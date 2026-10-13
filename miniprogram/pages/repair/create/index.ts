/**
 * 报修创建页（FE-3）
 * 契约：workorder:create（提交后返回 { id, aiSummary }）
 * FE-13：URL 入参 `?category=` 预选分类（非法/缺失不预选）
 *
 * 图片策略（降级优先，保证无云环境也能演示）：
 * - 选图后本地预览；提交时尝试 wx.cloud.uploadFile 取 fileID
 * - 上传失败（无云环境/无权限）则**跳过该图**，不阻断提交（契约 images 为可选）
 */
import { ENV, STORAGE_KEYS } from '../../../config/env';
import { createWorkOrder } from '../../../services/workorder';
import { store } from '../../../store/global';
import { CATEGORY_LABELS } from '../../../utils/dict';
import { track, trackPageView } from '../../../utils/logger';
import { toast } from '../../../utils/ui';

export interface CategoryOption {
  key: WorkOrder['category'];
  label: string;
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

Page({
  data: {
    categories: CATEGORY_OPTIONS,
    category: '' as WorkOrder['category'] | '',
    title: '',
    description: '',
    images: [] as string[],
    maxImages: ENV.MAX_IMAGES,
    submitting: false,
    elderMode: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    trackPageView('pages/repair/create/index');
    this.setData({ elderMode: store.get<boolean>(STORAGE_KEYS.ELDER_MODE, false) });
    const preset = normalizeCategory(options.category);
    if (preset) this.setData({ category: preset });
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
    const { category, title, description } = this.data;
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
      });
      track('workorder_create', { category, hasImages: images.length > 0 });
      wx.hideLoading();
      wx.showToast({ title: '提交成功', icon: 'success' });
      // 详情页为二级页，直接回服务订单列表看结果
      setTimeout(() => {
        wx.switchTab({ url: '/pages/repair/list/index' });
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
