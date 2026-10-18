/**
 * 首页 v1.2 改版（FE-11）
 * 结构：绿色渐变头部（填满顶部）→ 白色通知卡（负边距叠压）→ 双 pill → 2×2 四类服务宫格
 * ⚠ 实现红线：头部与内容必须在**同一滚动容器**内做负边距叠压，
 *   否则通知卡顶部会被裁切（设计预览 §0 v1.2 已踩坑）。本页用整页自然流（无独立 overflow 容器）。
 * 数据源：notice:urgentLatest + service:list（Promise.all 并发，首屏 ≤2 次云调用）
 */
import { EMERGENCY_FOOTER_TIP, LOCAL_EMERGENCY_CONTACTS, type EmergencyContact } from '../../config/emergency';
import { ENV, STORAGE_KEYS } from '../../config/env';
import { getProfile } from '../../services/auth';
import { listNotices, listUrgentLatest } from '../../services/notice';
import { listPhonebook } from '../../services/phonebook';
import { listServices } from '../../services/service';
import { store } from '../../store/global';
import { PHONE_CATEGORY_LABELS } from '../../utils/dict';
import { getCapsuleSafeWidth, getStatusBarHeight } from '../../utils/device';
import { displayName, initialOf } from '../../utils/format';
import { track, trackPageView } from '../../utils/logger';
import { goNoticeList, goCircleRoad, navigateByTarget } from '../../utils/navigator';
import { toast } from '../../utils/ui';
import {
  COMMUNITY_NAME,
  FEED_LIMIT,
  toFeedVM,
  toGridVM,
  toUrgentVM,
  type FeedVM,
  type GridVM,
  type UrgentState,
  type UrgentVM,
} from './viewmodel';

/** 模块级：宫格原始分类（保留 items 供点击分发）与轮播定时器 */
let categories: ServiceCategory[] = [];
let swipeTimer = 0;

