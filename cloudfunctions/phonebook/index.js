'use strict';



const { ok, fail, CODES, handler } = require('./response');
const { db } = require('./db');
const { getOpenId } = require('./auth');
const { isBlank } = require('./time');

const CATEGORIES = ['property', 'government', 'medical', 'life', 'emergency'];

async function list(event) {
  const openid = getOpenId();
  if (!openid) return fail(CODES.AUTH, '登录态失效，请重新进入小程序');

  const category = isBlank(event.category) ? '' : String(event.category).trim();
  // 未知分类按空态返回（{code:0, list:[]}），不用 400 —— 契约未定义分类错误码
  const where = category && CATEGORIES.includes(category) ? { category } : category ? { category: '__none__' } : {};

  const query = db.collection('phonebook');
  const res = await (Object.keys(where).length ? query.where(where) : query)
    .orderBy('sort', 'asc')
    .limit(200)
    .get()
    .catch(() => ({ data: [] }));

  const rows = (res.data || []).slice().sort((a, b) => (a.sort || 0) - (b.sort || 0));
  return ok({ list: rows });
}

exports.main = handler(async (event = {}) => {
  const action = (event && event.action) || '';
  switch (action) {
    case 'list': return await list(event);
    default: return fail(CODES.PARAM, '未知的 action');
  }
});
