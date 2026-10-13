/**
 * CR-017-c 演示模式标识 · 显隐判定单测
 *
 * 口径：显示条件 = `USE_MOCK === true && DEMO_MODE === false`。
 * 即"数据来自本地 mock、且当前不是正式演示"时才提示；演示当天置 `DEMO_MODE=true` 即隐藏。
 *
 * CR-015-b 口径：**每条负向断言都必须配正向对照**——只断言"不显示"是不够的，
 * 因为一个恒返回 false 的实现也能通过所有负向用例。所以下面每条负向都用正向用例夹住，
 * 证明判定是真的在区分，而不是一律关掉。
 *
 * ⚠ 通道声明（契约附 C）：本文件跑在 **mock 通道**，只证明「判定逻辑对」，
 * 不构成契约验收证据。
 */
import { describe, expect, it } from 'vitest';
import { ENV, shouldShowMockBanner } from '../miniprogram/config/env';

describe('shouldShowMockBanner · 真值表（正向 + 负向对照）', () => {
  it('正向：mock 开 + 非演示 → 显示', () => {
    expect(shouldShowMockBanner(true, false)).toBe(true);
  });

  it('负向：mock 开 + 演示模式 → 不显示（演示当天不自曝）', () => {
    expect(shouldShowMockBanner(true, true)).toBe(false);
  });

  it('负向对照：同上开关组合只差 DEMO_MODE，结果必须相反（证明判定真的在区分）', () => {
    expect(shouldShowMockBanner(true, false)).not.toBe(shouldShowMockBanner(true, true));
  });

  it('负向：mock 关 + 非演示 → 不显示（真机通道不该出现标识）', () => {
    expect(shouldShowMockBanner(false, false)).toBe(false);
  });

  it('负向：mock 关 + 演示模式 → 不显示', () => {
    expect(shouldShowMockBanner(false, true)).toBe(false);
  });

  it('负向对照：DEMO_MODE 固定为 false 时，只差 USE_MOCK，结果必须相反', () => {
    expect(shouldShowMockBanner(true, false)).not.toBe(shouldShowMockBanner(false, false));
  });

  it('四种组合全覆盖，有且仅有「mock 开 + 非演示」一种显示', () => {
    const table = [
      { useMock: true, demoMode: false, expected: true },
      { useMock: true, demoMode: true, expected: false },
      { useMock: false, demoMode: false, expected: false },
      { useMock: false, demoMode: true, expected: false },
    ];
    for (const row of table) {
      expect(shouldShowMockBanner(row.useMock, row.demoMode), JSON.stringify(row)).toBe(row.expected);
    }
    expect(table.filter((r) => r.expected).length).toBe(1);
  });
});

describe('ENV 默认态护栏（防止有人顺手改开关）', () => {
  it('USE_MOCK 必须为 true（lead 明令：本轮不得改这个值）', () => {
    expect(ENV.USE_MOCK).toBe(true);
  });

  it('DEMO_MODE 默认必须为 false（默认显示标识，演示当天才置 true）', () => {
    expect(ENV.DEMO_MODE).toBe(false);
  });

  it('默认组合下标识应当显示（与真值表一致，防止两个开关被同时改坏）', () => {
    expect(shouldShowMockBanner(ENV.USE_MOCK, ENV.DEMO_MODE)).toBe(true);
  });
});
