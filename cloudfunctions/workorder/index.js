'use strict';

/**
 * 资源 workorder：action = create / list / detail / cancel / handle
 * 契约：contracts/api-contract.md §workorder
 * 状态机：pending→assigned→processing→done；closed/canceled 为终态，非法流转返回 400
 * 数据隔离：居民仅见本人工单（越权 403），物业/管理员见全部
 */
const { ok, fail, CODES, handler } = require('../shared/response');
const { db } = require('../shared/db');
const { getOpenId, requireUser, requireStaff } = require('../shared/auth');
const { isoNow, paginate } = require('../shared/time');
const { checkText } = require('../shared/security');
const { chat, buildSummaryPrompt } = require('../shared/ai');
const { notifyWorkOrderDone } = require('../shared/subscribe');
const { overLimit, RULE } = require('../shared/ratelimit');

const CATEGORIES = ['water', 'electric', 'door', 'public', 'other'];
const FLOW = {
  pending: ['assigned', 'canceled', 'closed'],
  assigned: ['processing', 'canceled', 'closed'],
  processing: ['done', 'closed'],
  done: [],
  closed: [],
  canceled: [],
};
const ACTION_TO_STATUS = { assign: 'assigned', process: 'processing', done: 'done' };

/* --------------------------- workorder:create --------------------------- */
async function create(event) {
  const openid = getOpenId();
  const user = await requireUser(openid);

  if (overLimit(`wo:create:${openid}`, RULE.WORKORDER_CREATE.limit, RULE.WORKORDER_CREATE.windowMs)) {
    return fail(CODES.RATE, '提交过于频繁，请稍后再试');
  }

  const title = String(event.title || '').trim();
  const description = String(event.description || '').trim();
  const category = String(event.category || '').trim();
  const images = Array.isArray(event.images) ? event.images.slice(0, 6) : [];

  if (!title) return fail(CODES.PARAM, '标题不能为空');
  if (title.length > 50) return fail(CODES.PARAM, '标题不超过 50 字');
  if (!description) return fail(CODES.PARAM, '问题描述不能为空');
  if (description.length > 500) return fail(CODES.PARAM, '问题描述不超过 500 字');
  if (!CATEGORIES.includes(category)) return fail(CODES.PARAM, '报修分类不合法');

  // 内容安全：先审后发（接口异常 fail-open，不阻断报修主流程）
  const sec = await checkText(openid, `${title}\n${description}`);
  if (!sec.pass) return fail(CODES.PARAM, '内容包含敏感信息，请修改后重试');

  // AI 智能摘要：失败/无 Key 用原文截断兜底，绝不阻断创建
  const ai = await chat(buildSummaryPrompt(title, description), { maxTokens: 120 });
  const aiSummary = ai.degraded
    ? (description.length > 40 ? `${title}：${description.slice(0, 40)}…` : `${title}：${description}`)
    : String(ai.content || '').slice(0, 200);

  const now = isoNow();
  const data = {
    _openid: openid,
    title,
    description,
    category,
    images,
    status: 'pending',
    aiSummary,
    createdAt: now,
    updatedAt: now,
  };
  const add = await db.collection('workorders').add({ data });
  console.log(`[workorder] create by ***${String(openid).slice(-4)} category=${category} ai_degraded=${ai.degraded}`);
  return ok({ id: add && add._id, aiSummary });
}

/* ---------------------------- workorder:list ---------------------------- */
async function list(event) {
  const openid = getOpenId();
  const user = await requireUser(openid);

  const where = {};
  if (user.role === 'resident') where._openid = openid; // 居民仅见本人
  if (event.status) where.status = String(event.status);

  const query = db.collection('workorders');
  const res = await (Object.keys(where).length ? query.where(where) : query)
    .orderBy('createdAt', 'desc')
    .limit(200)
    .get()
    .catch(() => ({ data: [] }));

  const rows = (res.data || []).slice().sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  const { list: pageList, total } = paginate(rows, event.page, event.pageSize);
  return ok({ list: pageList, total });
}

