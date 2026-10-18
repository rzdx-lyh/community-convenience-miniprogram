/**
 * 缴费账单 · 视图模型（CR-026）
 *
 * 数据来源：**纯本地** —— 户号存在 Storage，账单是社区公示口径的演示数据。
 * 为什么不上云：缴费涉及资金，本项目**不做任何收款**，只做「户号绑定 + 账单试算 + 代办登记」，
 * 真实缴纳统一引导到微信「生活缴费」。这样既合规也不需要后端。
 *
 * ⚠ 红线：页面任何位置都不得出现「本小程序可缴费 / 代扣」的表述。
 */

export type BillKind = 'water' | 'electric' | 'gas';

export interface BillKindMeta {
  key: BillKind;
  name: string;
  unit: string;
  /** 户号格式提示 */
  hint: string;
  color: string;
}

export const BILL_KINDS: BillKindMeta[] = [
  { key: 'water', name: '水费', unit: '吨', hint: '水费单左上角 8~10 位', color: '#1F5FD6' },
  { key: 'electric', name: '电费', unit: '度', hint: '电费卡或缴费单上的户号', color: '#A86A05' },
  { key: 'gas', name: '燃气', unit: '立方米', hint: '燃气表箱贴纸上的编号', color: '#0E7C6B' },
];

/** 阶梯水价（社区公示口径）：0-20 吨 2.6，21-30 吨 3.9，30 吨以上 5.2；污水处理费按总用量 1.1/吨 */
export const WATER_TIERS: { upTo: number; price: number; label: string }[] = [
  { upTo: 20, price: 2.6, label: '第一阶梯 0-20 吨' },
  { upTo: 30, price: 3.9, label: '第二阶梯 21-30 吨' },
  { upTo: Infinity, price: 5.2, label: '第三阶梯 30 吨以上' },
];
export const SEWAGE_UNIT_PRICE = 1.1;

export interface TierRow {
  label: string;
  usage: number;
  price: number;
  amount: number;
}

export interface BillCalc {
  usage: number;
  tiers: TierRow[];
  sewage: number;
  total: number;
}

/** 阶梯水费试算（纯函数，可单测）。用量非法（负数/NaN）按 0 处理 */
export function calcWaterFee(rawUsage: number): BillCalc {
  const usage = Number.isFinite(rawUsage) && rawUsage > 0 ? rawUsage : 0;
  let left = usage;
  let lower = 0;
  const tiers: TierRow[] = [];
  let waterFee = 0;
  WATER_TIERS.forEach((tier) => {
    if (left <= 0) return;
    const cap = tier.upTo - lower;
    const part = Math.min(left, cap);
    const amount = Math.round(part * tier.price * 100) / 100;
    tiers.push({ label: tier.label, usage: Math.round(part * 100) / 100, price: tier.price, amount });
    waterFee += amount;
    left -= part;
    lower = tier.upTo;
  });
  const sewage = Math.round(usage * SEWAGE_UNIT_PRICE * 100) / 100;
  return {
    usage,
    tiers,
    sewage,
    total: Math.round((waterFee + sewage) * 100) / 100,
  };
}

/** 演示账单（社区公示口径的示例数据，界面上标注「示例」） */
export interface DemoBill {
  kind: BillKind;
  period: string;
  usage: number;
  amount: number;
  paid: boolean;
}

export const DEMO_BILLS: DemoBill[] = [
  { kind: 'water', period: '2026-09', usage: 24, amount: 78.2, paid: true },
  { kind: 'electric', period: '2026-09', usage: 186, amount: 112.4, paid: true },
  { kind: 'gas', period: '2026-09', usage: 18, amount: 46.8, paid: true },
  { kind: 'water', period: '2026-10', usage: 27, amount: 92.5, paid: false },
  { kind: 'electric', period: '2026-10', usage: 165, amount: 99.7, paid: false },
  { kind: 'gas', period: '2026-10', usage: 15, amount: 39.0, paid: false },
];

export interface BillVM extends DemoBill {
  /** 列表 wx:key：同一 period 有 水/电/燃气 三条，不能只拿 period 当 key */
  id: string;
  name: string;
  unit: string;
  color: string;
  statusText: string;
}

export function toBillVM(bill: DemoBill): BillVM {
  const meta = BILL_KINDS.find((k) => k.key === bill.kind) ?? BILL_KINDS[0];
  return {
    ...bill,
    id: `${bill.kind}_${bill.period}`,
    name: meta.name,
    unit: meta.unit,
    color: meta.color,
    statusText: bill.paid ? '已缴' : '待缴',
  };
}

/** 未缴总额（页面顶部「待缴合计」） */
export function sumUnpaid(list: DemoBill[]): number {
  return Math.round(list.filter((b) => !b.paid).reduce((s, b) => s + b.amount, 0) * 100) / 100;
}

/** 户号脱敏展示（只留末 4 位）—— 户号属于可识别信息，列表里不显全 */
export function maskAccount(account: string): string {
  const s = String(account ?? '').trim();
  if (s.length <= 4) return s;
  return `${'*'.repeat(s.length - 4)}${s.slice(-4)}`;
}

/** 户号绑定提交文案（走 workorder:create，与预约类服务同一结构） */
export function buildBillOrderDescription(input: {
  kind: string;
  account: string;
  room: string;
  note?: string;
}): string {
  return [
    `服务：户号绑定代办（${input.kind}）`,
    `户号：${String(input.account ?? '').trim()}`,
    `房号：${String(input.room ?? '').trim()}`,
    input.note && input.note.trim() ? `备注：${input.note.trim()}` : '',
  ]
    .filter((line) => line !== '')
    .join('\n');
}
