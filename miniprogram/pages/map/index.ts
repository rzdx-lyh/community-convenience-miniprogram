/**
 * 社区地图（CR-028 / 下一阶段阶段 2）
 *
 * 零 Key、零系统定位：
 * - 点位来自本地 `config/community-places.ts`；
 * - 起点来自用户手选的社区位置点（楼栋 / 出入口 / 食堂）；
 * - 原生 map 只负责展示与导航，不调用 wx.getLocation / show-location；
 * - 地图、列表两个视图共享同一份按距离排序的数据。
 */
import { getStatusBarHeight } from '../../utils/device';
import { toast } from '../../utils/ui';
import { STORAGE_KEYS } from '../../config/env';
import {
  COMMUNITY,
  COMMUNITY_SPOTS,
  resolveSpot,
  spotPickerLabels,
  spotToLocation,
} from '../../config/community';
import {
  COMMUNITY_PLACES,
  PLACE_CATEGORIES,
  placesNear,
  type CommunityPlace,
  type NearbyPlace,
  type PlaceCategory,
  type PlaceCategoryTab,
  type PlaceFilter,
} from '../../config/community-places';
import { store } from '../../store/global';
import { isUsableLocation, type UserLocation } from '../../utils/onboarding';
import { requestCurrentLocation } from '../../utils/location';

const DEFAULT_LAT = COMMUNITY.center.latitude;
const DEFAULT_LNG = COMMUNITY.center.longitude;

