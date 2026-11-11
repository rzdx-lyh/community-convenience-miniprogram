/**
 * 三页签登录页：居民 / 管理端 / 维修端
 *
 * 居民走微信身份；管理端与维修端走工作人员账号 + 密码。
 * 服务端会话独立于居民 openid，页面只保存令牌，权限始终由服务端复核。
 */
import { APP_VERSION, STORAGE_KEYS } from '../../../config/env';
import { PORTAL_TABS, portalHome } from '../../../config/portal';
import { login } from '../../../services/auth';
import { staffLogin } from '../../../services/staff';
import { store } from '../../../store/global';
import { toast } from '../../../utils/ui';

const info = wx.getWindowInfo();

Page({
  data: {
    statusBarHeight: info.statusBarHeight,
    agree: false,
    busy: false,
    staffBusy: false,
    appVersion: APP_VERSION,
    portals: PORTAL_TABS,
    portal: 'resident' as PortalMode,
    username: '',
    password: '',
  },

  onLoad(options: Record<string, string | undefined>) {
    const requested = String(options.portal || '');
    const portal: PortalMode =
      requested === 'management' || requested === 'maintenance' ? requested : 'resident';
    this.setData({
      agree: store.get<boolean>(STORAGE_KEYS.AGREED_PRIVACY, false),
      portal,
    });
  },

  onPortalTap(e: WechatMiniprogram.TouchEvent): void {
    const portal = String((e.currentTarget.dataset as { portal?: string }).portal || 'resident') as PortalMode;
    if (!['resident', 'management', 'maintenance'].includes(portal)) return;
    this.setData({ portal, username: '', password: '' });
  },

  onToggleAgree(): void {
    const agree = !this.data.agree;
    this.setData({ agree });
    if (agree) store.set(STORAGE_KEYS.AGREED_PRIVACY, true);
  },

  onUsernameInput(e: WechatMiniprogram.Input): void {
    this.setData({ username: String(e.detail.value || '') });
  },

  onPasswordInput(e: WechatMiniprogram.Input): void {
    this.setData({ password: String(e.detail.value || '') });
  },

  ensureAgreement(): boolean {
    if (this.data.agree) return true;
    toast('请先阅读并勾选《用户协议》和《隐私政策》');
    return false;
  },

  async onWxLogin(): Promise<void> {
    if (this.data.busy) return;
    if (!this.ensureAgreement()) return;
    this.setData({ busy: true });
    try {
      await login();
      store.set(STORAGE_KEYS.PORTAL_MODE, 'resident');
      wx.switchTab({ url: '/pages/index/index' });
    } catch {
      /* request 层已统一提示 */
    } finally {
      this.setData({ busy: false });
    }
  },

  async onStaffLogin(): Promise<void> {
    if (this.data.staffBusy) return;
    if (!this.ensureAgreement()) return;
    const username = this.data.username.trim();
    const password = this.data.password;
    if (!username || !password) {
      toast('请输入工作人员账号和密码');
      return;
    }
    if (this.data.portal === 'resident') return;
    this.setData({ staffBusy: true });
    try {
      let device: Record<string, string> = {};
      try {
        const deviceInfo = wx.getDeviceInfo();
        device = { platform: String(deviceInfo.platform || ''), model: String(deviceInfo.model || '') };
      } catch {
        device = {};
      }
      const result = await staffLogin({
        username,
        password,
        portalMode: this.data.portal,
        device,
      });
      if (result.profile.mustChangePassword) {
        wx.redirectTo({ url: `/pages/auth/staff-password/index?portal=${this.data.portal}` });
        return;
      }
      wx.reLaunch({ url: portalHome(this.data.portal) });
    } catch {
      /* request 层已统一提示 */
    } finally {
      this.setData({ staffBusy: false });
    }
  },

  onPhoneLogin(): void {
    toast('个人主体暂无法获取手机号，请使用微信一键登录');
  },

  onSkip(): void {
    store.set(STORAGE_KEYS.PORTAL_MODE, 'resident');
    wx.switchTab({ url: '/pages/index/index' });
  },

  onOpenDoc(e: WechatMiniprogram.TouchEvent): void {
    const kind = String((e.currentTarget.dataset as { kind?: string }).kind ?? 'user');
    wx.showModal({
      title: kind === 'privacy' ? '隐私政策' : '用户协议',
      content:
        kind === 'privacy'
          ? '收集：昵称、楼栋房号、联系方式，仅在提交单据时收集。用途：就近匹配服务、上门服务、通知送达。社区位置由你手动选择，仅用于就近排序附近服务点，不读取手机定位、不保存轨迹。健康档案仅本人与签约医生可见。'
          : '本小程序只提供社区服务的信息发布与预约登记，不收款、不担保交易、不提供医疗诊断。一个微信仅对应一个社区账号，账号仅限本人使用。工作人员账号由社区管理员创建并受审计。',
      showCancel: false,
      confirmText: '我知道了',
    });
  },
});
