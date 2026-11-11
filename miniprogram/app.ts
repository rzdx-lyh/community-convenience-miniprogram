/**
 * 小程序入口（FE-0）
 * ⚠ wx.cloud.init 必须在 onLaunch 第一行执行且带 env，否则所有云调用 fail 且报错不直观。
 */
import { ENV, STORAGE_KEYS } from './config/env';
import { store } from './store/global';
import { installCarePageHook, isCareModeEnabled, type MiniPageOptions } from './utils/care';
import { getCapsuleSafeWidth, getStatusBarHeight } from './utils/device';

/**
 * 关怀模式注入（2026-11-04）
 * 微信没有全局页面样式 API；在 Page 注册阶段统一注入 careMode，
 * 并在每次 onShow 重读 storage，保证从「我的」切到任意页面立即生效。
 * 页面根节点配合 {{careMode ? 'care-mode' : ''}}。
 */
const pageScope = globalThis as unknown as {
  Page?: (options: MiniPageOptions) => unknown;
};
const basePage = pageScope.Page;
if (typeof basePage === 'function') {
  pageScope.Page = installCarePageHook(basePage) as typeof pageScope.Page;
}

interface IAppOption {
  globalData: {
    /** 状态栏高度（px），首页自定义导航占位用 */
    statusBarHeight: number;
    /** 微信胶囊右侧避让宽度（px） */
    capsuleRight: number;
    elderMode: boolean;
  };
  /** 首启资料设置守卫：未完成时统一跳到 setup 页 */
  // 2026-11-10 审核整改：不再强制首屏登录/完善资料，游客可先浏览服务。
  // 需要身份的操作（提交报修/发布等）由对应页面按需引导。
}

App<IAppOption>({
  globalData: {
    statusBarHeight: 20,
    capsuleRight: 97,
    elderMode: false,
  },

  onLaunch() {
    if (ENV.CLOUD_ENV_ID) {
      wx.cloud.init({ env: ENV.CLOUD_ENV_ID, traceUser: true });
    } else {
      // 未配 env 时云调用全部失败；mock 模式（USE_MOCK=true）不受影响
      console.warn('[app] 未配置 CLOUD_ENV_ID，云调用将失败；mock 模式不受影响');
    }

    this.globalData.statusBarHeight = getStatusBarHeight();
    this.globalData.capsuleRight = getCapsuleSafeWidth();
    this.globalData.elderMode = isCareModeEnabled();

    // 开关怀模式后同步 app.globalData（profile 页通过 store.set 写入）
    store.subscribe((key, value) => {
      if (key === STORAGE_KEYS.ELDER_MODE) this.globalData.elderMode = value === true;
    });

    // TODO(FE-8): 首启隐私弹窗（agreedPrivacy）— 隐私协议未同意前禁止调用任何隐私接口
  },
});
