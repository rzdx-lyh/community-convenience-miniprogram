/**
 * 首页（按设计稿 pgHome v1.4 重建）
 * 结构：渐变头部（定位 + 搜索 + 4 快捷）→ 服务分类 4 专区卡 → 常用服务 → 附近服务 → AI 提醒 → 社区动态
 */
import { LOCAL_SERVICE_CATEGORIES } from '../../config/service-grid';
import { STORAGE_KEYS } from '../../config/env';
import { store } from '../../store/global';
import { navigateByTarget } from '../../utils/navigator';
import { distanceMeters, formatDistance } from '../../utils/geo';
import { isFreshLocation, type UserLocation } from '../../utils/onboarding';

const info = wx.getWindowInfo();

/**
 * 胶囊按钮占位（2026-10-22）：navigationStyle:custom 下微信胶囊（··· | ◎）固定悬浮在右上角，
 * 首页 .r1 行的定位胶囊 margin-left:auto 正好顶到它下面 → 两个胶囊重叠。
 * 用 getMenuButtonBoundingClientRect 拿胶囊实际位置，给 .r1 留出右侧空间。
 */
function capsuleRightPad(): number {
  try {
    const rect = wx.getMenuButtonBoundingClientRect();
    if (rect && rect.left > 0) return Math.round(info.windowWidth - rect.left + 8);
  } catch {
    /* 老基础库无此 API：退回固定留白 */
  }
  return 100;
}

/** 服务项 key → 图标名（icons.wxss 已存在） */
const ICONS: Record<string, string> = {
  house_clean: 'broom',
  house_repair: 'wrench',
  house_drain: 'pipe',
  house_nanny: 'nurse',
  house_lock: 'key',
  house_ac: 'snow',
  bill_utility: 'bulb',
  bill_express: 'package',
  bill_gov: 'file',
  fresh_veg: 'leaf',
  fresh_clear: 'tagpct',
  fresh_group: 'cart',
  fresh_pickup: 'basket',
  health_reg: 'hospital',
  health_clinic: 'stetho',
  health_vaccine: 'syringe',
  health_record: 'clipboard',
  health_meal: 'bowl',
  health_bp: 'droplet',
  health_report: 'file',
  elderly_chronic: 'pill',
  elderly_meal: 'bowl',
  elderly_bath: 'bathtub',
  elderly_escort: 'handshake',
  elderly_reno: 'tools',
  elderly_doctor: 'doctor',
  tools_umbrella: 'umbrella',
  tools_toolkit: 'toolbox',
  tools_power: 'battery',
  ext_takeout: 'scooter',
  ext_stray: 'paw',
  ext_lease: 'building',
  culture_weekly: 'stetho',
  culture_hr: 'activity',
  culture_neighbor: 'megaphone',
  culture_lib: 'book',
  culture_class: 'pencil',
  culture_phone: 'phone',
};

const COMMON_NAMES = ['保洁', '家电维修', '水电燃气代缴', '助餐', '社区门诊挂号', '共享雨伞', '当日鲜菜', '房屋租售'];

/** 模块级：扁平的 38 项（点击时按 key 找回原始 target） */
let flatItems: ServiceItem[] = [];

