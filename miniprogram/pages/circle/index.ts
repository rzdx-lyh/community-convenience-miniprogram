/**
 * 社区圈子页（FE-12 · 最小版：只读公告流）
 * 契约：circle:list（分页）/ circle:detail（本期降级为卡片内联展开全文，见任务卡降级方案）
 * 依赖：FE-0 request 封装；空态一律用 empty-state 组件，禁止白屏。
 */
import { ENV, STORAGE_KEYS } from '../../config/env';
import { listCirclePosts } from '../../services/circle';
import { store } from '../../store/global';
import { CIRCLE_TYPE_LABELS } from '../../utils/dict';
import { toRelativeTime } from '../../utils/format';
import { track, trackPageView } from '../../utils/logger';
import { consumePendingCircleFilter, type CircleFilter } from '../../utils/navigator';
import { createPager, normalizePage } from '../../utils/pagination';

export interface CircleTab {
  label: string;
  value: string;
}

export interface CircleVM {
  _id: string;
  title: string;
  content: string;
  typeLabel: string;
  authorName: string;
  isOfficial: boolean;
  tags: string[];
  timeText: string;
  topFlag: boolean;
  viewCount: number;
  /** 内联展开态（降级方案：不新增详情二级页） */
  expanded: boolean;
}

export const CIRCLE_TABS: CircleTab[] = [
  { label: '全部', value: '' },
  { label: '路况', value: 'road' },
  { label: '公告', value: 'notice' },
  { label: '活动', value: 'activity' },
];

/** CirclePost → 视图模型（可单测的纯函数） */
export function toCircleVM(post: CirclePost): CircleVM {
  return {
    _id: post._id,
    title: post.title,
    content: post.content,
    typeLabel: CIRCLE_TYPE_LABELS[post.type] ?? post.type,
    authorName: post.authorName,
    isOfficial: post.authorRole === 'official',
    tags: post.tags ?? [],
    timeText: toRelativeTime(post.publishAt),
    topFlag: Boolean(post.topFlag),
    viewCount: Number(post.viewCount ?? 0),
    expanded: false,
  };
}

const pager = createPager<CirclePost>(async (page, pageSize) => {
  const res = await listCirclePosts({ type: (currentType || undefined) as CirclePost['type'] | undefined, page, pageSize });
  return { list: res.list ?? [], total: res.total ?? 0 };
}, ENV.PAGE_SIZE);

/** 当前筛选类型（模块级，供 pager 的 fetcher 读取） */
let currentType = '';

Page({
  data: {
    tabs: CIRCLE_TABS,
    activeType: '',
    list: [] as CircleVM[],
    loadingMore: false,
    hasMore: true,
    elderMode: false,
    emptyText: '还没有邻居发言',
    emptySubText: '成为第一个分享社区新鲜事的人',
  },

  onLoad() {
    trackPageView('pages/circle/index');
    this.setData({ elderMode: store.get<boolean>(STORAGE_KEYS.ELDER_MODE, false) });
    void this.refresh();
  },

  onShow() {
    const elderMode = store.get<boolean>(STORAGE_KEYS.ELDER_MODE, false);
    if (elderMode !== this.data.elderMode) this.setData({ elderMode });
    // 契约附 A.3：读全局 pendingCircleFilter 后立即消费并清除，返回再进不残留
    const filter: CircleFilter | null = consumePendingCircleFilter();
    if (filter) {
      const nextType = String(filter.type ?? '');
      if (nextType !== this.data.activeType) {
        this.setData({ activeType: nextType });
        currentType = nextType;
        void this.refresh();
        return;
      }
    }
  },

  onUnload() {
    currentType = '';
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
    if (value === this.data.activeType) return;
    track('btn_click', { page: 'circle', target: value });
    this.setData({ activeType: value });
    currentType = value;
    void this.refresh();
  },

  /** 卡片点击：内联展开/收起全文（降级方案，不跳二级页） */
  onCardTap(e: WechatMiniprogram.TouchEvent) {
    const id = String((e.currentTarget.dataset as { id?: string }).id ?? '');
    const list = this.data.list.map((item) =>
      item._id === id ? { ...item, expanded: !item.expanded } : item,
    );
    this.setData({ list });
  },

  async refresh(): Promise<void> {
    pager.reset();
    this.setData({ list: [], hasMore: true, loadingMore: true });
    try {
      await this.loadMore();
    } finally {
      this.setData({ loadingMore: false });
    }
  },

  async loadMore(): Promise<void> {
    if (!pager.hasMore() || pager.loading()) return;
    this.setData({ loadingMore: true });
    try {
      const res = await pager.next();
      const appended = res.list.map(toCircleVM);
      const list = this.data.list.concat(appended);
      this.setData({ list, loadingMore: false, hasMore: pager.hasMore() });
    } catch {
      // 失败态：request 层已统一 toast，这里只收起 loading，保持可重试
      this.setData({ loadingMore: false });
    }
  },

  /** 分页参数归一化（契约：page 从 1 起、pageSize 上限 50） */
  normalize(page?: number, pageSize?: number): { page: number; pageSize: number } {
    return normalizePage(page, pageSize);
  },
});
