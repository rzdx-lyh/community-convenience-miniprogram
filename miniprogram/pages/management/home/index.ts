/** 管理端 / 物业工作台：服务全景、工单搜索、图片找单与状态流转。 */
import { staffRoleLabel } from '../../../config/portal';
import { getStaffToken, logoutStaff, refreshStaffSession } from '../../../services/staff';
import {
  analyzeStaffWorkOrderImage,
  handleWorkOrder,
  listManagementWorkOrders,
} from '../../../services/workorder';
import { confirm, toast } from '../../../utils/ui';
import {
  buildServiceModules,
  buildWorkorderStats,
  decorateStaffOrders,
  filterOrdersByImageAnalysis,
  filterStaffOrders,
  managementHeadline,
  type StaffOrderVM,
  type StaffServiceModuleVM,
  type WorkorderStats,
} from '../../../viewmodels/staff-portal';

const info = wx.getWindowInfo();

const KPI_META = [
  { key: 'pending', label: '待受理', hint: '新报修待响应', tone: 'warm' },
  { key: 'assigned', label: '已派单', hint: '等待上门', tone: 'blue' },
  { key: 'processing', label: '处理中', hint: '正在处理', tone: 'teal' },
  { key: 'done', label: '已完工', hint: '累计完成', tone: 'green' },
] as const;

const QUICK_ACTIONS = [
  { key: 'imageSearch', label: '拍照找单', desc: 'AI 看图定位报修', icon: 'sparkles', tone: 'warm' },
  { key: 'services', label: '居民服务', desc: '38 项服务全景', icon: 'file', tone: 'teal' },
  { key: 'notice', label: '社区通知', desc: '查看发布记录', icon: 'megaphone', tone: 'blue' },
  { key: 'resident', label: '居民视角', desc: '回到服务首页', icon: 'home', tone: 'indigo' },
];

const STATUS_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待受理' },
  { key: 'assigned', label: '已派单' },
  { key: 'processing', label: '处理中' },
  { key: 'done', label: '已完工' },
];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

function kpiRows(stats: WorkorderStats) {
  return KPI_META.map((item) => ({ ...item, count: stats[item.key] }));
}

