/**
 * 缴费代办（按 UI 设计稿 1.4 重写）
 *
 * 结构：彩色页头（本期应缴合计）→ 水/电/燃气账单卡 → 代办进度 → 水费试算
 *
 * ⚠ 红线：本页**不收款、不代扣**。只做「户号绑定 + 代办登记」，
 *   资金统一在微信「生活缴费」完成，页面上固定展示「不经手资金」。
 */
import { STORAGE_KEYS } from '../../../config/env';
import { createWorkOrder } from '../../../services/workorder';
import { track, trackPageView } from '../../../utils/logger';
import { getStorage, setStorage } from '../../../utils/storage';
import { toast } from '../../../utils/ui';
import {
  buildBillOrderDescription,
  calcWaterFee,
  maskAccount,
  type BillCalc,
  type BillKind,
} from './viewmodel';

/** 户号存储键（本地，不上传云端） */
const ACCOUNT_KEY = STORAGE_KEYS.BILL_ACCOUNTS;
const info = wx.getWindowInfo();

interface BillDef {
  key: BillKind;
  name: string;
  icon: string;
  tint: string;
  color: string;
  amount: number;
  day: string;
  demoAccount: string;
}

/** 社区公示口径的示例账单（金额只作演示，实际以官方账单为准） */
const BILL_DEFS: BillDef[] = [
  {
    key: 'water',
    name: '水费',
    icon: 'droplet',
    tint: 'teal',
    color: '#0E7C6B',
    amount: 32.4,
    day: '10-15 出账',
    demoAccount: '****3021',
  },
  {
    key: 'electric',
    name: '电费',
    icon: 'bulb',
    tint: 'gold',
    color: '#A86A05',
    amount: 128.6,
    day: '10-14 出账',
    demoAccount: '****8890',
  },
  {
    key: 'gas',
    name: '燃气费',
    icon: 'flame',
    tint: 'blue',
    color: '#1F5FD6',
    amount: 46.8,
    day: '10-13 出账',
    demoAccount: '',
  },
];

interface BillCardVM {
  key: BillKind;
  name: string;
  icon: string;
  tint: string;
  color: string;
  account: string;
  masked: string;
  bound: boolean;
  amount: number;
  amountText: string;
  dayText: string;
  percent: number;
  statusText: string;
  statusClass: string;
}

