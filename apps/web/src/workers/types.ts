export type TailPoint = [ts: number, close: number];

export type InferRequestMessage = {
  id: string;
  type: 'infer:request';
  payload: {
    tail: TailPoint[];
    tf: string; // пока прокидывается дефолт из клиента
    horizon: number;
    model?: string;
  };
};

export type InferDoneMessage = {
  id: string;
  type: 'infer:done';
  payload: {
    p50: number[];
    p10?: number[];
    p90?: number[];
    diag: {
      runtime_ms: number;
      backend: 'wasm' | 'webgpu';
      model_ver: string;
    };
  };
};

export type InferErrorMessage = {
  id: string;
  type: 'error';
  payload: {
    code: 'ELOAD' | 'ERUNTIME' | 'EBADINPUT';
    message: string;
  };
};

export type WorkerMessage =
  | InferRequestMessage
  | InferDoneMessage
  | InferErrorMessage;

/**
 * Runtime marker to avoid 0-line coverage on type-only module.
 * Does not affect worker protocol or logic.
 */
export const WORKER_MESSAGE_PROTOCOL_V1 = 'infer:v1' as const;
