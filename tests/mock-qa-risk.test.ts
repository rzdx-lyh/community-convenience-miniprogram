/**
 * CR-012 安全话术 · mock 通道单测
 *
 * 【为什么测这个】
 * USE_MOCK = true 时 `qa:ask` 的完整调用链是：
 *   pages/assistant/index.ts send()
 *     → services/qa.ts askQuestion()
 *       → utils/request.ts call('qa:ask', …)（ENV.USE_MOCK === true 分支）
 *         → mock/index.ts mockDispatch()
 *           → mock/data.ts mockHandlers['qa:ask']（本文件主要被测对象）
 *             → mock/risk-rules.ts tryBuildRiskAnswer()（CR-012 短路）
 * 这条链**根本不打云函数**，所以后端 cloudfunctions/qa/index.js 的安全话术在演示现场出不来。
 * 本文件把 mock 通道的拦截行为钉死，确保答辩现场 USE_MOCK=true 也能演示出安全话术。
 *
 * ⚠ 前端 tools/mock-server/ 只有 .gitkeep（npm run mock 是空脚本），不在运行链上；
 *    后端 scripts/mock-server.mjs 属后端目录树，前端不得改动。
 *
 * 关键词表与话术必须与后端 RISK_RULES 逐字对齐（判定顺序：紧急 → 涉医 → 涉法）。
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { RiskRule } from '../miniprogram/mock/risk-rules';

type RiskRulesModule = typeof import('../miniprogram/mock/risk-rules');
type MockDataModule = typeof import('../miniprogram/mock/data');
type RequestModule = typeof import('../miniprogram/utils/request');

let rules: RiskRulesModule;
let mockData: MockDataModule;
/** 与后端 detectRisk 一致的期望表：[提问, 期望等级] */
const CASES: Array<[string, 'medical' | 'legal' | 'emergency']> = [
  ['胸痛怎么办', 'medical'],
  ['骨折了要紧吗', 'medical'],
  ['劳动仲裁怎么申请', 'legal'],
  ['离婚需要什么材料', 'legal'],
  ['着火了怎么办', 'emergency'],
  ['电梯困人了', 'emergency'],
];

beforeAll(async () => {
  const g = globalThis as unknown as Record<string, unknown>;
  g.wx = {
    showToast: () => undefined,
    showLoading: () => undefined,
    hideLoading: () => undefined,
    getStorageSync: () => '',
    setStorageSync: () => undefined,
    cloud: { init: () => undefined, callFunction: () => undefined },
  };
  rules = await import('../miniprogram/mock/risk-rules');
  mockData = await import('../miniprogram/mock/data');
  // mock 通道默认 300ms 模拟延迟，单测里置 0 保持快速
  const { ENV } = await import('../miniprogram/config/env');
  ENV.MOCK_DELAY = 0;
});

/** 取 mock 通道 qa:ask 的出参（走真实 handler，不是复制一份逻辑） */
async function ask(question: string): Promise<QaAskResult> {
  return (await mockData.mockHandlers['qa:ask']({ question })) as QaAskResult;
}

describe('detectRisk · 关键词命中（与后端 RISK_RULES 同表）', () => {
  it('三类各 2 个代表关键词都能命中正确等级', () => {
    for (const [question, level] of CASES) {
      expect(rules.detectRisk(question)?.level, question).toBe(level);
      expect(rules.riskLevelOf(question), question).toBe(level);
    }
  });

  it('判定顺序：紧急 → 涉医 → 涉法（同时命中多类时取最需立即行动的一类）', () => {
    // 「着火」(紧急) + 「骨折」(涉医) 同句 → emergency 胜出
    expect(rules.detectRisk('着火了有人骨折')?.level).toBe('emergency');
    // 「胸痛」(涉医) + 「起诉」(涉法) 同句 → medical 胜出
    expect(rules.detectRisk('胸痛想起诉物业')?.level).toBe('medical');
    expect(rules.RISK_RULES.map((r: RiskRule) => r.level)).toEqual(['emergency', 'medical', 'legal']);
  });

  it('未命中返回 null / none（普通问题不能被误伤）', () => {
    expect(rules.detectRisk('物业费怎么交？')).toBeNull();
    expect(rules.detectRisk('停水通知在哪里看')).toBeNull();
    expect(rules.riskLevelOf('老年卡怎么办理')).toBe('none');
  });

  it('空值 / 非字符串入参不抛错', () => {
    expect(rules.detectRisk(undefined)).toBeNull();
    expect(rules.detectRisk(null)).toBeNull();
    expect(rules.detectRisk('')).toBeNull();
    expect(rules.detectRisk(123 as unknown as string)).toBeNull();
  });

  it('正则不带 g 标志：同一条规则重复 test 结果稳定（避免 lastIndex 状态污染）', () => {
    for (const rule of rules.RISK_RULES) {
      expect(rule.re.global, rule.level).toBe(false);
    }
    expect(rules.detectRisk('胸痛')?.level).toBe('medical');
    expect(rules.detectRisk('胸痛')?.level).toBe('medical');
  });
});

