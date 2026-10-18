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

describe('ENV 默认态护栏（开关与标识逻辑必须一致）', () => {
  /**
   * 通道是**阶段性决策**，不是常量：
   *   CR-020 期 → 全程 mock（USE_MOCK=true）
   *   上云后按 CR-017-a → 必须 false
   * 所以这里不再断言"必须等于某个值"（那会在每次切通道时误报），
   * 改为断言"开关取值与标识显隐严格对应"——
   * 既能挡住"改了开关忘了改标识逻辑"，也不会妨碍正常切换。
   */
  it('DEMO_MODE 默认必须为 false（标识只在开发期显示）', () => {
    expect(ENV.DEMO_MODE).toBe(false);
  });

  it('标识显隐与当前开关严格对应（只差 USE_MOCK，结果相反）', () => {
    expect(shouldShowMockBanner(ENV.USE_MOCK, ENV.DEMO_MODE)).toBe(ENV.USE_MOCK === true);
  });

  it('通道开关必须是明确布尔值（不允许 undefined / 字符串）', () => {
    expect(typeof ENV.USE_MOCK).toBe('boolean');
  });
});
