'use strict';

const { ok, fail, CODES, handler } = require('./response');
const { getOpenId, ensureUser, toProfile } = require('./auth');
const { cloud, cloudError } = require('./cloud');
const { db } = require('./db');
const { updateProfile } = require('./profile');

async function login() {
  const openid = getOpenId();
  if (!openid) return fail(CODES.AUTH, '登录态失效，请重新进入小程序');
  const user = await ensureUser(openid);
  const profile = await toProfile(user); // 内部含 accountId 懒迁移
  console.log('[auth] login openid=***' + String(openid).slice(-4) + ' role=' + profile.role);
  return ok({ profile });
}

exports.main = handler(async (event = {}) => {
  const action = (event && event.action) || '';
  switch (action) {
    case 'login':
      return await login(event);
    // ⚠ 临时诊断（定位「openid 为空」问题，定位后删除）：
    // 只回报身份上下文里有哪些键、是否有 openid，不回传任何值本身。
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
    // 兼容早期脚手架描述（auth/package.json 曾写 login/updateProfile）：
    // 契约 v1.2 的正式路由是 user:updateProfile，此处仅做等价转发，入参出参完全一致。
    case 'updateProfile':
      return await updateProfile(getOpenId(), event);
    default:
      return fail(CODES.PARAM, '未知的 action');
  }
});
