/**
 * 报修创建页（FE-3 / 下一阶段阶段 2）
 * 契约：workorder:create（提交后返回 { id, aiSummary }）
 *
 * 位置策略：不读取手机定位。默认带入用户在首页/我的选择的社区点位，
 * 也可在页内原生地图或楼栋列表中重新选点；只随工单提交一个业务点位，不保存轨迹。
 */
import { ENV, STORAGE_KEYS } from '../../../config/env';
import { COMMUNITY_SPOTS, resolveSpot, spotToLocation, type CommunitySpot } from '../../../config/community';
import { createWorkOrder } from '../../../services/workorder';
import { store } from '../../../store/global';
import { CATEGORY_LABELS } from '../../../utils/dict';
import { track, trackPageView } from '../../../utils/logger';
import { isUsableLocation, type UserLocation } from '../../../utils/onboarding';
import { toast } from '../../../utils/ui';

const winInfo = wx.getWindowInfo();

function capsuleRightPad(): number {
  try {
    const rect = wx.getMenuButtonBoundingClientRect();
    if (rect && rect.left > 0) return Math.round(winInfo.windowWidth - rect.left + 8);
  } catch {
    /* 老基础库无此 API */
  }
  return 100;
}

export interface CategoryOption {
  key: WorkOrder['category'];
  label: string;
}

export interface SpotMarker {
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

const VALID_CATEGORIES: WorkOrder['category'][] = ['water', 'electric', 'door', 'public', 'other'];

export const CATEGORY_OPTIONS: CategoryOption[] = VALID_CATEGORIES.map((key) => ({
  key,
  label: CATEGORY_LABELS[key],
}));

/** 归一化分类入参：非法/缺失一律返回空串（= 不预选），绝不抛错 */
export function normalizeCategory(input?: string): WorkOrder['category'] | '' {
  const value = String(input ?? '').trim().toLowerCase();
  return (VALID_CATEGORIES as string[]).indexOf(value) >= 0 ? (value as WorkOrder['category']) : '';
}

/** 社区点位 → 原生 map markers（纯函数，便于单测） */
export function buildSpotMarkers(spots: CommunitySpot[]): SpotMarker[] {
  return spots.map((spot, index) => ({
    id: index + 1,
    latitude: spot.latitude,
    longitude: spot.longitude,
    iconPath: '/pages/map/pin-svc.png',
    width: 28,
    height: 28,
    anchor: { x: 0.5, y: 0.5 },
    callout: {
      content: spot.name,
      color: '#14181F',
      fontSize: 12,
      borderRadius: 8,
      padding: 6,
      bgColor: '#FFFFFF',
      display: 'ALWAYS',
      textAlign: 'center',
    },
  }));
}

function defaultRepairSpot(): CommunitySpot {
  const saved = store.get<UserLocation | null>(STORAGE_KEYS.USER_LOCATION, null);
  return resolveSpot(isUsableLocation(saved) ? saved : null);
}

Page({
  goBack(): void {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: '/pages/index/index' });
  },

  goHome(): void {
    wx.switchTab({ url: '/pages/index/index' });
  },

  data: {
    statusBarHeight: winInfo.statusBarHeight,
    navRightPad: capsuleRightPad(),
    categories: CATEGORY_OPTIONS,
    category: '' as WorkOrder['category'] | '',
    title: '',
    description: '',
    images: [] as string[],
    maxImages: ENV.MAX_IMAGES,
    submitting: false,
    elderMode: false,

    /** 当前报修位置（默认带入手选楼栋） */
    location: null as WorkOrder['location'] | null,
    locationDesc: '',
    selectedSpotKey: '',
    spotPickerVisible: false,
    spots: COMMUNITY_SPOTS,
    spotMarkers: buildSpotMarkers(COMMUNITY_SPOTS),
    spotMapLat: COMMUNITY_SPOTS[0].latitude,
    spotMapLng: COMMUNITY_SPOTS[0].longitude,
  },

  onLoad(options: Record<string, string | undefined>) {
    trackPageView('pages/repair/create/index');
    this.setData({ elderMode: store.get<boolean>(STORAGE_KEYS.ELDER_MODE, false) });
    this.applySpot(defaultRepairSpot());
    const preset = normalizeCategory(options.category);
    if (preset) this.setData({ category: preset });
  },

  onShow() {
    const elderMode = store.get<boolean>(STORAGE_KEYS.ELDER_MODE, false);
    if (elderMode !== this.data.elderMode) this.setData({ elderMode });
  },

