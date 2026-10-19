'use strict';

/**
 * 统一响应封装：{ code, msg, data }
 * 错误码严格复用契约 api-contract.md 抬头 8 码表，不新增任何码。
 */
const CODES = {
  OK: 0,
  PARAM: 400, // 参数错误（含内容审核拒绝、账号占用/格式非法）
  AUTH: 401, // 未登录 / 登录态失效
  FORBIDDEN: 403, // 无权限（角色不符或越权访问他人工单）
  NOT_FOUND: 404, // 资源不存在（仅单条查询接口）
  RATE: 429, // 请求过于频繁
  ERROR: 500, // 服务内部错误
  AI_DOWN: 503, // AI 服务暂时不可用（已降级）
};

const ok = (data = {}) => ({ code: CODES.OK, msg: 'ok', data });
const fail = (code, msg) => ({ code, msg, data: null });

/**
 * 业务异常：throw 后由 handler 统一转成 fail 响应。
 * 非 bizErr（真正的代码异常）一律收敛为 500，避免把堆栈抛给前端。
 */
function bizErr(code, msg) {
  const e = new Error(msg);
  e.biz = { code, msg };
  throw e;
}

/**
 * 云函数入口包装：捕获 bizErr → 对应错误码；其余 → 500。
 * 保证所有出口恒为 {code,msg,data}，无裸返回。
 */
function handler(fn) {
  return async (event, context) => {
    try {
      return await fn(event || {}, context || {});
    } catch (e) {
      if (e && e.biz) return fail(e.biz.code, e.biz.msg);
      console.error('[cf] 未捕获异常：', e && e.stack ? e.stack : e);
      return fail(CODES.ERROR, '服务内部错误');
    }
  };
}

/** 剔除出参中的隐私/内部字段（如 circle_post.authorOpenid） */
function omit(obj, keys = []) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  Object.keys(obj).forEach((k) => {
    if (!keys.includes(k)) out[k] = obj[k];
  });
  return out;
}

module.exports = { CODES, ok, fail, bizErr, handler, omit };
