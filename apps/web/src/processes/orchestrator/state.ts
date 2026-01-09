export type OrchestratorStatus = 'idle' | 'running' | 'error';

export const TIMESERIES_TTL_MS = 10 * 60 * 1000; // 10 минут

export const orchestratorState: { status: OrchestratorStatus } = {
  status: 'idle',
};
