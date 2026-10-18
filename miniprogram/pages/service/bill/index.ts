/**
 * 缴费账单（CR-026）
 *
 * 结构：待缴合计卡 → 户号绑定（本地 Storage）→ 账单列表 → 水费试算器 → 缴费引导
 *
 * ⚠ 红线：本页**不收款、不代扣**。所有「去缴纳」都引导到微信「生活缴费」，
 *   页面上固定展示这句提示，避免被理解成「小程序能缴费」。
 */
import { ENV, STORAGE_KEYS } from '../../../config/env';
import { createWorkOrder } from '../../../services/workorder';
import { track, trackPageView } from '../../../utils/logger';
import { getStorage, setStorage } from '../../../utils/storage';
import { toast } from '../../../utils/ui';
import {
  BILL_KINDS,
  DEMO_BILLS,
  buildBillOrderDescription,
  calcWaterFee,
  maskAccount,
  sumUnpaid,
  toBillVM,
  type BillCalc,
  type BillKind,
  type BillVM,
} from './viewmodel';

/** 户号存储键（本地，不上传云端） */
const ACCOUNT_KEY = STORAGE_KEYS.BILL_ACCOUNTS;

interface AccountRow {
  key: BillKind;
  name: string;
  hint: string;
  account: string;
  masked: string;
  bound: boolean;
}

Page({
  data: {
    kinds: BILL_KINDS,
    accounts: [] as AccountRow[],
    bills: [] as BillVM[],
    unpaid: 0,
    demoHintText: '',

    /** 绑定弹层里随 kind 变化的文案（wxml 不做运算） */
    bindKindName: '水费',
    bindHint: '',

    /** 水费试算 */
    usage: '',
    calc: null as BillCalc | null,

    /** 绑定弹层 */
    showBind: false,
    bindKind: 'water' as BillKind,
    bindAccount: '',
    bindRoom: '',
    bindNote: '',
    submitting: false,
  },

  onLoad() {
    trackPageView('pages/service/bill/index');
    this.loadAccounts();
    this.setData({
      bills: DEMO_BILLS.map(toBillVM),
      unpaid: sumUnpaid(DEMO_BILLS),
      demoHintText: this.demoHint(),
    });
  },

  loadAccounts(): void {
    const saved = getStorage<Record<string, string>>(ACCOUNT_KEY) ?? {};
    this.setData({
      accounts: BILL_KINDS.map((k) => {
        const account = String(saved[k.key] ?? '').trim();
        return {
          key: k.key,
          name: k.name,
          hint: k.hint,
          account,
          masked: account ? maskAccount(account) : '未绑定',
          bound: account !== '',
        };
      }),
    });
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

  /* ============================ 户号绑定 ============================ */

  onBind(e: WechatMiniprogram.TouchEvent): void {
    const key = String((e.currentTarget.dataset as { k?: string }).k ?? 'water') as BillKind;
    track('btn_click', { page: 'bill', target: 'bind_open', kind: key });
    const meta = BILL_KINDS.find((k) => k.key === key) ?? BILL_KINDS[0];
    this.setData({
      showBind: true,
      bindKind: key,
      bindKindName: meta.name,
      bindHint: meta.hint,
      bindAccount: '',
      bindRoom: '',
      bindNote: '',
    });
  },

  onCloseBind(): void {
    this.setData({ showBind: false });
  },

  onInputAccount(e: WechatMiniprogram.Input): void {
    this.setData({ bindAccount: String(e.detail.value ?? '') });
  },

  onInputRoom(e: WechatMiniprogram.Input): void {
    this.setData({ bindRoom: String(e.detail.value ?? '') });
  },

  onInputNote(e: WechatMiniprogram.Input): void {
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
    if (!room) {
      toast('请填写楼栋房号');
      return;
    }
    this.setData({ submitting: true });
    const kindName = BILL_KINDS.find((k) => k.key === this.data.bindKind)?.name ?? '水费';
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
      // 本地先记账，界面立刻反馈（真实核对由工作人员线下完成）
      const saved = getStorage<Record<string, string>>(ACCOUNT_KEY) ?? {};
      saved[this.data.bindKind] = account;
      setStorage(ACCOUNT_KEY, saved);
      this.setData({ showBind: false, submitting: false });
      this.loadAccounts();
      wx.showToast({ title: '已提交，核对通过后生效', icon: 'none' });
    } catch {
      this.setData({ submitting: false });
      toast('提交失败，请稍后重试');
    }
  },

  /* ============================ 缴费引导 ============================ */

  /** 去缴纳：不做任何收款，引导到微信生活缴费 */
  onPayGuide(): void {
    track('btn_click', { page: 'bill', target: 'pay_guide' });
    wx.showModal({
      title: '去微信「生活缴费」缴纳',
      content:
        '本小程序不收款、不代扣。请打开微信 → 我 → 服务 → 生活缴费，选择对应户号完成缴纳；如需上门代办可在办事大厅提交。',
      confirmText: '知道了',
      showCancel: false,
    });
  },

  noop(): void {
    /* noop */
  },

  /** 顶部演示数据提示（CR-017-a：未连云端时要有可见标识） */
  demoHint(): string {
    return ENV.USE_MOCK ? '示例账单 · 未连接云端' : '示例账单 · 金额以官方账单为准';
  },
});