Page({
  data: {
    statusBarHeight: 20,
    capsuleWidth: 97,
    elderMode: false,
    communityName: COMMUNITY_NAME,

    nickName: '居民朋友',
    accountId: '',
    avatarText: '邻',

    urgentState: 'loading' as UrgentState,
    urgentList: [] as UrgentVM[],
    urgentIndex: 0,
    urgentTitle: '加载中…',
    urgentSub: '正在获取社区紧急通知',

    grid: [] as GridVM[],

    /** v1.0.1 / CR-019：首屏补全 —— 社区动态 3 条（空则整块隐藏） */
    feed: [] as FeedVM[],

    showEmergency: false,
    contacts: [] as EmergencyContact[],
    emergencyTip: EMERGENCY_FOOTER_TIP,
  },

  onLoad() {
    trackPageView('pages/index/index');
    this.setData({
      statusBarHeight: getStatusBarHeight(),
      capsuleWidth: getCapsuleSafeWidth(),
      elderMode: store.get<boolean>(STORAGE_KEYS.ELDER_MODE, false),
      contacts: LOCAL_EMERGENCY_CONTACTS,
    });
    // ⚠ 先把「静默登录」跑完，再并发拉数据。
    // 云端 requireUser 会校验用户记录存在；若与登录并发，notice:urgentLatest 可能
    // 先到并拿到 401，首页显示「公告加载失败 / 请检查网络后重试」——
    // 看起来像网络问题，实际是时序问题。多花一次登录往返（≈300ms）换确定性，值得。
    void (async () => {
      await this.loadProfile();
      await Promise.all([this.loadUrgent(), this.loadServices(), this.loadFeed()]);
    })();
  },

  onShow() {
    const elderMode = store.get<boolean>(STORAGE_KEYS.ELDER_MODE, false);
    if (elderMode !== this.data.elderMode) this.setData({ elderMode });
    // 「我的」页改过资料后回到首页即时刷新（读缓存，不发请求）
    const profile = store.peek<User | null>(STORAGE_KEYS.PROFILE, null);
    if (profile) this.applyProfile(profile);
  },

  onHide() {
    this.stopSwipe();
  },

  onUnload() {
    this.stopSwipe();
  },

  onPullDownRefresh() {
    void Promise.all([this.loadUrgent(), this.loadServices(), this.loadFeed()]).finally(() =>
      wx.stopPullDownRefresh(),
    );
  },

  /* ============================ 数据加载 ============================ */

  applyProfile(profile: User): void {
    this.setData({
      nickName: displayName(profile.nickName),
      accountId: profile.accountId ?? '',
      avatarText: initialOf(profile.nickName),
    });
  },

  async loadProfile(): Promise<void> {
    try {
      const profile = await getProfile();
      this.applyProfile(profile);
    } catch {
      // 未登录/失败：保持默认文案「居民朋友」，不阻塞首屏其它区域
      this.setData({ nickName: '居民朋友', accountId: '', avatarText: '邻' });
    }
  },

  async loadUrgent(): Promise<void> {
    this.setData({ urgentState: 'loading', urgentTitle: '加载中…', urgentSub: '正在获取社区紧急通知' });
    try {
      const res = await listUrgentLatest({ limit: ENV.URGENT_LIMIT });
      const list = (res.list ?? []).map<UrgentVM>(toUrgentVM); // summary 为空回退 title（契约约定）
      if (list.length === 0) {
        // 空态协议：空数组是合法结果，不是错误
        this.stopSwipe();
        this.setData({
          urgentState: 'empty',
          urgentList: [],
          urgentTitle: '暂无紧急通知',
          urgentSub: '社区运行正常',
        });
        return;
      }
      this.setData({
        urgentState: 'normal',
        urgentList: list,
        urgentIndex: 0,
        urgentTitle: list[0].title,
        urgentSub: list[0].sub,
      });
      this.startSwipe();
    } catch {
      this.stopSwipe();
      this.setData({
        urgentState: 'error',
        urgentTitle: '公告加载失败',
        urgentSub: '请检查网络后重试',
      });
    }
  },

  async loadServices(): Promise<void> {
    // listServices 内部已兜底：接口空/失败 → 回退本地常量，保证 0 白屏
    const list = await listServices();
    categories = list;
    this.setData({ grid: list.map(toGridVM) });
  },

  /**
   * v1.0.1 / CR-019：加载「社区动态」3 条（复用 notice:list，零新增接口）。
   * 失败/为空 → feed=[]，wxml 整块不渲染（宁可少一块，也不留空框）。
   */
  async loadFeed(): Promise<void> {
    try {
      const res = await listNotices({ page: 1, pageSize: FEED_LIMIT });
      const list = (res.list ?? []).slice(0, FEED_LIMIT).map<FeedVM>(toFeedVM);
      this.setData({ feed: list });
    } catch {
      this.setData({ feed: [] });
    }
  },

  /* ============================ 轮播控制 ============================ */

  startSwipe(): void {
    this.stopSwipe();
    const list = this.data.urgentList;
    if (!list || list.length <= 1) return;
    swipeTimer = setInterval(() => {
      const next = (this.data.urgentIndex + 1) % list.length;
      this.setData({ urgentIndex: next, urgentTitle: list[next].title, urgentSub: list[next].sub });
    }, ENV.URGENT_SWIPE_INTERVAL) as unknown as number;
  },

  stopSwipe(): void {
    if (swipeTimer) {
      clearInterval(swipeTimer);
      swipeTimer = 0;
    }
  },

  /* ============================ 交互事件 ============================ */

  /** 通知卡点击：有数据跳紧急通知列表；失败态等同重试 */
  onNoticeTap(): void {
    track('btn_click', { page: 'index', target: 'notice_card' });
    if (this.data.urgentState === 'error') {
      void this.loadUrgent();
      return;
    }
    if (this.data.urgentState === 'empty') {
      goNoticeList({});
      return;
    }
    // 契约附 A.3：通知列表页只认 type / tag 两个入参；不再自造 id 参数（lead 2026-10-14 裁决）
    goNoticeList({ type: 'urgent' });
  },

  onRetryUrgent(): void {
    void this.loadUrgent();
  },

  /** 「本周公告」pill → 通知/活动列表 */
  onNoticePillTap(): void {
    track('btn_click', { page: 'index', target: 'pill_notice' });
    goNoticeList({});
  },

  /** 「最近路况」pill → 社区圈子路况筛选（契约 §circle:list 说明） */
  onRoadPillTap(): void {
    track('btn_click', { page: 'index', target: 'pill_road' });
    goCircleRoad();
  },

  /**
   * 宫格点击：进「服务分类页」（FE-14 / CR-022）。
   * 原来用 ActionSheet 展开子项——8 项尚可，扩到 38 项后一屏放不下、也没有说明文字。
   */
  onGridTap(e: WechatMiniprogram.TouchEvent): void {
    const key = String((e.currentTarget.dataset as { key?: string }).key ?? '');
    const category = categories.find((c) => c.key === key);
    if (!category) {
      toast('该服务暂未开通');
      return;
    }
    track('btn_click', { target: 'grid_to_category', kind: key });
    wx.navigateTo({
      url: `/pages/service/category/index?cat=${key}`,
      fail: () => {
        // 兜底：分类页打不开时回退到原 ActionSheet，保证子项仍可达
        const items = category.items ?? [];
        if (items.length === 0) {
          toast('该服务暂未开通');
          return;
        }
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
    });
  },

  /* ============================ 首屏补全模块（v1.0.1） ============================ */

  /** AI 助手入口卡 → AI 办事助手（不带预设问题，让用户自由输入） */
  onAiEntryTap(): void {
    track('btn_click', { page: 'index', target: 'ai_entry' });
    wx.navigateTo({ url: '/pages/assistant/index', fail: () => toast('页面暂时打不开，请稍后再试') });
  },

  /** 动态条点击 → 通知列表按该条类型筛选（紧急/公告/活动） */
  onFeedTap(e: WechatMiniprogram.TouchEvent): void {
    const type = String((e.currentTarget.dataset as { type?: string }).type ?? '');
    track('btn_click', { page: 'index', target: 'feed_item', type });
    goNoticeList(type === 'activity' || type === 'notice' || type === 'urgent' ? { type } : {});
  },

  /** 「全部 ›」→ 通知列表全量 */
  onMoreNotices(): void {
    track('btn_click', { page: 'index', target: 'feed_more' });
    goNoticeList({});
  },

  /* ============================ 紧急求助 ============================ */

  async onUrgentTap(): Promise<void> {
    track('btn_click', { page: 'index', target: 'urgent_help' });
    this.setData({ showEmergency: true });
    await this.loadEmergencyContacts();
  },

  /** 号码优先取 phonebook:list（emergency/property），失败/断网用本地兜底常量 */
  async loadEmergencyContacts(): Promise<void> {
    const merged: EmergencyContact[] = [...LOCAL_EMERGENCY_CONTACTS];
    const seen: Record<string, boolean> = {};
    merged.forEach((c) => {
      seen[c.phone] = true;
    });
    try {
      const [emergency, property] = await Promise.all([
        listPhonebook({ category: 'emergency' }),
        listPhonebook({ category: 'property' }),
      ]);
      (emergency.list ?? []).concat(property.list ?? []).forEach((p) => {
        if (seen[p.phone]) return;
        seen[p.phone] = true;
        merged.push({ name: p.name, phone: p.phone, remark: p.remark || PHONE_CATEGORY_LABELS[p.category] });
      });
      this.setData({ contacts: merged });
    } catch {
      // 断网兜底：110/119/120 与本地值班号码必须始终可用
      this.setData({ contacts: merged });
    }
  },

  closeEmergency(): void {
    this.setData({ showEmergency: false });
  },

  onCallPhone(e: WechatMiniprogram.TouchEvent): void {
    const phone = String((e.currentTarget.dataset as { phone?: string }).phone ?? '');
    if (!phone) return;
    wx.makePhoneCall({
      phoneNumber: phone,
      fail: () => {
        /* 用户取消拨号，静默 */
      },
    });
  },

  /** 阻止弹层内部点击冒泡到遮罩 */
  noop(): void {
    /* noop */
  },

  onShareAppMessage(): { title: string; path: string } {
    return { title: `${COMMUNITY_NAME} · 社区便民服务`, path: '/pages/index/index' };
  },
});