Page({
  data: {
    statusBarHeight: info.statusBarHeight,
    bills: [] as BillCardVM[],
    totalText: '0.00',
    summaryText: '',

    /** 弹层：bill = 办理 / bind = 绑户号 / help = 资金说明 */
    sheet: '' as '' | 'bill' | 'bind' | 'help',
    activeKey: 'water' as BillKind,
    activeName: '',
    activeAmountText: '',
    activeAccountText: '',
    activeBound: false,
    proxyRoom: '',
    proxyNote: '',

    bindAccount: '',
    bindRoom: '',
    bindNote: '',
    submitting: false,

    /** 水费试算 */
    usage: '',
    calc: null as BillCalc | null,
  },

  onLoad() {
    trackPageView('pages/service/bill/index');
    this.load();
  },

  /** 读取本地户号 + 生成账单卡 */
  load(): void {
    const saved = getStorage<Record<string, string>>(ACCOUNT_KEY) ?? {};
    const max = Math.max(1, ...BILL_DEFS.map((b) => b.amount));
    let total = 0;
    let boundCount = 0;

    const bills: BillCardVM[] = BILL_DEFS.map((def) => {
      const account = String(saved[def.key] ?? '').trim() || def.demoAccount;
      const bound = account !== '';
      const amount = bound ? def.amount : 0;
      if (bound) {
        total += amount;
        boundCount += 1;
      }
      return {
        key: def.key,
        name: def.name,
        icon: def.icon,
        tint: def.tint,
        color: def.color,
        account,
        masked: account ? (account.startsWith('*') ? account : maskAccount(account)) : '未绑定',
        bound,
        amount,
        amountText: bound ? `¥${amount.toFixed(2)}` : '—',
        dayText: bound ? def.day : '需先绑定户号',
        percent: Math.round((amount / max) * 100),
        statusText: bound ? '已出账' : '待绑定',
        statusClass: bound ? 'ok' : 'warn',
      };
    });

    this.setData({
      bills,
      totalText: total.toFixed(2),
      summaryText: `${boundCount} 张已出账 · ${BILL_DEFS.length - boundCount} 张待绑定`,
    });
  },

  /* ============================ 卡片点击 ============================ */

  onBillTap(e: WechatMiniprogram.TouchEvent): void {
    const key = String((e.currentTarget.dataset as { k?: string }).k ?? 'water') as BillKind;
    const card = this.data.bills.find((b) => b.key === key);
    if (!card) return;
    track('btn_click', { page: 'bill', target: 'card', kind: key, bound: card.bound });
    if (!card.bound) {
      this.setData({
        sheet: 'bind',
        activeKey: key,
        activeName: card.name,
        bindAccount: '',
        bindRoom: '',
        bindNote: '',
      });
      return;
    }
    this.setData({
      sheet: 'bill',
      activeKey: key,
      activeName: card.name,
      activeAmountText: card.amountText,
      activeAccountText: card.masked,
      activeBound: true,
      proxyRoom: '',
      proxyNote: '',
    });
  },

  onHelp(): void {
    track('btn_click', { page: 'bill', target: 'help' });
    this.setData({ sheet: 'help' });
  },

  onCloseSheet(): void {
    this.setData({ sheet: '' });
  },

  /* ============================ 户号绑定 ============================ */

  onInputBindAccount(e: WechatMiniprogram.Input): void {
    this.setData({ bindAccount: String(e.detail.value ?? '') });
  },

  onInputBindRoom(e: WechatMiniprogram.Input): void {
    this.setData({ bindRoom: String(e.detail.value ?? '') });
  },

  onInputBindNote(e: WechatMiniprogram.Input): void {
    this.setData({ bindNote: String(e.detail.value ?? '') });
  },

  async onSubmitBind(): Promise<void> {
    if (this.data.submitting) return;
    const account = String(this.data.bindAccount ?? '').trim();
    const room = String(this.data.bindRoom ?? '').trim();
    if (!account) {
      toast('请填写户号');
      return;
    }
    if (!/^[0-9A-Za-z-]{6,24}$/.test(account)) {
      toast('户号格式不正确，请核对后再填');
      return;
    }
    if (!room) {
      toast('请填写楼栋房号');
      return;
    }
    this.setData({ submitting: true });
    const kind = this.data.activeKey;
    const kindName = this.data.bills.find((b) => b.key === kind)?.name ?? '水费';
    try {
      await createWorkOrder({
        title: `户号绑定 · ${kindName}`,
        category: 'other',
        description: buildBillOrderDescription({
          kind: kindName,
          account,
          room,
          note: this.data.bindNote,
        }),
      });
      const saved = getStorage<Record<string, string>>(ACCOUNT_KEY) ?? {};
      saved[kind] = account;
      setStorage(ACCOUNT_KEY, saved);
      this.setData({ sheet: '', submitting: false });
      this.load();
      wx.showToast({ title: '已提交，核对通过后生效', icon: 'none' });
    } catch {
      this.setData({ submitting: false });
      toast('提交失败，请稍后重试');
    }
  },

  /* ============================ 办理 / 代办 ============================ */

  onInputProxyRoom(e: WechatMiniprogram.Input): void {
    this.setData({ proxyRoom: String(e.detail.value ?? '') });
  },

  onInputProxyNote(e: WechatMiniprogram.Input): void {
    this.setData({ proxyNote: String(e.detail.value ?? '') });
  },

  /** 只做引导，不做任何收款 */
  onPayGuide(): void {
    track('btn_click', { page: 'bill', target: 'pay_guide' });
    wx.showModal({
      title: '去微信「生活缴费」缴纳',
      content:
        '本小程序不收款、不代扣。请打开微信 → 我 → 服务 → 生活缴费，选择对应户号完成缴纳。',
      confirmText: '知道了',
      showCancel: false,
    });
  },

  async onSubmitProxy(): Promise<void> {
    if (this.data.submitting) return;
    const room = String(this.data.proxyRoom ?? '').trim();
    if (!room) {
      toast('请填写楼栋房号，方便志愿者上门');
      return;
    }
    const card = this.data.bills.find((b) => b.key === this.data.activeKey);
    if (!card) return;
    this.setData({ submitting: true });
    const lines = [
      `服务：缴费代办登记（${card.name}）`,
      `户号：${card.account}`,
      `应缴：${card.amountText}`,
      `房号：${room}`,
    ];
    if (this.data.proxyNote.trim()) lines.push(`备注：${this.data.proxyNote.trim()}`);
    lines.push('说明：本页不收款，资金在微信「生活缴费」完成，社区只做登记与转派。');
    try {
      await createWorkOrder({
        title: `缴费代办 · ${card.name}`,
        category: 'other',
        description: lines.join('\n'),
      });
      this.setData({ sheet: '', submitting: false });
      wx.showToast({ title: '已登记，志愿者会联系你', icon: 'none' });
    } catch {
      this.setData({ submitting: false });
      toast('提交失败，请稍后重试');
    }
  },

  /* ============================ 水费试算 ============================ */

  onUsageInput(e: WechatMiniprogram.Input): void {
    const v = String(e.detail.value ?? '').trim();
    this.setData({ usage: v });
    if (v === '') {
      this.setData({ calc: null });
      return;
    }
    this.setData({ calc: calcWaterFee(Number(v)) });
  },

  /* ============================ 导航 ============================ */

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
