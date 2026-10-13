/**
 * CR-012 · 高风险输入护栏（mock 通道版）
 *
 * 【为什么要有这份副本】
 * 前端 miniprogram/config/env.ts 的 USE_MOCK = true 时，`qa:ask` 走内存 mock
 * （utils/request.ts → mock/index.ts → mock/data.ts），根本不会打到后端云函数，
 * 后端 cloudfunctions/qa/index.js 里的安全话术在答辩现场就演示不出来。
 * 因此这里**逐字复制**后端的关键词表、判定顺序与固定话术，让 mock 通道与真实通道
 * 表现一致；USE_MOCK 置 false 后本文件不再参与调用链，前端零改动。
 *
 * 【与后端对齐的三条铁律】
 * 1. 关键词表逐字复制（顺序：紧急求助 → 涉医 → 涉法，同一问题命中多类取最需立即行动的一类）。
 * 2. 命中即**短路返回固定安全话术**，不进入知识库检索、不调用大模型。
 * 3. 出参加 `_riskLevel`，`degraded` 恒为 true，`sources` 恒为空数组；
 *    命中的 answer 里已包含明确动作与电话，**不再追加「AI 生成仅供参考」**（与后端一致）。
 *
 * ⚠ 同步责任：后端 RISK_RULES 若变更，本文件必须同步（见 tests/mock-qa-risk.test.ts 的对齐护栏）。
 *
 * 同步记录：
 * - CR-012 初版：三类词表与后端 cloudfunctions/qa/index.js 内联版逐字一致；
 * - CR-013（2026-10-14）：后端已把话术迁到 cloudfunctions/shared/safety.js，
 *   并在 legal 词表补 `工伤 / 工伤认定 / 伤残鉴定 / 拖欠工资`，本文件已同步。
 *   号码改由后端 shared/hotline.js 统一取自真源，取值与本文件话术中的号码一致（未变）。
 */

/** 风险等级：'none' 表示未命中 */
export type RiskLevel = 'none' | 'medical' | 'legal' | 'emergency';

export interface RiskRule {
  level: Exclude<RiskLevel, 'none'>;
  /** 关键词正则（后端同款，⚠ 不要加 g 标志：带 lastIndex 的正则在多次 test 间有状态） */
  re: RegExp;
  /** 固定安全话术（后端同款，逐字复制） */
  text: string;
}

/**
 * 高风险规则表 —— 顺序即优先级：紧急求助 → 涉医 → 涉法。
 * 与 cloudfunctions/qa/index.js 的 RISK_RULES 逐条对应。
 */
export const RISK_RULES: RiskRule[] = [
  {
    level: 'emergency',
    re: /(着火|起火|火灾|煤气泄漏|燃气泄漏|燃气味|漏水漏电|电梯困人|被困电梯|有人晕倒|救命|急病|突发疾病)/,
    text:
      '这是紧急情况，请立刻拨打应急电话：火警 119 / 报警 110 / 急救 120。' +
      '接通后说明小区名称、楼栋单元与现场情况，并在安全位置等待救援。' +
      '如需联系物业协助，请拨打物业值班电话 020-88888888；更多号码可在小程序「便民电话簿」查看。',
  },
  {
    level: 'medical',
    re: /(胸痛|胸闷|心梗|中风|昏迷|晕倒|抽搐|大出血|止不住血|中毒|误服|窒息|呼吸困难|高烧不退|剧烈疼痛|流产|骨折|烫伤|触电|溺水|自杀|想死|轻生)/,
    text:
      '身体不适我不能给出判断，请尽快就医或拨打 120。现在就做：' +
      '1）立即停止自行用药与自行处理；2）让家人陪同前往最近医院急诊；' +
      '3）独居老人可按紧急呼叫按钮或拨打物业值班电话 020-88888888 求助；' +
      '4）出现意识不清、呼吸困难、大量出血时直接打 120，不要自行前往。',
  },
  {
    level: 'legal',
    // 工伤 / 工伤认定 / 伤残鉴定 / 拖欠工资（CR-013）：与劳动仲裁同类的劳动纠纷高频问法，
    // 原词表漏了会走大模型自由发挥。「工伤认定」虽是「工伤」子串也显式列出，便于与后端逐字对齐。
    re: /(起诉|打官司|律师|法院|开庭|离婚|遗产|遗嘱|抚养权|劳动仲裁|工伤|工伤认定|伤残鉴定|拖欠工资|合同违约|违约赔偿|赔偿标准|立案|被拘留|被抓)/,
    text:
      '法律纠纷我不能给出结论性意见。现在就做：' +
      '1）携带身份证、合同、照片与缴费凭证等材料；2）到社区居委会（020-88886666）申请免费法律援助，由值班律师当面解答；' +
      '3）需要即时咨询请拨打公共法律服务热线 12348；4）涉及人身安全或正在发生的违法行为，先拨打 110。',
  },
];

/**
 * 命中风险规则则返回该规则，未命中返回 null（与后端 detectRisk 同语义）。
 * @param question 用户原始提问（允许 undefined / null / 非字符串，内部统一转字符串）
 */
export function detectRisk(question: unknown): RiskRule | null {
  const q = String(question ?? '');
  for (const rule of RISK_RULES) {
    if (rule.re.test(q)) return rule;
  }
  return null;
}

/** 命中时的风险等级；未命中固定返回 'none' */
export function riskLevelOf(question: unknown): RiskLevel {
  const risk = detectRisk(question);
  return risk ? risk.level : 'none';
}

/**
 * 组装风险命中的 qa:ask 出参（结构与后端 ask() 命中分支一致）。
 * @param risk detectRisk 命中的规则
 * @param sessionId 会话 ID；为空时新建（mock 通道新建规则与后端 newSessionId 保持一致前缀 s_）
 */
export function buildRiskAnswer(risk: RiskRule, sessionId?: string): QaAskResult {
  const stamp = Date.now().toString(36);
  return {
    answerId: `qa_${risk.level}_${stamp}`,
    sessionId: String(sessionId ?? '') || `s_${stamp}`,
    answer: risk.text,
    sources: [],
    degraded: true,
    _riskLevel: risk.level,
  };
}

/**
 * qa:ask 的 mock 短路入口：命中走安全话术，未命中返回 null 由调用方继续走普通 mock 回答。
 * 这样 mock/data.ts 里不会出现"命中了还进普通分支"的漏网路径。
 */
export function tryBuildRiskAnswer(question: unknown, sessionId?: string): QaAskResult | null {
  const risk = detectRisk(question);
  if (!risk) return null;
  return buildRiskAnswer(risk, sessionId);
}
