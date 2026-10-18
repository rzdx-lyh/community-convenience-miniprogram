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
 *
 * ⚠ 通道声明（契约 v1.4 附 C「验收口径」）：本文件运行在 **mock 通道**（`USE_MOCK=true`）。
 *   它只能证明「前端渲染逻辑对 + mock 表没漂移」，**不构成契约验收证据**——
 *   云函数 action 分发、错误码、降级字段、安全护栏、种子数据在 mock 通道下全都不经过。
 *   契约一致性结论必须在 `USE_MOCK=false` 的真机通道重跑取得。
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { ENV } from '../miniprogram/config/env';
import type { RiskRule } from '../miniprogram/mock/risk-rules';

type RiskRulesModule = typeof import('../miniprogram/mock/risk-rules');
type MockDataModule = typeof import('../miniprogram/mock/data');
type RequestModule = typeof import('../miniprogram/utils/request');
type AssistantModule = typeof import('../miniprogram/pages/assistant/index');

let rules: RiskRulesModule;
let mockData: MockDataModule;
let assistant: AssistantModule;
/** 与后端 detectRisk 一致的期望表：[提问, 期望等级] */
const CASES: Array<[string, 'medical' | 'legal' | 'emergency']> = [
  ['胸痛怎么办', 'medical'],
  ['骨折了要紧吗', 'medical'],
  ['劳动仲裁怎么申请', 'legal'],
  ['离婚需要什么材料', 'legal'],
  ['着火了怎么办', 'emergency'],
  ['电梯困人了', 'emergency'],
];

/**
 * ⚠ 本文件验证的是 **mock 通道**的行为，和项目当前走哪条通道无关。
 * 上云后 ENV.USE_MOCK 为 false，若不加这一行，call() 会走到 wx.cloud
 * 在 vitest 环境里没有 wx 对象 → 5 秒超时后失败（看起来像"安全话术坏了"，
 * 其实是通道用错了）。这里显式打回 mock，保证本文件永远验证它该验证的东西。
 */
ENV.USE_MOCK = true;

beforeAll(async () => {
  const g = globalThis as unknown as Record<string, unknown>;
  // 页面模块在 Node 下加载需要 Page 全局桩（末条用例要 import pages/assistant/index）
  g.Page = () => ({});
  g.Component = () => ({});
  g.App = () => ({});
  g.wx = {
    showToast: () => undefined,
    showLoading: () => undefined,
    hideLoading: () => undefined,
    showModal: () => undefined,
    setClipboardData: () => undefined,
    navigateTo: () => undefined,
    navigateBack: () => undefined,
    switchTab: () => undefined,
    getStorageSync: () => '',
    setStorageSync: () => undefined,
    removeStorageSync: () => undefined,
    getWindowInfo: () => ({ statusBarHeight: 20 }),
    cloud: { init: () => undefined, callFunction: () => undefined },
  };
  rules = await import('../miniprogram/mock/risk-rules');
  mockData = await import('../miniprogram/mock/data');
  assistant = await import('../miniprogram/pages/assistant/index');
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

  it('普通问题：未命中知识库，degraded=true，且兜底话术不得自曝 mock/演示/模拟', async () => {
    const res = await ask('物业费怎么交？');
    expect(res._riskLevel).toBe('none');
    // CR-021：未命中知识库时必须 degraded=true（但 answer 仍带完整兜底话术）
    expect(res.degraded).toBe(true);
    expect(res.answer).not.toContain('（mock 回答）');
    expect(res.answer).not.toContain('mock');
    expect(res.answer).not.toContain('模拟');
    expect(res.answer).not.toContain('演示');
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
    // 通道已在上方显式锁定为 mock（ENV.USE_MOCK = true），这里只调 MOCK_DELAY
    const request: RequestModule = await import('../miniprogram/utils/request');
    const res = await request.call<QaAskResult>('qa:ask', { question: '胸痛怎么办' });
    expect(res._riskLevel).toBe('medical');
    expect(res.degraded).toBe(true);
    expect(res.answer).toContain('请尽快就医或拨打 120');
  });
});

