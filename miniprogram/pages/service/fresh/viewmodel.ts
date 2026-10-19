/**
 * 生鲜零售 · 视图模型（CR-027）
 *
 * 4 个子频道：当日鲜菜 / 临期特惠 / 邻里拼单 / 次日自提。
 * 数据本地配置；下单与拼单都走既有 `workorder:create`，不新增云函数、不改契约。
 *
 * ⚠ 红线：本页**不收款、不代扣**。下单只是「预订登记」，
 *   结算在驿站自提时现场完成；金额一律标注为「参考价 / 到店结算」。
 */

export type FreshTab = 'daily' | 'clear' | 'group' | 'pickup';

export const FRESH_TABS: Array<{ key: FreshTab; name: string; note: string }> = [
  { key: 'daily', name: '当日鲜菜', note: '每日 6:00 到货，15:00 前下单当天取' },
  { key: 'clear', name: '临期特惠', note: '临期 1-2 天，低价清仓不浪费' },
  { key: 'group', name: '邻里拼单', note: '满 20 单成团，成团后统一配送' },
  { key: 'pickup', name: '次日自提', note: '当晚下单，次日到驿站自提' },
];

export interface FreshItem {
  id: string;
  name: string;
  /** 规格 */
  spec: string;
  /** 参考价（元） */
  price: number;
  /** 有原价时为特惠品 */
  origin?: number;
  /** 库存或剩余份数 */
  stock: number;
  /** 副信息：到货时间 / 保质期 / 成团进度 / 自提点 */
  meta: string;
  soldOut?: boolean;
}

/** 当日鲜菜 */
export const FRESH_DAILY: FreshItem[] = [
  { id: 'fd1', name: '本地小油菜', spec: '500g / 把', price: 3.5, stock: 40, meta: '6:00 到货 · 当日现采' },
  { id: 'fd2', name: '西红柿', spec: '500g', price: 4.8, stock: 35, meta: '6:00 到货 · 沙瓤' },
  { id: 'fd3', name: '黄瓜', spec: '500g', price: 3.2, stock: 30, meta: '6:00 到货 · 带刺鲜' },
  { id: 'fd4', name: '土豆', spec: '1kg', price: 4.5, stock: 25, meta: '6:00 到货 · 黄心' },
  { id: 'fd5', name: '土鸡蛋', spec: '15 枚 / 盒', price: 18.0, stock: 20, meta: '6:30 到货 · 限量 20 盒' },
  { id: 'fd6', name: '冷鲜猪里脊', spec: '500g', price: 22.0, stock: 12, meta: '7:00 到货 · 冷链直送' },
];

/** 临期特惠（origin 为原价） */
export const FRESH_CLEAR: FreshItem[] = [
  { id: 'fc1', name: '香蕉', spec: '1kg', price: 4.9, origin: 9.9, stock: 8, meta: '保质期剩 1 天 · 每人限 2 份' },
  { id: 'fc2', name: '鲜牛奶', spec: '950ml', price: 8.0, origin: 15.8, stock: 6, meta: '保质期剩 1 天 · 冷链' },
  { id: 'fc3', name: '全麦吐司', spec: '400g', price: 5.0, origin: 12.0, stock: 10, meta: '保质期剩 1 天' },
  { id: 'fc4', name: '盒装草莓', spec: '250g', price: 9.9, origin: 25.0, stock: 3, meta: '保质期剩 1 天 · 手慢无' },
];

/** 邻里拼单（stock 表示还差几单成团） */
export const FRESH_GROUP: FreshItem[] = [
  { id: 'fg1', name: '山东苹果', spec: '5 斤 / 箱', price: 19.9, stock: 6, meta: '已 14 / 20 单 · 还差 6 单成团' },
  { id: 'fg2', name: '赣南脐橙', spec: '5 斤 / 箱', price: 22.0, stock: 11, meta: '已 9 / 20 单 · 还差 11 单成团' },
  { id: 'fg3', name: '东北大米', spec: '10 斤 / 袋', price: 39.0, stock: 3, meta: '已 17 / 20 单 · 快成团了' },
  { id: 'fg4', name: '土鸡蛋', spec: '30 枚 / 箱', price: 32.0, stock: 15, meta: '已 5 / 20 单 · 刚发起' },
];

/** 次日自提 */
export const FRESH_PICKUP: FreshItem[] = [
  { id: 'fp1', name: '现磨豆腐', spec: '400g', price: 3.0, stock: 30, meta: '自提点：1 号楼驿站 · 次日 7:00 后' },
  { id: 'fp2', name: '手工水饺', spec: '500g / 袋', price: 16.0, stock: 20, meta: '自提点：1 号楼驿站 · 次日 7:00 后' },
  { id: 'fp3', name: '鲜面条', spec: '500g', price: 4.0, stock: 25, meta: '自提点：3 号楼门岗 · 次日 8:00 后' },
  { id: 'fp4', name: '卤味拼盘', spec: '300g', price: 26.0, stock: 10, meta: '自提点：中心广场服务亭 · 次日 16:00 后' },
];

export function itemsOf(tab: FreshTab): FreshItem[] {
  switch (tab) {
    case 'clear':
      return FRESH_CLEAR;
    case 'group':
      return FRESH_GROUP;
    case 'pickup':
      return FRESH_PICKUP;
    default:
      return FRESH_DAILY;
  }
}

export function findFreshItem(tab: FreshTab, id: string): FreshItem | undefined {
  return itemsOf(tab).find((i) => i.id === id);
}

/** 折扣标签：特惠品算出几折，非特惠返回空（wxml 不展示） */
export function discountText(item: FreshItem): string {
  if (!item.origin || item.origin <= 0 || item.origin <= item.price) return '';
  const d = (item.price / item.origin) * 10;
  return d >= 9.95 ? '' : `${d.toFixed(1)} 折`;
}

/** 拼单进度百分比（0-100） */
export function groupPercent(item: FreshItem): number {
  const m = item.meta.match(/已\s*(\d+)\s*\/\s*(\d+)/);
  if (!m) return 0;
  const done = Number(m[1]);
  const total = Number(m[2]);
  if (!total) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}

/** 预订/下单工单描述（走 workorder:create） */
export function buildFreshOrderDescription(input: {
  tabName: string;
  name: string;
  spec: string;
  price: number;
  count: number;
  room: string;
  contact: string;
  note?: string;
}): string {
  return [
    `服务：生鲜${input.tabName}登记`,
    `商品：${input.name}（${input.spec}）`,
    `参考价：¥${input.price} × ${input.count}`,
    `楼栋房号：${String(input.room ?? '').trim()}`,
    `联系电话：${String(input.contact ?? '').trim()}`,
    input.note && input.note.trim() ? `备注：${input.note.trim()}` : '',
    '说明：本页不收款，到驿站自提时现场结算；参考价随行就市，以当日标价为准。',
  ]
    .filter((line) => line !== '')
    .join('\n');
}
