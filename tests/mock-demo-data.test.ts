/**
 * mock 通道 · 演示完整性守卫
 *
 * 背景：本轮用户拍板**全程 mock 演示、不上云**，`miniprogram/mock/` 就是演示实际数据源，
 * 它的质量直接等于演示质量。所以这里把"每个页面在 mock 通道下都不能空"钉死。
 *
 * 三条重点（lead 指定）：
 *   1. CR-012 安全话术必须能演示（问胸痛 → 出 120）；
 *   2. 无空态：首页轮播 / 宫格 / 公告 / 圈子 / 订单 / 电话簿 / 我的 都要有数据；
 *   3. 电话簿 11 条与后端 seed 一致，紧急三条 110/119/120 **不得有任何改动**（CR-016 红线）。
 *
 * ⚠ 通道声明（契约附 C）：本文件跑在 **mock 通道**，守的是"演示数据不空、不漂移"，
 * **不构成契约验收证据**；与真机是否一致需真机冒烟兜底。
 */
import { beforeAll, describe, expect, it } from 'vitest';

type MockDataModule = typeof import('../miniprogram/mock/data');

let mockData: MockDataModule;

/** 直接调真实 mock handler（不是复制一份逻辑） */
function call(name: string, data: Record<string, unknown> = {}): unknown {
  return mockData.mockHandlers[name](data);
}

beforeAll(async () => {
  mockData = await import('../miniprogram/mock/data');
});

describe('CR-012 安全话术 · 演示必须能触发', () => {
  it('「胸痛怎么办」→ medical，answer 含 120', () => {
    const res = call('qa:ask', { question: '胸痛怎么办' }) as QaAskResult;
    expect(res._riskLevel).toBe('medical');
    expect(res.degraded).toBe(true);
    expect(res.answer).toContain('120');
  });

  it('「我爸突然胸痛出汗」→ medical，answer 含 120（lead 点名的第二个问法）', () => {
    const res = call('qa:ask', { question: '我爸突然胸痛出汗' }) as QaAskResult;
    expect(res._riskLevel).toBe('medical');
    expect(res.answer).toContain('120');
  });

  it('涉法 / 紧急两类同样能演示', () => {
    const legal = call('qa:ask', { question: '劳动仲裁怎么申请' }) as QaAskResult;
    expect(legal._riskLevel).toBe('legal');
    expect(legal.answer).toContain('12348');

    const emergency = call('qa:ask', { question: '着火了怎么办' }) as QaAskResult;
    expect(emergency._riskLevel).toBe('emergency');
    expect(emergency.answer).toContain('119');
    expect(emergency.answer).toContain('110');
    expect(emergency.answer).toContain('120');
  });

  it('快捷提问有数据（否则助手页首屏空白）', () => {
    const res = call('qa:suggest') as QaSuggestResult;
    expect((res.questions ?? []).length).toBeGreaterThan(0);
  });
});

describe('无空态 · 逐页演示数据完整性', () => {
  it('首页：紧急通知轮播非空', () => {
    const res = call('notice:urgentLatest', { limit: 5 }) as { list: Notice[] };
    expect(res.list.length).toBeGreaterThan(0);
  });

  it('首页：四类服务宫格非空且每类都有子项', () => {
    const res = call('service:list', {}) as { list: ServiceCategory[] };
    expect(res.list.length).toBeGreaterThan(0);
    for (const c of res.list) {
      expect(c.items.length, `分类 ${c.key} 无子项`).toBeGreaterThan(0);
    }
  });

  it('公告列表：全部 / 通知 / 活动 / 紧急 四个 Tab 均有数据', () => {
    const all = call('notice:list', {}) as { list: Notice[]; total: number };
    expect(all.list.length).toBeGreaterThan(0);
    for (const type of ['notice', 'activity', 'urgent']) {
      const res = call('notice:list', { type }) as { list: Notice[] };
      expect(res.list.length, `公告 Tab ${type} 为空`).toBeGreaterThan(0);
    }
  });

  it('社区圈子：全部 / 路况 / 活动 / 通知 四个 Tab 均有数据（首页「最近路况」跳路况 Tab）', () => {
    const all = call('circle:list', {}) as { list: CirclePost[] };
    expect(all.list.length).toBeGreaterThan(0);
    for (const type of ['road', 'activity', 'notice']) {
      const res = call('circle:list', { type }) as { list: CirclePost[] };
      expect(res.list.length, `圈子 Tab ${type} 为空`).toBeGreaterThan(0);
    }
  });

  it('服务订单：全部 / 待受理 / 处理中 / 已完成 四个 Tab 均有数据', () => {
    const all = call('workorder:list', {}) as { list: WorkOrder[] };
    expect(all.list.length).toBeGreaterThan(0);
    for (const status of ['pending', 'processing', 'done']) {
      const res = call('workorder:list', { status }) as { list: WorkOrder[] };
      expect(res.list.length, `订单 Tab ${status} 为空`).toBeGreaterThan(0);
    }
  });

  it('我的：用户资料非空（昵称与社区账号都要有，否则页面上半部空白）', () => {
    const res = call('auth:login', {}) as { profile: User };
    expect(res.profile.nickName).toBeTruthy();
    expect(res.profile.accountId).toBeTruthy();
  });

  it('报修详情：任意工单都能取到详情（点卡片不白屏）', () => {
    const list = (call('workorder:list', {}) as { list: WorkOrder[] }).list;
    for (const w of list) {
      const res = call('workorder:detail', { id: w._id }) as { workorder: WorkOrder };
      expect(res.workorder?._id, `工单 ${w._id} 详情缺失`).toBe(w._id);
    }
  });
});

describe('CR-016 红线 · 电话簿 11 条与紧急三号码', () => {
  it('11 条，与后端 seed 一致', () => {
    const res = call('phonebook:list', {}) as PhonebookListResult;
    expect(res.list.length).toBe(11);
  });

  it('紧急分类恰好 3 条，号码集合恒为 [110, 119, 120]（任何环境不得替换）', () => {
    const res = call('phonebook:list', { category: 'emergency' }) as PhonebookListResult;
    expect(res.list.length).toBe(3);
    expect(res.list.map((p) => p.phone).sort()).toEqual(['110', '119', '120']);
  });

  it('三条真号码本身一字不改', () => {
    const res = call('phonebook:list', {}) as PhonebookListResult;
    const phones = res.list.map((p) => p.phone);
    expect(phones).toContain('110');
    expect(phones).toContain('119');
    expect(phones).toContain('120');
  });

  it('不得再出现虚构号段 020-8765', () => {
    const res = call('phonebook:list', {}) as PhonebookListResult;
    expect(res.list.filter((p) => p.phone.indexOf('020-8765') === 0)).toEqual([]);
  });
});
