import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  careRootClass,
  installCarePageHook,
  isCareModeEnabled,
} from '../miniprogram/utils/care';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('care mode', () => {
  it('reads elderMode from storage', () => {
    vi.stubGlobal('wx', { getStorageSync: () => true });
    expect(isCareModeEnabled()).toBe(true);
  });

  it('defaults to off when storage is missing/unavailable', () => {
    vi.stubGlobal('wx', { getStorageSync: () => undefined });
    expect(isCareModeEnabled()).toBe(false);
  });

  it('returns the global care-mode class', () => {
    expect(careRootClass(true)).toBe('care-mode');
    expect(careRootClass(false)).toBe('');
  });

  it('injects careMode and refreshes it on show', () => {
    vi.stubGlobal('wx', { getStorageSync: () => true });
    const base = vi.fn((options: any) => options);
    const hook = installCarePageHook(base);
    const originalOnShow = vi.fn();
    const options: any = { data: { foo: 1 }, onShow: originalOnShow };

    hook(options);

    expect(base).toHaveBeenCalledTimes(1);
    expect(options.data.careMode).toBe(true);

    const ctx: any = {
      data: { careMode: true },
      setData(patch: Record<string, unknown>) {
        this.data = { ...this.data, ...patch };
      },
    };
    options.onShow.call(ctx);
    expect(originalOnShow).toHaveBeenCalledTimes(1);

    vi.stubGlobal('wx', { getStorageSync: () => false });
    options.onShow.call(ctx);
    expect(ctx.data.careMode).toBe(false);
  });
});
