/**
 * 首启资料设置（头像/昵称/位置）的纯函数，便于单测。
 */
export const NICKNAME_MAX = 20;

export interface UserLocation {
  latitude: number;
  longitude: number;
  /** 毫秒时间戳 */
  ts: number;
  /** v1.2.1：手动选择的社区位置点 key（不再使用定位接口） */
  key?: string;
  /** v1.2.1：位置点名称，如「3 号楼」 */
  name?: string;
}

/** 去掉首尾空白、连续空白压成一个空格；不改用户内部字符 */
export function normalizeNickName(input: unknown): string {
  return String(input ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isValidNickName(input: unknown): boolean {
  const n = normalizeNickName(input);
  return n.length >= 1 && n.length <= NICKNAME_MAX;
}

/** 无头像时用昵称首字占位；空昵称用「邻」 */
export function avatarText(input: unknown): string {
  const n = normalizeNickName(input);
  return n ? Array.from(n)[0] : '邻';
}

/** 以 4 位小数展示坐标，避免把完整经纬度塞进界面 */
export function formatCoords(latitude: number, longitude: number): string {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return '';
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

/**
 * 位置对象是否可用（v1.2.1：手选社区位置点后不再按时间过期）。
 * 只校验经纬度是否有限；`key` 用于恢复具体楼栋/出入口。
 */
export function isUsableLocation(location: UserLocation | null | undefined): boolean {
  if (!location) return false;
  return Number.isFinite(location.latitude) && Number.isFinite(location.longitude);
}

/**
 * 缓存的定位是否仍然新鲜（默认 10 分钟）。
 * ⚠ v1.2.1 起 `wx.getLocation` 已被移除，本函数仅保留给历史缓存兼容与单测。
 */
export function isFreshLocation(
  location: UserLocation | null | undefined,
  now = Date.now(),
  maxAgeMs = 10 * 60 * 1000,
): boolean {
  if (!location) return false;
  if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) return false;
  if (!Number.isFinite(location.ts)) return false;
  return now - location.ts >= 0 && now - location.ts <= maxAgeMs;
}
