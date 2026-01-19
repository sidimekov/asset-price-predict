/* global GPUAdapter, GPUBindGroup, GPUBindGroupLayout, GPUBuffer, GPUBufferUsage, GPUCommandEncoder, GPUComputePassEncoder, GPUComputePipeline, GPUDevice, GPUMapMode, GPUQueue, GPUShaderModule */
/// <reference lib="webworker" />

import type { ForecastModelConfig } from '@/config/ml';
import { TailPoint } from '@/workers/types';

const FEATURE_COUNT = 10;

type GpuState = {
  device: GPUDevice;
  pipeline: GPUComputePipeline;
  normMeanBuffer: GPUBuffer;
  normStdBuffer: GPUBuffer;
  paramsBuffer: GPUBuffer;
  modelVer: string;
};

const shader = `
struct Params = {
  len: u32,
  epsilon: f32,
  _pad0: u32,
  _pad1: u32,
}

@group(0) @binding(0) var<storage, read> closes: array<f32>;
@group(0) @binding(1) var<storage, read> normMean: array<f32>;
@group(0) @binding(2) var<storage, read> normStd: array<f32>;
@group(0) @binding(3) var<storage, read_write> out: array<f32>;
@group(0) @binding(4) var<uniform> params: Params;

fn meanRange(start: i32, count: i32) -> f32 {
  var sum: f32 = 0.0;
  for (var i = 0; i < count; i = i + 1) {
    sum = sum + closes[start + i];
  }
  return sum / f32(count);
}

fn stdRange(start: i32, count: i32) -> f32 {
  let m = meanRange(start, count);
  var acc: f32 = 0.0;
  for (var i = 0; i < count; i = i + 1) {
    let v = closes[start + i] - m;
    acc = acc + v * v;
  }
  return sqrt(acc / f32(count));
}

fn emaRange(start: i32, count: i32, span: f32) -> f32 {
  let alpha = 2.0 / (span + 1.0);
  var acc = closes[start];
  for (var i = 1; i < count; i = i + 1) {
    acc = alpha * closes[start + i] + (1.0 - alpha) * acc;
  }
  return acc;
}

fn meanReturns(start: i32, count: i32) -> f32 {
  var sum: f32 = 0.0;
  for (var i = 0; i < count; i = i + 1) {
    let idx = start + i;
    let prev = closes[idx];
    let curr = closes[idx + 1];
    let r = select(0.0, (curr - prev) / prev, prev != 0.0);
    sum = sum + r;
  }
  return sum / f32(count);
}

@compute @workgroup_size(1)
fn main() {
  let len = i32(params.len)
  if (len <= 0) {
    return;
  }
  
  let lastClose = closes[len - 1];
  let start5 = max(len - 5, 0);
  let count5 = len - start5;
  let start20 = max(len - 20, 0);
  let count20 = len - start20;
  
  let momentum3 = select(0.0, lastClose - closes[len - 3], len >= 3);
  let momentum8 = select(0.0, lastClose - closes[len - 8], len >= 8);
  
  let ema5 = emaRange(start5, count5, 5.0);
  let start10 = max(len - 10, 0);
  let count10 = len - start10;
  let ema10 = emaRange(start10, count10, 10.0);
  
  let returnsLen = len - 1;
  let startReturns5 = max(returnsLen - 5, 0);
  let countReturns5 = returnsLen - startReturns5;
  let startReturns20 = max(returnsLen - 20, 0);
  let countReturns20 = returnsLen - startReturns20;

  var feats: array<f32, 10>;
  feats[0] = lastClose;
  feats[1] = meanRange(start5, count5);
  feats[2] = meanRange(start20, count20);
  feats[3] = stdRange(start20, count20);
  feats[4] = momentum3;
  feats[5] = momentum8;
  feats[6] = ema5;
  feats[7] = ema10;
  feats[8] = meanReturns(startReturns5, countReturns5);
  feats[9] = stdReturns(startReturns20, countReturns20);
  
  for (var i = 0; i < ${FEATURE_COUNT}; i = i + 1) {
    let mean = normMean[i];
    let std = normStd[i];
    out[i] = (feats[i] - mean) / (std + params.epsilon);
  }
}
`;

