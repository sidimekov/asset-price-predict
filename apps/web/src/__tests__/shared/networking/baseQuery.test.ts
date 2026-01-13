import { describe, it, expect } from 'vitest';
import { createBaseQuery } from '@/shared/networking/baseQuery';

describe('createBaseQuery', () => {
  it('returns a baseQuery function', () => {
    const baseQuery = createBaseQuery('/api/market');
    expect(typeof baseQuery).toBe('function');
  });
});
