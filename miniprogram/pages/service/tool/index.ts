/**
 * 共享设备（CR-026）
 *
 * 结构：借用中的台账 → 设备列表（可借余量）→ 点位 → 借用登记
 *
 * ⚠ 红线：只做登记与查询，**不收押金、不做支付**。
 *   台账存本地 Storage，登记走既有 workorder:create。
 */
import { STORAGE_KEYS } from '../../../config/env';
import { createWorkOrder } from '../../../services/workorder';
import { track, trackPageView } from '../../../utils/logger';
import { getStorage, setStorage } from '../../../utils/storage';
import { toast } from '../../../utils/ui';
import {
  TOOL_KINDS,
  TOOL_META,
  TOOL_SPOTS,
  borrowDurationMs,
  buildBorrowOrderDescription,
  findTool,
  formatTime,
  makeBorrowId,
  stockPercent,
  type BorrowRow,
  type ToolKind,
} from './viewmodel';

/** 借用台账存储键（本地） */
const BORROW_KEY = STORAGE_KEYS.TOOL_BORROWS;

interface ToolCardVM {
  key: ToolKind;
  name: string;
  desc: string;
  free: string;
  over: string;
  limit: string;
  note: string;
  stock: number;
  total: number;
  percent: number;
  soldOut: boolean;
  borrowing: boolean;
}

Page({
  data: {
    tools: [] as ToolCardVM[],
    spots: TOOL_SPOTS,
    borrows: [] as BorrowRow[],

    /** 借用登记弹层 */
    showBorrow: false,
    borrowKind: 'umbrella' as ToolKind,
    borrowName: '共享雨伞',
    borrowSpot: TOOL_SPOTS[0].name,
    spotNames: TOOL_SPOTS.map((s) => s.name),
    spotIndex: 0,
    room: '',
    contact: '',
    note: '',
    submitting: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    trackPageView('pages/service/tool/index');
    // 支持从宫格带 kind 直接进入（例：tools_toolkit → 自动展开维修工具）
    const kind = String(options?.kind ?? '');
    if (TOOL_KINDS.indexOf(kind as ToolKind) >= 0) {
      this.setData({ borrowKind: kind as ToolKind });
    }
    this.refresh();
  },

  onShow() {
    this.refresh();
  },

  refresh(): void {
    const borrows = getStorage<BorrowRow[]>(BORROW_KEY) ?? [];
    const active = borrows.filter((b) => b.status === 'borrowing');
    this.setData({
      borrows: active,
      tools: TOOL_META.map((m) => ({
        key: m.key,
        name: m.name,
        desc: m.desc,
        free: m.free,
        over: m.over,
        limit: m.limit,
        note: m.note,
        stock: m.stock,
        total: m.total,
        percent: stockPercent(m),
        soldOut: m.stock <= 0,
        borrowing: active.some((b) => b.kind === m.key),
      })),
    });
  },

  /* ============================ 借用登记 ============================ */

  onBorrow(e: WechatMiniprogram.TouchEvent): void {
    const key = String((e.currentTarget.dataset as { k?: string }).k ?? 'umbrella') as ToolKind;
    const meta = findTool(key);
    if (!meta) return;
    if (meta.stock <= 0) {
      toast('该设备当前已借完，请稍后再来');
      return;
    }
    const list = (getStorage<BorrowRow[]>(BORROW_KEY) ?? []).filter((b) => b.status === 'borrowing');
    if (list.some((b) => b.kind === key)) {
      toast('你已借用同款设备，归还后可再借');
      return;
    }
    track('btn_click', { page: 'tool', target: 'borrow_open', kind: key });
    this.setData({
      showBorrow: true,
      borrowKind: key,
      borrowName: meta.name,
      borrowSpot: this.data.spotNames[this.data.spotIndex] ?? TOOL_SPOTS[0].name,
      room: '',
      contact: '',
      note: '',
    });
  },

  onCloseBorrow(): void {
    this.setData({ showBorrow: false });
  },

  onSpotChange(e: WechatMiniprogram.PickerChange): void {
    const idx = Number(e.detail.value ?? 0);
    this.setData({ spotIndex: idx, borrowSpot: this.data.spotNames[idx] ?? TOOL_SPOTS[0].name });
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

  async onSubmitBorrow(): Promise<void> {
    if (this.data.submitting) return;
    const room = String(this.data.room ?? '').trim();
    const contact = String(this.data.contact ?? '').trim();
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
    const kind = this.data.borrowKind;
    const meta = findTool(kind);
    const now = Date.now();
    try {
      await createWorkOrder({
        title: `共享设备借用 · ${meta?.name ?? kind}`,
        category: 'other',
        description: buildBorrowOrderDescription({
          name: meta?.name ?? kind,
          spot: this.data.borrowSpot,
          room,
          contact,
          note: this.data.note,
        }),
      });
      const list = getStorage<BorrowRow[]>(BORROW_KEY) ?? [];
      list.unshift({
        id: makeBorrowId(),
        kind,
        name: meta?.name ?? kind,
        spot: this.data.borrowSpot,
        timeText: formatTime(now),
        dueText: formatTime(now + borrowDurationMs(kind)),
        dueAt: now + borrowDurationMs(kind),
        status: 'borrowing',
      });
      setStorage(BORROW_KEY, list);
      this.setData({ showBorrow: false, submitting: false });
      this.refresh();
      wx.showToast({ title: '已登记，请到点位扫码取件', icon: 'none' });
    } catch {
      this.setData({ submitting: false });
      toast('登记失败，请稍后重试');
    }
  },

  /* ============================ 归还 ============================ */

  onReturn(e: WechatMiniprogram.TouchEvent): void {
    const id = String((e.currentTarget.dataset as { id?: string }).id ?? '');
    if (!id) return;
    wx.showModal({
      title: '确认已归还？',
      content: '请确认设备已放回点位。点击确认后本次借用结束。',
      confirmText: '已归还',
      success: (res) => {
        if (!res.confirm) return;
        const list = getStorage<BorrowRow[]>(BORROW_KEY) ?? [];
        const hit = list.find((b) => b.id === id);
        if (hit) hit.status = 'returned';
        setStorage(BORROW_KEY, list);
        track('btn_click', { page: 'tool', target: 'return', kind: hit?.kind ?? '' });
        this.refresh();
        wx.showToast({ title: '已归还，感谢配合', icon: 'none' });
      },
    });
  },

  noop(): void {
    /* noop */
  },
});
