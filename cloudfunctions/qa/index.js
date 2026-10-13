'use strict';

/**
 * 资源 qa：action = ask / history / clear / feedback / suggest
 * 契约：contracts/api-contract.md §qa（RAG + 多轮会话 + 双层护栏 + 分级降级）
 *
 * 调用链：输入护栏 → 知识库检索 → 大模型（8s 超时）→ 输出护栏 → 落会话 → 返回
 * 无 DEEPSEEK_API_KEY 时全链路降级：知识库命中回原文，未命中回兜底话术 + 便民电话
 */
const { ok, fail, CODES, handler } = require('../shared/response');
const { db } = require('../shared/db');
const { getOpenId, requireUser } = require('../shared/auth');
const { isoNow, paginate } = require('../shared/time');
const { chat, buildRagPrompt } = require('../shared/ai');
const { searchKB, SUGGEST_QUESTIONS, FALLBACK_TEXT, hotlineLines } = require('../shared/kb/kb');
const { overLimit, RULE } = require('../shared/ratelimit');

const DISCLAIMER = 'AI 生成仅供参考';
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 会话 2 小时失效
// 【已裁决】契约「服务端只保留最近 3 轮」= 3 轮问答 = 6 条 turns（user 与 assistant 各 3 条）。
// 另叠加 2000 tokens 估算裁剪（见 trimTurns），双重保险防上下文爆炸。
const MAX_TURNS = 6;
const MAX_ANSWER_LEN = 500;
const INJECTION_RE = /(忽略(以上|前面|之前|上述)|ignore\s+(previous|above)|无视(以上|前面))/i;

/* ------------------------------------------------------------------ *
 * CR-012 · 高风险输入护栏（涉医 / 涉法 / 紧急求助）
 * 命中即返回固定安全话术 + _riskLevel，【不调用大模型】：
 *   ① 省 token  ② 避免模型在急症/法律场景下胡说  ③ 话术给出明确动作，不含"建议"等模糊表述
 * 新增字段 _riskLevel 为可选出参（'none'|'medical'|'legal'|'emergency'），纯向后兼容，零新增错误码。
 * 判定顺序：紧急求助 → 涉医 → 涉法（同一问题命中多类时取最需要立即行动的一类）。
 * ------------------------------------------------------------------ */
const RISK_RULES = [
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
    re: /(起诉|打官司|律师|法院|开庭|离婚|遗产|遗嘱|抚养权|劳动仲裁|合同违约|违约赔偿|赔偿标准|立案|被拘留|被抓)/,
    text:
      '法律纠纷我不能给出结论性意见。现在就做：' +
      '1）携带身份证、合同、照片与缴费凭证等材料；2）到社区居委会（020-88886666）申请免费法律援助，由值班律师当面解答；' +
      '3）需要即时咨询请拨打公共法律服务热线 12348；4）涉及人身安全或正在发生的违法行为，先拨打 110。',
  },
];

/** 返回命中的风险规则，未命中返回 null */
function detectRisk(question) {
  const q = String(question || '');
  for (const rule of RISK_RULES) {
    if (rule.re.test(q)) return rule;
  }
  return null;
}

const newSessionId = () => 's_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const newAnswerId = () => 'qa_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const estimateTokens = (turns) =>
  Math.ceil(turns.reduce((s, t) => s + String(t.content || '').length, 0) / 1.6);

function trimTurns(turns) {
  let out = (turns || []).slice(-MAX_TURNS);
  while (out.length > 2 && estimateTokens(out) > 2000) out = out.slice(1); // 防 token 爆炸
  return out;
}

async function loadSession(openid, sessionId) {
  const res = await db
    .collection('qa_sessions')
    .where({ _openid: openid, sessionId })
    .limit(1)
    .get()
    .catch(() => ({ data: [] }));
  const s = (res.data || [])[0];
  if (!s) return null;
  if (s.updatedAt && Date.now() - new Date(s.updatedAt).getTime() > SESSION_TTL_MS) return null; // 懒清理：已过期
  return s;
}