describe('话术内容 · 必须与后端逐字对齐', () => {
  it('emergency：给出 119 / 110 / 120 与物业值班电话', () => {
    const rule = rules.RISK_RULES.find((r: RiskRule) => r.level === 'emergency');
    expect(rule?.text).toContain('119');
    expect(rule?.text).toContain('110');
    expect(rule?.text).toContain('120');
    expect(rule?.text).toContain('020-88888888');
  });

  it('medical：明确「请尽快就医或拨打 120」', () => {
    const rule = rules.RISK_RULES.find((r: RiskRule) => r.level === 'medical');
    expect(rule?.text).toContain('请尽快就医或拨打 120');
    expect(rule?.text).toContain('不要自行前往');
  });

  it('legal：引导法律援助（居委会 020-88886666）与公共法律服务热线 12348', () => {
    const rule = rules.RISK_RULES.find((r: RiskRule) => r.level === 'legal');
    expect(rule?.text).toContain('12348');
    expect(rule?.text).toContain('020-88886666');
    expect(rule?.text).toContain('免费法律援助');
  });
});

describe('mockHandlers[qa:ask] · CR-012 短路出参', () => {
  it('涉医：_riskLevel=medical、degraded=true、sources 为空', async () => {
    for (const q of ['胸痛怎么办', '骨折了要紧吗']) {
      const res = await ask(q);
      expect(res._riskLevel, q).toBe('medical');
      expect(res.degraded, q).toBe(true);
      expect(res.sources, q).toEqual([]);
      expect(res.answer, q).toContain('请尽快就医或拨打 120');
    }
  });

  it('涉法：_riskLevel=legal、degraded=true、话术含 12348', async () => {
    for (const q of ['劳动仲裁怎么申请', '离婚需要什么材料']) {
      const res = await ask(q);
      expect(res._riskLevel, q).toBe('legal');
      expect(res.degraded, q).toBe(true);
      expect(res.answer, q).toContain('12348');
    }
  });

  it('紧急：_riskLevel=emergency、degraded=true、话术含 119/110/120', async () => {
    for (const q of ['着火了怎么办', '电梯困人了']) {
      const res = await ask(q);
      expect(res._riskLevel, q).toBe('emergency');
      expect(res.degraded, q).toBe(true);
      expect(res.answer, q).toContain('119');
      expect(res.answer, q).toContain('110');
      expect(res.answer, q).toContain('120');
    }
  });

  it('普通问题：走原 mock 路径，degraded=false、_riskLevel=none', async () => {
    const res = await ask('物业费怎么交？');
    expect(res._riskLevel).toBe('none');
    expect(res.degraded).toBe(false);
    expect(res.answer).toContain('（mock 回答）');
    expect(res.sources.length).toBeGreaterThan(0);
  });

  it('命中时不再追加「AI 生成仅供参考」（与后端一致：话术本身就是结论性动作）', async () => {
    const res = await ask('胸痛怎么办');
    expect(res.answer).not.toContain('AI 生成仅供参考');
  });

  it('命中时 sessionId 透传；未传时自行新建', async () => {
    const withSession = (await mockData.mockHandlers['qa:ask']({
      question: '着火了怎么办',
      sessionId: 's_fixed_001',
    })) as QaAskResult;
    expect(withSession.sessionId).toBe('s_fixed_001');

    const noSession = await ask('着火了怎么办');
    expect(noSession.sessionId).toBeTruthy();
    expect(noSession.answerId).toContain('qa_emergency');
  });
});

describe('全链路 · utils/request.ts call("qa:ask") 在 USE_MOCK 下也命中安全话术', () => {
  it('走 call() 与直接调 handler 结果一致（证明演示现场真的能出话术）', async () => {
    const { ENV } = await import('../miniprogram/config/env');
    expect(ENV.USE_MOCK).toBe(true); // 前置条件：当前仍是 mock 通道
    const request: RequestModule = await import('../miniprogram/utils/request');
    const res = await request.call<QaAskResult>('qa:ask', { question: '胸痛怎么办' });
    expect(res._riskLevel).toBe('medical');
    expect(res.degraded).toBe(true);
    expect(res.answer).toContain('请尽快就医或拨打 120');
  });
});

/**
 * ⚠ 已知缺口（对齐快照，不是期望行为）
 * 后端 RISK_RULES 的 legal 正则目前不含「工伤」，因此「工伤怎么赔偿」会走普通回答路径。
 * 已上报 be-engineer 评估是否补词。**后端补词后本用例会失败，届时同步更新本文件与 risk-rules.ts**。
 */
describe('已知缺口快照 · 后端补词后需要同步', () => {
  it('「工伤」当前未纳入 legal（后端现状快照）', () => {
    expect(rules.detectRisk('工伤怎么赔偿')).toBeNull();
  });
});
