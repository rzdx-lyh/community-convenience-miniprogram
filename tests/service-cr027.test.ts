/**
 * CR-027 · 生鲜零售 / 健康服务 / 文化服务 / 物业延伸 视图模型单测
 *
 * 这 13 项原本是「AI 兜底」（点进去只能问一句），本轮全部做成真页面。
 * 测试守住两条红线：
 *   ① 不收款：生鲜 / 文化 / 房源的工单文案不得出现支付类措辞；
 *   ② 不诊断：健康服务只给办事口径，文案不得出现确诊类表述。
 */
import { describe, expect, it } from 'vitest';
import {
  FRESH_CLEAR,
  FRESH_DAILY,
  FRESH_GROUP,
  FRESH_PICKUP,
  FRESH_TABS,
  buildFreshOrderDescription,
  discountText,
  findFreshItem,
  groupPercent,
  itemsOf,
} from '../miniprogram/pages/service/fresh/viewmodel';
import {
  ANNUAL_INFO,
  CHRONIC_ITEMS,
  HEALTH_TABS,
  REPORT_ITEMS,
  VACCINE_ITEMS,
  buildHealthOrderDescription,
  findHealthItem,
  itemsOf as healthItemsOf,
} from '../miniprogram/pages/service/health/viewmodel';
import {
  BOOKS,
  BOOK_CATS,
  CLASSES,
  LIBRARY_RULES,
  buildCultureOrderDescription,
  filterBooks,
  findBook,
  seatPercent,
} from '../miniprogram/pages/service/culture/viewmodel';
import {
  LEASE_ITEMS,
  PROPERTY_TABS,
  STRAY_RULES,
  STRAY_SPOTS,
  TAKEOUT_RULES,
  TAKEOUT_SPOTS,
  buildLeaseOrderDescription,
  buildStrayOrderDescription,
  buildTakeoutOrderDescription,
  findLease,
} from '../miniprogram/pages/service/property/viewmodel';

/**
 * 支付类措辞黑名单。
 * ⚠ 不含「资金托管」「中介费」——页面正是靠「不做资金托管 / 不收中介费」做免责声明，
 *   把它们算进黑名单会让「写了免责」和「真收款」被判成同一件事。
 */
const PAY_RE = /(?<![不未需])(?:支付|收款|代扣|在线付款|先付款|转账|扫码付)/;
const DIAG_RE = /确诊|你患有|诊断结果|处方为/;

describe('生鲜零售 · 四个子频道', () => {
  it('4 个 Tab，key 唯一', () => {
    expect(FRESH_TABS.map((t) => t.key)).toEqual(['daily', 'clear', 'group', 'pickup']);
    expect(new Set(FRESH_TABS.map((t) => t.key)).size).toBe(4);
  });

  it('每个子频道都有货，不留空列表', () => {
    (['daily', 'clear', 'group', 'pickup'] as const).forEach((t) => {
      expect(itemsOf(t).length, `${t} 为空`).toBeGreaterThan(0);
    });
  });

  it('商品 id 在各频道内唯一（wx:key）', () => {
    [FRESH_DAILY, FRESH_CLEAR, FRESH_GROUP, FRESH_PICKUP].forEach((list) => {
      expect(new Set(list.map((i) => i.id)).size).toBe(list.length);
    });
  });

  it('临期品才有折扣标签，正价品不显示', () => {
    expect(discountText(FRESH_CLEAR[0])).toMatch(/折$/);
    expect(discountText(FRESH_DAILY[0])).toBe('');
  });

  it('折扣价必须低于原价（标错价比不标更糟）', () => {
    FRESH_CLEAR.forEach((i) => {
      expect(i.origin).toBeDefined();
      expect(i.price).toBeLessThan(i.origin!);
    });
  });

  it('拼单进度从 meta 解析，落在 0-100', () => {
    FRESH_GROUP.forEach((i) => {
      const p = groupPercent(i);
      expect(p).toBeGreaterThan(0);
      expect(p).toBeLessThanOrEqual(100);
    });
    expect(groupPercent(FRESH_DAILY[0])).toBe(0);
  });

  it('findFreshItem 命中已知 id，未知返回 undefined', () => {
    expect(findFreshItem('daily', 'fd1')?.name).toBe('本地小油菜');
    expect(findFreshItem('daily', 'nope')).toBeUndefined();
  });

  it('预订工单含商品与房号，且不收款', () => {
    const text = buildFreshOrderDescription({
      tabName: '当日鲜菜',
      name: '本地小油菜',
      spec: '500g / 把',
      price: 3.5,
      count: 2,
      room: '3-2-502',
      contact: '13800138000',
    });
    expect(text).toContain('本地小油菜');
    expect(text).toContain('3-2-502');
    expect(text).toContain('现场结算');
    expect(text).not.toMatch(PAY_RE);
  });
});