async function latestSession(openid) {
  const res = await db
    .collection('qa_sessions')
    .where({ _openid: openid })
    .orderBy('updatedAt', 'desc')
    .limit(1)
    .get()
    .catch(() => ({ data: [] }));
  return (res.data || [])[0] || null;
}

/** 输出护栏：回答中的号码必须能在命中的知识库原文里找到，否则判为幻觉 */
function outputGuard(answer, hits) {
  const ctx = (hits || []).map((h) => h.content || '').join(' ');
  const nums = String(answer || '').match(/\d[\d-]{5,}/g) || [];
  const suspicious = nums.filter((n) => !ctx.includes(n));
  return { pass: suspicious.length === 0, suspicious };
}

/* -------------------------------- qa:ask -------------------------------- */
async function ask(event) {
  const openid = getOpenId();
  await requireUser(openid);

  const question = String(event.question || '').trim();
  if (!question) return fail(CODES.PARAM, '问题不能为空');
  if (question.length > 300) return fail(CODES.PARAM, '问题不超过 300 字');
  if (INJECTION_RE.test(question)) return fail(CODES.PARAM, '问题包含不合规内容，请换个说法');

  // CR-012：高风险优先判定 —— 放在限流之前，紧急求助不应被频率限制挡住
  const risk = detectRisk(question);
  if (risk) {
    console.log(`[qa][risk] 命中高风险：${risk.level}（不调用大模型）`);
    const riskAnswerId = newAnswerId();
    const riskNow = isoNow();
    const riskSessionId = String(event.sessionId || '').trim() || newSessionId();
    const riskSession = await loadSession(openid, riskSessionId);
    const riskHistory = riskSession && Array.isArray(riskSession.turns) ? riskSession.turns.slice() : [];
    const riskTurns = trimTurns([
      ...riskHistory,
      { role: 'user', content: question.slice(0, 300), createdAt: riskNow },
      { role: 'assistant', content: risk.text.slice(0, 300), createdAt: riskNow, answerId: riskAnswerId, sources: [], degraded: true, _riskLevel: risk.level },
    ]);
    const riskPayload = {
      _openid: openid,
      sessionId: riskSessionId,
      turns: riskTurns,
      turnCount: (riskSession && riskSession.turnCount ? riskSession.turnCount : 0) + 1,
      updatedAt: riskNow,
    };
    if (riskSession) {
      await db.collection('qa_sessions').doc(riskSession._id).update({ data: riskPayload }).catch(() => ({ stats: { updated: 0 } }));
    } else {
      await db.collection('qa_sessions').add({ data: Object.assign({ createdAt: riskNow }, riskPayload) }).catch(() => ({}));
    }
    // 安全话术非 AI 生成，不追加「AI 生成仅供参考」免责声明
    return ok({
      answerId: riskAnswerId,
      sessionId: riskSessionId,
      answer: risk.text,
      sources: [],
      degraded: true,
      _riskLevel: risk.level,
    });
  }

  if (overLimit(`qa:ask:${openid}`, RULE.QA_ASK.limit, RULE.QA_ASK.windowMs)) {
    return fail(CODES.RATE, '提问太频繁，请稍后再试');
  }

  const sessionId = String(event.sessionId || '').trim() || newSessionId();
  const session = await loadSession(openid, sessionId);
  const history = session && Array.isArray(session.turns) ? session.turns.slice() : [];
  const answerId = newAnswerId();

  // ① 知识库检索（未命中 → 不调用大模型）
  const hits = searchKB(question);
  const sources = hits.map((h) => h.title);

  let answer = '';
  let degraded = true;
  let kbFallback = false;

  if (!hits.length) {
    // 降级②：未命中 → 兜底话术 + 便民电话
    answer = `${FALLBACK_TEXT}\n便民电话：${hotlineLines()}`;
    console.log('[qa] 知识库未命中，直接兜底，不调用大模型');
  } else {
    const base = buildRagPrompt(hits, question);
    const messages = [
      base[0],
      ...history.slice(-MAX_TURNS).map((t) => ({
        role: t.role === 'assistant' ? 'assistant' : 'user',
        content: String(t.content || '').slice(0, 300),
      })),
      base[1],
    ];
    const ai = await chat(messages, { maxTokens: 600 });
    if (!ai.degraded) {
      const guard = outputGuard(ai.content, hits);
      if (guard.pass) {
        answer = String(ai.content || '').slice(0, MAX_ANSWER_LEN);
        degraded = false;
      } else {
        // 输出护栏拦截（疑似编造号码/金额）→ 回落知识库原文
        console.warn('[qa] 输出护栏拦截，回落知识库原文：', guard.suspicious.join(','));
        answer = hits[0].content;
        kbFallback = true;
      }
    } else if (hits.length) {
      // 降级①：模型不可用 → 直接回知识库原文（仍有用）
      answer = hits[0].content;
      kbFallback = true;
    }
  }

  if (degraded && !answer) answer = `${FALLBACK_TEXT}\n便民电话：${hotlineLines()}`;
  if (!degraded || kbFallback) answer = `${answer}\n\n${DISCLAIMER}`;
  answer = answer.slice(0, MAX_ANSWER_LEN + 20);

  // ③ 落会话（仅本人可读写；保留最近 3 轮）
  const now = isoNow();
  const turns = trimTurns([
    ...history,
    { role: 'user', content: question.slice(0, 300), createdAt: now },
    { role: 'assistant', content: answer.slice(0, 300), createdAt: now, answerId, sources, degraded },
  ]);
  const payload = {
    _openid: openid,
    sessionId,
    turns,
    turnCount: (session && session.turnCount ? session.turnCount : 0) + 1,
    updatedAt: now,
  };
  if (session) {
    await db.collection('qa_sessions').doc(session._id).update({ data: payload }).catch(() => ({ stats: { updated: 0 } }));
  } else {
    await db.collection('qa_sessions').add({ data: Object.assign({ createdAt: now }, payload) }).catch(() => ({}));
  }

  console.log(`[qa] ask degraded=${degraded} hits=${hits.length} session=${sessionId}`);
  // _riskLevel='none' 为 CR-012 新增可选字段，未命中高风险时恒为 'none'（向后兼容）
  return ok({ answerId, sessionId, answer, sources, degraded, _riskLevel: 'none' });
}

