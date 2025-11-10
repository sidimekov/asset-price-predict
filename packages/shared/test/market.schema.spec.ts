import { describe, it, expect } from 'vitest';
import { zBars, zBar, zTimeframe } from '../src/schemas/market.schema.js';
import { MAX_BARS } from '../src/types/common.js';

describe('zBar', () => {
  it('должен принимать валидный бар с volume', () => {
    const valid: [number, number, number, number, number, number] = [
      1000, // ts
      100, // open
      110, // high
      95, // low
      105, // close
      1000, // volume
    ];

    const result = zBar.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('должен принимать валидный бар без volume', () => {
    const valid: [number, number, number, number, number] = [
      1000, // ts
      100, // open
      110, // high
      95, // low
      105, // close
    ];

    const result = zBar.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('должен проверять логику OHLC: high >= max(open, close)', () => {
    const invalid: [number, number, number, number, number] = [
      1000,
      100, // open
      90, // high меньше open - неверно
      95, // low
      105, // close
    ];

    const result = zBar.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.errors.find((e) =>
        e.message.includes('high must be'),
      );
      expect(error).toBeDefined();
    }
  });

  it('должен проверять логику OHLC: low <= min(open, close)', () => {
    const invalid: [number, number, number, number, number] = [
      1000,
      100, // open
      110, // high
      105, // low больше min(open, close) - неверно
      95, // close
    ];

    const result = zBar.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe('zBars', () => {
  it('должен принимать корректный массив баров', () => {
    const valid = [
      [1000, 100, 110, 95, 105],
      [2000, 105, 115, 100, 110],
      [3000, 110, 120, 105, 115],
    ];

    const result = zBars.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('должен проверять монотонность времени: ts не должен убывать', () => {
    const invalid = [
      [2000, 100, 110, 95, 105], // более поздний timestamp
      [1000, 105, 115, 100, 110], // более ранний timestamp - неверно
      [3000, 110, 120, 105, 115],
    ];

    const result = zBars.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.errors.find((e) =>
        e.message.includes('sorted by timestamp'),
      );
      expect(error).toBeDefined();
    }
  });

  it('должен принимать массив с одинаковыми timestamp (допустимо)', () => {
    const valid = [
      [1000, 100, 110, 95, 105],
      [1000, 105, 115, 100, 110], // тот же timestamp - допустимо
      [2000, 110, 120, 105, 115],
    ];

    const result = zBars.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('должен отклонять массив, превышающий MAX_BARS', () => {
    const invalid = Array(MAX_BARS + 1).fill([1000, 100, 110, 95, 105]);

    const result = zBars.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      const error = result.error.errors.find((e) =>
        e.message.includes(MAX_BARS.toString()),
      );
      expect(error).toBeDefined();
    }
  });

  it('должен принимать пустой массив', () => {
    const valid: number[][] = [];

    const result = zBars.safeParse(valid);
    expect(result.success).toBe(true);
  });
});

describe('zTimeframe', () => {
  it('должен принимать все поддерживаемые таймфреймы', () => {
    const timeframes = ['1h', '8h', '1d', '7d', '1mo'] as const;

    for (const tf of timeframes) {
      const result = zTimeframe.safeParse(tf);
      expect(result.success).toBe(true);
    }
  });

  it('должен отклонять невалидный таймфрейм', () => {
    const invalid = '2h';

    const result = zTimeframe.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
