/**
 * 共享设备（按 UI 设计稿 1.4 重写）
 *
 * 结构：彩色页头 → 借用中圆环 → 点位分布 → 6 类设备 → 借还记录 → 借用弹层
 *
 * ⚠ 红线：只做借用登记与点位查询，**免押金、不收款**。
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
  buildBorrowOrderDescription,
  findTool,
  formatTime,
  makeBorrowId,
  type BorrowRow,
  type ToolKind,
} from './viewmodel';

const BORROW_KEY = STORAGE_KEYS.TOOL_BORROWS;
const info = wx.getWindowInfo();

const ICONS: Record<ToolKind, string> = {
  umbrella: 'umbrella',
  toolkit: 'toolbox',
  power: 'battery',
  chair: 'chair',
  stroller: 'child',
  monitor: 'stetho',
};

const TINTS: Record<ToolKind, string> = {
  umbrella: 'teal',
  toolkit: 'gold',
  power: 'blue',
  chair: 'indigo',
  stroller: 'indigo',
  monitor: 'teal',
};

const UNITS: Record<ToolKind, string> = {
  umbrella: '把',
  toolkit: '套',
  power: '个',
  chair: '台',
  stroller: '辆',
  monitor: '台',
};

interface ToolCardVM {
  key: ToolKind;
  name: string;
  desc: string;
  free: string;
  note: string;
  icon: string;
  tint: string;
  unit: string;
  stock: number;
  total: number;
  borrowed: boolean;
}

interface RecordVM extends BorrowRow {
  statusText: string;
}

interface DayOption {
  d: number;
  label: string;
}

const DAY_OPTIONS: DayOption[] = [
  { d: 1, label: '1 天' },
  { d: 3, label: '3 天' },
  { d: 7, label: '7 天' },
];

/** 剩余归还时间（设计稿是 HH:MM，这里按天/时/分给出更直观） */
function remainText(dueAt: number): string {
  const ms = dueAt - Date.now();
  if (ms <= 0) return '已到期';
  const h = Math.floor(ms / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d} 天 ${h % 24} 时`;
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h} 时 ${m} 分`;
}

