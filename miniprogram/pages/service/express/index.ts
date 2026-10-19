/**
 * 快递代取代寄（按 UI 设计稿 1.4 重写）
 *
 * 结构：彩色页头 → 在库包裹券 → 驿站信息 → 代取规则 → 我的申请 → 预约弹层
 *
 * ⚠ 红线：不代收货款、不做支付；代取服务费由跑腿志愿者线下结算。
 *   取件码只用于本次登记，页面不回显他人包裹。
 */
import { STORAGE_KEYS } from '../../../config/env';
import { createWorkOrder } from '../../../services/workorder';
import { track, trackPageView } from '../../../utils/logger';
import { getStorage, setStorage } from '../../../utils/storage';
import { toast } from '../../../utils/ui';
import {
  EXPRESS_COMPANIES,
  EXPRESS_RULES,
  EXPRESS_SPOTS,
  SIZE_KEYS,
  SIZE_META,
  buildExpressOrderDescription,
  formatTime,
  kindText,
  makeExpressId,
  type ExpressKind,
  type ExpressOrder,
  type ExpressSize,
} from './viewmodel';

const ORDER_KEY = STORAGE_KEYS.EXPRESS_ORDERS;
const info = wx.getWindowInfo();

/** 在库包裹（示例数据，取件码仅本人可见） */
const PACKAGES = [
  {
    name: '顺丰 · 文件袋',
    code: '3-2081',
    timeText: '今日 09:12 入库',
    keep: '免费保管 3 天（剩 2 天）',
  },
  {
    name: '中通 · 纸箱',
    code: '3-2077',
    timeText: '昨日 18:40 入库',
    keep: '免费保管 3 天（剩 1 天）',
  },
];

const SIZE_OPTIONS = SIZE_KEYS.map((k) => ({
  key: k,
  name: SIZE_META[k].name,
  desc: SIZE_META[k].desc,
  fee: SIZE_META[k].fee,
}));

interface OrderVM extends ExpressOrder {
  spotText: string;
  feeText: string;
}