export type PoiCat = PlaceCategory;
export type PoiCatTab = PlaceCategoryTab;
export type Poi = NearbyPlace;
export const POI_CATS = PLACE_CATEGORIES;
export const POIS = placesNear(COMMUNITY.center);

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
export function toMarkers(list: CommunityPlace[]): PoiMarker[] {
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

/** 分类筛选（纯函数，保留给测试与外部调用） */
export function filterPois(cat: PlaceFilter): NearbyPlace[] {
  return placesNear(COMMUNITY.center, cat);
}

Page({
  data: {
    statusBarHeight: getStatusBarHeight(),
    cats: POI_CATS,
    cat: 'all' as PlaceFilter,
    viewMode: 'map' as 'map' | 'list',
    viewModes: [
      { k: 'map', n: '地图' },
      { k: 'list', n: '列表' },
    ],
    points: POIS as NearbyPlace[],
    markers: toMarkers(POIS) as PoiMarker[],
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LNG,
    scale: 17,
    spotName: '',
    selected: null as NearbyPlace | null,
    totalPlaces: COMMUNITY_PLACES.length,
  },

  onLoad(options: Record<string, string | undefined>) {
    const saved = store.get<UserLocation | null>(STORAGE_KEYS.USER_LOCATION, null);
    const useGps = isUsableLocation(saved) && saved?.source === 'gps';
    const spot = resolveSpot(isUsableLocation(saved) ? saved : null);
    const here = useGps
      ? { latitude: saved!.latitude, longitude: saved!.longitude }
      : { latitude: spot.latitude, longitude: spot.longitude };
    this.applyLocation(here, useGps ? '当前位置' : spot.name);
    wx.nextTick(() => this.fitView(here));

    const focusId = String(options?.focus ?? '').trim();
    if (focusId) {
      const hit = (this.data.points as NearbyPlace[]).find((p) => p.id === focusId);
      if (hit) this.selectPoi(hit);
    }
  },

  goBack(): void {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  onToggleView(e: WechatMiniprogram.TouchEvent): void {
    const mode = String((e.currentTarget.dataset as { k?: string }).k ?? 'map');
    if (mode !== 'map' && mode !== 'list') return;
    this.setData({ viewMode: mode });
  },

  /** 顶部位置按钮：先让用户选择定位或手选 */
  onLocationOptions(): void {
    wx.showActionSheet({
      itemList: ['定位当前位置', '手动选择社区位置'],
      success: (res) => {
        if (res.tapIndex === 0) void this.onLocateCurrent();
        if (res.tapIndex === 1) this.onPickSpot();
      },
    });
  },

  async onLocateCurrent(): Promise<void> {
    wx.showLoading({ title: '正在定位…', mask: true });
    const result = await requestCurrentLocation();
    wx.hideLoading();
    if (!result.ok) {
      toast(result.message);
      return;
    }
    const saved: UserLocation = {
      latitude: result.location.latitude,
      longitude: result.location.longitude,
      ts: Date.now(),
      key: 'gps',
      name: '当前位置',
      source: 'gps',
      accuracy: result.location.accuracy,
    };
    store.set(STORAGE_KEYS.USER_LOCATION, saved);
    const here = { latitude: saved.latitude, longitude: saved.longitude };
    this.applyLocation(here, '当前位置');
    this.fitView(here);
    toast('定位成功');
  },

  /** 选择社区位置点（手动模式，不读取手机位置） */
  onPickSpot(): void {
    wx.showActionSheet({
      itemList: spotPickerLabels(),
      success: (res) => {
        const spot = COMMUNITY_SPOTS[res.tapIndex];
        if (!spot) return;
        store.set(STORAGE_KEYS.USER_LOCATION, spotToLocation(spot));
        const here = { latitude: spot.latitude, longitude: spot.longitude };
        this.applyLocation(here, spot.name);
        this.fitView(here);
        toast(`已切换到 ${spot.name}`);
      },
    });
  },

  /** 回到社区中心：只移动视野，不改变已选手选位置和距离排序 */
  onCenter(): void {
    const here = { latitude: DEFAULT_LAT, longitude: DEFAULT_LNG };
    this.setData({ latitude: DEFAULT_LAT, longitude: DEFAULT_LNG, scale: 17, selected: null });
    this.fitView(here);
    toast('已回到社区中心');
  },

  /** 让视野同时包住「手选位置 + 当前分类点位」 */
  fitView(here: { latitude: number; longitude: number }): void {
    const ctx = wx.createMapContext('tmap', this);
    const pts = [{ latitude: here.latitude, longitude: here.longitude }].concat(
      this.data.points.map((p: NearbyPlace) => ({ latitude: p.latitude, longitude: p.longitude })),
    );
    ctx.includePoints({ points: pts, padding: [60, 60, 60, 60] });
  },

  /** 用手选位置重算地图中心、距离、步行时间和排序 */
  applyLocation(here: { latitude: number; longitude: number }, spotName?: string): void {
    const points = placesNear(here, this.data.cat);
    this.setData({
      latitude: here.latitude,
      longitude: here.longitude,
      points,
      markers: toMarkers(points),
      spotName: spotName ?? this.data.spotName,
      selected: null,
    });
  },

  onCatTap(e: WechatMiniprogram.TouchEvent): void {
    const k = String((e.currentTarget.dataset as { k?: string }).k ?? 'all') as PlaceFilter;
    if (k === this.data.cat) return;
    const points = placesNear(
      { latitude: this.data.latitude, longitude: this.data.longitude },
      k,
    );
    this.setData({ cat: k, points, markers: toMarkers(points), selected: null });
  },

  onMarkerTap(e: WechatMiniprogram.TouchEvent): void {
    const markerId = Number((e.detail as unknown as { markerId?: number }).markerId ?? 0);
    const hit = (this.data.points as NearbyPlace[]).find((p) => p.mid === markerId);
    if (hit) this.selectPoi(hit);
  },

  onPoiTap(e: WechatMiniprogram.TouchEvent): void {
    const id = String((e.currentTarget.dataset as { id?: string }).id ?? '');
    const hit = (this.data.points as NearbyPlace[]).find((p) => p.id === id);
    if (hit) this.selectPoi(hit);
  },

  /** 选中点位后切到地图视图，保证原生 marker 与详情卡同时可见 */
  selectPoi(p: NearbyPlace): void {
    this.setData({
      selected: p,
      viewMode: 'map',
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
      fail: () => toast('打开地图失败，请稍后重试'),
    });
  },

  noop(): void {
    /* 阻止卡片内部点击冒泡 */
  },
});
