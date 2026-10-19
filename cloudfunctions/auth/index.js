'use strict';



const { ok, fail, CODES, handler } = require('./shared/response');
const { getOpenId, ensureUser, toProfile } = require('./shared/auth');
const { updateProfile } = require('./shared/profile');

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
    // 兼容早期脚手架描述（auth/package.json 曾写 login/updateProfile）：
    // 契约 v1.2 的正式路由是 user:updateProfile，此处仅做等价转发，入参出参完全一致。
    case 'updateProfile':
      return await updateProfile(getOpenId(), event);
    default:
      return fail(CODES.PARAM, '未知的 action');
  }
});
