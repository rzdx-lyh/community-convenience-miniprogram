'use strict';

const { ok, fail, CODES, handler } = require('./response');
const { getOpenId, ensureUser, toProfile } = require('./auth');
const { cloud, cloudError, isCloud } = require('./cloud');
const { db } = require('./db');
const { updateProfile } = require('./profile');
const {
  normalizeUsername,
  createPasswordRecord,
  verifyPassword,
  roleAllowedForPortal,
  toStaffProfile,
  findStaffByUsername,
  createStaffSession,
  requireStaffSession,
  revokeStaffSession,
  revokeAllStaffSessions,
} = require('./staffAuth');

const MAX_FAILED_LOGINS = 5;
const LOGIN_LOCK_MS = 15 * 60 * 1000;

async function login() {
  const openid = getOpenId();
  if (!openid) return fail(CODES.AUTH, '登录态失效，请重新进入小程序');
  const user = await ensureUser(openid);
  const profile = await toProfile(user); // 内部含 accountId 懒迁移
  console.log('[auth] login openid=***' + String(openid).slice(-4) + ' role=' + profile.role);
  return ok({ profile });
}

async function staffLogin(event) {
  const username = normalizeUsername(event.username);
  const password = String(event.password || '');
  const portalMode = String(event.portalMode || '');
  if (!username || !password) return fail(CODES.PARAM, '请输入工作人员账号和密码');
  if (!['management', 'maintenance'].includes(portalMode)) {
    return fail(CODES.PARAM, '登录端参数不合法');
  }

  const staff = await findStaffByUsername(username);
  if (!staff) return fail(CODES.AUTH, '账号或密码错误');
  if (staff.status !== 'active') return fail(CODES.FORBIDDEN, '账号已停用，请联系管理员');
  if (!roleAllowedForPortal(staff.role, portalMode)) {
    return fail(CODES.FORBIDDEN, '该账号不能登录当前端');
  }

  const lockUntilMs = staff.lockUntil ? Date.parse(staff.lockUntil) : 0;
  if (lockUntilMs > Date.now()) {
    return fail(CODES.RATE, '登录失败次数过多，请 15 分钟后再试');
  }

  if (!verifyPassword(password, staff)) {
    const previous = lockUntilMs > 0 && lockUntilMs <= Date.now() ? 0 : Number(staff.failedCount || 0);
    const failedCount = previous + 1;
    const lockUntil = failedCount >= MAX_FAILED_LOGINS
      ? new Date(Date.now() + LOGIN_LOCK_MS).toISOString()
      : '';
    await db.collection('staff_accounts').doc(staff._id).update({
      data: { failedCount, lockUntil, updatedAt: new Date().toISOString() },
    });
    return fail(
      CODES.AUTH,
      lockUntil ? '登录失败次数过多，账号已锁定 15 分钟' : '账号或密码错误',
    );
  }

  const device = event.device && typeof event.device === 'object' ? event.device : {};
  const session = await createStaffSession(staff, portalMode, device);
  const now = new Date().toISOString();
  const updated = Object.assign({}, staff, {
    failedCount: 0,
    lockUntil: '',
    lastLoginAt: now,
    updatedAt: now,
  });
  await db.collection('staff_accounts').doc(staff._id).update({
    data: { failedCount: 0, lockUntil: '', lastLoginAt: now, updatedAt: now },
  });
  console.log(`[auth] staffLogin username=${username} role=${staff.role} portal=${portalMode}`);
  return ok({ token: session.token, expiresAt: session.expiresAt, profile: toStaffProfile(updated) });
}

async function staffSession(event) {
  const token = String(event.token || '');
  const { staff, session } = await requireStaffSession(token);
  return ok({ profile: toStaffProfile(staff), expiresAt: session.expiresAt });
}

async function staffLogout(event) {
  await revokeStaffSession(String(event.token || ''));
  return ok({ ok: true });
}

async function staffChangePassword(event) {
  const token = String(event.token || '');
  const { staff, session } = await requireStaffSession(token);
  const oldPassword = String(event.oldPassword || '');
  const newPassword = String(event.newPassword || '');
  if (!verifyPassword(oldPassword, staff)) return fail(CODES.AUTH, '原密码错误');
  const record = createPasswordRecord(newPassword);
  if (verifyPassword(newPassword, staff)) return fail(CODES.PARAM, '新密码不能与原密码相同');
  const now = new Date().toISOString();
  await revokeAllStaffSessions(staff._id);
  await db.collection('staff_accounts').doc(staff._id).update({
    data: Object.assign({}, record, { mustChangePassword: false, failedCount: 0, lockUntil: '', updatedAt: now }),
  });
  const renewed = await createStaffSession(Object.assign({}, staff, record), session.portalMode, session.device);
  return ok({
    token: renewed.token,
    expiresAt: renewed.expiresAt,
    profile: toStaffProfile(Object.assign({}, staff, record, { mustChangePassword: false })),
  });
}

let __ensuredCollections = false;
async function ensureCollections() {
  if (__ensuredCollections || !isCloud || !cloud) return;
  __ensuredCollections = true;
  for (const name of ['users', 'staff_accounts', 'staff_sessions']) {
    try {
      await cloud.database().createCollection(name);
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
    case 'login':
      return await login(event);
    case 'staffLogin':
      return await staffLogin(event);
    case 'staffSession':
      return await staffSession(event);
    case 'staffLogout':
      return await staffLogout(event);
    case 'staffChangePassword':
      return await staffChangePassword(event);
    // 临时诊断：只回报身份上下文里有哪些键，不回传任何值本身。
    case 'whoami': {
      const ctx = cloud && cloud.getWXContext ? cloud.getWXContext() || {} : {};
      const envKeyNames = Object.keys(process.env)
        .filter((key) => /^(WX_|TCB_|SCF_|CCF_)/.test(key))
        .sort();
      return ok({
        ctxKeys: Object.keys(ctx),
        hasOpenid: !!ctx.OPENID,
        hasAppid: !!ctx.APPID,
        env: ctx.ENV || '',
        cloudReady: !!cloud,
        cloudError,
        dbIsMock: !!db.__isMock,
        forceMock: process.env.CCF_FORCE_MOCK === '1',
        identityEnvPresent: !!process.env.WX_CONTEXT_KEYS,
        envKeyNames,
        runtime: process.version,
      });
    }
    // 兼容早期脚手架描述：正式路由是 user:updateProfile，此处仅做等价转发。
    case 'updateProfile':
      return await updateProfile(getOpenId(), event);
    default:
      return fail(CODES.PARAM, '未知的 action');
  }
});
