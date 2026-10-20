'use strict';



const { ok, fail, CODES, handler } = require('./lib/response');
const { db } = require('./lib/db');
const { getOpenId, requireUser } = require('./lib/auth');
const { isoNow, isActiveNow, isExpired, paginate, isBlank } = require('./lib/time');

const TYPES = ['notice', 'activity', 'urgent'];
const LEVEL_WEIGHT = { critical: 3, high: 2, normal: 1 };

/** limit 默认 5、上限 10；<1 按 1 处理；非法值回落默认 5 */
function clampLimit(raw) {
  if (raw === undefined || raw === null || raw === '') return 5;
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n)) return 5;
  if (n < 1) return 1;
  return Math.min(10, n);
}

/* ---------------------------- notice:list ---------------------------- */
async function list(event) {
  const openid = getOpenId();
  await requireUser(openid); // 401 未登录

  const rawType = event.type;
  const type = isBlank(rawType) ? '' : String(rawType);
  if (type && !TYPES.includes(type)) return fail(CODES.PARAM, '公告类型不合法');

  const includeExpired = event.includeExpired === true || event.includeExpired === 'true';
  const where = { status: 'published' };
  if (type) where.type = type;

  const res = await db
    .collection('notices')
    .where(where)
    .orderBy('publishAt', 'desc')
    .limit(200)
    .get()
    .catch(() => ({ data: [] }));

  const now = isoNow();
  // 默认过滤「已过期的紧急通知」；对 notice/activity 零影响（v1.2 唯一行为微调）
  let rows = (res.data || []).filter(
    (n) => includeExpired || !(n.type === 'urgent' && isExpired(n.endAt, now)),
  );
  rows = rows.slice().sort((a, b) => String(b.publishAt || '').localeCompare(String(a.publishAt || '')));

  const { list: pageList, total } = paginate(rows, event.page, event.pageSize);
  return ok({ list: pageList, total });
}

/* --------------------------- notice:detail --------------------------- */
async function detail(event) {
  const openid = getOpenId();
  await requireUser(openid);

  const id = String(event.id || '').trim();
  if (!id) return fail(CODES.PARAM, '缺少公告 id');

  const res = await db.collection('notices').doc(id).get().catch(() => ({ data: null }));
  if (!res.data || res.data.status !== 'published') return fail(CODES.NOT_FOUND, '公告不存在或已下架');
  return ok({ notice: res.data });
}

/* ------------------------ notice:urgentLatest ------------------------ */
async function urgentLatest(event) {
  const openid = getOpenId();
  await requireUser(openid); // 401 未登录

  const limit = clampLimit(event.limit);
  const now = isoNow();

  const res = await db
    .collection('notices')
    .where({ status: 'published', type: 'urgent' })
    .limit(200)
    .get()
    .catch(() => ({ data: [] }));

  // 有效期内：startAt 为空或已生效，且 endAt 为空或未过期
  const rows = (res.data || []).filter((n) => isActiveNow(n.startAt, n.endAt, now));

  rows.sort((a, b) => {
    const wa = LEVEL_WEIGHT[a.level] || LEVEL_WEIGHT.normal;
    const wb = LEVEL_WEIGHT[b.level] || LEVEL_WEIGHT.normal;
    if (wa !== wb) return wb - wa; // level 权重降序
    const sa = String(a.startAt || '');
    const sb = String(b.startAt || '');
    if (sa !== sb) return sb.localeCompare(sa); // startAt 降序
    return String(b.publishAt || '').localeCompare(String(a.publishAt || '')); // publishAt 降序
  });

  const list = rows.slice(0, limit);
  // 空态协议：无数据时 { code:0, data:{ list:[], total:0 } }，不是错误
  if (!list.length) console.log('[notice] urgentLatest 空态：当前无有效紧急通知');
  return ok({ list, total: list.length });
}

exports.main = handler(async (event = {}) => {
  const action = (event && event.action) || '';
  switch (action) {
    case 'list': return await list(event);
    case 'detail': return await detail(event);
    case 'urgentLatest': return await urgentLatest(event);
    default: return fail(CODES.PARAM, '未知的 action');
  }
});
