'use strict';

/**
 * 用户资料更新（BE-1 / BE-12 共用逻辑）
 * 抽到 shared 是为了让 auth 与 user 两个云函数条目共享同一份校验，避免两处实现漂移。
 * 契约：contracts/api-contract.md §user:updateProfile（v1.2 扩展 accountId）
 */
const { db } = require('./db');
const { ok, bizErr, CODES } = require('./response');
const { isoNow } = require('./time');
const { requireUser, toProfile } = require('./auth');
const { resolveForUpdate } = require('./accountId');
const { encryptPhone, isValidPhone } = require('./crypto');

async function updateProfile(openid, event = {}) {
  const user = await requireUser(openid);
  const patch = {};

  if (event.nickName !== undefined && event.nickName !== null) {
    const n = String(event.nickName || '').trim();
    if (!n) bizErr(CODES.PARAM, '昵称不能为空');
    if (n.length > 20) bizErr(CODES.PARAM, '昵称不超过 20 字');
    patch.nickName = n;
  }

  if (event.avatarUrl !== undefined && event.avatarUrl !== null) {
    const a = String(event.avatarUrl || '').trim();
    if (a && !/^(cloud:\/\/|https?:\/\/)/.test(a)) bizErr(CODES.PARAM, '头像地址格式不正确');
    if (a.length > 500) bizErr(CODES.PARAM, '头像地址过长');
    patch.avatarUrl = a;
  }

  if (event.phone !== undefined && event.phone !== null) {
    const p = String(event.phone || '').trim();
    if (p && !isValidPhone(p)) bizErr(CODES.PARAM, '手机号格式不正确');
    patch.phone = p ? encryptPhone(p) : ''; // AES 加密存储，出参脱敏
  }

  if (event.building !== undefined && event.building !== null) {
    const b = String(event.building || '').trim();
    if (b.length > 30) bizErr(CODES.PARAM, '楼栋信息过长');
    patch.building = b;
  }

  if (event.elderMode !== undefined && event.elderMode !== null) {
    if (typeof event.elderMode !== 'boolean') bizErr(CODES.PARAM, 'elderMode 必须为布尔值');
    patch.elderMode = event.elderMode;
  }

  // v1.2：社区账号 —— 格式 + 唯一性（命中自己当前值视为未修改）
  if (event.accountId !== undefined && event.accountId !== null) {
    const r = await resolveForUpdate(event.accountId, user);
    if (r.changed) patch.accountId = r.accountId;
  }

  if (Object.keys(patch).length) {
    patch.updatedAt = isoNow();
    await db.collection('users').doc(user._id).update({ data: patch });
    Object.assign(user, patch);
  }

  return ok({ profile: await toProfile(user) });
}

module.exports = { updateProfile };
