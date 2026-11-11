import { afterEach, describe, expect, it, vi } from 'vitest';
import { classifyLocationError, locationFailureMessage, requestCurrentLocation } from '../miniprogram/utils/location';

afterEach(() => vi.unstubAllGlobals());

describe('居民定位封装', () => {
  it('识别拒绝授权、超时与不支持', () => {
    expect(classifyLocationError('getLocation:fail auth deny')).toBe('denied');
    expect(classifyLocationError('getLocation:fail timeout')).toBe('timeout');
    expect(classifyLocationError('getLocation:fail not support')).toBe('unsupported');
    expect(locationFailureMessage('denied')).toContain('手动选择楼栋');
  });

  it('定位成功返回 GCJ-02 经纬度与精度', async () => {
    vi.stubGlobal('wx', {
      getLocation: ({ success }: { success: (res: Record<string, unknown>) => void }) => {
        success({ latitude: 23.1291, longitude: 113.2643, accuracy: 18 });
      },
    });
    const result = await requestCurrentLocation();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.location.source).toBe('gps');
      expect(result.location.accuracy).toBe(18);
    }
  });

  it('定位拒绝时返回可展示的降级提示，不抛异常', async () => {
    vi.stubGlobal('wx', {
      getLocation: ({ fail }: { fail: (err: { errMsg: string }) => void }) => {
        fail({ errMsg: 'getLocation:fail auth deny' });
      },
    });
    const result = await requestCurrentLocation();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe('denied');
      expect(result.message).toContain('手动选择楼栋');
    }
  });
});
