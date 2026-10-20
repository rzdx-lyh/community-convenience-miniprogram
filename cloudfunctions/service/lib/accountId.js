'use strict';

/**
 * 社区账号 accountId（v1.2 · CR-009 / 任务卡 BE-12）
 * - 替代微信未开放的「用户微信号」
 * - 格式：/^[a-z][a-z0-9_]{3,19}$/（小写字母开头，4~20 位）
 * - 服务端默认生成：linju_ + 6 位随机串（字符集排除易混淆的 0/o/1/l/i），冲突重试 3 次
 * - 懒迁移：读取时无值即生成并回写，前端读到的 accountId 永远有值
 */
const { db } = require('./db');
const { isoNow } = require('./time');
const { bizErr, CODES } = require('./response');

const ACCOUNT_ID_RE = /^[a-z][a-z0-9_]{3,19}$/;
const CHARSET = 'abcdefghjkmnpqrstuvwxyz23456789'; // 排除 0/o/1/l/i

const MSG_FORMAT = '社区账号需 4-20 位小写字母开头，可含数字和下划线';
const MSG_DUP = '社区账号已被使用，换一个试试';

const normalize = (v) => String(v === undefined || v === null ? '' : v).trim().toLowerCase();
const isValid = (v) => ACCOUNT_ID_RE.test(v);

function randomSuffix(n = 6) {
  let s = '';
  for (let i = 0; i < n; i += 1) s += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  return s;
}

function sanitizeTail(tail) {
  const s = String(tail || '').toLowerCase().replace(/[^a-z0-9_]/g, 'x');
  return s || randomSuffix(6);
}

/** 查库：命中「他人」已占用的 accountId 则返回该文档 */
async function findByAccountId(accountId, excludeId) {
  const res = await db
    .collection('users')
    .where({ accountId })
    .limit(5)
    .get()
    .catch(() => ({ data: [] }));
  return (res.data || []).find((d) => d._id !== excludeId) || null;
}

/** 生成全局唯一 accountId（重试 3 次后降级为 linju_ + openid 末 6 位） */
async function generateUniqueAccountId(openid) {
  for (let i = 0; i < 3; i += 1) {
    const candidate = 'linju_' + randomSuffix(6);
    const dup = await findByAccountId(candidate);
    if (!dup) return candidate;
    console.warn('[accountId] 生成撞号，重试 ' + (i + 1));
  }
  const tail = String(openid || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(-6);
  let fallback = 'linju_' + sanitizeTail(tail);
  if (await findByAccountId(fallback)) fallback = fallback + randomSuffix(2);
  console.warn('[accountId] 3 次重试仍冲突，降级为 openid 末 6 位');
  return fallback;
}

/** 懒迁移：accountId 为空/非法即生成并回写 users 集合 */
async function ensureAccountId(user) {
  const current = normalize(user && user.accountId);
  if (current && isValid(current)) return current;
  const generated = await generateUniqueAccountId(user && user._openid);
  await db
    .collection('users')
    .doc(user._id)
    .update({ data: { accountId: generated, updatedAt: isoNow() } })
    .catch((e) => {
      console.warn('[accountId] 懒迁移回写失败：', e && e.message);
      return { stats: { updated: 0 } };
    });
  if (user) user.accountId = generated;
  return generated;
}

/** 入参校验：非法格式 → 400 */
function validate(raw) {
  const v = normalize(raw);
  if (!isValid(v)) bizErr(CODES.PARAM, MSG_FORMAT);
  return v;
}

/** 入参校验 + 唯一性：命中自己当前值视为未修改；命中他人 → 400 */
async function resolveForUpdate(raw, user) {
  const v = validate(raw);
  if (v === normalize(user.accountId)) return { accountId: v, changed: false };
  const dup = await findByAccountId(v, user._id);
  if (dup) bizErr(CODES.PARAM, MSG_DUP);
  return { accountId: v, changed: true };
}

module.exports = {
  ACCOUNT_ID_RE, CHARSET, MSG_FORMAT, MSG_DUP,
  normalize, isValid, randomSuffix,
  findByAccountId, generateUniqueAccountId, ensureAccountId, validate, resolveForUpdate,
};