Page({
  data: {
    statusBarHeight: info.statusBarHeight,
    greeting: greeting(),
    loading: true,
    profile: null as StaffProfile | null,
    roleLabel: '',
    headline: '物业运营台',
    stats: { pending: 0, assigned: 0, processing: 0, done: 0, active: 0 } as WorkorderStats,
    kpis: kpiRows({ pending: 0, assigned: 0, processing: 0, done: 0, active: 0 }),
    quickActions: QUICK_ACTIONS,
    serviceModules: [] as StaffServiceModuleVM[],
    serviceTotal: 0,
    orders: [] as StaffOrderVM[],
    viewOrders: [] as StaffOrderVM[],
    statusFilters: STATUS_FILTERS.map((item) => ({ ...item, count: 0 })),
    activeStatus: 'all',
    query: '',
    searchingImage: false,
    searchImage: '',
    imageAnalysis: null as WorkOrderImageAnalysis | null,
    selectedOrder: null as StaffOrderVM | null,
    handlingId: '',
    selectedService: null as StaffServiceModuleVM | null,
    loadingList: false,
    loadError: '',
  },

  onLoad() {
    const modules = buildServiceModules();
    this.setData({
      serviceModules: modules,
      serviceTotal: modules.reduce((total, item) => total + item.count, 0),
    });
    void this.init();
  },

  onShow() {
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
      this.setData({
        profile: result.profile,
        roleLabel: staffRoleLabel(result.profile.role),
        headline: managementHeadline(result.profile.role),
      });
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
      const orders = decorateStaffOrders(result.list || [], this.data.profile?._id || '', 'management');
      const stats = buildWorkorderStats(orders);
      this.setData({
        orders,
        stats,
        kpis: kpiRows(stats),
        statusFilters: STATUS_FILTERS.map((item) => ({
          ...item,
          count: item.key === 'all' ? orders.length : stats[item.key as keyof WorkorderStats] || 0,
        })),
      });
      this.applyFilters();
    } catch {
      this.setData({ loadError: '工单加载失败，请检查工作人员会话后重试' });
    } finally {
      this.setData({ loadingList: false });
    }
  },

  applyFilters(): void {
    const imageRows = this.data.imageAnalysis
      ? filterOrdersByImageAnalysis(this.data.orders as StaffOrderVM[], this.data.imageAnalysis)
      : (this.data.orders as StaffOrderVM[]);
    const viewOrders = filterStaffOrders(imageRows, this.data.query, this.data.activeStatus);
    this.setData({ viewOrders });
  },

  onSearchInput(e: WechatMiniprogram.Input): void {
    this.setData({ query: String(e.detail.value || '') });
    this.applyFilters();
  },

  onClearSearch(): void {
    this.setData({ query: '' });
    this.applyFilters();
  },

  onStatusFilter(e: WechatMiniprogram.TouchEvent): void {
    const status = String((e.currentTarget.dataset as { status?: string }).status || 'all');
    this.setData({ activeStatus: status });
    this.applyFilters();
  },

  onQuickAction(e: WechatMiniprogram.TouchEvent): void {
    const action = String((e.currentTarget.dataset as { action?: string }).action || '');
    if (action === 'imageSearch') {
      this.onPickSearchImage();
      return;
    }
    if (action === 'services') {
      wx.navigateTo({ url: '/pages/service/category/index' });
      return;
    }
    if (action === 'notice') {
      wx.navigateTo({ url: '/pages/notice/list/index' });
      return;
    }
    if (action === 'resident') this.onBackResident();
  },

  onPickSearchImage(): void {
    if (this.data.searchingImage) return;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const temp = res.tempFiles?.[0]?.tempFilePath || '';
        if (!temp) return;
        this.setData({ searchImage: temp, imageAnalysis: null, searchingImage: true });
        try {
          const ext = (temp.match(/\.(\w+)$/) || [])[1] || 'jpg';
          const cloudPath = `workorder-search/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const uploaded = await wx.cloud.uploadFile({ cloudPath, filePath: temp });
          const result = await analyzeStaffWorkOrderImage(uploaded.fileID);
          if (!result.analysis) {
            toast('视觉识别暂不可用，请使用关键词或分类筛选');
            return;
          }
          const analysis = result.analysis as WorkOrderImageAnalysis;
          this.setData({ imageAnalysis: analysis, activeStatus: 'all', query: '' });
          this.applyFilters();
          toast(`已识别为${analysis.title || '相关报修'}`);
        } catch {
          this.setData({ searchImage: '' });
          toast('图片上传或识别失败，请稍后重试');
        } finally {
          this.setData({ searchingImage: false });
        }
      },
    });
  },

  onClearSearchImage(): void {
    this.setData({ searchImage: '', imageAnalysis: null, searchingImage: false });
    this.applyFilters();
  },

  onPreviewSearchImage(): void {
    if (!this.data.searchImage) return;
    wx.previewImage({ current: this.data.searchImage, urls: [this.data.searchImage] });
  },

  onOpenOrder(e: WechatMiniprogram.TouchEvent): void {
    const id = String((e.currentTarget.dataset as { id?: string }).id || '');
    const selectedOrder = this.data.viewOrders.find((item) => item._id === id) || null;
    if (selectedOrder) this.setData({ selectedOrder });
  },

  onCloseOrder(): void {
    this.setData({ selectedOrder: null });
  },

  onPreviewOrderImage(e: WechatMiniprogram.TouchEvent): void {
    const id = String((e.currentTarget.dataset as { id?: string }).id || '');
    const index = Number((e.currentTarget.dataset as { index?: string }).index || 0);
    const order = this.data.orders.find((item) => item._id === id);
    if (!order || !order.images?.length) return;
    wx.previewImage({ current: order.images[index] || order.images[0], urls: order.images });
  },

  async onQuickHandle(e: WechatMiniprogram.TouchEvent): Promise<void> {
    if (this.data.handlingId) return;
    const id = String((e.currentTarget.dataset as { id?: string }).id || '');
    const kind = String((e.currentTarget.dataset as { kind?: string }).kind || '') as 'assign' | 'process' | 'done';
    if (!id || !kind) return;
    const label = kind === 'assign' ? '受理派单' : kind === 'process' ? '开始处理' : '确认完工';
    const ok = await confirm(label, `确定要执行“${label}”吗？状态更新后居民端会同步看到。`);
    if (!ok) return;
    this.setData({ handlingId: id });
    try {
      await handleWorkOrder({ id, action: kind, handleAction: kind });
      toast(`${label}成功`);
      this.setData({ selectedOrder: null });
      await this.loadWorkorders();
    } catch {
      /* request 层已提示 */
    } finally {
      this.setData({ handlingId: '' });
    }
  },

  onOpenServiceModule(e: WechatMiniprogram.TouchEvent): void {
    const key = String((e.currentTarget.dataset as { key?: string }).key || '');
    const selectedService = this.data.serviceModules.find((item) => item.key === key) || null;
    if (selectedService) this.setData({ selectedService });
  },

  onCloseServiceModule(): void {
    this.setData({ selectedService: null });
  },

  onBackResident(): void {
    wx.switchTab({ url: '/pages/index/index' });
  },

  async onLogout(): Promise<void> {
    await logoutStaff();
    wx.reLaunch({ url: '/pages/auth/login/index?portal=management' });
  },
});