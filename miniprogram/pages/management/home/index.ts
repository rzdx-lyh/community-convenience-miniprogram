/** 管理端工作台（阶段 4 第一步：账号、会话与页面守卫） */
import { staffRoleLabel } from '../../../config/portal';
import { getStaffToken, logoutStaff, refreshStaffSession } from '../../../services/staff';
import { toast } from '../../../utils/ui';

export default {};

Page({
  data: {
    loading: true,
    profile: null as StaffProfile | null,
    roleLabel: '',
    cards: [
      { k: 'pending', t: '待放单', n: 0, d: '居民新提交，等待物业放入抢单池' },
      { k: 'pool', t: '抢单池', n: 0, d: '维修人员可接单' },
      { k: 'verify', t: '待验收', n: 0, d: '维修完工，等待物业验收' },
      { k: 'confirm', t: '待最终确认', n: 0, d: '管理员确认后锁定工单' },
    ],
  },

  async onLoad() {
    const token = getStaffToken();
    if (!token) {
      wx.reLaunch({ url: '/pages/auth/login/index?portal=management' });
      return;
    }
    try {
      const result = await refreshStaffSession();
      if (result.profile.portalMode !== 'management') {
        toast('账号不属于管理端');
        wx.reLaunch({ url: '/pages/auth/login/index?portal=management' });
        return;
      }
      if (result.profile.mustChangePassword) {
        wx.redirectTo({ url: '/pages/auth/staff-password/index?portal=management' });
        return;
      }
      this.setData({ profile: result.profile, roleLabel: staffRoleLabel(result.profile.role) });
    } catch {
      wx.reLaunch({ url: '/pages/auth/login/index?portal=management' });
    } finally {
      this.setData({ loading: false });
    }
  },

  onBackResident(): void {
    wx.switchTab({ url: '/pages/index/index' });
  },

  async onLogout(): Promise<void> {
    await logoutStaff();
    wx.reLaunch({ url: '/pages/auth/login/index?portal=management' });
  },
});
