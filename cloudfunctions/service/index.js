'use strict';

/**
 * 资源 service：action = list
 * 契约：contracts/api-contract.md §service:list（v1.2 新增，四类服务宫格聚合，不分页）
 *
 * 降级铁律（BE-11 / 风险 R-D）：任何异常都必须返回 { code:0, data:{ list:[] } }，
 * 绝不能返回 500 —— 让前端回退本地常量 config/service-grid.ts，保证 Demo 不白屏。
 */
const { ok, fail, CODES, handler } = require('../shared/response');
const { db } = require('../shared/db');
const { getOpenId, requireUser } = require('../shared/auth');
const { isBlank } = require('../shared/time');

const VALID_TARGET_TYPES = ['page', 'notice', 'circle', 'assistant', 'phone', 'toast'];

/** 只输出契约 ServiceCategory / ServiceItem 定义的字段，避免把内部字段带给前端 */
function normalizeCategory(c) {
  const normItem = (it) => ({
    key: it.key,
    name: it.name,
    // v1.0.1 / CR-022：desc 是分类页每行的小字说明（「60 元/小时起」），
    // 早期实现漏了它，真机上 38 项全部只有名字、无从判断选哪个。
    desc: it.desc,
    badge: it.badge,
    targetType: it.targetType,
    targetPath: it.targetPath,
    targetParams: it.targetParams,
    tip: it.tip,
    sort: it.sort,
  });

  const normList = (list) =>
    (Array.isArray(list) ? list : [])
      .slice()
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
      .map(normItem)
      .filter((it) => VALID_TARGET_TYPES.includes(it.targetType));

  const items = normList(c.items);

  // v1.0.1 / CR-022：groups 是 8 个板块的分组结构，分类页靠它渲染板块标题与说明。
  // 不透传的话，前端 toGroupsVM 会退化成"一个分类一个板块"，38 项挤成一坨。
  const groups = Array.isArray(c.groups)
    ? c.groups
        .slice()
        .sort((a, b) => (a.sort || 0) - (b.sort || 0))
        .map((g) => ({
          key: g.key,
          name: g.name,
          note: g.note,
          render: g.render || 'grid',
          sort: g.sort,
          items: normList(g.items),
        }))
    : undefined;

  return {
    _id: c._id,
    key: c.key,
    title: c.title,
    subtitle: c.subtitle,
    icon: c.icon,
    iconTheme: c.iconTheme,
    sort: c.sort,
    status: c.status,
    items,
    groups,
  };
}

async function list(event) {
  // 401 未登录必须如实返回，不能吞进降级分支
  const openid = getOpenId();
  await requireUser(openid);

  try {
    const key = isBlank(event.key) ? '' : String(event.key).trim();
    const where = { status: 'online' };
    if (key) where.key = key;

    const res = await db
      .collection('service_category')
      .where(where)
      .orderBy('sort', 'asc')
      .limit(20)
      .get()
      .catch(() => ({ data: [] }));

    const rows = (res.data || []).slice().sort((a, b) => (a.sort || 0) - (b.sort || 0));
    return ok({ list: rows.map(normalizeCategory) });
  } catch (e) {
    console.error('[service] list 异常，降级返回空列表（前端回退本地常量）：', e && e.message);
    return ok({ list: [] });
  }
}

exports.main = handler(async (event = {}) => {
  const action = (event && event.action) || '';
  switch (action) {
    case 'list': return await list(event);
    default: return fail(CODES.PARAM, '未知的 action');
  }
});
