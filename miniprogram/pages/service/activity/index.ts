/**
 * 文化便民活动页（2026-10-23）
 *
 * 每周义诊 / 邻里活动 / 长者手机课 共用；页面按 type 切换配置。
 * 报名走既有 `workorder:create`，不新增云函数、不收款。
 */
import { createWorkOrder } from '../../../services/workorder';
import { track, trackPageView } from '../../../utils/logger';
import { toast } from '../../../utils/ui';
import {
  ACTIVITY_CONFIGS,
  buildActivityOrderDescription,
  normalizeActivityType,
  type ActivityConfig,
  type ActivityFeature,
} from './viewmodel';

const info = wx.getWindowInfo();

Page({
  data: {
    statusBarHeight: info.statusBarHeight,
    cfg: ACTIVITY_CONFIGS.clinic as ActivityConfig,
    showForm: false,
    option: '',
    room: '',
    contact: '',
    note: '',
    submitting: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    trackPageView('pages/service/activity/index');
    const type = normalizeActivityType(options?.type);
    const cfg = ACTIVITY_CONFIGS[type];
    this.setData({ cfg, option: cfg.options[0] ?? '' });
  },

  goBack(): void {
    if (getCurrentPages().length > 1) wx.navigateBack();
    else wx.switchTab({ url: '/pages/index/index' });
  },

  onFeatureTap(e: WechatMiniprogram.TouchEvent): void {
    const name = String((e.currentTarget.dataset as { name?: string }).name ?? '');
    const feature = this.data.cfg.features.find((f: ActivityFeature) => f.name === name);
    if (!feature) return;
    track('btn_click', { page: 'activity', target: 'feature', name: feature.name });
    wx.showModal({
      title: feature.name,
      content: feature.desc,
      showCancel: false,
      confirmText: '知道了',
    });
  },

  onSignup(): void {
    track('btn_click', { page: 'activity', target: 'signup', type: this.data.cfg.type });
    this.setData({
      showForm: true,
      option: this.data.cfg.options[0] ?? '',
      room: '',
      contact: '',
      note: '',
    });
  },

  onClose(): void {
    if (this.data.submitting) return;
    this.setData({ showForm: false });
  },

  onPickOption(e: WechatMiniprogram.TouchEvent): void {
    this.setData({ option: String((e.currentTarget.dataset as { v?: string }).v ?? '') });
  },

  onRoom(e: WechatMiniprogram.Input): void {
    this.setData({ room: String(e.detail.value || '') });
  },

  onContact(e: WechatMiniprogram.Input): void {
    this.setData({ contact: String(e.detail.value || '') });
  },

  onNote(e: WechatMiniprogram.Input): void {
    this.setData({ note: String(e.detail.value || '') });
  },

  async onSubmit(): Promise<void> {
    if (this.data.submitting) return;
    this.setData({ submitting: true });
    const cfg = this.data.cfg;
    try {
      await createWorkOrder({
        title: `${cfg.title}报名`,
        category: 'other',
        description: buildActivityOrderDescription(cfg, {
          option: this.data.option,
          room: this.data.room,
          contact: this.data.contact,
          note: this.data.note,
        }),
      });
      this.setData({ showForm: false });
      toast('报名已提交，社区会电话确认');
    } catch {
      // request 层已 toast；保留弹层，避免用户重复填写
      toast('提交失败，请稍后重试');
    } finally {
      this.setData({ submitting: false });
    }
  },
});
