/**
 * 房屋租售 · 视图模型（CR-028 · 备案风险项）
 *
 * ⚠ 红线：社区只做**信息展示与联系**，不撮合、不收佣金、不代收租金与押金。
 *   发布 / 求租都只是登记（workorder:create），核验由社区线下完成。
 */

export type LeaseDeal = 'rent' | 'sell';
export type LeaseFilter = 'all' | LeaseDeal;

export interface LeaseFilterItem {
  key: LeaseFilter;
  name: string;
}

export const LEASE_FILTERS: LeaseFilterItem[] = [
  { key: 'all', name: '全部' },
  { key: 'rent', name: '出租' },
  { key: 'sell', name: '出售' },
];

export interface HouseItem {
  id: string;
  title: string;
  /** 面积 · 朝向 · 楼层 · 核验状态 */
  desc: string;
  deal: LeaseDeal;
  dealText: string;
  price: number;
  /** 展示用单位：元/月 或 万 */
  unit: string;
  priceText: string;
  unitText: string;
  /** 首屏两段摘要（原型 hph 底部那行） */
  brief: string;
  tags: string[];
  /** 详情补充（不含任何资金代收表述） */
  detail: string;
  emoji: string;
}

export const HOUSES: HouseItem[] = [
  {
    id: 'h1',
    title: '3 号楼 2 室 1 厅',
    desc: '68㎡ · 朝南 · 15 楼 · 已核验',
    deal: 'rent',
    dealText: '出租',
    price: 2600,
    unit: '元/月',
    priceText: '¥2600',
    unitText: '/月',
    brief: '68㎡ · 朝南',
    tags: ['已核验', '业主直挂', '可看房'],
    detail: '南向采光，家电齐全，拎包入住；工作日 18:00 后可看房。',
    emoji: '🏢',
  },
  {
    id: 'h2',
    title: '7 号楼 1 室 1 厅',
    desc: '42㎡ · 精装 · 6 楼 · 已核验',
    deal: 'rent',
    dealText: '出租',
    price: 1800,
    unit: '元/月',
    priceText: '¥1800',
    unitText: '/月',
    brief: '42㎡ · 精装',
    tags: ['已核验', '业主直挂', '可看房'],
    detail: '独立厨卫，近 7 号楼门岗；适合一人或小两口居住。',
    emoji: '🏠',
  },
  {
    id: 'h3',
    title: '1 号楼 3 室 2 厅',
    desc: '102㎡ · 南北通透 · 业主自挂',
    deal: 'rent',
    dealText: '出租',
    price: 3500,
    unit: '元/月',
    priceText: '¥3500',
    unitText: '/月',
    brief: '102㎡ · 南北通透',
    tags: ['业主直挂', '可看房'],
    detail: '三房朝南，带独立阳台；业主自挂，看房请提前一天联系。',
    emoji: '🏘',
  },
  {
    id: 'h4',
    title: '5 号楼 2 室 2 厅 · 出售',
    desc: '89㎡ · 满五唯一 · 已核验',
    deal: 'sell',
    dealText: '出售',
    price: 218,
    unit: '万',
    priceText: '¥218',
    unitText: ' 万',
    brief: '89㎡ · 满五唯一',
    tags: ['已核验', '业主直挂', '可看房'],
    detail: '满五唯一，产权清晰；交易与过户由双方线下自行办理。',
    emoji: '🏦',
  },
];

export function filterHouses(deal: LeaseFilter): HouseItem[] {
  if (deal === 'all') return HOUSES;
  return HOUSES.filter((h) => h.deal === deal);
}

export function findHouse(id: string): HouseItem | undefined {
  return HOUSES.find((h) => h.id === id);
}

/** 房源发布登记文案（只登记，不做撮合） */
export function buildLeasePublishDescription(input: {
  deal: LeaseDeal;
  title: string;
  layout: string;
  area: string;
  price: string;
  contact: string;
  note?: string;
}): string {
  const lines = [
    `服务：房源${input.deal === 'rent' ? '出租' : '出售'}登记`,
    `房源：${input.title.trim()}`,
    `户型：${input.layout.trim() || '未填'}`,
    `面积：${input.area.trim() || '未填'}`,
    `挂牌价：${input.price.trim()}`,
    `联系电话：${input.contact.trim()}`,
  ];
  if (input.note && input.note.trim()) lines.push(`备注：${input.note.trim()}`);
  lines.push('说明：社区只做信息登记与核验，不撮合交易、不收中介费、不代收租金与押金。');
  return lines.join('\n');
}

/** 求租登记文案 */
export function buildLeaseWantDescription(input: { contact: string; note: string }): string {
  const lines = [
    '服务：求租登记',
    `联系电话：${input.contact.trim()}`,
    `需求：${input.note.trim() || '未填写'}`,
    '说明：社区只做信息登记，不撮合交易、不收中介费。',
  ];
  return lines.join('\n');
}
