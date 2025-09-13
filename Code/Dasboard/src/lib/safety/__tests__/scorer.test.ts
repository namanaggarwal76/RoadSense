import { parseJSONRows } from '../parser';
import { computeSafetyScore } from '../scorer';
import { defaultSettings } from '../settings';
import sample from '../__fixtures__/sampleRide.json';

describe('computeSafetyScore', () => {
  const rows = parseJSONRows(sample as unknown[]);
  it('calculates proportional penalties', () => {
    const out = computeSafetyScore(rows, defaultSettings);
    expect(out.breakdown.counts['Overspeeding']).toBeGreaterThanOrEqual(1);
    expect(out.breakdown.raw_negative).toBeGreaterThan(3.3);
  });
  it('awards good row bonus', () => {
    const out = computeSafetyScore(rows, defaultSettings);
    expect(out.breakdown.good_ratio).toBeGreaterThan(0);
    expect(out.breakdown.positive_bonus).toBeGreaterThan(0);
  });
  it('stars are within range', () => {
    const out = computeSafetyScore(rows, defaultSettings);
    expect(out.stars).toBeGreaterThanOrEqual(0);
    expect(out.stars).toBeLessThanOrEqual(5);
  });
});