Page({
  data: {
    statusBarHeight: info.statusBarHeight,
    spots: TOOL_SPOTS,
    tools: [] as ToolCardVM[],
    records: [] as RecordVM[],

    currentKey: 'umbrella' as ToolKind,
    currentName: '共享雨伞',
    currentFree: '24 小时内免费',
    currentUnit: '把',
    currentStock: 18,
    currentBorrow: null as BorrowRow | null,
    currentDesc: '24 小时内免费',
    remainText: '',
    borrowNo: '',

    /** 弹层：borrow = 借用登记 / spots = 点位 */
    sheet: '' as '' | 'borrow' | 'spots',
    spotName: TOOL_SPOTS[0].name,
    spotNames: TOOL_SPOTS.map((s) => s.name),
    dayOptions: DAY_OPTIONS,
    borrowDays: 1,
    duePreview: '',
    room: '',
    contact: '',
    note: '',
    submitting: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    trackPageView('pages/service/tool/index');
    const kind = String(options?.kind ?? '');
    if (TOOL_KINDS.indexOf(kind as ToolKind) >= 0) {
      this.setData({ currentKey: kind as ToolKind });
    }
    this.refresh();
  },

  onShow() {
    this.refresh();
  },

  /** 读取台账 + 重算当前设备 */
  refresh(): void {
    const list = getStorage<BorrowRow[]>(BORROW_KEY) ?? [];
    const active = list.filter((b) => b.status === 'borrowing');
    const tools: ToolCardVM[] = TOOL_META.map((m) => ({
      key: m.key,
      name: m.name,
      desc: m.desc,
      free: m.free,
      note: m.note,
      icon: ICONS[m.key],
      tint: TINTS[m.key],
      unit: UNITS[m.key],
      stock: m.stock,
      total: m.total,
      borrowed: active.some((b) => b.kind === m.key),
    }));
    const cur = TOOL_META.find((m) => m.key === this.data.currentKey) ?? TOOL_META[0];
    const borrow = active.find((b) => b.kind === cur.key) ?? null;
    const records: RecordVM[] = list
      .slice()
      .sort((a, b) => b.dueAt - a.dueAt)
      .slice(0, 6)
      .map((b) => ({
        ...b,
        statusText: b.status === 'borrowing' ? '借用中' : '已归还',
      }));
    this.setData({
      tools,
      records,
      currentKey: cur.key,
      currentName: cur.name,
      currentFree: cur.free,
      currentUnit: UNITS[cur.key],
      currentStock: cur.stock,
      currentBorrow: borrow,
      currentDesc: borrow ? `编号 ${borrow.no ?? '—'} · 可在任意点位归还` : cur.free,
      remainText: borrow ? remainText(borrow.dueAt) : '',
      borrowNo: borrow?.no ?? '',
    });
  },

  /** 切换当前设备（点设备卡） */
  onSelectTool(e: WechatMiniprogram.TouchEvent): void {
    const key = String((e.currentTarget.dataset as { k?: string }).k ?? '') as ToolKind;
    if (!findTool(key)) return;
    this.setData({ currentKey: key }, () => {
      this.refresh();
      this.onOpenBorrow();
    });
  },

  /* ============================ 借用登记 ============================ */

  onOpenBorrow(): void {
    const meta = findTool(this.data.currentKey);
    if (!meta) return;
    const existing = this.data.currentBorrow;
    if (existing) {
      toast('这款设备你已借用，归还后可再借');
      return;
    }
    if (meta.stock <= 0) {
      toast('该设备当前已借完，请稍后再来');
      return;
    }
    const now = Date.now();
    track('btn_click', { page: 'tool', target: 'borrow_open', kind: meta.key });
    this.setData({
      sheet: 'borrow',
      spotName: this.data.spotNames[0] ?? TOOL_SPOTS[0].name,
      borrowDays: 1,
      duePreview: formatTime(now + 24 * 3600 * 1000),
      room: '',
      contact: '',
      note: '',
    });
  },

  onCloseSheet(): void {
    this.setData({ sheet: '' });
  },

  onOpenSpots(): void {
    track('btn_click', { page: 'tool', target: 'spots' });
    this.setData({ sheet: 'spots' });
  },

  onPickSpot(e: WechatMiniprogram.TouchEvent): void {
    const name = String((e.currentTarget.dataset as { n?: string }).n ?? '');
    if (!name) return;
    this.setData({ spotName: name });
  },

  onPickDays(e: WechatMiniprogram.TouchEvent): void {
    const d = Number((e.currentTarget.dataset as { d?: number }).d ?? 1);
    this.setData({
      borrowDays: d,
      duePreview: formatTime(Date.now() + d * 24 * 3600 * 1000),
    });
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
    const meta = findTool(this.data.currentKey);
    if (!meta) return;
    this.setData({ submitting: true });
    const now = Date.now();
    const days = this.data.borrowDays;
    try {
      await createWorkOrder({
        title: `共享设备借用 · ${meta.name}（${days} 天）`,
        category: 'other',
        description: buildBorrowOrderDescription({
          name: meta.name,
          spot: this.data.spotName,
          room,
          contact,
          note: this.data.note,
        }),
      });
      const list = getStorage<BorrowRow[]>(BORROW_KEY) ?? [];
      list.unshift({
        id: makeBorrowId(),
        no: `SB${String(now).slice(-6)}`,
        kind: meta.key,
        name: meta.name,
        spot: this.data.spotName,
        timeText: formatTime(now),
        dueText: formatTime(now + days * 24 * 3600 * 1000),
        dueAt: now + days * 24 * 3600 * 1000,
        status: 'borrowing',
      });
      setStorage(BORROW_KEY, list.slice(0, 50));
      this.setData({ sheet: '', submitting: false });
      this.refresh();
      wx.showToast({ title: '已登记，请到点位扫码取件', icon: 'none' });
    } catch {
      this.setData({ submitting: false });
      toast('登记失败，请稍后重试');
    }
  },

  /* ============================ 归还 ============================ */

  /** 页头主按钮：借用中 → 归还，否则 → 借用登记 */
  onMainAction(): void {
    const b = this.data.currentBorrow;
    if (b) {
      this.confirmReturn(b.id);
    } else {
      this.onOpenBorrow();
    }
  },

  onReturn(e: WechatMiniprogram.TouchEvent): void {
    const id = String((e.currentTarget.dataset as { id?: string }).id ?? '');
    if (!id) return;
    this.confirmReturn(id);
  },

  confirmReturn(id: string): void {
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