Page({
  data: {
    statusBarHeight: info.statusBarHeight,
    /** .r1 右侧留白（px）：避开微信胶囊按钮 */
    navRightPad: capsuleRightPad(),
    kw: '',
    locState: 'idle',
    locText: '点此定位',

    quick: [
      { i: 'wrench', t: '报修', k: 'repair' },
      { i: 'bolt', t: '缴费', k: 'pay' },
      { i: 'hospital', t: '挂号', k: 'reg' },
      { i: 'bowl', t: '助餐', k: 'meal' },
    ],

    cats: [] as Array<{ key: string; title: string; groups: string; count: number }>,
    totalItems: 0,
    common: [] as Array<{ key: string; name: string; desc: string; icon: string }>,

    notices: [
      { t: '3 号楼停水提醒（附储水建议）', m: '紧急 · 5 小时前', lb: '紧急', type: 'red', filter: 'urgent' },
      { t: '2 号门道路施工，建议绕行东门', m: '公告 · 6 小时前', lb: '公告', type: '', filter: 'notice' },
      { t: '爱心义诊进社区（本周六）', m: '活动 · 1 天前', lb: '活动', type: 'ok', filter: 'activity' },
    ],
  },

  onLoad() {
    this.buildData();
    // setup 页刚拿到的定位优先复用，避免同一轮启动连续弹两次授权
    const cached = store.get<UserLocation | null>(STORAGE_KEYS.USER_LOCATION, null);
    if (cached && isFreshLocation(cached)) {
      this.applyLocation(cached);
      return;
    }
    this.onLocTap();
  },

  /** 把坐标转成「距社区中心」文案 */
  applyLocation(loc: UserLocation): void {
    const m = distanceMeters(loc, { latitude: 23.12894, longitude: 113.26411 });
    this.setData({ locState: 'ok', locText: `已定位 · 距社区中心 ${formatDistance(m)}` });
  },

  buildData() {
    const cats = LOCAL_SERVICE_CATEGORIES.map((c) => ({
      key: c.key,
      title: c.title,
      groups: (c.groups ?? []).map((g) => g.name).join(' · '),
      count: c.items.length,
    }));

    const flat: ServiceItem[] = [];
    LOCAL_SERVICE_CATEGORIES.forEach((c) => {
      (c.groups ?? []).forEach((g) => {
        g.items.forEach((it) => flat.push(it));
      });
    });
    flatItems = flat;

    const common = COMMON_NAMES.map((name) => flat.find((it) => it.name === name))
      .filter((it): it is ServiceItem => !!it)
      .map((it) => ({
        key: it.key,
        name: it.name,
        desc: it.desc ?? '',
        icon: ICONS[it.key] ?? 'grid',
      }));

    this.setData({ cats, totalItems: flat.length, common });
  },

  /* ---------------------------- 交互 ---------------------------- */

  onKwInput(e: WechatMiniprogram.Input): void {
    this.setData({ kw: e.detail.value });
  },

  /** 搜索：tab 页不能带 query，用本地缓存把关键词交给办事大厅 */
  onSearch(): void {
    wx.setStorageSync('pendingHallKw', this.data.kw);
    wx.switchTab({ url: '/pages/hall/index' });
  },

  onLocTap(): void {
    if (this.data.locState === 'locating') return;
    this.setData({ locState: 'locating', locText: '定位中…' });
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        const loc: UserLocation = {
          latitude: res.latitude,
          longitude: res.longitude,
          ts: Date.now(),
        };
        store.set(STORAGE_KEYS.USER_LOCATION, loc);
        this.applyLocation(loc);
      },
      fail: () => this.setData({ locState: 'denied', locText: '未授权 · 点此开启' }),
    });
  },

  onQuickTap(e: WechatMiniprogram.TouchEvent): void {
    const k = String(e.currentTarget.dataset.k ?? '');
    if (k === 'repair') {
      wx.navigateTo({ url: '/pages/repair/create/index' });
      return;
    }
    if (k === 'pay') {
      wx.navigateTo({ url: '/pages/service/bill/index' });
      return;
    }
    if (k === 'reg') {
      // 挂号走统一预约页（与 service-grid 的 health_reg 一致），不再跳电话簿
      wx.navigateTo({
        url: `/pages/service/book/index?svc=${encodeURIComponent('社区门诊挂号')}&cat=health&opts=${encodeURIComponent('普通号|专家号')}`,
      });
      return;
    }
    wx.navigateTo({ url: '/pages/service/meal/index' });
  },

  /** 服务分类卡 → 办事大厅对应分类 */
  onCatTap(e: WechatMiniprogram.TouchEvent): void {
    const key = String(e.currentTarget.dataset.key ?? '');
    wx.setStorageSync('pendingHallCat', key);
    wx.switchTab({ url: '/pages/hall/index' });
  },

  onCellTap(e: WechatMiniprogram.TouchEvent): void {
    const key = String(e.currentTarget.dataset.key ?? '');
    const item = flatItems.find((it) => it.key === key);
    if (!item) return;
    navigateByTarget(item);
  },

  onGo(e: WechatMiniprogram.TouchEvent): void {
    const url = String(e.currentTarget.dataset.url ?? '');
    if (!url) return;
    wx.navigateTo({ url });
  },

  onMoreHall(): void {
    wx.switchTab({ url: '/pages/hall/index' });
  },

  onMoreNotice(e: WechatMiniprogram.TouchEvent): void {
    const filter = String(e.currentTarget.dataset.filter ?? '');
    const suffix = filter === 'urgent' || filter === 'activity' ? `?type=${filter}` : '';
    wx.navigateTo({ url: `/pages/notice/list/index${suffix}` });
  },
});

