/**
 * 社区地图（CR-028 新建 · 对照 demo.html pgMap）
 *
 * 关键差异（见施工契约 §八-3）：原型用腾讯位置服务 GL JS（DOM/Canvas），
 * 小程序无 DOM，改为**原生 `<map>` 组件 + wx.getLocation({type:'gcj02'})**：
 *   - 坐标保持 GCJ-02，markers 用本地 PNG 圆点（pin-svc / pin-tool / pin-life）；
 *   - 定位失败（未授权 / app.json 未声明 requiredPrivateInfos）时退回社区中心坐标，
 *     用 `.tip` 说明，页面结构照常渲染；
 *   - 分类切换只筛点位，不重建地图实例。
 */
import { getStatusBarHeight } from '../../utils/device';
import { toast } from '../../utils/ui';
import { distanceMeters, walkMinutes, formatDistance } from '../../utils/geo';

/** 社区中心（阳光社区 3 号楼）默认坐标，定位不可用时使用 */
const DEFAULT_LAT = 23.12894;
const DEFAULT_LNG = 113.26411;

export type PoiCat = 'svc' | 'tool' | 'life';

export interface PoiCatTab {
  k: 'all' | PoiCat;
  n: string;
}

export interface Poi {
  id: string;
  /** marker 数字 id（原生 map 要求 number） */
  mid: number;
  name: string;
  desc: string;
  cat: PoiCat;
  /** icons.wxss 图标名 */
  icon: string;
  color: string;
  /** 图标底色（color + 1F 透明度） */
  bg: string;
  latitude: number;
  longitude: number;
  walk: string;
  walkMin: number;
  open: string;
}

export const POI_CATS: PoiCatTab[] = [
  { k: 'all', n: '全部' },
  { k: 'svc', n: '服务点' },
  { k: 'tool', n: '便民设备' },
  { k: 'life', n: '生活配套' },
];

function poi(item: Omit<Poi, 'bg' | 'walkMin'>): Poi {
  const meters = parseInt(item.walk, 10) || 0;
  return {
    ...item,
    bg: `${item.color}1F`,
    walkMin: Math.max(1, Math.round(meters / 70)),
  };
}

export const POIS: Poi[] = [
  poi({
    id: 'p1',
    mid: 1,
    name: '社区物业服务中心',
    desc: '1 号楼 1 层 · 报修/缴费/门禁',
    cat: 'svc',
    icon: 'building',
    color: '#1F5FD6',
    latitude: 23.12916,
    longitude: 113.26386,
    walk: '120 m',
    open: '8:30-18:00',
  }),
  poi({
    id: 'p2',
    mid: 2,
    name: '社区卫生服务站',
    desc: '西门旁 · 全科/慢病/疫苗',
    cat: 'svc',
    icon: 'stetho',
    color: '#1F5FD6',
    latitude: 23.12841,
    longitude: 113.26472,
    walk: '380 m',
    open: '8:00-21:00',
  }),
  poi({
    id: 'p3',
    mid: 3,
    name: '社区活动室',
    desc: '2 号楼 2 层 · 图书角/四点半课堂',
    cat: 'svc',
    icon: 'users',
    color: '#1F5FD6',
    latitude: 23.12888,
    longitude: 113.2632,
    walk: '260 m',
    open: '9:00-21:00',
  }),
  poi({
    id: 'p4',
    mid: 4,
    name: '共享雨伞 · 1 号楼大厅',
    desc: '可借 6 把 · 24 小时可还',
    cat: 'tool',
    icon: 'umbrella',
    color: '#0E7C6B',
    latitude: 23.12933,
    longitude: 113.26452,
    walk: '60 m',
    open: '24 小时',
  }),
  poi({
    id: 'p5',
    mid: 5,
    name: '共享充电宝 · 南门岗亭',
    desc: '可借 12 个 · 通借通还',
    cat: 'tool',
    icon: 'battery',
    color: '#0E7C6B',
    latitude: 23.12872,
    longitude: 113.26362,
    walk: '210 m',
    open: '24 小时',
  }),
  poi({
    id: 'p6',
    mid: 6,
    name: '快递柜 · 1 号楼架空层',
    desc: '丰巢柜 · 大件请到驿站',
    cat: 'tool',
    icon: 'package',
    color: '#0E7C6B',
    latitude: 23.1291,
    longitude: 113.2643,
    walk: '150 m',
    open: '24 小时',
  }),
  poi({
    id: 'p7',
    mid: 7,
    name: '生鲜自提 · 1 号楼驿站',
    desc: '次日自提点 · 生鲜冷链',
    cat: 'tool',
    icon: 'basket',
    color: '#0E7C6B',
    latitude: 23.12895,
    longitude: 113.26505,
    walk: '300 m',
    open: '6:00-21:00',
  }),
  poi({
    id: 'p8',
    mid: 8,
    name: '垃圾分类点 · 2 号楼东侧',
    desc: '四分类投放 · 误时投放至南门',
    cat: 'life',
    icon: 'sprout',
    color: '#A86A05',
    latitude: 23.1286,
    longitude: 113.2642,
    walk: '180 m',
    open: '6:00-22:00',
  }),
  poi({
    id: 'p9',
    mid: 9,
    name: '老年助餐点 · 社区食堂',
    desc: '午餐 11:00 / 晚餐 17:00 配送',
    cat: 'life',
    icon: 'bowl',
    color: '#A86A05',
    latitude: 23.1295,
    longitude: 113.2641,
    walk: '220 m',
    open: '11:00-18:30',
  }),
];

