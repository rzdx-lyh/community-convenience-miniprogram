/**
 * 快递代取代寄 · 视图模型（CR-026）
 *
 * 数据来源：本地配置 + 本地申请记录（Storage）；
 * 申请提交走既有 `workorder:create`，不新增云函数、不改契约。
 *
 * ⚠ 红线：本页**不代收货款、不做支付**，也**不展示他人取件码**。
 *   取件码属于个人凭证，只在用户自己填写后进入工单，页面不回显别人的件。
 */

export type ExpressKind = 'pickup' | 'send';
export type ExpressSize = 'small' | 'big' | 'cold';

export interface ExpressOrder {
  id: string;
  kind: ExpressKind;
  kindText: string;
  company: string;
  code: string;
  size: ExpressSize;
  sizeText: string;
  room: string;
  timeText: string;
  status: 'pending' | 'done';
  statusText: string;
}

export const EXPRESS_COMPANIES: string[] = [
  '顺丰速运',
  '京东物流',
  '中通快递',
  '圆通速递',
  '韵达快递',
  '申通快递',
  '极兔速递',
  '中国邮政',
  '其他',
];

export const SIZE_META: Record<ExpressSize, { name: string; desc: string; fee: string }> = {
  small: { name: '小件', desc: '1 kg 以内 / 鞋盒大小', fee: '2 元/件' },
  big: { name: '大件', desc: '1-10 kg / 纸箱家电', fee: '5 元/件' },
  cold: { name: '冷链', desc: '生鲜冷冻，需冷藏', fee: '8 元/件' },
};

export const SIZE_KEYS: ExpressSize[] = ['small', 'big', 'cold'];

/** 驿站点位 */
export const EXPRESS_SPOTS: Array<{ name: string; addr: string; hours: string; note: string }> = [
  { name: '1 号楼驿站', addr: '1 号楼 1 层大堂东侧', hours: '7:00 - 22:00', note: '代收 · 代寄 · 冷链暂存' },
  { name: '中心广场快递柜', addr: '中心广场北侧 24 组柜机', hours: '24 小时', note: '仅快递员投放，超时 12 小时后转驿站' },
  { name: '3 号楼门岗', addr: '3 号楼南门门岗值班室', hours: '24 小时', note: '夜间代收，大件请次日到驿站取' },
  { name: '党群服务中心', addr: '会所 2 层 201', hours: '9:00 - 18:00（周一闭馆）', note: '代寄填单 · 问题件处理' },
];

/** 收费标准（与上面 fee 一致的完整说明） */
export const EXPRESS_RULES: Array<{ label: string; value: string }> = [
  { label: '代取（小件）', value: '2 元/件' },
  { label: '代取（大件）', value: '5 元/件' },
  { label: '代取（冷链）', value: '8 元/件' },
  { label: '代寄', value: '按快递公司标准价，驿站不加点' },
  { label: '免费保管', value: '到件后 24 小时内' },
  { label: '超时保管', value: '1 元/天，冷链 3 元/天' },
  { label: '上门送件', value: '60 岁以上 / 行动不便免费' },
];

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 申请 id（自增序号兜底，避免同毫秒撞 wx:key） */
let seq = 0;
export function makeExpressId(): string {
  seq = (seq + 1) % 100000;
  return `ex_${Date.now()}_${seq}`;
}

export function kindText(kind: ExpressKind): string {
  return kind === 'pickup' ? '帮我代取' : '帮我代寄';
}

/** 申请工单描述（走 workorder:create） */
export function buildExpressOrderDescription(input: {
  kind: ExpressKind;
  company: string;
  code: string;
  size: ExpressSize;
  room: string;
  contact: string;
  note?: string;
}): string {
  const lines = [
    `服务：快递${kindText(input.kind)}`,
    `快递公司：${String(input.company ?? '').trim()}`,
    `取件码 / 单号：${String(input.code ?? '').trim()}`,
    `件型：${SIZE_META[input.size]?.name ?? '小件'}（${SIZE_META[input.size]?.fee ?? ''}）`,
    `楼栋房号：${String(input.room ?? '').trim()}`,
    `联系电话：${String(input.contact ?? '').trim()}`,
  ];
  if (input.note && input.note.trim()) lines.push(`备注：${input.note.trim()}`);
  lines.push('说明：代取需提供取件码，代寄请当面交接物品；费用在取件时现场结算。');
  return lines.join('\n');
}
