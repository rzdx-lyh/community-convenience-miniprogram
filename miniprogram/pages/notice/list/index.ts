/**
 * 社区通知（CR-028 按 1.4 设计稿重建 · pgNotice）
 *
 * 结构对照 design：`.sbar` + `.nav` + `.tb`（类型 tab）+ `.nt` 通知卡列表。
 * 数据能力保留：notice:list 分页 / notice:detail 详情 / 下拉刷新 / 上拉加载。
 *
 * 降级铁律（"报错可以留，白屏不行"）：首屏接口失败或无数据时落到本地示例通知，
 * 保证列表结构可见，并用 `.tip` 明示「示例数据」。
 */
import { ENV } from '../../../config/env';
import { getNoticeDetail, listNotices } from '../../../services/notice';
import { getStatusBarHeight } from '../../../utils/device';
import { parseDate, toRelativeTime, toShortDateTime } from '../../../utils/format';
import { createPager } from '../../../utils/pagination';
import { decodeQueryValue } from '../../../utils/query';

/** Tab key：前 3 个对应服务端 type，road/water 为本地关键词筛选 */
export type NoticeTabKey = 'all' | 'notice' | 'activity' | 'urgent' | 'road' | 'water';

export interface NoticeTab {
  key: NoticeTabKey;
  label: string;
}

export const NOTICE_TABS: NoticeTab[] = [
  { key: 'all', label: '全部' },
  { key: 'notice', label: '公告' },
  { key: 'activity', label: '活动' },
  { key: 'urgent', label: '紧急' },
  { key: 'road', label: '路况' },
  { key: 'water', label: '停水停电' },
];

/** 列表视图模型（wxml 只做渲染，不再算文案） */
export interface NoticeVM {
  id: string;
  title: string;
  summary: string;
  content: string;
  tagLabel: string;
  /** 原型 `.tag` 修饰类：red / ok / warn / 空 */
  tagClass: string;
  levelLabel: string;
  timeText: string;
  metaText: string;
  placeText: string;
  rangeText: string;
}

const TYPE_TAG: Record<Notice['type'], { label: string; cls: string }> = {
  urgent: { label: '紧急', cls: 'red' },
  activity: { label: '活动', cls: 'ok' },
  notice: { label: '公告', cls: '' },
};

const LEVEL_LABEL: Record<string, string> = {
  critical: '特别紧急',
  high: '紧急',
  normal: '',
};

const ROAD_KEYS = ['施工', '道路', '路况', '绕行', '检修', '门岗', '封路'];
const WATER_KEYS = ['停水', '停电', '供水', '水压'];

/* ---------------- 入参归一化（供 wx.navigateTo 携带的 query 使用） ---------------- */

const VALID_TYPES: Notice['type'][] = ['notice', 'activity', 'urgent'];

/** 归一化 type 入参：非法/缺失返回 'notice'（默认通知） */
export function normalizeNoticeType(input?: string): Notice['type'] {
  const value = String(input ?? '').trim().toLowerCase();
  return (VALID_TYPES as string[]).indexOf(value) >= 0 ? (value as Notice['type']) : 'notice';
}

/** 归一化 tag 入参：缺失返回空串（= 不筛选） */
export function normalizeTag(input?: string): string {
  return String(input ?? '').trim();
}

/** 报名截止文案（纯函数） */
export function toDeadlineText(signupDeadline?: string): string {
  const text = toShortDateTime(signupDeadline);
  return text ? `报名截止 ${text}` : '';
}

/** tag 本地关键词过滤（纯函数）：空 tag 直接放行；否则匹配 title/content */
export function matchTag(notice: Notice, tag: string): boolean {
  const keyword = String(tag ?? '').trim();
  if (!keyword) return true;
  return `${notice.title ?? ''} ${notice.content ?? ''}`.indexOf(keyword) >= 0;
}

function includesAny(text: string, keys: string[]): boolean {
  return keys.some((k) => text.indexOf(k) >= 0);
}

/** Tab 匹配（纯函数）：type Tab 走服务端类型，路况/停水停电走本地关键词 */
export function matchTab(notice: Notice, tab: NoticeTabKey): boolean {
  if (tab === 'all') return true;
  if (tab === 'notice' || tab === 'activity' || tab === 'urgent') return notice.type === tab;
  const haystack = `${notice.title ?? ''} ${notice.content ?? ''} ${notice.summary ?? ''}`;
  if (tab === 'road') return includesAny(haystack, ROAD_KEYS);
  return includesAny(haystack, WATER_KEYS);
}

/** Tab → 服务端 type（all/road/water 不传，取全量后本地筛） */
export function typeOfTab(tab: NoticeTabKey): Notice['type'] | undefined {
  if (tab === 'notice' || tab === 'activity' || tab === 'urgent') return tab;
  return undefined;
}

/** 起止文案（纯函数） */
export function toRangeText(startAt?: string, endAt?: string): string {
  const start = toShortDateTime(startAt);
  const end = toShortDateTime(endAt);
  if (start && end) return `${start} 至 ${end}`;
  if (start) return `${start} 起`;
  if (end) return `至 ${end}`;
  return '';
}

