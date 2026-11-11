/** 定位能力统一封装：仅在用户主动点击时调用 wx.getLocation，失败由页面回退到手动选点。 */
import type { LatLng } from './geo';

export type LocationFailureKind = 'denied' | 'timeout' | 'unsupported' | 'unavailable';

export interface CurrentLocation extends LatLng {
  accuracy: number;
  source: 'gps';
}

export interface LocationSuccess {
  ok: true;
  location: CurrentLocation;
}

export interface LocationFailure {
  ok: false;
  kind: LocationFailureKind;
  message: string;
}

export type LocationResult = LocationSuccess | LocationFailure;

export function classifyLocationError(errMsg: string): LocationFailureKind {
  const msg = String(errMsg || '').toLowerCase();
  if (/auth deny|authorize|permission|scope\.userlocation/.test(msg)) return 'denied';
  if (/timeout|timed out|超时/.test(msg)) return 'timeout';
  if (/not support|unsupported|not a function/.test(msg)) return 'unsupported';
  return 'unavailable';
}

export function locationFailureMessage(kind: LocationFailureKind): string {
  if (kind === 'denied') return '定位权限未开启，请手动选择楼栋或到设置中授权位置';
  if (kind === 'timeout') return '定位超时，请移动到开阔处重试或手动选择楼栋';
  if (kind === 'unsupported') return '当前微信版本不支持定位，请手动选择楼栋';
  return '暂时无法获取当前位置，请手动选择楼栋';
}

/** 用户主动触发的一次定位；失败不抛异常。 */
export function requestCurrentLocation(): Promise<LocationResult> {
  return new Promise((resolve) => {
    if (typeof wx.getLocation !== 'function') {
      resolve({ ok: false, kind: 'unsupported', message: locationFailureMessage('unsupported') });
      return;
    }
    wx.getLocation({
      type: 'gcj02',
      isHighAccuracy: true,
      highAccuracyExpireTime: 5000,
      success: (res) => {
        const latitude = Number(res.latitude);
        const longitude = Number(res.longitude);
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          resolve({ ok: false, kind: 'unavailable', message: locationFailureMessage('unavailable') });
          return;
        }
        resolve({
          ok: true,
          location: {
            latitude,
            longitude,
            accuracy: Number(res.accuracy) || 0,
            source: 'gps',
          },
        });
      },
      fail: (err) => {
        const kind = classifyLocationError(err.errMsg || '');
        resolve({ ok: false, kind, message: locationFailureMessage(kind) });
      },
    });
  });
}