let gpuState: GpuState | null = null;

function getNavigator(): DedicatedWorkerGlobalScope['navigator'] | undefined {
  return (globalThis as unknown as DedicatedWorkerGlobalScope).navigator;
}

export function isWebGpuSupported(): boolean {
  return Boolean(getNavigator()?.gpu);
}

async function getGpuState(
  modelConfig: ForecastModelConfig,
): Promise<GpuState> {
  if (gpuState?.modelVer === modelConfig.modelVer) return gpuState;

  const navigator = getNavigator();
  if (!navigator?.gpu) {
    throw new Error('WebGPU is not supported in this environment');
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error('WebGPU adapter is not available');
  }

  const device = await adapter.requestDevice();
  const module = device.createShaderModule({ code: shader });
  const pipeline = device.createComputePipeline({
    layout: 'auto',
    compute: { module, entryPoint: 'main' },
  });

  const norm = modelConfig.normalization;
  if (!norm || norm.type !== 'zscore') {
    throw new Error('WebGPU feature pipeline expects zscore normalization');
  }

  const normMeanBuffer = device.createBuffer({
    size: FEATURE_COUNT * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  const normStdBuffer = device.createBuffer({
    size: FEATURE_COUNT * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(normMeanBuffer, 0, new Float32Array(norm.mean));
  device.queue.writeBuffer(normStdBuffer, 0, new Float32Array(norm.std));

  const paramsBuffer = device.createBuffer({
    size: 4 * 4,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  gpuState = {
    device,
    pipeline,
    normMeanBuffer,
    normStdBuffer,
    paramsBuffer,
    modelVer: modelConfig.modelVer,
  };
  return gpuState;
}

export async function buildFeaturesGpu(
  tail: TailPoint[],
  modelConfig: ForecastModelConfig,
): Promise<Float32Array> {
  if (tail.length < modelConfig.featureWindow) {
    throw new Error(
      `EBADINPUT: tail too short (need >= ${modelConfig.featureWindow}, got ${tail.length})`,
    );
  }

  const closes = tail
    .slice(-modelConfig.featureWindow)
    .map(([, close]) => close);
  const state = await getGpuState(modelConfig);
  const { device, pipeline, normMeanBuffer, normStdBuffer, paramsBuffer } =
    state;

  const closesBuffer = device.createBuffer({
    size: closes.length * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(closesBuffer, 0, new Float32Array(closes));

  const outputBuffer = device.createBuffer({
    size: FEATURE_COUNT * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });
  const readBuffer = device.createBuffer({
    size: FEATURE_COUNT * Float32Array.BYTES_PER_ELEMENT,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  const norm = modelConfig.normalization;
  if (!norm || norm.type !== 'zscore') {
    throw new Error('WebGPU feature pipeline expects zscore normalization');
  }

  const params = new ArrayBuffer(16);
  const paramsView = new DataView(params);
  paramsView.setUint32(0, closes.length, true);
  paramsView.setFloat32(4, norm.epsilon, true);
  device.queue.writeBuffer(paramsBuffer, 0, params);

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: closesBuffer } },
      { binding: 1, resource: { buffer: normMeanBuffer } },
      { binding: 2, resource: { buffer: normStdBuffer } },
      { binding: 3, resource: { buffer: outputBuffer } },
      { binding: 4, resource: { buffer: paramsBuffer } },
    ],
  });

  const encoder = device.createCommandEncoder();
  const pass = encoder.beginComputePass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(1);
  pass.end();
  encoder.copyBufferToBuffer(
    outputBuffer,
    0,
    readBuffer,
    0,
    FEATURE_COUNT * Float32Array.BYTES_PER_ELEMENT,
  );
  device.queue.submit([encoder.finish()]);

  await readBuffer.mapAsync(GPUMapMode.READ);
  const copy = readBuffer.getMappedRange();
  const out = new Float32Array(copy.slice(0));
  readBuffer.unmap();

  closesBuffer.destroy();
  outputBuffer.destroy();
  readBuffer.destroy();

  return out;
}
