import { describe, expect, it } from 'vitest';
import { defaultSpot } from '../miniprogram/config/community';
import {
  COMMUNITY_PLACES,
  PLACE_CATEGORIES,
  placesNear,
} from '../miniprogram/config/community-places';

describe('阶段 2 · 社区点位单一真源', () => {
  it('点位 id / marker id 唯一，坐标为有效值', () => {
    expect(new Set(COMMUNITY_PLACES.map((p) => p.id)).size).toBe(COMMUNITY_PLACES.length);
    expect(new Set(COMMUNITY_PLACES.map((p) => p.mid)).size).toBe(COMMUNITY_PLACES.length);
    for (const p of COMMUNITY_PLACES) {
      expect(Number.isFinite(p.latitude)).toBe(true);
      expect(Number.isFinite(p.longitude)).toBe(true);
    }
  });

  it('覆盖办事服务 / 便民设备 / 生活配套 / 应急设施四类', () => {
    expect(PLACE_CATEGORIES.map((c) => c.k)).toEqual(['all', 'svc', 'tool', 'life', 'emergency']);
    const cats = new Set(COMMUNITY_PLACES.map((p) => p.cat));
    expect(cats).toEqual(new Set(['svc', 'tool', 'life', 'emergency']));
  });

  it('首页最近 3 个点位按距离升序，且距离/步行/状态字段齐全', () => {
    const nearby = placesNear(defaultSpot(), 'all', 3);
    expect(nearby).toHaveLength(3);
    expect(nearby[0].meters).toBeLessThanOrEqual(nearby[1].meters);
    expect(nearby[1].meters).toBeLessThanOrEqual(nearby[2].meters);
    for (const p of nearby) {
      expect(p.walk).toMatch(/\d/);
      expect(p.walkMin).toBeGreaterThanOrEqual(1);
      expect(['可用', '较忙', '暂停']).toContain(p.statusLabel);
    }
  });

  it('分类筛选与全部点位使用同一距离排序口径', () => {
    const origin = defaultSpot();
    const emergency = placesNear(origin, 'emergency');
    expect(emergency.length).toBeGreaterThan(0);
    expect(emergency.every((p) => p.cat === 'emergency')).toBe(true);
    expect(emergency.map((p) => p.meters)).toEqual([...emergency].map((p) => p.meters).sort((a, b) => a - b));
  });
});
