/**
 * 办事指南（CR-026 / CR-028 视觉重写）
 *
 * 分类 chip → 搜索 → 事项卡片 → 详情弹层（材料 / 窗口 / 时限 / 跑几趟 / 常见退回）
 * → 可「申请代办」（走 workorder:create）。
 *
 * 数据：纯本地常量（viewmodel.ts），断网可查；不臆造政策条文。
 */
import { createWorkOrder } from '../../../services/workorder';
import { track, trackPageView } from '../../../utils/logger';
import { toast } from '../../../utils/ui';
import {
  buildGuideOrderDescription,
  filterGuide,
  findGuide,
  GUIDE_CATS,
  toGuideVM,
  type GuideItem,
  type GuideVM,
} from './viewmodel';

const TIME_SLOTS: string[] = ['工作日上班时间', '本周末', '下周一'];
const info = wx.getWindowInfo();

type GuideDetail = GuideItem & { materialText: string; flowText: string };

Page({
  data: {
    statusBarHeight: info.statusBarHeight,
    cats: GUIDE_CATS,
    activeCat: '全部',
    keyword: '',
    list: [] as GuideVM[],

    detail: null as GuideDetail | null,

    showOrder: false,
    times: TIME_SLOTS,
    orderRoom: '',
    orderContact: '',
    orderTime: TIME_SLOTS[0],
    orderNote: '',
    submitting: false,
  },

  /** 模块级：当前列表原始项（详情弹层需要完整对象） */
  raw: [] as GuideItem[],

  onLoad(options: Record<string, string | undefined>) {
    trackPageView('pages/service/guide/index');
    const cat = String(options.cat ?? '').trim();
    if (cat && GUIDE_CATS.indexOf(cat) >= 0) this.setData({ activeCat: cat });
    this.apply();
  },

  apply(): void {
    this.raw = filterGuide(this.data.activeCat, this.data.keyword);
    this.setData({ list: this.raw.map(toGuideVM) });
  },

  goBack(): void {
    if (getCurrentPages().length > 1) wx.navigateBack();
    else wx.switchTab({ url: '/pages/index/index' });
  },

  onPickCat(e: WechatMiniprogram.TouchEvent): void {
    const cat = String((e.currentTarget.dataset as { v?: string }).v ?? '全部');
    if (cat === this.data.activeCat) return;
    this.setData({ activeCat: cat });
    this.apply();
  },

  onSearchInput(e: WechatMiniprogram.Input): void {
    this.setData({ keyword: String(e.detail.value ?? '') });
    this.apply();
  },

  onClearKeyword(): void {
    this.setData({ keyword: '' });
    this.apply();
  },

  /* ============================ 详情 ============================ */

  onOpenDetail(e: WechatMiniprogram.TouchEvent): void {
    const key = String((e.currentTarget.dataset as { k?: string }).k ?? '');
    const item = findGuide(key);
    if (!item) return;
    track('btn_click', { page: 'guide', target: 'detail', kind: key });
    this.setData({
      detail: {
        ...item,
        materialText: item.materials.join('、'),
        flowText: `到${item.window}取号 → 提交材料 → 领取回执，按告知时限领结果。`,
      },
    });
  },

  onCloseDetail(): void {
    this.setData({ detail: null });
  },

  /* ============================ 代办申请 ============================ */

  onOrder(): void {
    const matter = this.data.detail?.name ?? '政务事项';
    track('btn_click', { page: 'guide', target: 'order_open', kind: matter });
    this.setData({ showOrder: true, orderTime: TIME_SLOTS[0] });
  },

  onCloseOrder(): void {
    this.setData({ showOrder: false });
  },

  onInputRoom(e: WechatMiniprogram.Input): void {
    this.setData({ orderRoom: String(e.detail.value ?? '') });
  },

  onInputContact(e: WechatMiniprogram.Input): void {
    this.setData({ orderContact: String(e.detail.value ?? '') });
  },

  onInputNote(e: WechatMiniprogram.Input): void {
    this.setData({ orderNote: String(e.detail.value ?? '') });
  },

  onPickTime(e: WechatMiniprogram.TouchEvent): void {
    const v = String((e.currentTarget.dataset as { v?: string }).v ?? '');
    if (v) this.setData({ orderTime: v });
  },

  async onSubmitOrder(): Promise<void> {
    if (this.data.submitting) return;
    const room = String(this.data.orderRoom ?? '').trim();
    const contact = String(this.data.orderContact ?? '').trim();
    if (!room) {
      toast('请填写楼栋房号');
      return;
    }
    if (!contact) {
      toast('请填写联系电话');
      return;
    }
    this.setData({ submitting: true });
    try {
      await createWorkOrder({
        title: `政务代办 · ${this.data.detail?.name ?? '政务事项'}`,
        category: 'other',
        description: buildGuideOrderDescription({
          matter: this.data.detail?.name ?? '政务事项',
          room,
          time: this.data.orderTime,
          contact,
          note: this.data.orderNote,
        }),
      });
      this.setData({ showOrder: false, submitting: false, orderRoom: '', orderNote: '', detail: null });
      wx.showToast({ title: '已提交，工作人员会电话联系', icon: 'none' });
    } catch {
      this.setData({ submitting: false });
      toast('提交失败，请稍后重试');
    }
  },

  onShareAppMessage(): { title: string; path: string } {
    return { title: '社区办事指南 · 材料一次带齐', path: '/pages/service/guide/index' };
  },
});
