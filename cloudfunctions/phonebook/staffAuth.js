'use strict';

/**
 * 工作人员 / 维修人员认证底座。
 *
 * 安全边界：
 * - 密码只保存 scrypt 哈希与随机盐，数据库与日志不保存明文；
 * - 前端只拿到随机会话令牌，数据库只保存令牌 SHA-256 哈希；
 * - 服务端始终重新读取账号状态与角色，不信任前端传入 role/portalMode；
 * - 工作人员会话与居民 openid 登录态相互独立。
 */
const crypto = require('crypto');
const { db } = require('./db');
const { bizErr, CODES } = require('./response');
const { isoNow } = require('./time');

const STAFF_ROLES = ['property', 'admin', 'super_admin', 'maintenance'];
const MANAGEMENT_ROLES = ['property', 'admin', 'super_admin'];
const MAINTENANCE_ROLES = ['maintenance'];
const PORTAL_ROLES = {
  management: MANAGEMENT_ROLES,
  maintenance: MAINTENANCE_ROLES,
};
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const HASH_ALGORITHM = 'scrypt';

function normalizeUsername(value) {
  return String(value || '').trim().toLowerCase();
}

function validatePassword(password) {
  const value = String(password || '');
  if (value.length < 8) return '密码至少 8 位';
  if (value.length > 64) return '密码不超过 64 位';
  return '';
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

/** 生成 scrypt 密码记录；返回对象可直接写入 staff_accounts。 */
function createPasswordRecord(password) {
  const invalid = validatePassword(password);
  if (invalid) bizErr(CODES.PARAM, invalid);
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { passwordHash: hash, passwordSalt: salt, hashAlgorithm: HASH_ALGORITHM };
}

/** 恒定时间比较密码；参数缺失或算法不支持时返回 false。 */
function verifyPassword(password, staff) {
  if (!staff || staff.hashAlgorithm !== HASH_ALGORITHM) return false;
  if (!staff.passwordHash || !staff.passwordSalt) return false;
  try {
    const expected = Buffer.from(String(staff.passwordHash), 'hex');
    const actual = crypto.scryptSync(String(password || ''), String(staff.passwordSalt), 64);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function roleAllowedForPortal(role, portalMode) {
  return (PORTAL_ROLES[portalMode] || []).includes(role);
}

function portalForRole(role) {
  if (MAINTENANCE_ROLES.includes(role)) return 'maintenance';
  if (MANAGEMENT_ROLES.includes(role)) return 'management';
  return '';
}

function toStaffProfile(staff) {
  return {
    _id: staff._id,
    username: normalizeUsername(staff.username),
    displayName: String(staff.displayName || staff.username || '工作人员'),
    role: staff.role,
    skills: Array.isArray(staff.skills) ? staff.skills.slice(0, 20) : [],
    portalMode: portalForRole(staff.role),
    mustChangePassword: staff.mustChangePassword === true,
    lastLoginAt: staff.lastLoginAt || '',
  };
}

async function findStaffByUsername(username) {
  const normalized = normalizeUsername(username);
  if (!normalized) return null;
  const res = await db
    .collection('staff_accounts')
    .where({ username: normalized })
    .limit(1)
    .get()
    .catch(() => ({ data: [] }));
  return (res.data || [])[0] || null;
}

async function findStaffById(id) {
  if (!id) return null;
  const res = await db.collection('staff_accounts').doc(id).get().catch(() => ({ data: null }));
  return res.data || null;
}

async function createStaffSession(staff, portalMode, device) {
  if (!roleAllowedForPortal(staff.role, portalMode)) {
    bizErr(CODES.FORBIDDEN, '账号角色与登录端不匹配');
  }
  const token = crypto.randomBytes(32).toString('hex');
  const now = isoNow();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  await db.collection('staff_sessions').add({
    data: {
      tokenHash: sha256(token),
      staffId: staff._id,
      portalMode,
      role: staff.role,
      device: device && typeof device === 'object' ? device : {},
      expiresAt,
      lastActiveAt: now,
      revokedAt: '',
      createdAt: now,
    },
  });
  return { token, expiresAt };
}

async function findSessionByToken(token) {
  const tokenHash = sha256(token);
  if (!tokenHash) return null;
  const res = await db
    .collection('staff_sessions')
    .where({ tokenHash })
    .limit(1)
    .get()
    .catch(() => ({ data: [] }));
  return (res.data || [])[0] || null;
}

/**
 * 校验工作人员会话。allowedRoles 可选；portalMode 可选。
 * 返回 { staff, session }，任何异常都转换为稳定的业务错误。
 */
async function requireStaffSession(token, options = {}) {
  if (!token) bizErr(CODES.AUTH, '工作人员登录已失效，请重新登录');
  const session = await findSessionByToken(token);
  if (!session || session.revokedAt) bizErr(CODES.AUTH, '工作人员登录已失效，请重新登录');
  if (session.expiresAt && Date.parse(session.expiresAt) <= Date.now()) {
    bizErr(CODES.AUTH, '工作人员登录已过期，请重新登录');
  }
  const staff = await findStaffById(session.staffId);
  if (!staff) bizErr(CODES.AUTH, '工作人员账号不存在');
  if (staff.status !== 'active') bizErr(CODES.FORBIDDEN, '工作人员账号已停用');
  if (options.portalMode && session.portalMode !== options.portalMode) {
    bizErr(CODES.FORBIDDEN, '登录端不匹配');
  }
  if (options.allowedRoles && !options.allowedRoles.includes(staff.role)) {
    bizErr(CODES.FORBIDDEN, '当前账号无权执行此操作');
  }
  await db.collection('staff_sessions').doc(session._id).update({
    data: { lastActiveAt: isoNow() },
  }).catch(() => null);
  return { staff, session };
}

async function revokeStaffSession(token) {
  if (!token) return false;
  const session = await findSessionByToken(token);
  if (!session) return false;
  await db.collection('staff_sessions').doc(session._id).update({
    data: { revokedAt: isoNow() },
  });
  return true;
}

async function revokeAllStaffSessions(staffId) {
  if (!staffId) return 0;
  const res = await db
    .collection('staff_sessions')
    .where({ staffId, revokedAt: '' })
    .get()
    .catch(() => ({ data: [] }));
  const rows = res.data || [];
  for (const row of rows) {
    await db.collection('staff_sessions').doc(row._id).update({ data: { revokedAt: isoNow() } });
  }
  return rows.length;
}

module.exports = {
  STAFF_ROLES,
  MANAGEMENT_ROLES,
  MAINTENANCE_ROLES,
  PORTAL_ROLES,
  SESSION_TTL_MS,
  normalizeUsername,
  validatePassword,
  sha256,
  createPasswordRecord,
  verifyPassword,
  roleAllowedForPortal,
  portalForRole,
  toStaffProfile,
  findStaffByUsername,
  findStaffById,
  createStaffSession,
  findSessionByToken,
  requireStaffSession,
  revokeStaffSession,
  revokeAllStaffSessions,
};
