export class InferenceStub {
  // Заготовка под onnxruntime-node
  async run(
    _features: Float32Array,
  ): Promise<{ p10: number[]; p50: number[]; p90: number[] }> {
    return { p10: [], p50: [], p90: [] };
  }
}
