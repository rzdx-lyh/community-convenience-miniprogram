/** 维修端首页（阶段 4 第一步：账号、会话与页面守卫） */
import { staffRoleLabel } from '../../../config/portal';
import { getStaffToken, logoutStaff, refreshStaffSession } from '../../../services/staff';
import { toast } from '../../../utils/ui';

export default {};

Page({
  data: {
    loading: true,
    profile: null as StaffProfile | null,
    roleLabel: '',
    activeCount: 0,
    limit: 3,
  },

  async onLoad() {
    const token = getStaffToken();
    if (!token) {
      wx.reLaunch({ url: '/pages/auth/login/index?portal=maintenance' });
      return;
    }
    try {
      const result = await refreshStaffSession();
      if (result.profile.portalMode !== 'maintenance') {
        toast('账号不属于维修端');
        wx.reLaunch({ url: '/pages/auth/login/index?portal=maintenance' });
        return;
      }
      if (result.profile.mustChangePassword) {
        wx.redirectTo({ url: '/pages/auth/staff-password/index?portal=maintenance' });
        return;
      }
      this.setData({ profile: result.profile, roleLabel: staffRoleLabel(result.profile.role) });
    } catch {
      wx.reLaunch({ url: '/pages/auth/login/index?portal=maintenance' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onBackResident(): void {
    wx.switchTab({ url: '/pages/index/index' });
  },

  async onLogout(): Promise<void> {
    await logoutStaff();
    wx.reLaunch({ url: '/pages/auth/login/index?portal=maintenance' });
  },
});
