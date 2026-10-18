/**
 * 共享设备 · 视图模型（CR-026）
 *
 * 数据来源：**本地配置 + 本地借用台账**（Storage）。
 * 借用登记走既有 `workorder:create`，不新增云函数、不改契约。
 *
 * ⚠ 红线：本页只做**借用登记与点位查询**，不做押金收取、不做支付。
 *   真实借还由现场扫码/工作人员核对完成，页面上的「借用中」是登记状态，不是设备状态。
 */

export type ToolKind = 'umbrella' | 'toolkit' | 'power' | 'chair' | 'stroller' | 'monitor';

export interface ToolMeta {
  key: ToolKind;
  name: string;
  /** 副标题：给什么人用 */
  desc: string;
  /** 免费时长 */
  free: string;
  /** 超时计费 */
  over: string;
  /** 最长借用 */
  limit: string;
  /** 可借数量 / 总数 */
  stock: number;
  total: number;
  /** 借用条件提示 */
  note: string;
}

export const TOOL_KINDS: ToolKind[] = ['umbrella', 'toolkit', 'power', 'chair', 'stroller', 'monitor'];

export const TOOL_META: ToolMeta[] = [
  {
    key: 'umbrella',
    name: '共享雨伞',
    desc: '下雨天应急，驿站门口自取',
    free: '24 小时内免费',
    over: '超时 1 元/天，上限 10 元',
    limit: '最长 7 天',
    stock: 18,
    total: 24,
    note: '无需押金，登记房号即可借出',
  },
  {
    key: 'toolkit',
    name: '维修工具',
    desc: '电钻 / 梯子 / 通厕器 / 扳手套装',
    free: '48 小时内免费',
    over: '超时 2 元/天，上限 20 元',
    limit: '最长 3 天',
    stock: 6,
    total: 9,
    note: '借用需登记联系电话，损坏照价赔偿',
  },
  {
    key: 'power',
    name: '共享充电宝',
    desc: '10000mAh，三接口自带线',
    free: '前 1 小时免费',
    over: '之后 2 元/小时，单日封顶 20 元',
    limit: '最长 3 天',
    stock: 12,
    total: 20,
    note: '任意点位可归还，归还前确认已拔线',
  },
  {
    key: 'chair',
    name: '轮椅',
    desc: '行动不便老人 / 术后康复',
    free: '72 小时内免费',
    over: '超时 5 元/天',
    limit: '最长 15 天',
    stock: 3,
    total: 4,
    note: '需家属陪同登记，使用前检查刹车',
  },
  {
    key: 'stroller',
    name: '儿童推车',
    desc: '轻便伞车，适合 0-3 岁',
    free: '24 小时内免费',
    over: '超时 2 元/天',
    limit: '最长 5 天',
    stock: 4,
    total: 6,
    note: '用完请清理食物残渣后归还',
  },
  {
    key: 'monitor',
    name: '血压计',
    desc: '上臂式电子血压计',
    free: '72 小时内免费',
    over: '超时 1 元/天',
    limit: '最长 10 天',
    stock: 5,
    total: 8,
    note: '与「健康档案」页配合使用，测完随手记一条',
  },
];

/** 点位（与电话簿、快递点位同源口径：社区内真实可走到的地方） */
export const TOOL_SPOTS: Array<{ name: string; addr: string; hours: string; tools: string }> = [
  { name: '1 号楼驿站', addr: '1 号楼 1 层大堂东侧', hours: '7:00 - 22:00', tools: '雨伞 · 充电宝 · 推车' },
  { name: '中心广场服务亭', addr: '中心广场北侧（党群服务中心旁）', hours: '8:00 - 20:00', tools: '雨伞 · 维修工具 · 轮椅' },
  { name: '3 号楼门岗', addr: '3 号楼南门门岗值班室', hours: '24 小时', tools: '雨伞 · 充电宝 · 血压计' },
  { name: '党群服务中心', addr: '会所 2 层 201', hours: '9:00 - 18:00（周一闭馆）', tools: '维修工具 · 轮椅 · 血压计' },
];

export function findTool(key: string): ToolMeta | undefined {
  return TOOL_META.find((t) => t.key === key);
}

/** 借用台账里的一行（本地） */
export interface BorrowRow {
  id: string;
  kind: ToolKind;
  name: string;
  spot: string;
  timeText: string;
  /** 到期时间文本 */
  dueText: string;
  /** 是否已过期（按文本比较不可靠，存时间戳） */
  dueAt: number;
  status: 'borrowing' | 'returned';
}

/** 剩余可借进度（0-100），用于进度条，避免满仓时看不到差别 */
export function stockPercent(meta: ToolMeta): number {
  if (meta.total <= 0) return 0;
  return Math.round((meta.stock / meta.total) * 100);
}

/** 生成台账 id（自增序号兜底，避免同毫秒撞 wx:key） */
let seq = 0;
export function makeBorrowId(): string {
  seq = (seq + 1) % 100000;
  return `bw_${Date.now()}_${seq}`;
}

/** 到期时间：按借用时长规则折算（单位毫秒） */
export function borrowDurationMs(kind: ToolKind): number {
  switch (kind) {
    case 'power':
      return 3 * 24 * 3600 * 1000;
    case 'toolkit':
      return 3 * 24 * 3600 * 1000;
    case 'chair':
      return 15 * 24 * 3600 * 1000;
    case 'stroller':
      return 5 * 24 * 3600 * 1000;
    case 'monitor':
      return 10 * 24 * 3600 * 1000;
    default:
      return 7 * 24 * 3600 * 1000;
  }
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 借用登记工单描述（走 workorder:create） */
export function buildBorrowOrderDescription(input: {
  name: string;
  spot: string;
  room: string;
  contact: string;
  note?: string;
}): string {
  return [
    '服务：共享设备借用登记',
    `设备：${input.name}`,
    `点位：${input.spot}`,
    `楼栋房号：${String(input.room ?? '').trim()}`,
    `联系电话：${String(input.contact ?? '').trim()}`,
    input.note && input.note.trim() ? `备注：${input.note.trim()}` : '',
    '说明：现场扫码取件后生效，归还请在同一点位或其他点位放回并确认。',
  ]
    .filter((line) => line !== '')
    .join('\n');
}