/** Notice → 视图模型（纯函数） */
export function toNoticeVM(notice: Notice): NoticeVM {
  const tag = TYPE_TAG[notice.type] ?? TYPE_TAG.notice;
  const level = notice.level ?? 'normal';
  const timeText = toRelativeTime(notice.publishAt);
  const end = parseDate(notice.endAt);
  const isExpired = Boolean(end) && (end as Date).getTime() < Date.now();
  return {
    id: notice._id,
    title: notice.title,
    summary: notice.summary || notice.title,
    content: notice.content || '',
    tagLabel: tag.label,
    tagClass: tag.cls,
    levelLabel: notice.type === 'urgent' ? LEVEL_LABEL[level] ?? '' : '',
    timeText,
    metaText: `${tag.label} · ${timeText || '刚刚'}${isExpired ? ' · 已结束' : ''}`,
    placeText: notice.location || '',
    rangeText: toRangeText(notice.startAt, notice.endAt),
  };
}

/** 本地示例通知（接口不可用时的兜底，内容取自设计稿） */
export function buildDemoNotices(): Notice[] {
  const now = Date.now();
  const hoursAgo = (h: number): string => new Date(now - h * 3600 * 1000).toISOString();
  return [
    {
      _id: 'demo-1',
      title: '3 号楼停水提醒（附储水建议）',
      content:
        '明天 09:00-17:00 对 3 号楼供水管网进行检修，期间全楼停水。家有老人的建议今晚先接两桶水，物业办公室也可取水。恢复供水后请先放水 1-2 分钟再使用。',
      type: 'urgent',
      status: 'published',
      publishAt: hoursAgo(5),
      location: '3 号楼 · 1-3 单元',
      level: 'high',
      summary: '明天 09:00-17:00 停水，家有老人的建议今晚先接两桶水，物业办公室也可取水。',
      startAt: new Date(now + 16 * 3600 * 1000).toISOString(),
      endAt: new Date(now + 24 * 3600 * 1000).toISOString(),
    },
    {
      _id: 'demo-2',
      title: '2 号门道路施工，建议绕行东门',
      content:
        '2 号门今早开始道路检修，预计两天。早高峰建议走东门，电动车请绕行南门坡道并注意减速。施工期间请勿在路面停放车辆。',
      type: 'notice',
      status: 'published',
      publishAt: hoursAgo(6),
      location: '2 号门 · 主路',
    },
    {
      _id: 'demo-3',
      title: '爱心义诊进社区（本周六）',
      content:
        '本周六 9:00-11:30 在社区广场开展免费义诊，测血压血糖、中医问诊。需测血糖的请空腹，现场可登记健康档案，带医保卡即可。',
      type: 'activity',
      status: 'published',
      publishAt: hoursAgo(24),
      location: '社区广场',
      signupDeadline: new Date(now + 3 * 24 * 3600 * 1000).toISOString(),
    },
    {
      _id: 'demo-4',
      title: '你的报修已派单',
      content:
        '张师傅预计今天 14:00 上门处理厨房下水返味问题，如需改期请点工单详情。师傅上门前会先电话联系。',
      type: 'notice',
      status: 'published',
      publishAt: hoursAgo(2),
      location: '3 号楼 2 单元',
    },
    {
      _id: 'demo-5',
      title: '本周六上午计划停电检修',
      content: '本周六 08:00-11:00 对 1 号楼配电房检修，停电范围 1 号楼全部楼层，请提前关闭电器。',
      type: 'urgent',
      status: 'published',
      publishAt: hoursAgo(9),
      location: '1 号楼',
      level: 'normal',
    },
    {
      _id: 'demo-6',
      title: '长者手机课：微信挂号与防诈骗',
      content:
        '本周四 14:00 在社区活动室开课，教长辈用微信挂号、查报告、识别陌生链接和诈骗电话。建议带上手机，现场有志愿者一对一协助。',
      type: 'activity',
      status: 'published',
      publishAt: hoursAgo(18),
      location: '社区活动室',
      signupDeadline: new Date(now + 2 * 24 * 3600 * 1000).toISOString(),
    },
    {
      _id: 'demo-7',
      title: '邻里手工坊：旧物改造周末场',
      content: '本周日 15:00 在社区活动室做旧物改造，材料由社区提供，欢迎带上家里的旧布料和瓶罐参加。',
      type: 'activity',
      status: 'published',
      publishAt: hoursAgo(30),
      location: '社区活动室',
    },
  ];
}

/** 当前筛选类型（模块级，供 pager fetcher 读取） */
let currentType: Notice['type'] | undefined;
/** 当前关键词筛选（活动入口：义诊/手机课等；空串=不过滤） */
let currentTag = '';

const pager = createPager<Notice>(async (page, pageSize) => {
  const params: NoticeListParams = { page, pageSize };
  // 契约 notice:list 的 type 为可选；不传 = 全量（避免给云函数塞 undefined/null）
  if (currentType) params.type = currentType;
  const res = await listNotices(params);
  return { list: res.list ?? [], total: res.total ?? 0 };
}, ENV.PAGE_SIZE);