Page({
  data: {
    statusBarHeight: info.statusBarHeight,
    packages: PACKAGES,
    spots: EXPRESS_SPOTS,
    rules: EXPRESS_RULES,
    orders: [] as OrderVM[],

    /** 弹层：form = 预约 / spots = 存放点 */
    sheet: '' as '' | 'form' | 'spots',
    kind: 'pickup' as ExpressKind,
    kindName: '帮我代取',
    companies: EXPRESS_COMPANIES,
    company: EXPRESS_COMPANIES[0],
    sizes: SIZE_OPTIONS,
    size: 'small' as ExpressSize,
    sizeName: SIZE_META.small.name,
    sizeFee: SIZE_META.small.fee,
    spotName: EXPRESS_SPOTS[0].name,
    spotNames: EXPRESS_SPOTS.map((s) => s.name),
    code: '',
    room: '',
    contact: '',
    note: '',
    submitting: false,
  },

  onLoad() {
    trackPageView('pages/service/express/index');
    this.refresh();
  },

  onShow() {
    this.refresh();
  },

  refresh(): void {
    const list = getStorage<ExpressOrder[]>(ORDER_KEY) ?? [];
    this.setData({
      orders: list.map((o) => ({
        ...o,
        spotText: o.spot || EXPRESS_SPOTS[0].name,
        feeText: o.fee || '线下结算',
      })),
    });
  },

  /* ============================ 表单 ============================ */

  onOpenForm(e: WechatMiniprogram.TouchEvent): void {
    const k = String((e.currentTarget.dataset as { k?: string }).k ?? 'pickup') as ExpressKind;
    track('btn_click', { page: 'express', target: 'apply_open', kind: k });
    this.setData({
      sheet: 'form',
      kind: k,
      kindName: kindText(k),
      company: EXPRESS_COMPANIES[0],
      size: 'small',
      sizeName: SIZE_META.small.name,
      sizeFee: SIZE_META.small.fee,
      spotName: this.data.spotNames[0] ?? EXPRESS_SPOTS[0].name,
      code: '',
      room: '',
      contact: '',
      note: '',
    });
  },

  onOpenSpots(): void {
    track('btn_click', { page: 'express', target: 'spots' });
    this.setData({ sheet: 'spots' });
  },

  onCloseSheet(): void {
    this.setData({ sheet: '' });
  },

  onPickKind(e: WechatMiniprogram.TouchEvent): void {
    const k = String((e.currentTarget.dataset as { k?: string }).k ?? 'pickup') as ExpressKind;
    this.setData({ kind: k, kindName: kindText(k) });
  },

  onPickCompany(e: WechatMiniprogram.TouchEvent): void {
    const v = String((e.currentTarget.dataset as { v?: string }).v ?? '');
    if (!v) return;
    this.setData({ company: v });
  },

  onPickSize(e: WechatMiniprogram.TouchEvent): void {
    const k = String((e.currentTarget.dataset as { s?: string }).s ?? 'small') as ExpressSize;
    if (!SIZE_META[k]) return;
    this.setData({ size: k, sizeName: SIZE_META[k].name, sizeFee: SIZE_META[k].fee });
  },

  onPickSpot(e: WechatMiniprogram.TouchEvent): void {
    const n = String((e.currentTarget.dataset as { n?: string }).n ?? '');
    if (!n) return;
    this.setData({ spotName: n });
  },

  onInputCode(e: WechatMiniprogram.Input): void {
    this.setData({ code: String(e.detail.value ?? '') });
  },

  onInputRoom(e: WechatMiniprogram.Input): void {
    this.setData({ room: String(e.detail.value ?? '') });
  },

  onInputContact(e: WechatMiniprogram.Input): void {
    this.setData({ contact: String(e.detail.value ?? '') });
  },

  onInputNote(e: WechatMiniprogram.Input): void {
    this.setData({ note: String(e.detail.value ?? '') });
  },

  async onSubmit(): Promise<void> {
    if (this.data.submitting) return;
    const code = String(this.data.code ?? '').trim();
    const room = String(this.data.room ?? '').trim();
    const contact = String(this.data.contact ?? '').trim();
    if (!code) {
      toast(this.data.kind === 'pickup' ? '请填写取件码' : '请填写寄件单号');
      return;
    }
    if (!room) {
      toast('请填写楼栋房号');
      return;
    }
    if (!contact) {
      toast('请填写联系电话');
      return;
    }
    if (!/^\d{7,15}$/.test(contact.replace(/[-\s]/g, ''))) {
      toast('请填写正确的联系电话');
      return;
    }
    this.setData({ submitting: true });
    const kind = this.data.kind;
    const size = this.data.size;
    const fee = SIZE_META[size].fee;
    try {
      const desc = [
        buildExpressOrderDescription({
          kind,
          company: this.data.company,
          code,
          size,
          room,
          contact,
          note: this.data.note,
        }),
        `取件点位：${this.data.spotName}`,
        `代取服务费：${fee}（由跑腿志愿者线下结算，本页不收款）`,
      ].join('\n');
      await createWorkOrder({
        title: `快递${kindText(kind)} · ${this.data.company}`,
        category: 'other',
        description: desc,
      });
      const list = getStorage<ExpressOrder[]>(ORDER_KEY) ?? [];
      list.unshift({
        id: makeExpressId(),
        kind,
        kindText: kindText(kind),
        company: this.data.company,
        code,
        size,
        sizeText: SIZE_META[size].name,
        spot: this.data.spotName,
        fee,
        room,
        timeText: formatTime(Date.now()),
        status: 'pending',
        statusText: '待处理',
      });
      setStorage(ORDER_KEY, list.slice(0, 50));
      this.setData({ sheet: '', submitting: false });
      this.refresh();
      wx.showToast({ title: '已提交，驿站会尽快处理', icon: 'none' });
    } catch {
      this.setData({ submitting: false });
      toast('提交失败，请稍后重试');
    }
  },

  /* ============================ 订单 ============================ */

  onCancel(e: WechatMiniprogram.TouchEvent): void {
    const id = String((e.currentTarget.dataset as { id?: string }).id ?? '');
    if (!id) return;
    wx.showModal({
      title: '撤销这条申请？',
      content: '撤销后驿站不再处理，如需代取请重新提交。',
      confirmText: '撤销',
      confirmColor: '#E5484D',
      success: (res) => {
        if (!res.confirm) return;
        const list = (getStorage<ExpressOrder[]>(ORDER_KEY) ?? []).filter((o) => o.id !== id);
        setStorage(ORDER_KEY, list);
        this.refresh();
      },
    });
  },

  goBack(): void {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  noop(): void {
    /* noop */
  },
});
