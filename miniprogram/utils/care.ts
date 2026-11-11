/**
 * 关怀模式（适老化）运行时工具
 *
 * 单一状态源：STORAGE_KEYS.ELDER_MODE。首页快捷按钮和「我的」开关都只通过
 * setCareMode() 写入，页面显示则在 onShow 时从 storage 重读，保证跨 Tab 同步与冷启动恢复。
 */
import { STORAGE_KEYS } from '../config/env';
import { store } from '../store/global';

type PageData = Record<string, unknown>;
type PageMethod = (this: MiniPageContext, ...args: unknown[]) => unknown;

export type MiniPageOptions = Record<string, unknown> & {
  data?: PageData;
  onShow?: PageMethod;
};

export interface MiniPageContext {
  data?: PageData;
  setData?: (patch: PageData) => void;
}

/** 读取关怀模式开关（每次直接读 storage，避免局部缓存导致跨页不同步） */
export function isCareModeEnabled(): boolean {
  try {
    return wx.getStorageSync(STORAGE_KEYS.ELDER_MODE) === true;
  } catch {
    return false;
  }
}

/** 全站唯一写入口：持久化并通知全局 store；返回写入后的布尔状态 */
export function setCareMode(enabled: boolean): boolean {
  const next = enabled === true;
  store.set(STORAGE_KEYS.ELDER_MODE, next);
  return next;
}

/** 页面根节点 class 拼接（保留给页面/测试复用） */
export function careRootClass(enabled: boolean): string {
  return enabled ? 'care-mode' : '';
}

/**
 * 包装 Page 构造器：注入 careMode 数据，并在每次 onShow 时重读 storage。
 * 从首页/「我的」切换后，切 Tab、navigateTo、navigateBack 都会立即生效。
 */
export function installCarePageHook(
  basePage: (options: MiniPageOptions) => unknown,
): (options: MiniPageOptions) => unknown {
  return function carePage(options: MiniPageOptions): unknown {
    const data = (options.data ?? {}) as PageData;
    if (data.careMode === undefined) data.careMode = isCareModeEnabled();
    options.data = data;

    const originalOnShow = options.onShow;
    options.onShow = function careOnShow(this: MiniPageContext, ...args: unknown[]) {
      const care = isCareModeEnabled();
      if (this.data?.careMode !== care) this.setData?.({ careMode: care });
      if (typeof originalOnShow === 'function') return originalOnShow.apply(this, args);
      return undefined;
    };

    return basePage(options);
  };
}