/**
 * 契约 v1.4 §「🛡 安全话术表（CR-012 · 唯一来源，前后端共用同一份文案）」守卫。
 * 断言按契约「必含动作 / 强制要求」列编写（而非逐字比对某一侧的实现），
 * 这样契约原文与后端实现两种措辞都能通过，但把话术改成模糊表述（如"建议就医"）会立刻红。
 */
describe('端到端 · 话术唯一来源守卫（契约 v1.4）', () => {
  it('「胸痛怎么办」走完整调用链：answer 含 120、degraded=true、sources 为空', async () => {
    const { call } = await import('../miniprogram/utils/request');
    const res = await call<QaAskResult>('qa:ask', { question: '胸痛怎么办' });
    expect(res.answer).toContain('120');
    expect(res.degraded).toBe(true);
    expect(res.sources).toEqual([]);
  });

  it('medical：必含「请尽快就医」语义 + 120（禁止"建议""可以"这类模糊表述）', async () => {
    const res = await ask('胸痛怎么办');
    expect(res.answer).toMatch(/请尽快就医/);
    expect(res.answer).toContain('120');
    expect(res.answer).not.toMatch(/建议你|您可以考虑/);
  });

  it('legal：必含 110 与法律援助渠道', async () => {
    const res = await ask('劳动仲裁怎么申请');
    expect(res.answer).toContain('110');
    expect(res.answer).toMatch(/法律援助/);
  });

  it('emergency：必含 119 / 110 / 120 与便民电话簿入口', async () => {
    const res = await ask('着火了怎么办');
    expect(res.answer).toContain('119');
    expect(res.answer).toContain('110');
    expect(res.answer).toContain('120');
    expect(res.answer).toMatch(/便民电话|电话簿/);
  });

  it('命中安全话术的气泡：正文被保留、isSafety 置位（wxml 据此隐藏 👍/👎）', async () => {
    const res = await ask('胸痛怎么办');
    const bubble = assistant.buildAiBubble(
      res.answer,
      res.sources,
      res.degraded,
      res.answerId,
      res._riskLevel,
    );
    expect(bubble.text).toBe(res.answer);
    expect(bubble.isSafety).toBe(true);
    expect(bubble.degradedTip).toBe('以上为安全提示，社区无法提供专业医疗或法律意见');
  });
});

/**
 * CR-013：后端已在 legal 词表补 `工伤 / 工伤认定 / 伤残鉴定 / 拖欠工资`
 * （后端 cloudfunctions/shared/safety.js）。前端 mock 副本已同步，这里把补的词钉死，
 * 防止后续任一侧回退导致「mock 绿、真机不一致」。
 */
describe('CR-013 补词 · legal 新增四个劳动纠纷高频词', () => {
  const WORDS = ['工伤怎么赔偿', '工伤认定怎么办', '伤残鉴定去哪做', '老板拖欠工资怎么办'];

  it('四个词全部命中 legal（detectRisk + riskLevelOf）', () => {
    for (const q of WORDS) {
      expect(rules.detectRisk(q)?.level, q).toBe('legal');
      expect(rules.riskLevelOf(q), q).toBe('legal');
    }
  });

  it('走 mock handler 也返回 legal 安全话术（含 12348 与居委会号）', async () => {
    for (const q of WORDS) {
      const res = await ask(q);
      expect(res._riskLevel, q).toBe('legal');
      expect(res.degraded, q).toBe(true);
      expect(res.sources, q).toEqual([]);
      expect(res.answer, q).toContain('12348');
      expect(res.answer, q).toContain('020-88886666');
    }
  });

  it('补词不得误伤普通问题（关键词仍要精准）', () => {
    expect(rules.detectRisk('物业费怎么交？')).toBeNull();
    expect(rules.detectRisk('停水通知在哪里看')).toBeNull();
    expect(rules.detectRisk('老年卡怎么办理')).toBeNull();
  });
});
