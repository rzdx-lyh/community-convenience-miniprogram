/**
 * 服务订单页（FE-4 · 变更 C1：由「我的报修/报修列表」改名）
 * 契约：workorder:list（数据源不变，后端零改动）；改名仅影响页面文案与筛选口径。
 * - 状态筛选 Tab：全部 / 待受理 / 处理中 / 已完成
 * - 分页下拉加载；空态用 empty-state 组件
 */
import { ENV, STORAGE_KEYS } from '../../../config/env';
import { listWorkOrders } from '../../../services/workorder';
import { store } from '../../../store/global';
import { CATEGORY_LABELS, STATUS_LABELS, labelOf } from '../../../utils/dict';
import { toShortDateTime } from '../../../utils/format';
import { track, trackPageView } from '../../../utils/logger';
import { createPager, normalizePage } from '../../../utils/pagination';

export interface OrderTab {
  label: string;
  value: string;
}

export interface OrderVM {
  _id: string;
  title: string;
  statusLabel: string;
  statusKey: string;
  categoryLabel: string;
  summary: string;
  timeText: string;
}

export const ORDER_TABS: OrderTab[] = [
  { label: '全部', value: '' },
  { label: '待受理', value: 'pending' },
  { label: '处理中', value: 'processing' },
  { label: '已完成', value: 'done' },
];

/** WorkOrder → 视图模型（纯函数，可单测） */
export function toOrderVM(order: WorkOrder): OrderVM {
  return {
    _id: order._id,
    title: order.title,
    statusLabel: labelOf(STATUS_LABELS, order.status, order.status),
    statusKey: order.status,
    categoryLabel: labelOf(CATEGORY_LABELS, order.category, order.category),
    summary: order.aiSummary || order.description,
    timeText: toShortDateTime(order.createdAt),
  };
}

/** 当前筛选状态（模块级，供 pager 的 fetcher 读取） */
let currentStatus = '';

const pager = createPager<WorkOrder>(async (page, pageSize) => {
  const res = await listWorkOrders({
    status: (currentStatus || undefined) as WorkOrder['status'] | undefined,
    page,
    pageSize,
  });
  return { list: res.list ?? [], total: res.total ?? 0 };
}, ENV.PAGE_SIZE);

Page({
  data: {
    tabs: ORDER_TABS,
    activeStatus: '',
    list: [] as OrderVM[],
    loadingMore: false,
    hasMore: true,
    elderMode: false,
    emptyText: '还没有服务订单',
    emptySubText: '遇到问题？点下方按钮提交报修',
  },

  /** 请求代际：每次 refresh 自增，过期响应直接丢弃，避免 onLoad/onShow 双触发与切 Tab 竞态导致数据重复/混杂（BUG-001/002） */
  genId: 0,

  onLoad() {
    trackPageView('pages/repair/list/index');
    this.setData({ elderMode: store.get<boolean>(STORAGE_KEYS.ELDER_MODE, false) });
  },

  onShow() {
    const elderMode = store.get<boolean>(STORAGE_KEYS.ELDER_MODE, false);
    if (elderMode !== this.data.elderMode) this.setData({ elderMode });
    void this.refresh();
  },

  onUnload() {
    currentStatus = '';
    pager.reset();
  },

  onPullDownRefresh() {
    void this.refresh().finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    void this.loadMore();
  },

  onTabTap(e: WechatMiniprogram.TouchEvent) {
    const value = String((e.currentTarget.dataset as { value?: string }).value ?? '');
    if (value === this.data.activeStatus) return;
    track('btn_click', { page: 'order', target: value });
    this.setData({ activeStatus: value });
    currentStatus = value;
    void this.refresh();
  },

  onCardTap(e: WechatMiniprogram.TouchEvent) {
    const id = String((e.currentTarget.dataset as { id?: string }).id ?? '');
    if (!id) return;
    wx.navigateTo({ url: `/pages/repair/detail/index?id=${id}` });
  },

  onCreate(): void {
    track('btn_click', { page: 'order', target: 'create' });
    wx.navigateTo({ url: '/pages/repair/create/index' });
  },

  async refresh(): Promise<void> {
    const gen = ++this.genId;
    pager.reset();
    this.setData({ list: [], hasMore: true, loadingMore: true });
    try {
      await this.loadMore(gen);
    } finally {
      if (gen === this.genId) this.setData({ loadingMore: false });
    }
  },

  async loadMore(gen?: number): Promise<void> {
    if (!pager.hasMore() || pager.loading()) return;
    this.setData({ loadingMore: true });
    try {
      const res = await pager.next();
      if (gen !== undefined && gen !== this.genId) return; // 过期响应丢弃（切 Tab/下拉刷新竞态）
      const list = this.data.list.concat(res.list.map(toOrderVM));
      this.setData({ list, loadingMore: false, hasMore: pager.hasMore() });
    } catch {
      if (gen === undefined || gen === this.genId) this.setData({ loadingMore: false });
    }
  },

  /** 分页参数归一化（契约：page 从 1 起、pageSize 上限 50） */
  normalize(page?: number, pageSize?: number): { page: number; pageSize: number } {
    return normalizePage(page, pageSize);
  },
});
