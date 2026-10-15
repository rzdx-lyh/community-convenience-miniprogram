/**
 * 通知 / 活动 / 紧急通知列表（FE-6）
 * 契约：notice:list（分页） / notice:detail（点卡片内联展开，零新增页面）
 *
 * FE-13 增量（保留导出，勿删）：URL 入参 `?type=` 与 `?tag=`
 * - 无参数默认「通知」Tab（与改造前一致）；首页紧急区会带 `type=urgent` 跳进来
 * - `tag=` 无服务端对应入参（契约 notice:list 只有 type/page/pageSize/includeExpired），
 *   故作为**本地关键词**对 title/content 做包含匹配，渲染成可清除的筛选 chip
 */
import { ENV, STORAGE_KEYS } from '../../../config/env';
import { getNoticeDetail, listNotices } from '../../../services/notice';
import { store } from '../../../store/global';
import { NOTICE_LEVEL_LABELS, NOTICE_TYPE_LABELS, labelOf } from '../../../utils/dict';
import { toShortDateTime } from '../../../utils/format';
import { track, trackPageView } from '../../../utils/logger';
import { createPager } from '../../../utils/pagination';

const VALID_TYPES: Notice['type'][] = ['notice', 'activity', 'urgent'];

/** 归一化 type 入参：非法/缺失返回 'notice'（默认通知 Tab） */
export function normalizeNoticeType(input?: string): Notice['type'] {
  const value = String(input ?? '').trim().toLowerCase();
  return (VALID_TYPES as string[]).indexOf(value) >= 0 ? (value as Notice['type']) : 'notice';
}

/** 归一化 tag 入参：缺失返回空串（= 不筛选） */
export function normalizeTag(input?: string): string {
  return String(input ?? '').trim();
}

export interface NoticeTab {
  label: string;
  value: Notice['type'];
}

export const NOTICE_TABS: NoticeTab[] = [
  { label: '通知', value: 'notice' },
  { label: '活动', value: 'activity' },
  { label: '紧急', value: 'urgent' },
];

/** 列表视图模型 */
export interface NoticeVM {
  _id: string;
  title: string;
  typeLabel: string;
  typeKey: Notice['type'];
  /** 紧急级别文案；非紧急或 normal 级别为空串（不高亮） */
  levelLabel: string;
  levelKey: string;
  /** 单行摘要；紧急项取 summary，缺省回退 title */
  summary: string;
  publishText: string;
  /** 起止时间文案，如「10-20 09:00 至 10-20 18:00」；无起止为空串 */
  rangeText: string;
  /** 活动地点，空则不渲染 */
  location: string;
  /** 报名截止文案，空则不渲染 */
  deadlineText: string;
}

/** 起止时间文案（纯函数）：两端都缺返回空串；只有一端则只显示一端 */
export function toRangeText(startAt?: string, endAt?: string): string {
  const start = toShortDateTime(startAt);
  const end = toShortDateTime(endAt);
  if (start && end) return `${start} 至 ${end}`;
  if (start) return `${start} 起`;
  if (end) return `至 ${end}`;
  return '';
}

/** 报名截止文案（纯函数） */
export function toDeadlineText(signupDeadline?: string): string {
  const text = toShortDateTime(signupDeadline);
  return text ? `报名截止 ${text}` : '';
}

/** Notice → 视图模型（纯函数） */
export function toNoticeVM(notice: Notice): NoticeVM {
  const level = notice.level ?? 'normal';
  return {
    _id: notice._id,
    title: notice.title,
    typeLabel: labelOf(NOTICE_TYPE_LABELS, notice.type, notice.type),
    typeKey: notice.type,
    // normal 与缺省都不高亮，避免列表一片红
    levelLabel: notice.type === 'urgent' && level !== 'normal' ? labelOf(NOTICE_LEVEL_LABELS, level, level) : '',
    levelKey: notice.type === 'urgent' ? level : '',
    summary: notice.summary || notice.title,
    publishText: toShortDateTime(notice.publishAt),
    rangeText: toRangeText(notice.startAt, notice.endAt),
    location: notice.location || '',
    deadlineText: toDeadlineText(notice.signupDeadline),
  };
}

