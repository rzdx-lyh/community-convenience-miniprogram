/**
 * 办事大厅（v1.0.2 / CR-019）
 *
 * 沿革：FE-4「报修列表」→ C1 改名「服务订单」→ v1.0.2 改名「办事大厅」并升格为聚合入口。
 * 结构：① 搜索（本地匹配 8 个服务子项）② 四类服务入口 ③ 我的报修记录（状态筛选 + 分页）
 *
 * 数据源（两条，互不阻塞）：
 * - service:list → 四类服务（失败回退 config/service-grid.ts 本地常量，0 白屏）
 * - workorder:list → 报修记录（**行为零回归**：分页/筛选/下拉刷新/代际去重全部沿用 FE-4 实现）
 *
 * 红线：本页是 Tab 页，`switchTab` 不支持 query —— 搜索态只存在页面内，不通过 URL 传递。
 */
import { ENV, STORAGE_KEYS } from '../../../config/env';
import { listServices } from '../../../services/service';
import { listWorkOrders } from '../../../services/workorder';
import { store } from '../../../store/global';
import { CATEGORY_LABELS, STATUS_LABELS, labelOf } from '../../../utils/dict';
import { toShortDateTime } from '../../../utils/format';
import { track, trackPageView } from '../../../utils/logger';
import { navigateByTarget } from '../../../utils/navigator';
import { createPager, normalizePage } from '../../../utils/pagination';
import { toast } from '../../../utils/ui';
import {
  buildHallRows,
  searchHallRows,
  toHallCatVM,
  type HallCatVM,
  type HallRow,
  type HallRowVM,
} from './viewmodel';

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

/** 服务检索行（模块级：带 ServiceItem，用于点击跳转；不进 setData） */
let hallRows: HallRow[] = [];

/** 分类原始数据（供「整卡热区 → ActionSheet 选子项」使用） */
let categories: ServiceCategory[] = [];

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
    /** 四类服务入口 */
    categories: [] as HallCatVM[],
    /** 搜索关键词与命中结果 */
    keyword: '',
    matchList: [] as HallRowVM[],

    tabs: ORDER_TABS,
    activeStatus: '',
    list: [] as OrderVM[],
    loadingMore: false,
    hasMore: true,
    elderMode: false,
    emptyText: '还没有报修记录',
    emptySubText: '遇到问题？点下方按钮提交报修',
  },

  /** 请求代际：每次 refresh 自增，过期响应直接丢弃，避免 onLoad/onShow 双触发与切 Tab 竞态导致数据重复/混杂（BUG-001/002） */
  genId: 0,

  onLoad() {
    trackPageView('pages/repair/list/index');
    this.setData({ elderMode: store.get<boolean>(STORAGE_KEYS.ELDER_MODE, false) });
    void this.loadServices();
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

  /* ============================ 四类服务入口 ============================ */

  async loadServices(): Promise<void> {
    const list = await listServices(); // 内部已兜底：空/失败 → 本地常量
    categories = list;
    hallRows = buildHallRows(list);
    this.setData({ categories: list.map(toHallCatVM) });
  },

  /** 入口卡点击：ActionSheet 展开该分类全部子项（与首页宫格同一交互口径） */
  onCatTap(e: WechatMiniprogram.TouchEvent): void {
    const key = String((e.currentTarget.dataset as { key?: string }).key ?? '');
    const category = categories.find((c) => c.key === key);
    const items = category?.items ?? [];
    if (items.length === 0) {
      toast('该服务暂未开通');
      return;
    }
    track('btn_click', { page: 'hall', target: `cat_${key}` });
    wx.showActionSheet({
      itemList: items.map((i) => i.name),
      success: (res) => {
        const item = items[res.tapIndex];
        if (item) navigateByTarget(item);
      },
      fail: () => {
        /* 用户取消，静默 */
      },
    });
  },

  /* ============================ 搜索 ============================ */

  /** 输入即筛（本地纯函数，无网络请求），并同步当前关键词 */
  onKeywordInput(e: WechatMiniprogram.Input): void {
    this.applyKeyword(String(e.detail.value ?? ''));
  },

  onClearKeyword(): void {
    this.applyKeyword('');
  },

  applyKeyword(keyword: string): void {
    const query = keyword.slice(0, 30);
    const matched = searchHallRows(hallRows, query);
    this.setData({
      keyword: query,
      matchList: matched.map(({ key, name, categoryKey, categoryTitle, iconText }) => ({
        key,
        name,
        categoryKey,
        categoryTitle,
        iconText,
      })),
    });
  },

  /** 键盘「搜索」：唯一命中直接跳转；多命中保持列表；0 命中引导问 AI */
  onSearchConfirm(): void {
    const matched = searchHallRows(hallRows, this.data.keyword);
    track('btn_click', { page: 'hall', target: 'search_confirm', hits: matched.length });
    if (matched.length === 1) {
      navigateByTarget(matched[0].item);
      return;
    }
    if (matched.length === 0) this.onAskAi();
  },

  /** 命中行点击 → 按契约 targetType 分发 */
  onRowTap(e: WechatMiniprogram.TouchEvent): void {
    const key = String((e.currentTarget.dataset as { key?: string }).key ?? '');
    const row = hallRows.find((r) => r.key === key);
    if (!row) return;
    track('btn_click', { page: 'hall', target: `search_${row.item.key}` });
    navigateByTarget(row.item);
  },

  /** 搜不到 → 带着关键词去问 AI 助手（presetQuestion 只填充输入框，不自动发送） */
  onAskAi(): void {
    const preset = this.data.keyword.trim();
    track('btn_click', { page: 'hall', target: 'search_ask_ai' });
    wx.navigateTo({
      url: `/pages/assistant/index${preset ? `?presetQuestion=${encodeURIComponent(preset)}` : ''}`,
      fail: () => toast('页面暂时打不开，请稍后再试'),
    });
  },

  /* ============================ 我的报修记录（FE-4 原逻辑，零回归） ============================ */

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