function nowClock(): string {
  const d = new Date();
  const pad = (n: number): string => (n < 10 ? `0${n}` : String(n));
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

Page({
  data: {
    statusBarHeight: getStatusBarHeight(),
    clock: nowClock(),
    tabs: NOTICE_TABS,
    activeTab: 'all' as NoticeTabKey,
    pageTitle: '消息通知',
    activeTag: '',
    list: [] as NoticeVM[],
    expandedId: '',
    loading: false,
    hasMore: true,
    demoMode: false,
  },

  /** 请求代际：切 Tab / 下拉刷新时丢弃过期响应 */
  genId: 0,

  onLoad(options: Record<string, string | undefined>) {
    // 兼容旧入参：?type=notice|activity|urgent
    const type = decodeQueryValue(options.type).toLowerCase();
    const tab: NoticeTabKey =
      type === 'notice' || type === 'activity' || type === 'urgent' ? type : 'all';
    currentType = typeOfTab(tab);
    // 文化便民入口：?tag=义诊&title=每周义诊；options 可能仍是 %XX，必须兜底解码
    currentTag = normalizeTag(decodeQueryValue(options.tag));
    const explicitTitle = decodeQueryValue(options.title);
    const pageTitle = explicitTitle || (currentTag ? `${currentTag}活动` : '消息通知');
    this.setData({ activeTab: tab, clock: nowClock(), pageTitle, activeTag: currentTag });
    void this.refresh();
  },

  onShow() {
    this.setData({ clock: nowClock() });
  },

  onUnload() {
    currentType = undefined;
    currentTag = '';
    pager.reset();
  },

  onPullDownRefresh() {
    void this.refresh().finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    void this.loadMore();
  },

  goBack(): void {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  onTabTap(e: WechatMiniprogram.TouchEvent): void {
    const key = String((e.currentTarget.dataset as { key?: string }).key ?? 'all') as NoticeTabKey;
    if (key === this.data.activeTab && !currentTag) return;
    currentType = typeOfTab(key);
    currentTag = '';
    this.setData({ activeTab: key, activeTag: '', pageTitle: '消息通知', expandedId: '' });
    pager.reset();
    void this.refresh();
  },

  /** 点卡片：内联展开全文（列表已带 content 时零请求，缺 content 才回查 notice:detail） */
  onCardTap(e: WechatMiniprogram.TouchEvent): void {
    const id = String((e.currentTarget.dataset as { id?: string }).id ?? '');
    if (!id) return;
    if (this.data.expandedId === id) {
      this.setData({ expandedId: '' });
      return;
    }
    this.setData({ expandedId: id });
    const item = this.data.list.find((n) => n.id === id);
    if (item && !item.content) void this.fetchDetail(id);
  },

  async fetchDetail(id: string): Promise<void> {
    try {
      const res = await getNoticeDetail({ id });
      const notice = res?.notice;
      if (!notice) return;
      const vm = toNoticeVM(notice);
      this.setData({
        list: this.data.list.map((n) => (n.id === id ? { ...n, content: vm.content } : n)),
      });
    } catch {
      // request 层已统一提示；展开态保持摘要即可，不打断阅读
    }
  },

  async refresh(): Promise<void> {
    const gen = ++this.genId;
    pager.reset();
    this.setData({ loading: true, hasMore: true });
    try {
      const res = await pager.next();
      if (gen !== this.genId) return;
      const filtered = (res.list ?? []).filter(
        (n) => matchTab(n, this.data.activeTab) && matchTag(n, currentTag),
      );
      if (filtered.length === 0) {
        this.applyDemo();
      } else {
        this.setData({
          list: filtered.map(toNoticeVM),
          demoMode: false,
          hasMore: pager.hasMore(),
        });
      }
    } catch {
      if (gen !== this.genId) return;
      this.applyDemo();
    } finally {
      if (gen === this.genId) this.setData({ loading: false });
    }
  },

  async loadMore(): Promise<void> {
    if (this.data.loading || !this.data.hasMore || this.data.demoMode) return;
    this.setData({ loading: true });
    try {
      const res = await pager.next();
      const added = (res.list ?? [])
        .filter((n) => matchTab(n, this.data.activeTab) && matchTag(n, currentTag))
        .map(toNoticeVM);
      this.setData({
        list: this.data.list.concat(added),
        hasMore: added.length > 0 && pager.hasMore(),
        loading: false,
      });
    } catch {
      this.setData({ loading: false, hasMore: false });
    }
  },

  /** 首屏无数据：回退本地示例，保证页面结构可见 */
  applyDemo(): void {
    const list = buildDemoNotices()
      .filter((n) => matchTab(n, this.data.activeTab))
      .filter((n) => matchTag(n, currentTag))
      .map(toNoticeVM);
    this.setData({
      list,
      demoMode: list.length > 0,
      hasMore: false,
      loading: false,
    });
  },
});
