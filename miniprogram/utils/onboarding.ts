/**
 * 首启资料设置（头像/昵称/位置）的纯函数，便于单测。
 */
export const NICKNAME_MAX = 20;

export interface UserLocation {
  latitude: number;
  longitude: number;
  /** 毫秒时间戳 */
  ts: number;
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

/** 缓存的定位是否仍然新鲜（默认 10 分钟） */
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
