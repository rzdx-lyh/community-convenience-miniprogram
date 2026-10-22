'use strict';

/* ============================================================
 * ⚠ 临时启动自检 v2（定位「lib 目录未生效」问题，定位后删除）
 * v1 的 bug：第二句赋值覆盖了 bootErr.message，导致永远看不到真实报错。
 * v2：完整保留 err.code/message/stack、__dirname、lib 与 response.js 的
 *     stat（是否目录/权限位/大小），一次性把运行时真相带回来。
 * ============================================================ */
try {
  require.resolve('./response');
} catch (bootErr) {
  let diag;
  try {
    const fs = require('fs');
    const info = {
      errStr: String(bootErr),
      code: bootErr && bootErr.code,
      msg: bootErr && bootErr.message,
      stack: bootErr && bootErr.stack ? String(bootErr.stack).split('\n').slice(0, 4).join(' | ') : '',
      dir: __dirname,
      node: process.version,
      root: fs.readdirSync(__dirname).slice(0, 20),
    };
    try {
      const s = fs.statSync(__dirname + '/lib');
      info.libStat = { isDir: s.isDirectory(), mode: (s.mode & 0o777).toString(8) };
    } catch (e1) { info.libStat = 'ERR:' + (e1 && e1.message); }
    try { info.libFiles = fs.readdirSync(__dirname + '/lib'); } catch (e2) { info.libFiles = 'ERR:' + (e2 && e2.message); }
    try {
      const s2 = fs.statSync(__dirname + '/lib/response.js');
      info.respStat = { size: s2.size, mode: (s2.mode & 0o777).toString(8) };
    } catch (e3) { info.respStat = 'ERR:' + (e3 && e3.message); }
    diag = 'BOOTFAIL ' + JSON.stringify(info);
  } catch (eDiag) {
    diag = 'BOOTFAIL_DIAGFAIL ' + (eDiag && eDiag.message) + ' || orig=' + String(bootErr);
  }
  console.error('[boot-diag] ' + diag);
  exports.main = async () => ({ code: 500, msg: diag.slice(0, 900), data: null });
  return;
}

const { ok, fail, CODES, handler } = require('./response');
const { db } = require('./db');
const { getOpenId, requireUser, requireStaff } = require('./auth');
const { isoNow, paginate } = require('./time');
const { checkText } = require('./security');
const { chat, buildSummaryPrompt } = require('./ai');
const { notifyWorkOrderDone } = require('./subscribe');
const { overLimit, RULE } = require('./ratelimit');

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

/* ============================================================
 * ⚠ 临时自愈（定位线上 500，定位后删除）
 * 云数据库集合若未创建，首次调用就地补建，避免 add 直接失败。
 * ============================================================ */
const { cloud: wxCloud, isCloud } = require('./cloud');
let __ensuredCollections = false;
async function ensureCollections() {
  if (__ensuredCollections || !isCloud || !wxCloud) return;
  __ensuredCollections = true;
  for (const name of ['users', 'workorders']) {
    try {
      await wxCloud.database().createCollection(name);
      console.log('[ensure] 已创建集合 ' + name);
    } catch (e) {
      // 已存在会抛错，忽略
    }
  }
}

exports.main = handler(async (event = {}) => {
  await ensureCollections();
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
