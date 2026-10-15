/**
 * 设备/窗口信息（FE-0）
 * 首页自定义导航（navigationStyle: custom）需要状态栏高度与微信胶囊避让宽度。
 */
const DEFAULT_STATUS_BAR_HEIGHT = 20;
/** 微信胶囊按钮宽度 87px + 右侧间距 10px（设计预览 §0：右侧避让 ≥190rpx） */
const CAPSULE_SAFE_WIDTH = 97;

export function getStatusBarHeight(): number {
  try {
    if (typeof wx.getWindowInfo === 'function') {
      return Number(wx.getWindowInfo().statusBarHeight ?? DEFAULT_STATUS_BAR_HEIGHT);
    }
    return Number(wx.getSystemInfoSync().statusBarHeight ?? DEFAULT_STATUS_BAR_HEIGHT);
  } catch {
    return DEFAULT_STATUS_BAR_HEIGHT;
  }
}

/** 右侧需为微信胶囊预留的宽度（px，直接用于 style 绑定） */
export function getCapsuleSafeWidth(): number {
  return CAPSULE_SAFE_WIDTH;
}
