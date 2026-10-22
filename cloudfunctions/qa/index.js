'use strict';



const { ok, fail, CODES, handler } = require('./response');
const { db } = require('./db');
const { getOpenId, requireUser } = require('./auth');
const { isoNow, paginate } = require('./time');
const { chat, buildRagPrompt } = require('./ai');
const { searchWeb, toSourceLabels } = require('./websearch');
const { searchKB, SUGGEST_QUESTIONS, FALLBACK_TEXT, hotlineLines } = require('./kb');
const { overLimit, RULE } = require('./ratelimit');
const { detectRisk } = require('./safety');

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
 * 【已迁移】话术与词表的唯一出处是 shared/safety.js（架构评审要求集中维护，防改一处漏一处），
 * 本文件只保留调用点，措辞/判定顺序/字段名一律未变。
 * ------------------------------------------------------------------ */

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
function outputGuard(answer, contexts) {
  const ctx = (contexts || []).map((c) => String((c && c.content) || '')).join(' ');
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
      _aiReason: 'risk',
    });
  }

  if (overLimit(`qa:ask:${openid}`, RULE.QA_ASK.limit, RULE.QA_ASK.windowMs)) {
    return fail(CODES.RATE, '提问太频繁，请稍后再试');
  }

  const sessionId = String(event.sessionId || '').trim() || newSessionId();
  const session = await loadSession(openid, sessionId);
  const history = session && Array.isArray(session.turns) ? session.turns.slice() : [];
  const answerId = newAnswerId();

  // ① 知识库 + 实时网页检索（两条上下文合并后交给模型）
  const hits = searchKB(question);
  const web = await searchWeb(question);
  const webResults = web.results || [];
  const webSources = toSourceLabels(webResults);
  const kbSources = hits.map((h, i) => `[${webSources.length + i + 1}] ${h.title}`);
  const sources = [...webSources, ...kbSources];
  const hasContext = hits.length > 0 || webResults.length > 0;

  let answer = '';
  let degraded = true;
  let kbFallback = false;
  let webFallback = false;
  // CR-027：把降级原因透出（no_key / timeout / network / http_xxx / kb_miss / risk / guard）
  let aiReason = hasContext ? 'ok' : 'no_context';

  if (!hasContext) {
    answer = `${FALLBACK_TEXT}\n便民电话：${hotlineLines()}`;
    aiReason = web.enabled ? `web_${web.reason}` : 'kb_miss';
    console.log(`[qa] 知识库与网页均未命中，直接兜底：reason=${aiReason}`);
  } else {
    const base = buildRagPrompt(hits, question, webResults);
    const messages = [
      base[0],
      ...history.slice(-MAX_TURNS).map((t) => ({
        role: t.role === 'assistant' ? 'assistant' : 'user',
        content: String(t.content || '').slice(0, 300),
      })),
      base[1],
    ];
    const ai = await chat(messages, { maxTokens: 650 });
    if (!ai.degraded) {
      const guard = outputGuard(ai.content, [...hits, ...webResults]);
      if (guard.pass) {
        answer = String(ai.content || '').slice(0, MAX_ANSWER_LEN);
        degraded = false;
        aiReason = webResults.length ? 'web_ok' : 'ok';
      } else {
        console.warn('[qa] 输出护栏拦截，回落检索资料：', guard.suspicious.join(','));
        answer = webResults.length
          ? String(webResults[0].content || webResults[0].snippet || '').slice(0, MAX_ANSWER_LEN)
          : hits[0].content;
        kbFallback = !webResults.length;
        webFallback = webResults.length > 0;
        aiReason = 'guard';
      }
    } else if (webResults.length) {
      // 大模型超时/不可用时，仍返回实时网页正文摘要，避免用户只看到“掉线”。
      const lines = webResults.slice(0, 2).map((r, i) => {
        const body = String(r.content || r.snippet || '').slice(0, 220);
        return `${i + 1}. ${r.title}：${body}`;
      });
      answer = `根据实时网页检索：\n${lines.join('\n')}`.slice(0, MAX_ANSWER_LEN);
      webFallback = true;
      aiReason = `web_fallback_${ai.reason || 'unknown'}`;
    } else if (hits.length) {
      // 模型不可用 → 直接回知识库原文（仍有用）
      answer = hits[0].content;
      kbFallback = true;
      aiReason = ai.reason || 'unknown';
    }
  }

  if (degraded && !answer) answer = `${FALLBACK_TEXT}\n便民电话：${hotlineLines()}`;
  if (!degraded || kbFallback || webFallback) answer = `${answer}\n\n${DISCLAIMER}`;
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

  console.log(`[qa] ask degraded=${degraded} reason=${aiReason} kb=${hits.length} web=${webResults.length} web_ms=${web.costMs} session=${sessionId}`);
  // _riskLevel='none' 为 CR-012 新增可选字段，未命中高风险时恒为 'none'（向后兼容）
  // _aiReason 为 CR-027 新增可选字段，纯向后兼容，零新增错误码
  return ok({ answerId, sessionId, answer, sources, degraded, _riskLevel: 'none', _aiReason: aiReason, _webCount: webResults.length });
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
