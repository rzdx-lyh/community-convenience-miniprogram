/**
 * 登录页（CR-028）
 *
 * 微信一键登录 → 写入全局 profile → switchTab 首页。
 * 本页不是 tab 页，禁止改成 tabBar 成员，否则 switchTab 会失败。
 */
import { APP_VERSION, STORAGE_KEYS } from '../../../config/env';
import { login } from '../../../services/auth';
import { store } from '../../../store/global';
import { toast } from '../../../utils/ui';

const info = wx.getWindowInfo();

Page({
  data: {
    statusBarHeight: info.statusBarHeight,
    agree: false,
    busy: false,
    appVersion: APP_VERSION,
  },

  onLoad() {
    this.setData({ agree: store.get<boolean>(STORAGE_KEYS.AGREED_PRIVACY, false) });
  },

  onToggleAgree(): void {
    const agree = !this.data.agree;
    this.setData({ agree });
    if (agree) store.set(STORAGE_KEYS.AGREED_PRIVACY, true);
  },

  async onWxLogin(): Promise<void> {
    if (this.data.busy) return;
    if (!this.data.agree) {
      toast('请先阅读并勾选《用户协议》和《隐私政策》');
      return;
    }
    this.setData({ busy: true });
    try {
      await login();
      wx.switchTab({ url: '/pages/index/index' });
    } catch {
      toast('登录失败，请检查网络后重试');
    } finally {
      this.setData({ busy: false });
    }
  },

  onPhoneLogin(): void {
    toast('个人主体暂无法获取手机号，请使用微信一键登录');
  },

  onSkip(): void {
    wx.switchTab({ url: '/pages/index/index' });
  },

  onOpenDoc(e: WechatMiniprogram.TouchEvent): void {
    const kind = String((e.currentTarget.dataset as { kind?: string }).kind ?? 'user');
    wx.showModal({
      title: kind === 'privacy' ? '隐私政策' : '用户协议',
      content:
        kind === 'privacy'
          ? '收集：昵称、楼栋房号、联系方式，仅在提交单据时收集。用途：就近匹配服务、上门服务、通知送达。社区位置由你手动选择，仅用于就近排序附近服务点，不读取手机定位、不保存轨迹。健康档案仅本人与签约医生可见。'
          : '本小程序只提供社区服务的信息发布与预约登记，不收款、不担保交易、不提供医疗诊断。一个微信仅对应一个社区账号，账号仅限本人使用。',
      showCancel: false,
      confirmText: '我知道了',
    });
  },
});
