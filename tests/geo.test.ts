import { describe, it, expect } from 'vitest';
import { distanceMeters, walkMinutes, formatDistance, formatLatLng } from '../miniprogram/utils/geo';

describe('geo · 距离与步行估算（FE-0 · 2026-10-22）', () => {
  it('同一点距离为 0', () => {
    expect(distanceMeters({ latitude: 23.12894, longitude: 113.26411 }, { latitude: 23.12894, longitude: 113.26411 })).toBe(0);
  });

  it('约 1 度纬度 ≈ 111km（数量级校验）', () => {
    const m = distanceMeters({ latitude: 23, longitude: 113.26411 }, { latitude: 24, longitude: 113.26411 });
    expect(m).toBeGreaterThan(110000);
    expect(m).toBeLessThan(112000);
  });

  it('近距离估算在合理范围（百米级）', () => {
    // 约 0.001 度 ≈ 111m
    const m = distanceMeters({ latitude: 23.12894, longitude: 113.26411 }, { latitude: 23.12994, longitude: 113.26411 });
    expect(m).toBeGreaterThan(100);
    expect(m).toBeLessThan(120);
  });

  it('walkMinutes 向上取整且最低 1 分钟', () => {
    expect(walkMinutes(0)).toBe(1);
    expect(walkMinutes(70)).toBe(1);
    expect(walkMinutes(71)).toBe(2);
  });

  it('formatDistance 千米内用 m，以上用 km', () => {
    expect(formatDistance(500)).toBe('500 m');
    expect(formatDistance(1500)).toBe('1.5 km');
  });

  it('formatLatLng 保留 5 位小数', () => {
    expect(formatLatLng({ latitude: 23.12894, longitude: 113.26411 })).toBe('23.12894, 113.26411');
  });
});