export interface PoiMarker {
  id: number;
  latitude: number;
  longitude: number;
  iconPath: string;
  width: number;
  height: number;
  anchor: { x: number; y: number };
  callout: {
    content: string;
    color: string;
    fontSize: number;
    borderRadius: number;
    padding: number;
    bgColor: string;
    display: string;
    textAlign: string;
  };
}

/** 点位 → 原生 map markers（纯函数） */
export function toMarkers(list: Poi[]): PoiMarker[] {
  return list.map((p) => ({
    id: p.mid,
    latitude: p.latitude,
    longitude: p.longitude,
    iconPath: `/pages/map/pin-${p.cat}.png`,
    width: 26,
    height: 26,
    anchor: { x: 0.5, y: 0.5 },
    callout: {
      content: p.name,
      color: '#14181F',
      fontSize: 11,
      borderRadius: 6,
      padding: 5,
      bgColor: '#FFFFFF',
      display: 'BYCLICK',
      textAlign: 'center',
    },
  }));
}

/** 分类筛选（纯函数） */
export function filterPois(cat: 'all' | PoiCat): Poi[] {
  return cat === 'all' ? POIS : POIS.filter((p) => p.cat === cat);
}

Page({
  data: {
    statusBarHeight: getStatusBarHeight(),
    cats: POI_CATS,
    cat: 'all' as 'all' | PoiCat,
    points: POIS as Poi[],
    markers: toMarkers(POIS) as PoiMarker[],
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
    scale: 17,
    locState: 'locating' as 'locating' | 'ok' | 'denied',
    selected: null as Poi | null,
  },

  onLoad() {
    this.locate();
  },

  goBack(): void {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  /** 取当前定位（GCJ-02，高精度）；失败退回社区中心，不阻塞页面 */
  locate(): void {
    this.setData({ locState: 'locating' });
    wx.getLocation({
      type: 'gcj02',
      // 真机高精度定位（基础库 2.9.0+，模拟器忽略此参数）
      isHighAccuracy: true,
      success: (res: WechatMiniprogram.GetLocationSuccessCallbackResult) => {
        const here = { latitude: res.latitude, longitude: res.longitude };
        this.applyLocation(here);
        this.setData({ locState: 'ok' });
        toast('已定位到当前位置');
        this.fitView(here);
      },
      fail: () => {
        this.applyLocation({ latitude: DEFAULT_LAT, longitude: DEFAULT_LNG });
        this.setData({ locState: 'denied' });
      },
    });
  },

  /** 让视野同时包住「我的位置 + 所有点位」，避免点位漂到屏幕外看起来像定位错乱 */
  fitView(here: { latitude: number; longitude: number }): void {
    const ctx = wx.createMapContext('tmap', this);
    const pts = [{ latitude: here.latitude, longitude: here.longitude }].concat(
      this.data.points.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
    );
    ctx.includePoints({ points: pts, padding: [60, 60, 60, 60] });
  },

  /** 用真实位置重算：地图中心 + 各点位到「我」的实时距离（替换写死的 walk） */
  applyLocation(here: { latitude: number; longitude: number }): void {
    const points = this.data.points.map((p) => {
      const m = distanceMeters(here, { latitude: p.latitude, longitude: p.longitude });
      return { ...p, walk: formatDistance(m), walkMin: walkMinutes(m) };
    });
    // 按距离从近到远重排（「附近 X 个点位 · 按步行距离排序」与文案一致）
    points.sort((a, b) => a.walkMin - b.walkMin);
    this.setData({ latitude: here.latitude, longitude: here.longitude, points });
  },

  onRelocate(): void {
    this.locate();
  },

  onCatTap(e: WechatMiniprogram.TouchEvent): void {
    const k = String((e.currentTarget.dataset as { k?: string }).k ?? 'all') as 'all' | PoiCat;
    if (k === this.data.cat) return;
    const points = filterPois(k);
    // 分类切换后，按当前地图中心重算各点位实时距离（保持与定位后一致）
    const here = { latitude: this.data.latitude, longitude: this.data.longitude };
    const recalculated = points.map((p) => {
      const m = distanceMeters(here, { latitude: p.latitude, longitude: p.longitude });
      return { ...p, walk: formatDistance(m), walkMin: walkMinutes(m) };
    });
    recalculated.sort((a, b) => a.walkMin - b.walkMin);
    this.setData({ cat: k, points: recalculated, markers: toMarkers(recalculated), selected: null });
  },

  onMarkerTap(e: WechatMiniprogram.TouchEvent): void {
    const markerId = Number((e.detail as unknown as { markerId?: number }).markerId ?? 0);
    const hit = this.data.points.find((p) => p.mid === markerId);
    if (hit) this.selectPoi(hit);
  },

  onPoiTap(e: WechatMiniprogram.TouchEvent): void {
    const id = String((e.currentTarget.dataset as { id?: string }).id ?? '');
    const hit = this.data.points.find((p) => p.id === id);
    if (hit) this.selectPoi(hit);
  },

  selectPoi(p: Poi): void {
    this.setData({
      selected: p,
      latitude: p.latitude,
      longitude: p.longitude,
      scale: 18,
    });
  },

  onClosePoi(): void {
    this.setData({ selected: null, scale: 17 });
  },

  /** 原生地图导航（wx.openLocation 也是 GCJ-02，坐标可直接传） */
  onOpenLocation(): void {
    const p = this.data.selected;
    if (!p) return;
    wx.openLocation({
      latitude: p.latitude,
      longitude: p.longitude,
      name: p.name,
      address: p.desc,
      scale: 18,
      fail: () => toast('打开地图失败，请检查定位权限'),
    });
  },

  /** 阻止点位卡内部点击冒泡 */
  noop(): void {
    /* noop */
  },
});
