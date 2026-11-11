/**
 * 首页（按设计稿 pgHome v1.4 重建）
 * 结构：渐变头部（定位 + 搜索 + 4 快捷）→ 服务分类 4 专区卡 → 常用服务 → 附近服务 → AI 提醒 → 社区动态
 */
import { LOCAL_SERVICE_CATEGORIES } from '../../config/service-grid';
import { STORAGE_KEYS } from '../../config/env';
import { COMMUNITY, COMMUNITY_SPOTS, resolveSpot, spotPickerLabels, spotToLocation, type CommunitySpot } from '../../config/community';
import { store } from '../../store/global';
import { navigateByTarget } from '../../utils/navigator';
import { isUsableLocation, type UserLocation } from '../../utils/onboarding';
import { requestCurrentLocation } from '../../utils/location';
import { COMMUNITY_PLACES, placesNear, type NearbyPlace } from '../../config/community-places';
import { isCareModeEnabled, setCareMode } from '../../utils/care';

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
    locState: 'ok',
    locText: '阳光社区 · 3 号楼',
    careMode: false,
    nearby: [] as NearbyPlace[],
    nearbyTotal: COMMUNITY_PLACES.length,

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
    this.refreshLocationAndNearby(false);
  },

  /** 每次回到首页都重读关怀模式与手选位置，避免跨页状态滞后 */
  onShow() {
    const care = isCareModeEnabled();
    if (care !== this.data.careMode) this.setData({ careMode: care });
    this.refreshLocationAndNearby(false);
  },

  refreshLocationAndNearby(persist = false): void {
    const cached = store.get<UserLocation | null>(STORAGE_KEYS.USER_LOCATION, null);
    if (isUsableLocation(cached) && cached?.source === 'gps') {
      this.applyGpsLocation(cached, persist);
      return;
    }
    const spot = resolveSpot(isUsableLocation(cached) ? cached : null);
    this.applySpot(spot, persist);
  },

  /** 应用所选社区位置点（persist=true 时写入本地缓存） */
  applySpot(spot: CommunitySpot, persist = true): void {
    if (persist) store.set(STORAGE_KEYS.USER_LOCATION, spotToLocation(spot));
    const nearby = placesNear(spot, 'all', 3);
    this.setData({
      locState: 'ok',
      locText: `${COMMUNITY.name} · ${spot.name}`,
      nearby,
      nearbyTotal: COMMUNITY_PLACES.length,
    });
  },

  /** 应用微信实时定位结果，不把经纬度直接展示给用户 */
  applyGpsLocation(location: { latitude: number; longitude: number; accuracy?: number }, persist = true): void {
    const saved: UserLocation = {
      latitude: location.latitude,
      longitude: location.longitude,
      ts: Date.now(),
      key: 'gps',
      name: '当前位置',
      source: 'gps',
      accuracy: Number(location.accuracy) || 0,
    };
    if (persist) store.set(STORAGE_KEYS.USER_LOCATION, saved);
    const nearby = placesNear(saved, 'all', 3);
    const accuracy = saved.accuracy && saved.accuracy > 0 ? ` · 精度约 ${Math.round(saved.accuracy)} 米` : '';
    this.setData({
      locState: 'ok',
      locText: `${COMMUNITY.name} · 当前位置${accuracy}`,
      nearby,
      nearbyTotal: COMMUNITY_PLACES.length,
    });
  },

  async onLocateCurrent(): Promise<void> {
    wx.showLoading({ title: '正在定位…', mask: true });
    const result = await requestCurrentLocation();
    wx.hideLoading();
    if (result.ok) {
      this.applyGpsLocation(result.location);
      wx.showToast({ title: '定位成功', icon: 'success' });
      return;
    }
    wx.showToast({ title: result.message, icon: 'none', duration: 2500 });
  },

  /** 首页快捷按钮与「我的」开关共用 setCareMode，状态实时同步 */
  onToggleCare(): void {
    const care = setCareMode(!this.data.careMode);
    this.setData({ careMode: care });
    try { wx.vibrateShort({ type: 'light' }); } catch { /* 不支持震动时静默 */ }
    wx.showToast({ title: care ? '关怀模式已开启' : '关怀模式已关闭', icon: 'none' });
  },

  /** 首页最近点位 → 地图页直接聚焦对应 marker */
  onNearbyTap(e: WechatMiniprogram.TouchEvent): void {
    const id = String((e.currentTarget.dataset as { id?: string }).id ?? '');
    wx.navigateTo({ url: `/pages/map/index${id ? `?focus=${encodeURIComponent(id)}` : ''}` });
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

  /** 用户主动选择：实时定位或手动选择社区点位 */
  onLocTap(): void {
    wx.showActionSheet({
      itemList: ['定位当前位置', '手动选择社区位置'],
      success: (res) => {
        if (res.tapIndex === 0) {
          void this.onLocateCurrent();
          return;
        }
        if (res.tapIndex === 1) this.onPickSpotManual();
      },
    });
  },

  onPickSpotManual(): void {
    wx.showActionSheet({
      itemList: spotPickerLabels(),
      success: (res) => {
        const spot = COMMUNITY_SPOTS[res.tapIndex];
        if (spot) this.applySpot(spot);
      },
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