/* ------------------------------ qa:history ------------------------------ */
async function history(event) {
  const openid = getOpenId();
  await requireUser(openid);

  const sessionId = String(event.sessionId || '').trim();
  const session = sessionId ? await loadSession(openid, sessionId) : await latestSession(openid);
  const turns = session && Array.isArray(session.turns) ? session.turns.slice() : [];
  turns.sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || ''))); // 时间正序
  const { list, total } = paginate(turns, event.page, event.pageSize);
  return ok({ list, total });
}

/* ------------------------------- qa:clear ------------------------------- */
async function clear(event) {
  const openid = getOpenId();
  await requireUser(openid);

  const sessionId = String(event.sessionId || '').trim();
  const session = sessionId ? await loadSession(openid, sessionId) : await latestSession(openid);
  if (!session) return ok({ ok: true }); // 幂等：无会话也算清除成功
  await db.collection('qa_sessions').doc(session._id).remove().catch(() => ({ stats: { removed: 0 } }));
  return ok({ ok: true });
}

/* ------------------------------ qa:feedback ----------------------------- */
async function feedback(event) {
  const openid = getOpenId();
  await requireUser(openid);

  const answerId = String(event.answerId || '').trim();
  if (!answerId) return fail(CODES.PARAM, 'answerId 必填');
  if (typeof event.useful !== 'boolean') return fail(CODES.PARAM, 'useful 必须为布尔值');

  await db.collection('qa_feedback').add({
    data: { _openid: openid, answerId, useful: event.useful, createdAt: isoNow() },
  }).catch(() => ({}));
  return ok({ ok: true });
}

exports.main = handler(async (event = {}) => {
  const action = (event && event.action) || '';
  switch (action) {
    case 'ask': return await ask(event);
    case 'history': return await history(event);
    case 'clear': return await clear(event);
    case 'feedback': return await feedback(event);
    case 'suggest': return ok({ questions: SUGGEST_QUESTIONS });
    default: return fail(CODES.PARAM, '未知的 action');
  }
});