describe('健康服务 · 四个子频道', () => {
  it('4 个 Tab 齐全', () => {
    expect(HEALTH_TABS.map((t) => t.key)).toEqual(['vaccine', 'report', 'chronic', 'annual']);
  });

  it('疫苗 / 代取 / 慢病三个频道都有事项，不留空页', () => {
    (['vaccine', 'report', 'chronic'] as const).forEach((t) => {
      expect(healthItemsOf(t).length, `${t} 为空`).toBeGreaterThan(0);
    });
  });

  it('每条事项都有适用/材料/地点/时间/提示，不留空文案', () => {
    [...VACCINE_ITEMS, ...REPORT_ITEMS, ...CHRONIC_ITEMS].forEach((i) => {
      expect(i.target.length, `${i.name} 缺适用对象`).toBeGreaterThan(3);
      expect(i.materials.length, `${i.name} 缺材料`).toBeGreaterThan(3);
      expect(i.place.length, `${i.name} 缺地点`).toBeGreaterThan(3);
      expect(i.time.length, `${i.name} 缺时间`).toBeGreaterThan(3);
      expect(i.tips.length, `${i.name} 缺提示`).toBeGreaterThan(3);
    });
  });

  it('年度体检说明 6 条，含免费对象与温馨提示', () => {
    expect(ANNUAL_INFO.length).toBe(6);
    expect(ANNUAL_INFO.map((i) => i.label)).toContain('免费对象');
    expect(ANNUAL_INFO.map((i) => i.label)).toContain('温馨提示');
  });

  it('findHealthItem 命中已知 id', () => {
    expect(findHealthItem('vaccine', 'v1')?.name).toBe('流感疫苗');
    expect(findHealthItem('vaccine', 'x')).toBeUndefined();
  });

  it('预约工单不做诊断，且声明不做诊断', () => {
    const text = buildHealthOrderDescription({
      tabName: '疫苗预约',
      name: '流感疫苗',
      room: '3-2-502',
      contact: '13800138000',
      slot: '周三上午',
    });
    expect(text).toContain('流感疫苗');
    expect(text).toContain('不做诊断');
    expect(text).not.toMatch(DIAG_RE);
  });
});

