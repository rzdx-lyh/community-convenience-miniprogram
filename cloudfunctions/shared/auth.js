'use strict';

/**
 * 身份与角色：openid 只从 wxContext 取（不可伪造），前端传 openid 一律忽略。
 * mock 模式：openid 来自 globalThis.__MOCK_OPENID__（自测脚本/本地服务按场景注入）。
 */
const { cloud } = require('./cloud');
const { db } = require('./db');
const { bizErr, CODES } = require('./response');
const { isoNow } = require('./time');
const { generateUniqueAccountId, ensureAccountId, normalize } = require('./accountId');
const { decryptPhone, maskPhone } = require('./crypto');

const getOpenId = () => {
  if (cloud) {
    const ctx = cloud.getWXContext() || {};
    return ctx.OPENID || '';
  }
  return globalThis.__MOCK_OPENID__ || '';
};

async function getUser(openid) {
  if (!openid) return null;
  const res = await db
    .collection('users')
    .where({ _openid: openid })
    .limit(1)
    .get()
    .catch(() => ({ data: [] }));
  return (res.data || [])[0] || null;
}

async function requireUser(openid) {
  if (!openid) bizErr(CODES.AUTH, '登录态失效，请重新进入小程序');
  const user = await getUser(openid);
  if (!user) bizErr(CODES.AUTH, '用户不存在，请先登录');
  return user;
}

/** 物业/管理员校验：写操作前必须调用 */
async function requireStaff(openid) {
  const user = await requireUser(openid);
  if (!['property', 'admin'].includes(user.role)) bizErr(CODES.FORBIDDEN, '无权限执行此操作');
  return user;
}

/** 首次登录自动建档（role 默认 resident，accountId 服务端生成） */
async function ensureUser(openid) {
  const exist = await getUser(openid);
  if (exist) return exist;
  const now = isoNow();
  const accountId = await generateUniqueAccountId(openid);
  const data = { _openid: openid, role: 'resident', accountId, createdAt: now, updatedAt: now };
  const add = await db.collection('users').add({ data });
  return Object.assign({}, data, { _id: add && add._id });
}

/**
 * 出参 profile：剔除内部字段；phone 一律脱敏；accountId 保证有值（懒迁移）。
 */
async function toProfile(user) {
  await ensureAccountId(user);
  const profile = {
    _id: user._id,
    _openid: user._openid,
    nickName: user.nickName || '',
    accountId: normalize(user.accountId),
    role: user.role || 'resident',
    building: user.building || '',
    elderMode: !!user.elderMode,
    createdAt: user.createdAt || '',
    updatedAt: user.updatedAt || '',
  };
  if (user.phone) profile.phone = maskPhone(decryptPhone(user.phone));
  return profile;
}

module.exports = { getOpenId, getUser, requireUser, requireStaff, ensureUser, toProfile };
