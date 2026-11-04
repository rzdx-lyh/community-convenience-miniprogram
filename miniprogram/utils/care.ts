/**
 * 关怀模式（适老化）运行时工具
 *
 * 背景：微信小程序没有「动态给 page 根节点加 class」的 API。
 * 方案：所有页面根节点统一绑定 `{{careMode ? 'care-mode' : ''}}`，
 *      careMode 由 app.ts 在 Page 注册时注入并在 onShow 刷新；
 *      `.care-mode` 通过 --care-scale 让所有 font-size 按 1.25 倍放大。
 */
import { STORAGE_KEYS } from '../config/env';

export type MiniPageOptions = Record<string, any>;

/** 读取关怀模式开关（每次直接读 storage，避免 store 缓存导致跨页不同步） */
export function isCareModeEnabled(): boolean {
  try {
    return wx.getStorageSync(STORAGE_KEYS.ELDER_MODE) === true;
  } catch {
    return false;
  }
}

/** 页面根节点 class 拼接（保留给页面/测试复用） */
export function careRootClass(enabled: boolean): string {
  return enabled ? 'care-mode' : '';
}

/**
 * 包装 Page 构造器：注入 careMode 数据，并在每次 onShow 时重读 storage。
 * 这样从「我的」切到任意页面（含 tab 切换、navigateTo 返回）都会立即生效。
 */
export function installCarePageHook(
  basePage: (options: MiniPageOptions) => unknown,
): (options: MiniPageOptions) => unknown {
  return function carePage(options: MiniPageOptions): unknown {
    const data = (options.data ?? {}) as Record<string, any>;
    if (data.careMode === undefined) data.careMode = isCareModeEnabled();
    options.data = data;

    const originalOnShow = options.onShow;
    options.onShow = function careOnShow(this: any, ...args: unknown[]) {
      const care = isCareModeEnabled();
      if (this?.data?.careMode !== care) this.setData({ careMode: care });
      if (typeof originalOnShow === 'function') return originalOnShow.apply(this, args);
    };

    return basePage(options);
  };
}