describe('文化服务 · 图书角与四点半课堂', () => {
  it('分类表第一项是「全部」，且每个分类都能筛出结果', () => {
    expect(BOOK_CATS[0]).toBe('全部');
    expect(filterBooks('全部').length).toBe(BOOKS.length);
    BOOK_CATS.slice(1).forEach((c) => {
      expect(filterBooks(c).length, `${c} 无书目`).toBeGreaterThan(0);
    });
  });

  it('在架数不超过总数', () => {
    BOOKS.forEach((b) => expect(b.stock).toBeLessThanOrEqual(b.total));
  });

  it('借阅规则 5 条，含借阅期限与逾期处理', () => {
    expect(LIBRARY_RULES.length).toBe(5);
    const labels = LIBRARY_RULES.map((r) => r.label);
    expect(labels).toContain('借阅期限');
    expect(labels).toContain('逾期处理');
  });

  it('课程余位百分比落在 0-100，满员标记正确', () => {
    CLASSES.forEach((c) => {
      const p = seatPercent(c);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(100);
    });
    expect(seatPercent({ ...CLASSES[0], seats: 0, total: 20 })).toBe(100);
  });

  it('findBook 命中已知 id', () => {
    expect(findBook('b1')?.name).toBe('猜猜我有多爱你');
    expect(findBook('zz')).toBeUndefined();
  });

  it('借阅/报名工单都不收款', () => {
    const borrow = buildCultureOrderDescription({
      kind: '借书',
      name: '活着',
      room: '3-2-502',
      contact: '13800138000',
    });
    expect(borrow).toContain('图书角借阅登记');
    expect(borrow).not.toMatch(PAY_RE);

    const join = buildCultureOrderDescription({
      kind: '报名',
      name: '硬笔书法',
      room: '3-2-502',
      contact: '13800138000',
    });
    expect(join).toContain('四点半课堂报名');
    expect(join).not.toMatch(PAY_RE);
  });
});

describe('物业延伸 · 外卖代收 / 流浪动物 / 房屋租售', () => {
  it('3 个 Tab 齐全', () => {
    expect(PROPERTY_TABS.map((t) => t.key)).toEqual(['takeout', 'stray', 'lease']);
  });

  it('存放点 / 投喂点 / 规则都有内容', () => {
    expect(TAKEOUT_SPOTS.length).toBeGreaterThanOrEqual(3);
    expect(STRAY_SPOTS.length).toBeGreaterThanOrEqual(3);
    expect(TAKEOUT_RULES.length).toBeGreaterThanOrEqual(4);
    expect(STRAY_RULES.length).toBeGreaterThanOrEqual(4);
  });

  it('公约必须写明「被抓咬要就医」这条安全底线', () => {
    const all = STRAY_RULES.map((r) => r.title + r.text).join(' ');
    expect(all).toMatch(/冲洗|就医/);
  });

  it('房源都有户型/面积/价格，且标注业主自发布', () => {
    LEASE_ITEMS.forEach((l) => {
      expect(l.layout.length).toBeGreaterThan(2);
      expect(l.area.length).toBeGreaterThan(1);
      expect(l.price.length).toBeGreaterThan(2);
      expect(l.owner).toBe('业主自发布');
    });
  });

  it('出租与出售都有房源，标签与实际成交类型一致', () => {
    const deals = LEASE_ITEMS.map((l) => l.deal);
    expect(deals).toContain('rent');
    expect(deals).toContain('sale');
    LEASE_ITEMS.forEach((l) => {
      expect(l.dealText).toBe(l.deal === 'rent' ? '出租' : '出售');
    });
  });

  it('findLease 命中已知 id', () => {
    expect(findLease('l1')?.title).toContain('3 号楼');
    expect(findLease('zz')).toBeUndefined();
  });

  it('三类工单都不做资金托管，房源单明确双方自行线下完成', () => {
    const takeout = buildTakeoutOrderDescription({
      platform: '美团',
      code: '8-3-1024',
      room: '3-2-502',
      contact: '13800138000',
    });
    expect(takeout).toContain('外卖代收登记');
    expect(takeout).not.toMatch(PAY_RE);

    const stray = buildStrayOrderDescription({
      kind: '救助',
      spot: '1 号楼西侧绿化带',
      contact: '13800138000',
    });
    expect(stray).toContain('流浪动物救助');
    expect(stray).toMatch(/就医|冲洗/);

    const lease = buildLeaseOrderDescription({
      deal: 'rent',
      title: '3 号楼 2 单元 502',
      layout: '2 室 1 厅',
      area: '78㎡',
      price: '2600 元/月',
      contact: '13800138000',
    });
    expect(lease).toContain('业主自发布');
    expect(lease).toContain('不收中介费');
    expect(lease).toMatch(/线下自行完成/);
    expect(lease).not.toMatch(PAY_RE);
  });
});
