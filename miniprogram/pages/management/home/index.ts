/** 管理端工作台（阶段 4：账号/会话 + 工单读取） */
import { staffRoleLabel } from '../../../config/portal';
import { getStaffToken, logoutStaff, refreshStaffSession } from '../../../services/staff';
import { listManagementWorkOrders } from '../../../services/workorder';
import { toast } from '../../../utils/ui';

export default {};

const STATUS_META = [
  { k: 'pending', status: 'pending', t: '待受理', d: '居民新提交，等待物业受理' },
  { k: 'assigned', status: 'assigned', t: '已派单', d: '维修人员待上门处理' },
  { k: 'processing', status: 'processing', t: '处理中', d: '维修人员正在处理' },
  { k: 'done', status: 'done', t: '已完工', d: '维修完成，等待确认' },
] as const;

const STATUS_LABEL: Record<WorkOrder['status'], string> = {
  pending: '待受理',
  assigned: '已派单',
  processing: '处理中',
  done: '已完工',
  closed: '已关闭',
  canceled: '已取消',
};

const CATEGORY_LABEL: Record<WorkOrder['category'], string> = {
  water: '水管',
  electric: '电路',
  door: '门窗',
  public: '公共设施',
  other: '其他',
};

Page({
  data: {
    loading: true,
    profile: null as StaffProfile | null,
    roleLabel: '',
    cards: STATUS_META.map((c) => ({ ...c, n: 0 })),
    list: [] as Array<WorkOrder & { statusLabel: string; categoryLabel: string; createdAtText: string }>,
    total: 0,
    loadingList: false,
    loadError: '',
  },

  onLoad() {
    void this.init();
  },

  onShow() {
    // 从居民端返回/重新显示时刷新，居民新提交的工单能立即看到
    if (this.data.profile && !this.data.loading) void this.loadWorkorders();
  },

  async init(): Promise<void> {
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
      await this.loadWorkorders();
    } catch {
      wx.reLaunch({ url: '/pages/auth/login/index?portal=management' });
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadWorkorders(): Promise<void> {
    if (this.data.loadingList) return;
    this.setData({ loadingList: true, loadError: '' });
    try {
      const result = await listManagementWorkOrders({ pageSize: 200 });
      const rows = result.list || [];
      const counts: Record<string, number> = {};
      rows.forEach((w) => {
        counts[w.status] = (counts[w.status] || 0) + 1;
      });
      const cards = STATUS_META.map((c) => ({ ...c, n: counts[c.status] || 0 }));
      const list = rows.map((w) => ({
        ...w,
        statusLabel: STATUS_LABEL[w.status] || w.status,
        categoryLabel: CATEGORY_LABEL[w.category] || w.category,
        createdAtText: String(w.createdAt || '').replace('T', ' ').slice(0, 16),
      }));
      this.setData({ cards, list, total: result.total });
    } catch {
      this.setData({ loadError: '工单加载失败，请稍后重试' });
      toast('工单加载失败，请稍后重试');
    } finally {
      this.setData({ loadingList: false });
    }
  },

  onItem(e: WechatMiniprogram.TouchEvent): void {
    const index = Number(e.currentTarget.dataset.index);
    const item = this.data.list[index];
    if (!item) return;
    wx.showModal({
      title: item.title,
      content: `${item.statusLabel} · ${item.categoryLabel}\n${item.aiSummary || item.description}`,
      showCancel: false,
      confirmText: '知道了',
    });
  },

  onBackResident(): void {
    wx.switchTab({ url: '/pages/index/index' });
  },

  async onLogout(): Promise<void> {
    await logoutStaff();
    wx.reLaunch({ url: '/pages/auth/login/index?portal=management' });
  },
});
