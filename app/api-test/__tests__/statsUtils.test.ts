import { describe, expect, it } from '@jest/globals';

import {
  bucketColor,
  bucketFor,
  bucketLabel,
  computeStats,
  formatBytes,
  formatMs,
} from '../statsUtils';

describe('computeStats', () => {
  it('returns null for an empty sample set', () => {
    expect(computeStats([])).toBeNull();
  });

  it('returns identical metrics for a single sample', () => {
    expect(computeStats([42])).toEqual({
      count: 1,
      min: 42,
      max: 42,
      mean: 42,
      median: 42,
      p95: 42,
      p99: 42,
      std: 0,
    });
  });

  it('computes count/min/max/mean over an evenly spaced set', () => {
    const stats = computeStats([10, 20, 30, 40, 50])!;
    expect(stats.count).toBe(5);
    expect(stats.min).toBe(10);
    expect(stats.max).toBe(50);
    expect(stats.mean).toBe(30);
  });

  it('uses the nearest-rank method for percentiles (floor((p/100)*n))', () => {
    // n=5: median -> sorted[floor(2.5)=2]=30, p95 -> sorted[floor(4.75)=4]=50, p99 -> sorted[floor(4.95)=4]=50.
    const stats = computeStats([10, 20, 30, 40, 50])!;
    expect(stats.median).toBe(30);
    expect(stats.p95).toBe(50);
    expect(stats.p99).toBe(50);
  });

  it('computes the population standard deviation', () => {
    // variance = mean of squared deviations from 30 = 1000/5 = 200; std = sqrt(200).
    const stats = computeStats([10, 20, 30, 40, 50])!;
    expect(stats.std).toBeCloseTo(Math.sqrt(200), 10);
  });

  it('sorts a copy without mutating the input', () => {
    const input = [5, 1, 3];
    const stats = computeStats(input)!;
    expect(input).toEqual([5, 1, 3]);
    expect(stats.min).toBe(1);
    expect(stats.max).toBe(5);
    expect(stats.median).toBe(3); // sorted[floor(0.5*3)=1] = 3
  });

  it('handles a two-element set (percentile clamps to n-1)', () => {
    const stats = computeStats([4, 8])!;
    expect(stats.mean).toBe(6);
    expect(stats.median).toBe(8); // sorted[floor(0.5*2)=1] = 8
    expect(stats.p95).toBe(8); // sorted[min(1, floor(1.9))] = 8
  });
});

describe('bucketFor', () => {
  it('classifies successful samples into latency bands', () => {
    expect(bucketFor(10, true)).toBe('fast');
    expect(bucketFor(100, true)).toBe('ok');
    expect(bucketFor(300, true)).toBe('medium');
    expect(bucketFor(700, true)).toBe('slow');
    expect(bucketFor(5000, true)).toBe('verySlow');
  });

  it('treats band edges as the start of the next band (half-open intervals)', () => {
    expect(bucketFor(0, true)).toBe('fast');
    expect(bucketFor(50, true)).toBe('ok');
    expect(bucketFor(200, true)).toBe('medium');
    expect(bucketFor(500, true)).toBe('slow');
    expect(bucketFor(1000, true)).toBe('verySlow');
  });

  it('collapses to "failed" when success is false (regardless of time)', () => {
    expect(bucketFor(10, false)).toBe('failed');
    expect(bucketFor(0, false)).toBe('failed');
  });

  it('collapses to "failed" for negative or non-finite times', () => {
    expect(bucketFor(-1, true)).toBe('failed');
    expect(bucketFor(NaN, true)).toBe('failed');
    expect(bucketFor(Infinity, true)).toBe('failed');
  });

  it('every bucket has a color and a label', () => {
    const buckets = ['fast', 'ok', 'medium', 'slow', 'verySlow', 'failed'] as const;
    for (const b of buckets) {
      expect(bucketColor[b]).toMatch(/^#[0-9a-f]{6}$/i);
      expect(typeof bucketLabel[b]).toBe('string');
    }
  });
});

describe('formatMs', () => {
  it('prints two decimals with a unit', () => {
    expect(formatMs(123.456)).toBe('123.46 ms');
    expect(formatMs(0)).toBe('0.00 ms');
    expect(formatMs(50)).toBe('50.00 ms');
  });

  it('returns "—" for non-finite values', () => {
    expect(formatMs(NaN)).toBe('—');
    expect(formatMs(Infinity)).toBe('—');
    expect(formatMs(-Infinity)).toBe('—');
  });
});

describe('formatBytes', () => {
  it('returns "0 B" for zero, negative, or non-finite input', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(-5)).toBe('0 B');
    expect(formatBytes(NaN)).toBe('0 B');
    expect(formatBytes(Infinity)).toBe('0 B');
  });

  it('prints raw bytes below 1 KB', () => {
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1023)).toBe('1023 B');
  });

  it('switches to KB (one decimal) between 1 KB and 1 MB', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('switches to MB (two decimals) at and above 1 MB', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
    expect(formatBytes(1024 * 1024 * 2.5)).toBe('2.50 MB');
  });
});
