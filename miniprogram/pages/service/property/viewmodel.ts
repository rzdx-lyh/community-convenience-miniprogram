/**
 * 物业延伸 · 视图模型（CR-027）
 *
 * 3 个子频道：外卖代收 / 流浪动物 / 房屋租售。
 * 数据本地配置；登记与发布都走既有 `workorder:create`，不新增云函数、不改契约。
 *
 * ⚠ 红线：
 *   1. 社区**只做信息登记**，不介入物业与业主之间的权责；
 *   2. 房屋租售**不收中介费、不做资金托管**，看房与签约由双方自行线下完成；
 *   3. 房源一律标注「业主自发布」，社区不对房源真实性背书（只做登记，不做核验承诺）。
 */

export type PropertyTab = 'takeout' | 'stray' | 'lease';

export const PROPERTY_TABS: Array<{ key: PropertyTab; name: string; note: string }> = [
  { key: 'takeout', name: '外卖代收', note: '存放点代收 · 60 岁以上可送上门' },
  { key: 'stray', name: '流浪动物', note: '文明养宠公约 · 定点投喂 · 救助登记' },
  { key: 'lease', name: '房屋租售', note: '业主自发布 · 社区不收中介费' },
];

/* ------------------------------ 外卖代收 ------------------------------ */

export const TAKEOUT_SPOTS: Array<{ name: string; addr: string; hours: string; note: string }> = [
  { name: '1 号楼驿站', addr: '1 号楼 1 层大堂东侧', hours: '7:00 - 22:00', note: '保温柜 + 冷藏格' },
  { name: '3 号楼门岗', addr: '3 号楼南门门岗值班室', hours: '24 小时', note: '夜间代收，次日 9:00 前转驿站' },
  { name: '中心广场服务亭', addr: '中心广场北侧', hours: '8:00 - 20:00', note: '生鲜冷链优先放这里' },
];

export const TAKEOUT_RULES: Array<{ label: string; value: string }> = [
  { label: '免费保管', value: '到件后 2 小时内' },
  { label: '超时保管', value: '1 元/小时，单件上限 5 元' },
  { label: '生鲜冷链', value: '必须 1 小时内取走，超时社区不担责' },
  { label: '上门送件', value: '60 岁以上 / 行动不便免费' },
  { label: '丢失处理', value: '请凭订单号向驿站查监控，社区协助协调' },
];

/* ------------------------------ 流浪动物 ------------------------------ */

export const STRAY_RULES: Array<{ title: string; text: string }> = [
  { title: '可以投喂，但请定点定时', text: '投喂点为 3 处（见下方），每日 8:00 与 18:00 各一次，喂完请清理餐盒。' },
  { title: '不驱赶、不伤害', text: '社区已联系救助站做绝育与领养；虐待动物可向物业与派出所反映。' },
  { title: '不要接触陌生动物', text: '被抓咬立即用肥皂水冲洗 15 分钟，并到社区卫生服务站就诊。' },
  { title: '自家宠物请牵绳清便', text: '遛狗必牵绳、必清理；电梯内请抱起或戴嘴套。' },
];

export const STRAY_SPOTS: Array<{ name: string; addr: string; note: string }> = [
  { name: '1 号楼西侧绿化带', addr: '1 号楼西侧灌木旁', note: '现有 3 只常住猫' },
  { name: '中心广场东南角', addr: '健身器材区旁', note: '遮雨棚下，雨天也能喂' },
  { name: '6 号楼后车棚', addr: '非机动车棚内侧', note: '冬季避风点' },
];

/* ------------------------------ 房屋租售 ------------------------------ */

export interface LeaseItem {
  id: string;
  title: string;
  /** 出租 / 出售 */
  deal: 'rent' | 'sale';
  dealText: string;
  layout: string;
  area: string;
  floor: string;
  price: string;
  owner: string;
  /** 是否已由社区核验过业主身份 */
  verified: boolean;
  meta: string;
}

export const LEASE_ITEMS: LeaseItem[] = [
  {
    id: 'l1',
    title: '3 号楼 2 单元 502 两居',
    deal: 'rent',
    dealText: '出租',
    layout: '2 室 1 厅',
    area: '78㎡',
    floor: '5/11 层',
    price: '2600 元/月',
    owner: '业主自发布',
    verified: true,
    meta: '南北通透 · 家电齐全 · 可看房',
  },
  {
    id: 'l2',
    title: '1 号楼 1 单元 1803 一居',
    deal: 'rent',
    dealText: '出租',
    layout: '1 室 1 厅',
    area: '52㎡',
    floor: '18/26 层',
    price: '1900 元/月',
    owner: '业主自发布',
    verified: true,
    meta: '精装修 · 地铁 800 米 · 押一付三',
  },
  {
    id: 'l3',
    title: '6 号楼 3 单元 201 三居',
    deal: 'sale',
    dealText: '出售',
    layout: '3 室 2 厅',
    area: '118㎡',
    floor: '2/18 层',
    price: '186 万',
    owner: '业主自发布',
    verified: true,
    meta: '满五唯一 · 带车位 · 随时看',
  },
  {
    id: 'l4',
    title: '2 号楼 2 单元 906 两居',
    deal: 'sale',
    dealText: '出售',
    layout: '2 室 1 厅',
    area: '86㎡',
    floor: '9/18 层',
    price: '142 万',
    owner: '业主自发布',
    verified: false,
    meta: '业主刚提交，身份核验中',
  },
];

export function findLease(id: string): LeaseItem | undefined {
  return LEASE_ITEMS.find((l) => l.id === id);
}

/** 外卖代收 / 流浪动物 / 房源登记的工单描述 */
export function buildTakeoutOrderDescription(input: {
  platform: string;
  code: string;
  room: string;
  contact: string;
  note?: string;
}): string {
  return [
    '服务：外卖代收登记',
    `外卖平台：${String(input.platform ?? '').trim()}`,
    `订单号 / 取件码：${String(input.code ?? '').trim()}`,
    `楼栋房号：${String(input.room ?? '').trim()}`,
    `联系电话：${String(input.contact ?? '').trim()}`,
    input.note && input.note.trim() ? `备注：${input.note.trim()}` : '',
    '说明：生鲜冷链请 1 小时内取走；超时保管费现场结算。',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

export function buildStrayOrderDescription(input: {
  kind: string;
  spot: string;
  contact: string;
  note?: string;
}): string {
  return [
    `服务：流浪动物${input.kind}`,
    `位置：${String(input.spot ?? '').trim()}`,
    `联系电话：${String(input.contact ?? '').trim()}`,
    input.note && input.note.trim() ? `情况说明：${input.note.trim()}` : '',
    '说明：社区只做信息登记与协调，抓咬伤请立即就医。',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

export function buildLeaseOrderDescription(input: {
  deal: 'rent' | 'sale';
  title: string;
  layout: string;
  area: string;
  price: string;
  contact: string;
  note?: string;
}): string {
  return [
    `服务：房源${input.deal === 'rent' ? '出租' : '出售'}登记（业主自发布）`,
    `房源：${String(input.title ?? '').trim()}`,
    `户型：${input.layout} · ${input.area}`,
    `价格：${String(input.price ?? '').trim()}`,
    `联系电话：${String(input.contact ?? '').trim()}`,
    input.note && input.note.trim() ? `补充说明：${input.note.trim()}` : '',
    '说明：社区不收中介费、不做资金托管；看房与签约由双方线下自行完成，请注意核验房产证与身份证。',
  ]
    .filter((line) => line !== '')
    .join('\n');
}
