import { describe, expect, it } from 'vitest';
import {
  COMMUNITY,
  COMMUNITY_SPOTS,
  DEFAULT_SPOT_KEY,
  defaultSpot,
  findSpot,
  nearestSpot,
  resolveSpot,
  spotPickerLabels,
  spotToLocation,
} from '../miniprogram/config/community';
import { distanceMeters } from '../miniprogram/utils/geo';

/**
 * v1.2.1：`wx.getLocation` 接口申请被驳回后，社区位置改为「手动选点」。
 * 这些用例守住配置数据与恢复逻辑，避免删接口时把地图/首页的距离算错。
 */
describe('community · 社区位置点（v1.2.1 替代 wx.getLocation）', () => {
  it('位置点 key 唯一，默认点存在', () => {
    const keys = COMMUNITY_SPOTS.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(findSpot(DEFAULT_SPOT_KEY)).toBeTruthy();
    expect(defaultSpot().key).toBe(DEFAULT_SPOT_KEY);
  });

  it('所有位置点坐标有效，且落在社区中心 2km 内', () => {
    for (const s of COMMUNITY_SPOTS) {
      expect(Number.isFinite(s.latitude)).toBe(true);
      expect(Number.isFinite(s.longitude)).toBe(true);
      expect(distanceMeters(COMMUNITY.center, s)).toBeLessThan(2000);
    }
  });

  it('findSpot 命中 / 未命中', () => {
    expect(findSpot('b1')?.name).toBe('1 号楼');
    expect(findSpot('nope')).toBeUndefined();
    expect(findSpot(null)).toBeUndefined();
  });

  it('nearestSpot 取最近的位置点', () => {
    expect(nearestSpot({ latitude: 23.12916, longitude: 113.26386 }).key).toBe('b1');
    expect(nearestSpot({ latitude: 23.12841, longitude: 113.26472 }).key).toBe('west');
  });

  it('resolveSpot：按 key 恢复；旧缓存按最近点恢复；空值/非法值回默认', () => {
    expect(resolveSpot({ key: 'west' }).key).toBe('west');
    // 旧缓存（只有经纬度，由已移除的定位接口写入）→ 按最近点恢复
    expect(resolveSpot({ latitude: 23.12916, longitude: 113.26386 }).key).toBe('b1');
    expect(resolveSpot(null).key).toBe(DEFAULT_SPOT_KEY);
    expect(resolveSpot({}).key).toBe(DEFAULT_SPOT_KEY);
    expect(resolveSpot({ latitude: Number.NaN, longitude: Number.NaN }).key).toBe(DEFAULT_SPOT_KEY);
  });

  it('spotToLocation 生成可持久化对象', () => {
    const spot = findSpot('b2')!;
    const loc = spotToLocation(spot, 1234);
    expect(loc).toMatchObject({
      key: 'b2',
      name: '2 号楼',
      latitude: spot.latitude,
      longitude: spot.longitude,
      ts: 1234,
    });
  });

  it('位置选择器最多 6 项（wx.showActionSheet 上限）', () => {
    const labels = spotPickerLabels();
    expect(labels.length).toBeLessThanOrEqual(6);
    expect(labels[0]).toContain(COMMUNITY_SPOTS[0].name);
  });
});
