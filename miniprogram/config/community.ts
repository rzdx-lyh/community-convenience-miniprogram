/**
 * 社区与「我的位置」配置（v1.2.1 · 2026-10-26）
 *
 * 背景：`wx.getLocation`（获取当前地理位置/速度）的接口申请被微信驳回
 * （2026-10-24，理由：使用场景未符合开放范围）。本项目决定不再依赖任何定位接口，
 * 改为让用户**手动选择自己在社区内的位置点**（楼栋 / 出入口 / 食堂），
 * 用该点位坐标参与「附近服务点」的距离与步行时间计算。
 *
 * 设计约束：
 * - 坐标统一 GCJ-02，与 `pages/map` 的 markers、`wx.openLocation` 同一坐标系；
 * - 位置点必须落在社区范围内（与 9 个服务点同一片区），距离才有意义；
 * - 默认位置点 = DEFAULT_SPOT_KEY，用户选择持久化在 STORAGE_KEYS.USER_LOCATION。
 *
 * ⚠ 这里**不调用任何定位 API**；后续若拿到模糊定位/位置接口权限，可在此加降级链，
 * 页面层不需要再改。
 */
import { distanceMeters, type LatLng } from '../utils/geo';

export interface CommunitySpot {
  /** 稳定 key（持久化用，不要改） */
  key: string;
  /** 展示名，如「3 号楼」 */
  name: string;
  /** 一句话说明，如「社区中心 · 默认位置」 */
  desc: string;
  latitude: number;
  longitude: number;
}

/** 当前接入的社区（本期单社区；多社区时把 spots 拆成 per-community 即可） */
export const COMMUNITY = {
  name: '阳光社区',
  address: '示范路 88 号',
  center: { latitude: 23.12894, longitude: 113.26411 } as LatLng,
} as const;

export const DEFAULT_SPOT_KEY = 'b3';

/** 社区内可选位置点（围绕社区中心，与 9 个服务点同片区） */
export const COMMUNITY_SPOTS: CommunitySpot[] = [
  { key: 'b3', name: '3 号楼', desc: '社区中心 · 默认位置', latitude: 23.12894, longitude: 113.26411 },
  { key: 'b1', name: '1 号楼', desc: '物业服务中心旁', latitude: 23.12916, longitude: 113.26386 },
  { key: 'b2', name: '2 号楼', desc: '活动室 / 图书角', latitude: 23.12888, longitude: 113.2632 },
  { key: 'south', name: '南门岗亭', desc: '快递柜 / 充电宝', latitude: 23.12872, longitude: 113.26362 },
  { key: 'west', name: '西门', desc: '社区卫生服务站旁', latitude: 23.12841, longitude: 113.26472 },
  { key: 'canteen', name: '社区食堂', desc: '老年助餐点', latitude: 23.1295, longitude: 113.2641 },
];

/** 按 key 查位置点 */
export function findSpot(key: string | null | undefined): CommunitySpot | undefined {
  if (!key) return undefined;
  return COMMUNITY_SPOTS.find((s) => s.key === key);
}

/** 默认位置点（配置缺失时兜底取第一项，保证永远有值） */
export function defaultSpot(): CommunitySpot {
  return findSpot(DEFAULT_SPOT_KEY) ?? COMMUNITY_SPOTS[0];
}

/** 离给定坐标最近的位置点 */
export function nearestSpot(here: LatLng): CommunitySpot {
  return COMMUNITY_SPOTS.reduce((best, spot) =>
    distanceMeters(here, spot) < distanceMeters(here, best) ? spot : best,
  );
}

/**
 * 解析本地缓存 → 社区位置点。
 * - v1.2.1 起的缓存带 `key`：按 key 恢复；
 * - 旧缓存只有经纬度（v1.2.1 及以前由 getLocation 写入）：取最近的位置点；
 * - 无缓存/非法值：回默认位置点。
 */
export function resolveSpot(
  saved: { key?: string; latitude?: number; longitude?: number } | null | undefined,
): CommunitySpot {
  if (!saved) return defaultSpot();
  const byKey = findSpot(saved.key);
  if (byKey) return byKey;
  if (Number.isFinite(saved.latitude) && Number.isFinite(saved.longitude)) {
    return nearestSpot({ latitude: saved.latitude as number, longitude: saved.longitude as number });
  }
  return defaultSpot();
}

/** 位置点 → 可持久化的定位对象（结构兼容 UserLocation） */
export function spotToLocation(spot: CommunitySpot, ts = Date.now()) {
  return {
    key: spot.key,
    name: spot.name,
    latitude: spot.latitude,
    longitude: spot.longitude,
    ts,
  };
}

/** 位置选择器的展示文案（wx.showActionSheet 最多 6 项） */
export function spotPickerLabels(): string[] {
  return COMMUNITY_SPOTS.slice(0, 6).map((s) => `${s.name} · ${s.desc}`);
}
