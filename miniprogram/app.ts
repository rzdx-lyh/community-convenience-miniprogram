/**
 * 小程序入口（FE-0）
 * ⚠ wx.cloud.init 必须在 onLaunch 第一行执行且带 env，否则所有云调用 fail 且报错不直观。
 */
import { ENV, STORAGE_KEYS } from './config/env';
import { store } from './store/global';
import { getCapsuleSafeWidth, getStatusBarHeight } from './utils/device';

interface IAppOption {
  globalData: {
    /** 状态栏高度（px），首页自定义导航占位用 */
    statusBarHeight: number;
    /** 微信胶囊右侧避让宽度（px） */
    capsuleRight: number;
    elderMode: boolean;
  };
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
    this.globalData.elderMode = store.get<boolean>(STORAGE_KEYS.ELDER_MODE, false);

    // TODO(FE-8): 首启隐私弹窗（agreedPrivacy）— 隐私协议未同意前禁止调用任何隐私接口
  },
});
