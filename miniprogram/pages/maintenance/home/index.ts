/** 维修端工作台：抢单池、我的工单、处理流转与图片查看。 */
import { staffRoleLabel } from '../../../config/portal';
import { getStaffToken, logoutStaff, refreshStaffSession } from '../../../services/staff';
import { handleWorkOrder, listStaffWorkOrders } from '../../../services/workorder';
import { CATEGORY_LABELS } from '../../../utils/dict';
import { confirm, toast } from '../../../utils/ui';
import {
  buildWorkorderStats,
  decorateStaffOrders,
  maintenanceHeadline,
  type StaffOrderVM,
  type WorkorderStats,
} from '../../../viewmodels/staff-portal';

const info = wx.getWindowInfo();

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

function skillLabels(skills: string[] = []): string[] {
  return skills.map((skill) => CATEGORY_LABELS[skill as WorkOrder['category']] || skill).slice(0, 8);
}

Page({
  data: {
    statusBarHeight: info.statusBarHeight,
    greeting: greeting(),
    loading: true,
    profile: null as StaffProfile | null,
    roleLabel: '',
    headline: '维修调度台',
    online: true,
    skillTags: [] as string[],
    stats: { pending: 0, assigned: 0, processing: 0, done: 0, active: 0 } as WorkorderStats,
    orders: [] as StaffOrderVM[],
    queue: [] as StaffOrderVM[],
    mine: [] as StaffOrderVM[],
    selectedOrder: null as StaffOrderVM | null,
    loadingList: false,
    loadError: '',
  },

  onLoad() {
    void this.init();
  },

  onShow() {
    if (this.data.profile && !this.data.loading) void this.loadOrders();
  },

  async init(): Promise<void> {
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
      this.setData({
        profile: result.profile,
        roleLabel: staffRoleLabel(result.profile.role),
        headline: maintenanceHeadline(result.profile.role),
        skillTags: skillLabels(result.profile.skills),
      });
      await this.loadOrders();
    } catch {
      wx.reLaunch({ url: '/pages/auth/login/index?portal=maintenance' });
    } finally {
      this.setData({ loading: false });
    }
  },

  async loadOrders(): Promise<void> {
    if (this.data.loadingList) return;
    this.setData({ loadingList: true, loadError: '' });
    try {
      const result = await listStaffWorkOrders({ pageSize: 200 });
      const orders = decorateStaffOrders(result.list || [], this.data.profile?._id || '');
      const queue = orders.filter((item) => item.status === 'pending' || (item.status === 'assigned' && !item.assignee));
      const mine = orders.filter((item) =>
        item.status === 'assigned' || item.status === 'processing' || item.status === 'done',
      );
      this.setData({ orders, queue, mine, stats: { ...buildWorkorderStats(orders), pending: queue.length } });
    } catch {
      this.setData({ loadError: '工单池加载失败，请重新登录后重试' });
    } finally {
      this.setData({ loadingList: false });
    }
  },

  onToggleOnline(): void {
    const online = !this.data.online;
    this.setData({ online });
    toast(online ? '已开启接单' : '已暂停接单');
  },

  onOpenOrder(e: WechatMiniprogram.TouchEvent): void {
    const id = String((e.currentTarget.dataset as { id?: string }).id || '');
    const selectedOrder = this.data.orders.find((item) => item._id === id) || null;
    if (selectedOrder) this.setData({ selectedOrder });
  },

  onCloseOrder(): void {
    this.setData({ selectedOrder: null });
  },

  onPreviewImage(e: WechatMiniprogram.TouchEvent): void {
    const id = String((e.currentTarget.dataset as { id?: string }).id || '');
    const index = Number((e.currentTarget.dataset as { index?: string }).index || 0);
    const order = this.data.orders.find((item) => item._id === id);
    if (!order || !order.images?.length) return;
    wx.previewImage({ current: order.images[index] || order.images[0], urls: order.images });
  },

  onOpenLocation(e: WechatMiniprogram.TouchEvent): void {
    const id = String((e.currentTarget.dataset as { id?: string }).id || '');
    const order = this.data.orders.find((item) => item._id === id);
    const location = order?.location;
    if (!location) {
      toast('该工单没有地图位置');
      return;
    }
    wx.openLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      name: location.name,
      address: `报修位置：${location.name}`,
      scale: 18,
    });
  },

  async onHandleOrder(e: WechatMiniprogram.TouchEvent): Promise<void> {
    const id = String((e.currentTarget.dataset as { id?: string }).id || '');
    const kind = String((e.currentTarget.dataset as { kind?: string }).kind || '') as 'assign' | 'process' | 'done';
    if (!id || !kind) return;
    if (!this.data.online) {
      toast('请先开启接单');
      return;
    }
    const label = kind === 'assign' ? '接单' : kind === 'process' ? '开始处理' : '确认完工';
    const ok = await confirm(label, `确定执行“${label}”吗？`);
    if (!ok) return;
    try {
      await handleWorkOrder({ id, action: kind, handleAction: kind, note: kind === 'done' ? '维修人员已在工作台确认完工' : undefined });
      toast(`${label}成功`);
      this.setData({ selectedOrder: null });
      await this.loadOrders();
    } catch {
      /* request 层已提示 */
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