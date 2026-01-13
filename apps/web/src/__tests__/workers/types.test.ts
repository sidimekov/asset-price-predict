import { describe, it, expect } from 'vitest';

import { WORKER_MESSAGE_PROTOCOL_V1 } from '@/workers/types';

describe('ml-worker types (runtime marker)', () => {
  it('exports protocol marker constant (prevents 0-line coverage)', () => {
    expect(WORKER_MESSAGE_PROTOCOL_V1).toBe('infer:v1');
  });
});