  /** 应用社区点位；persist=true 时同步为全站手选位置 */
  applySpot(spot: CommunitySpot, persist = false): void {
    if (persist) store.set(STORAGE_KEYS.USER_LOCATION, spotToLocation(spot));
    this.setData({
      location: { name: spot.name, latitude: spot.latitude, longitude: spot.longitude },
      locationDesc: spot.desc,
      selectedSpotKey: spot.key,
      spotMapLat: spot.latitude,
      spotMapLng: spot.longitude,
    });
  },

  /** 使用首页/我的当前手选楼栋，不请求系统定位 */
  onUseCurrentSpot(): void {
    const spot = defaultRepairSpot();
    this.applySpot(spot);
    toast(`已使用 ${spot.name}`);
  },

  onToggleSpotPicker(): void {
    this.setData({ spotPickerVisible: !this.data.spotPickerVisible });
  },

  onCloseSpotPicker(): void {
    this.setData({ spotPickerVisible: false });
  },

  onSpotMarkerTap(e: WechatMiniprogram.TouchEvent): void {
    const markerId = Number((e.detail as unknown as { markerId?: number }).markerId ?? 0);
    const spot = COMMUNITY_SPOTS[markerId - 1];
    if (!spot) return;
    this.applySpot(spot, true);
    this.setData({ spotPickerVisible: false });
    toast(`已选择 ${spot.name}`);
  },

  onSpotListItemTap(e: WechatMiniprogram.TouchEvent): void {
    const key = String((e.currentTarget.dataset as { key?: string }).key ?? '');
    const spot = COMMUNITY_SPOTS.find((s) => s.key === key);
    if (!spot) return;
    this.applySpot(spot, true);
    this.setData({ spotPickerVisible: false });
    toast(`已选择 ${spot.name}`);
  },

  onPickCategory(e: WechatMiniprogram.TouchEvent): void {
    const key = String((e.currentTarget.dataset as { key?: string }).key ?? '') as WorkOrder['category'];
    this.setData({ category: key });
  },

  onTitleInput(e: WechatMiniprogram.Input): void {
    this.setData({ title: String(e.detail.value ?? '') });
  },

  onDescInput(e: WechatMiniprogram.Input): void {
    this.setData({ description: String(e.detail.value ?? '') });
  },

  onChooseImage(): void {
    const remain = this.data.maxImages - this.data.images.length;
    if (remain <= 0) {
      toast(`最多上传 ${this.data.maxImages} 张`);
      return;
    }
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: (res) => {
        const picked = (res.tempFiles ?? []).map((f) => f.tempFilePath).filter(Boolean);
        this.setData({ images: this.data.images.concat(picked).slice(0, this.data.maxImages) });
      },
    });
  },

  onRemoveImage(e: WechatMiniprogram.TouchEvent): void {
    const idx = Number((e.currentTarget.dataset as { index?: string }).index ?? -1);
    if (idx < 0) return;
    const images = this.data.images.filter((_, i) => i !== idx);
    this.setData({ images });
  },

  /** 本地路径 → 云存储 fileID；失败返回空数组（不阻断提交） */
  async uploadImages(paths: string[]): Promise<string[]> {
    if (paths.length === 0) return [];
    const tasks = paths.map(
      (filePath) =>
        new Promise<string>((resolve) => {
          wx.cloud.uploadFile({
            cloudPath: `workorder/${Date.now()}_${Math.floor(Math.random() * 1e6)}.png`,
            filePath,
            success: (r) => resolve(String(r.fileID ?? '')),
            fail: () => resolve(''),
          });
        }),
    );
    const settled = await Promise.all(tasks);
    return settled.filter(Boolean);
  },

  async onSubmit(): Promise<void> {
    const { category, title, description, location } = this.data;
    if (this.data.submitting) return;

    if (!category) {
      toast('请选择报修类型');
      return;
    }
    if (title.trim().length < 2) {
      toast('请填写问题标题（至少 2 字）');
      return;
    }
    if (description.trim().length < 5) {
      toast('请描述一下问题（至少 5 字）');
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中…', mask: true });
    try {
      const images = await this.uploadImages(this.data.images);
      const res = await createWorkOrder({
        title: title.trim(),
        description: description.trim(),
        category: category as WorkOrder['category'],
        images,
        ...(location ? { location } : {}),
      });
      track('workorder_create', {
        category,
        hasImages: images.length > 0,
        hasLocation: Boolean(location),
      });
      wx.hideLoading();
      wx.showToast({ title: '提交成功', icon: 'success' });
      setTimeout(() => {
        wx.redirectTo({ url: '/pages/repair/list/index' });
      }, 800);
      void res;
    } catch {
      wx.hideLoading();
      // request 层已统一 toast（含 msgSecCheck 违禁词 400）
    } finally {
      this.setData({ submitting: false });
    }
  },
});
