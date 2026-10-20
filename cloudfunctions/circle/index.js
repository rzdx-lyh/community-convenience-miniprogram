'use strict';



const { ok, fail, CODES, handler, omit } = require('./lib/response');
const { db } = require('./lib/db');
const { getOpenId, requireUser } = require('./lib/auth');
const { paginate, isBlank } = require('./lib/time');

const TYPES = ['road', 'notice', 'activity'];
const PRIVATE_FIELDS = ['authorOpenid'];

const strip = (post) => omit(post, PRIVATE_FIELDS);

function sortPosts(rows) {
  return rows.slice().sort((a, b) => {
    const ta = a.topFlag ? 1 : 0;
    const tb = b.topFlag ? 1 : 0;
    if (ta !== tb) return tb - ta; // 置顶优先
    return String(b.publishAt || '').localeCompare(String(a.publishAt || ''));
  });
}

/* ---------------------------- circle:list ---------------------------- */
async function list(event) {
  const openid = getOpenId();
  await requireUser(openid); // 401 未登录

  const rawType = event.type;
  const type = isBlank(rawType) ? '' : String(rawType);
  if (type && !TYPES.includes(type)) return fail(CODES.PARAM, '圈子类型不合法');

  const where = { status: 'published' };
  if (type) where.type = type;

  const res = await db
    .collection('circle_post')
    .where(where)
    .orderBy('publishAt', 'desc')
    .limit(200)
    .get()
    .catch(() => ({ data: [] }));

  let rows = (res.data || []).slice();

  // tag 精确匹配
  const tag = isBlank(event.tag) ? '' : String(event.tag).trim();
  if (tag) rows = rows.filter((p) => Array.isArray(p.tags) && p.tags.includes(tag));

  // keyword 模糊匹配：标题 + 正文 + tags（演示级数据量，内存过滤，云环境/mock 行为一致）
  const keyword = String(event.keyword || '').trim().toLowerCase();
  if (keyword) {
    rows = rows.filter((p) =>
      [p.title, p.content, (p.tags || []).join(' ')].join('\n').toLowerCase().includes(keyword),
    );
  }

  rows = sortPosts(rows);
  const { list: pageList, total } = paginate(rows, event.page, event.pageSize);
  return ok({ list: pageList.map(strip), total });
}

/* --------------------------- circle:detail --------------------------- */
async function detail(event) {
  const openid = getOpenId();
  await requireUser(openid);

  const id = String(event.id || '').trim();
  if (!id) return fail(CODES.PARAM, '缺少帖子 id');

  const res = await db.collection('circle_post').doc(id).get().catch(() => ({ data: null }));
  if (!res.data || res.data.status !== 'published') return fail(CODES.NOT_FOUND, '帖子不存在或已下架');

  // viewCount 原子自增（失败静默，不阻断详情返回）
  await db
    .collection('circle_post')
    .doc(id)
    .update({ data: { viewCount: db.command.inc(1) } })
    .catch((e) => {
      console.warn('[circle] viewCount 自增失败（不阻断）：', e && e.message);
      return { stats: { updated: 0 } };
    });

  const after = await db.collection('circle_post').doc(id).get().catch(() => ({ data: null }));
  const post = (after && after.data) || res.data;
  return ok({ post: strip(post) });
}

exports.main = handler(async (event = {}) => {
  const action = (event && event.action) || '';
  switch (action) {
    case 'list': return await list(event);
    case 'detail': return await detail(event);
    default: return fail(CODES.PARAM, '未知的 action');
  }
});
