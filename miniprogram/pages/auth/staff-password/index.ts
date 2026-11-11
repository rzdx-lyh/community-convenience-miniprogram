/** 工作人员首次登录强制修改密码 */
import { portalHome } from '../../../config/portal';
import { changeStaffPassword, clearStaffAuth, getCachedStaffProfile } from '../../../services/staff';
import { toast } from '../../../utils/ui';

export default {};

Page({
  data: {
    portal: 'management' as Exclude<PortalMode, 'resident'>,
    roleLabel: '',
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    busy: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    const profile = getCachedStaffProfile();
    if (!profile) {
      wx.reLaunch({ url: '/pages/auth/login/index?portal=management' });
      return;
    }
    const requested = String(options.portal || profile.portalMode);
    const portal = requested === 'maintenance' ? 'maintenance' : 'management';
    this.setData({ portal, roleLabel: profile.displayName || profile.username });
  },

  onOldInput(e: WechatMiniprogram.Input): void {
    this.setData({ oldPassword: String(e.detail.value || '') });
  },

  onNewInput(e: WechatMiniprogram.Input): void {
    this.setData({ newPassword: String(e.detail.value || '') });
  },

  onConfirmInput(e: WechatMiniprogram.Input): void {
    this.setData({ confirmPassword: String(e.detail.value || '') });
  },

  async onSubmit(): Promise<void> {
    if (this.data.busy) return;
    if (this.data.newPassword.length < 8) {
      toast('新密码至少 8 位');
      return;
    }
    if (this.data.newPassword !== this.data.confirmPassword) {
      toast('两次输入的新密码不一致');
      return;
    }
    this.setData({ busy: true });
    try {
      await changeStaffPassword(this.data.oldPassword, this.data.newPassword);
      toast('密码已更新');
      setTimeout(() => wx.reLaunch({ url: portalHome(this.data.portal) }), 400);
    } catch {
      /* request 层已统一提示 */
    } finally {
      this.setData({ busy: false });
    }
  },

  onBackLogin(): void {
    clearStaffAuth();
    wx.reLaunch({ url: `/pages/auth/login/index?portal=${this.data.portal}` });
  },
});
