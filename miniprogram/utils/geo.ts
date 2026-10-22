/**
 * 地理工具（FE-0 · 2026-10-22）
 * - Haversine 球面距离：两个 GCJ-02 坐标之间的地表距离（米）
 * - 步行时长估算：按 70 m/min 换算，向上取整
 * - 坐标格式化：用于首页「当前位置」文案（无第三方逆地理编码 key 时兜底）
 */
export interface LatLng {
  latitude: number;
  longitude: number;
}

const EARTH_R = 6371000; // 地球半径（米）

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** 两点球面距离（米） */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(EARTH_R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

/** 步行时长（分钟，向上取整，最低 1 分钟） */
export function walkMinutes(meters: number): number {
  return Math.max(1, Math.ceil(meters / 70));
}

/** 距离文案：<1km 显示「xxx m」，>=1km 显示「x.x km」 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** 坐标格式化文案（兜底，无逆地理编码时展示） */
export function formatLatLng(p: LatLng): string {
  const lat = p.latitude.toFixed(5);
  const lng = p.longitude.toFixed(5);
  return `${lat}, ${lng}`;
}
