/**
 * 快递代取代寄（CR-026）
 *
 * 结构：我的申请 → 驿站点位 → 收费标准 → 提交申请
 *
 * ⚠ 红线：不代收货款、不做支付、不展示他人取件码。
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

/** 申请记录存储键（本地） */
const ORDER_KEY = STORAGE_KEYS.EXPRESS_ORDERS;

Page({
  data: {
    spots: EXPRESS_SPOTS,
    rules: EXPRESS_RULES,
    orders: [] as ExpressOrder[],

    /** 申请弹层 */
    showForm: false,
    kind: 'pickup' as ExpressKind,
    kindName: '帮我代取',
    companies: EXPRESS_COMPANIES,
    companyIndex: 0,
    company: EXPRESS_COMPANIES[0],
    code: '',
    size: 'small' as ExpressSize,
    sizeNames: SIZE_KEYS.map((k) => SIZE_META[k].name),
    sizeIndex: 0,
    sizeHint: SIZE_META.small.desc,
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
    this.setData({ orders: list });
  },

  /* ============================ 申请 ============================ */

  onApply(e: WechatMiniprogram.TouchEvent): void {
    const k = String((e.currentTarget.dataset as { k?: string }).k ?? 'pickup') as ExpressKind;
    track('btn_click', { page: 'express', target: 'apply_open', kind: k });
    this.setData({
      showForm: true,
      kind: k,
      kindName: kindText(k),
      code: '',
      room: '',
      contact: '',
      note: '',
    });
  },

  onCloseForm(): void {
    this.setData({ showForm: false });
  },

  onCompanyChange(e: WechatMiniprogram.PickerChange): void {
    const idx = Number(e.detail.value ?? 0);
    this.setData({ companyIndex: idx, company: this.data.companies[idx] ?? EXPRESS_COMPANIES[0] });
  },

  onSizeChange(e: WechatMiniprogram.PickerChange): void {
    const idx = Number(e.detail.value ?? 0);
    const key = SIZE_KEYS[idx] ?? 'small';
    this.setData({ sizeIndex: idx, size: key, sizeHint: SIZE_META[key].desc });
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
    try {
      await createWorkOrder({
        title: `快递${kindText(kind)}申请`,
        category: 'other',
        description: buildExpressOrderDescription({
          kind,
          company: this.data.company,
          code,
          size,
          room,
          contact,
          note: this.data.note,
        }),
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
        room,
        timeText: formatTime(Date.now()),
        status: 'pending',
        statusText: '待处理',
      });
      setStorage(ORDER_KEY, list.slice(0, 50));
      this.setData({ showForm: false, submitting: false });
      this.refresh();
      wx.showToast({ title: '已提交，驿站会尽快处理', icon: 'none' });
    } catch {
      this.setData({ submitting: false });
      toast('提交失败，请稍后重试');
    }
  },

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

  noop(): void {
    /* noop */
  },
});