/* --------------------------- workorder:detail --------------------------- */
async function detail(event) {
  const openid = getOpenId();
  const user = await requireUser(openid);

  const id = String(event.id || '').trim();
  if (!id) return fail(CODES.PARAM, '缺少工单 id');

  const res = await db.collection('workorders').doc(id).get().catch(() => ({ data: null }));
  const wo = res.data;
  if (!wo) return fail(CODES.NOT_FOUND, '工单不存在');
  if (user.role === 'resident' && wo._openid !== openid) return fail(CODES.FORBIDDEN, '无权查看该工单');
  return ok({ workorder: wo });
}

/* --------------------------- workorder:cancel --------------------------- */
async function cancel(event) {
  const openid = getOpenId();
  await requireUser(openid);

  const id = String(event.id || '').trim();
  if (!id) return fail(CODES.PARAM, '缺少工单 id');

  const res = await db.collection('workorders').doc(id).get().catch(() => ({ data: null }));
  const wo = res.data;
  if (!wo) return fail(CODES.NOT_FOUND, '工单不存在');
  if (wo._openid !== openid) return fail(CODES.FORBIDDEN, '无权操作该工单');
  if (wo.status !== 'pending') return fail(CODES.PARAM, '当前状态不可取消');

  await db.collection('workorders').doc(id).update({ data: { status: 'canceled', updatedAt: isoNow() } });
  return ok({ ok: true });
}

/* --------------------------- workorder:handle --------------------------- */
async function handle(event) {
  const openid = getOpenId();
  const staff = await requireStaff(openid); // 403 无权限

  const id = String(event.id || '').trim();
  // 【已裁决 · CR-011】契约侧定稿业务参数名为 handleAction（新增可选参数，非破坏性），
  // 同时保留 to 与原 action 两种读法做向后兼容，既有调用不受影响：
  //   ① { action:'handle', handleAction:'assign' }  ← 推荐写法
  //   ② { action:'handle', to:'assign' }            ← 兼容写法
  //   ③ { action:'assign', id }                     ← 兜底：调度字段被业务动作覆盖时的形态
  const bizAction =
    String(event.handleAction || event.to || (['assign', 'process', 'done'].includes(event.action) ? event.action : '') || '');
  const to = ACTION_TO_STATUS[bizAction];
  if (!id) return fail(CODES.PARAM, '缺少工单 id');
  if (!to) return fail(CODES.PARAM, '未知的处理动作');

  const res = await db.collection('workorders').doc(id).get().catch(() => ({ data: null }));
  const wo = res.data;
  if (!wo) return fail(CODES.NOT_FOUND, '工单不存在');
  if (!FLOW[wo.status] || !FLOW[wo.status].includes(to)) {
    return fail(CODES.PARAM, `状态流转不合法：${wo.status}→${to}`);
  }

  const patch = {
    status: to,
    assignee: openid,
    updatedAt: isoNow(),
  };
  if (event.note !== undefined && event.note !== null) patch.handleNote = String(event.note).slice(0, 200);
  await db.collection('workorders').doc(id).update({ data: patch });

  const after = await db.collection('workorders').doc(id).get().catch(() => ({ data: Object.assign({}, wo, patch) }));
  const updated = after.data || Object.assign({}, wo, patch);

  // done 触发订阅消息通知报修人（无模板 ID 时降级日志，不阻断）
  if (to === 'done') {
    await notifyWorkOrderDone(wo._openid, { title: wo.title, status: 'done', id })
      .catch(() => ({ sent: false }));
  }
  console.log(`[workorder] handle id=${id} ${wo.status}→${to} by ***${String(openid).slice(-4)} role=${staff.role}`);
  return ok({ workorder: updated });
}

exports.main = handler(async (event = {}) => {
  const action = (event && event.action) || '';
  switch (action) {
    case 'create': return await create(event);
    case 'list': return await list(event);
    case 'detail': return await detail(event);
    case 'cancel': return await cancel(event);
    case 'handle': return await handle(event);
    // 兼容「调度字段被业务 action 覆盖」的写法（见 handle 内注释 ③）
    case 'assign':
    case 'process':
    case 'done':
      return await handle(Object.assign({}, event, { handleAction: action }));
    default: return fail(CODES.PARAM, '未知的 action');
  }
});
