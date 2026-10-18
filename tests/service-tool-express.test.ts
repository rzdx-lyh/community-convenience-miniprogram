/**
 * CR-026 · 共享设备 / 快递代取 视图模型单测
 *
 * 守住两条红线：
 *   ① 共享设备只做登记，不收押金、不做支付；
 *   ② 快递页不代收货款，且不得展示他人取件码（取件码只在用户自填后进入工单）。
 */
import { describe, expect, it } from 'vitest';
import {
  SIZE_KEYS,
  SIZE_META,
  buildExpressOrderDescription,
  formatTime,
  kindText,
  makeExpressId,
} from '../miniprogram/pages/service/express/viewmodel';
import {
  TOOL_KINDS,
  TOOL_META,
  TOOL_SPOTS,
  borrowDurationMs,
  buildBorrowOrderDescription,
  findTool,
  makeBorrowId,
  stockPercent,
} from '../miniprogram/pages/service/tool/viewmodel';

describe('共享设备 · 设备库', () => {
  it('6 类设备，key 与 TOOL_KINDS 一致', () => {
    expect(TOOL_META).toHaveLength(6);
    expect(TOOL_META.map((t) => t.key)).toEqual(TOOL_KINDS);
  });

  it('每台设备都有免费时长/超时/期限/提示，不留空文案', () => {
    TOOL_META.forEach((t) => {
      expect(t.free.length, `${t.name} 缺免费时长`).toBeGreaterThan(3);
      expect(t.over.length, `${t.name} 缺超时规则`).toBeGreaterThan(3);
      expect(t.limit.length, `${t.name} 缺借用期限`).toBeGreaterThan(3);
      expect(t.note.length, `${t.name} 缺借用提示`).toBeGreaterThan(3);
      expect(t.desc.length, `${t.name} 缺说明`).toBeGreaterThan(3);
    });
  });

  it('余量不超过总数，且不为负', () => {
    TOOL_META.forEach((t) => {
      expect(t.stock).toBeGreaterThanOrEqual(0);
      expect(t.stock).toBeLessThanOrEqual(t.total);
      expect(t.total).toBeGreaterThan(0);
    });
  });

  it('进度条百分比在 0-100 之间', () => {
    TOOL_META.forEach((t) => {
      const p = stockPercent(t);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(100);
    });
    expect(stockPercent({ ...TOOL_META[0], total: 0 })).toBe(0);
  });

  it('findTool 命中已知 key，未知返回 undefined', () => {
    expect(findTool('umbrella')?.name).toBe('共享雨伞');
    expect(findTool('not-exist')).toBeUndefined();
  });

  it('借用期限换算为正毫秒（雨伞 7 天 / 充电宝 3 天）', () => {
    expect(borrowDurationMs('umbrella')).toBe(7 * 24 * 3600 * 1000);
    expect(borrowDurationMs('power')).toBe(3 * 24 * 3600 * 1000);
    TOOL_KINDS.forEach((k) => expect(borrowDurationMs(k)).toBeGreaterThan(0));
  });

  it('点位至少 3 个，且都有地址与时间', () => {
    expect(TOOL_SPOTS.length).toBeGreaterThanOrEqual(3);
    TOOL_SPOTS.forEach((s) => {
      expect(s.addr.length).toBeGreaterThan(3);
      expect(s.hours.length).toBeGreaterThan(2);
      expect(s.tools.length).toBeGreaterThan(2);
    });
  });

  it('借用台账 id 不重复', () => {
    const ids = new Set(Array.from({ length: 300 }, () => makeBorrowId()));
    expect(ids.size).toBe(300);
  });

  it('借用工单描述含设备/点位/房号/电话，且无押金支付字样', () => {
    const text = buildBorrowOrderDescription({
      name: '共享雨伞',
      spot: '1 号楼驿站',
      room: '3-2-502',
      contact: '13800138000',
    });
    expect(text).toContain('共享雨伞');
    expect(text).toContain('1 号楼驿站');
    expect(text).toContain('3-2-502');
    expect(text).not.toMatch(/押金|支付|收款|付款/);
  });

  it('时间文本补零格式正确', () => {
    expect(formatTime(new Date(2026, 9, 8, 9, 5).getTime())).toBe('2026-10-08 09:05');
  });
});

describe('快递代取 · 件型与点位', () => {
  it('三种件型，费用与说明齐全', () => {
    expect(SIZE_KEYS).toEqual(['small', 'big', 'cold']);
    SIZE_KEYS.forEach((k) => {
      expect(SIZE_META[k].name.length).toBeGreaterThan(0);
      expect(SIZE_META[k].fee).toMatch(/\d+\s*元/);
      expect(SIZE_META[k].desc.length).toBeGreaterThan(3);
    });
  });

  it('冷链比小件贵（定价单调，不会出现冷链更便宜）', () => {
    const fee = (k: 'small' | 'big' | 'cold'): number => Number(SIZE_META[k].fee.match(/(\d+)/)![1]);
    expect(fee('small')).toBeLessThan(fee('big'));
    expect(fee('big')).toBeLessThan(fee('cold'));
  });

  it('kindText 区分代取与代寄', () => {
    expect(kindText('pickup')).toBe('帮我代取');
    expect(kindText('send')).toBe('帮我代寄');
  });

  it('申请 id 不重复', () => {
    const ids = new Set(Array.from({ length: 300 }, () => makeExpressId()));
    expect(ids.size).toBe(300);
  });

  it('工单描述区分代取代寄，且不出现代收货款', () => {
    const pickup = buildExpressOrderDescription({
      kind: 'pickup',
      company: '顺丰速运',
      code: '8-3-1024',
      size: 'small',
      room: '3-2-502',
      contact: '13800138000',
    });
    expect(pickup).toContain('帮我代取');
    expect(pickup).toContain('8-3-1024');
    expect(pickup).not.toMatch(/货款|代收款|在线支付/);

    const send = buildExpressOrderDescription({
      kind: 'send',
      company: '京东物流',
      code: 'JD001',
      size: 'big',
      room: '3-2-502',
      contact: '13800138000',
    });
    expect(send).toContain('帮我代寄');
    expect(send).toContain('大件');
  });
});
