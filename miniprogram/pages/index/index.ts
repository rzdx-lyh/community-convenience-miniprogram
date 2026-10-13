/**
 * 首页 v1.2 改版（FE-11）
 * 结构：绿色渐变头部（填满顶部）→ 白色通知卡（负边距叠压）→ 双 pill → 2×2 四类服务宫格
 * ⚠ 实现红线：头部与内容必须在**同一滚动容器**内做负边距叠压，
 *   否则通知卡顶部会被裁切（设计预览 §0 v1.2 已踩坑）。本页用整页自然流（无独立 overflow 容器）。
 * 数据源：notice:urgentLatest + service:list（Promise.all 并发，首屏 ≤2 次云调用）
 */
import { EMERGENCY_FOOTER_TIP, LOCAL_EMERGENCY_CONTACTS, type EmergencyContact } from '../../config/emergency';
import { ENV, STORAGE_KEYS } from '../../config/env';
import { GRID_ICON_TEXT } from '../../config/service-grid';
import { getProfile } from '../../services/auth';
import { listUrgentLatest } from '../../services/notice';
import { listPhonebook } from '../../services/phonebook';
import { listServices } from '../../services/service';
import { store } from '../../store/global';
import { PHONE_CATEGORY_LABELS } from '../../utils/dict';
import { getCapsuleSafeWidth, getStatusBarHeight } from '../../utils/device';
import { displayName, initialOf } from '../../utils/format';
import { track, trackPageView } from '../../utils/logger';
import { goCircleRoad, goNoticeList, navigateByTarget } from '../../utils/navigator';
import { toast } from '../../utils/ui';

/** 社区名（本期为静态文案；后续可由定位或后端配置下发） */
export const COMMUNITY_NAME = '阳光社区';

export type UrgentState = 'loading' | 'normal' | 'empty' | 'error';

export interface UrgentVM {
  id: string;
  title: string;
  sub: string;
}

export interface GridVM {
  key: string;
  title: string;
  /** 小字第 1 行（≤2 项，`｜` 分隔） */
  subLine1: string;
  /** 小字第 2 行 */
  subLine2: string;
  iconText: string;
  theme: string;
  decoText: string;
}

/** 宫格小字按 2 行排版：'挂号｜义诊｜疫苗档案' → '挂号｜义诊' / '疫苗档案' */
export function splitSubtitle(subtitle: string): { line1: string; line2: string } {
  const parts = String(subtitle ?? '').split('｜');
  return { line1: parts.slice(0, 2).join('｜'), line2: parts.slice(2).join('｜') };
}

/** ServiceCategory → 宫格视图模型 */
export function toGridVM(category: ServiceCategory): GridVM {
  const { line1, line2 } = splitSubtitle(category.subtitle);
  return {
    key: category.key,
    title: category.title,
    subLine1: line1,
    subLine2: line2,
    iconText: GRID_ICON_TEXT[category.key] ?? '🏠',
    theme: category.iconTheme,
    decoText: '＋',
  };
}

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
    // 首屏两个接口并发（契约建议 Promise.all，避免串行拖慢首屏）
    void Promise.all([this.loadProfile(), this.loadUrgent(), this.loadServices()]);
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
    void Promise.all([this.loadUrgent(), this.loadServices()]).finally(() => wx.stopPullDownRefresh());
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
      const list = (res.list ?? []).map<UrgentVM>((n) => ({
        id: n._id,
        title: n.title,
        sub: n.summary || n.title, // 契约：summary 为空回退 title
      }));
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
    const current = this.data.urgentList[this.data.urgentIndex];
    if (current) {
      wx.navigateTo({
        url: `/pages/notice/list/index?type=urgent&id=${current.id}`,
        fail: () => goNoticeList({ type: 'urgent' }),
      });
      return;
    }
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

  /** 宫格点击：用 ActionSheet 展开该分类的全部子项，8 个子项全部可达 */
  onGridTap(e: WechatMiniprogram.TouchEvent): void {
    const key = String((e.currentTarget.dataset as { key?: string }).key ?? '');
    const category = categories.find((c) => c.key === key);
    if (!category) {
      toast('该服务暂未开通');
      return;
    }
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