/** tag 本地过滤（纯函数）：空 tag 直接放行；否则匹配 title/content */
export function matchTag(notice: Notice, tag: string): boolean {
  const keyword = String(tag ?? '').trim();
  if (!keyword) return true;
  const haystack = `${notice.title ?? ''} ${notice.content ?? ''}`;
  return haystack.indexOf(keyword) >= 0;
}

/** 当前筛选态（模块级，供 pager fetcher 读取） */
let currentType: Notice['type'] = 'notice';

const pager = createPager<Notice>(async (page, pageSize) => {
  const res = await listNotices({ type: currentType, page, pageSize });
  return { list: res.list ?? [], total: res.total ?? 0 };
}, ENV.PAGE_SIZE);

Page({
  data: {
    tabs: NOTICE_TABS,
    activeType: 'notice' as Notice['type'],
    activeTag: '',
    list: [] as NoticeVM[],
    loadingMore: false,
    hasMore: true,
    elderMode: false,
    /** 内联详情弹层 */
    detail: null as NoticeVM | null,
    detailContent: '',
    emptyText: '暂无通知',
    emptySubText: '社区有消息会第一时间发布',
  },

  /** 请求代际：每次 refresh 自增，过期响应丢弃，避免切 Tab/下拉竞态导致数据混杂（BUG-002） */
  genId: 0,

  onLoad(options: Record<string, string | undefined>) {
    trackPageView('pages/notice/list/index');
    this.setData({ elderMode: store.get<boolean>(STORAGE_KEYS.ELDER_MODE, false) });
    this.setData({
      activeType: normalizeNoticeType(options.type),
      activeTag: normalizeTag(options.tag),
    });
    currentType = this.data.activeType;
    void this.refresh();
  },

  onShow() {
    const elderMode = store.get<boolean>(STORAGE_KEYS.ELDER_MODE, false);
    if (elderMode !== this.data.elderMode) this.setData({ elderMode });
  },

  onUnload() {
    currentType = 'notice';
    pager.reset();
  },

  onPullDownRefresh() {
    void this.refresh().finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    void this.loadMore();
  },

  onTabTap(e: WechatMiniprogram.TouchEvent): void {
    const value = String(
      (e.currentTarget.dataset as { value?: string }).value ?? '',
    ) as Notice['type'];
    if (value === this.data.activeType) return;
    track('btn_click', { page: 'notice', target: value });
    this.setData({ activeType: value });
    currentType = value;
    void this.refresh();
  },

  onClearTag(): void {
    this.setData({ activeTag: '' });
    void this.refresh();
  },

  async onCardTap(e: WechatMiniprogram.TouchEvent): Promise<void> {
    const id = String((e.currentTarget.dataset as { id?: string }).id ?? '');
    if (!id) return;
    try {
      const res = await getNoticeDetail({ id });
      const notice = res?.notice;
      if (!notice) return;
      this.setData({ detail: toNoticeVM(notice), detailContent: notice.content || '' });
    } catch {
      // request 层已统一 toast
    }
  },

  onCloseDetail(): void {
    this.setData({ detail: null, detailContent: '' });
  },

  /** 拦截弹层内部点击冒泡，避免误触关闭（BUG-003） */
  noop(): void {},

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
      // tag 为本地关键词筛选，服务端无对应入参
      const filtered = (res.list ?? []).filter((n) => matchTag(n, this.data.activeTag));
      if (gen !== undefined && gen !== this.genId) return; // 过期响应丢弃（切 Tab/下拉刷新竞态）
      const list = this.data.list.concat(filtered.map(toNoticeVM));
      this.setData({ list, loadingMore: false, hasMore: pager.hasMore() });
    } catch {
      if (gen === undefined || gen === this.genId) this.setData({ loadingMore: false });
    }
  },
});
