'use strict';

/**
 * 内容安全（先审后发）
 * - 云环境：openapi.security.msgSecCheck，suggest==='pass' 放行
 * - 本地 mock：命中测试违禁词「【违禁】」即拒绝（保证拒绝路径可测）
 * - 接口异常：fail-open 放行并记日志 —— 第三方抖动不得阻断报修主流程
 */
const { cloud } = require('./cloud');

async function checkText(openid, text) {
  if (!text) return { pass: true };
  if (!cloud) {
    const pass = !/【违禁】/.test(String(text));
    if (!pass) console.log('[security][mock] 命中测试违禁词，拒绝发布');
    return { pass, reason: pass ? '' : 'mock-banned' };
  }
  try {
    const res = await cloud.openapi.security.msgSecCheck({
      version: 2,
      scene: 2,
      openid,
      content: String(text).slice(0, 2500),
    });
    const pass = !!(res && res.result && res.result.suggest === 'pass');
    return { pass, reason: pass ? '' : res.result && res.result.label };
  } catch (e) {
    console.warn('[security] msgSecCheck 调用失败，fail-open：', e && e.message);
    return { pass: true, reason: 'api-error' };
  }
}

module.exports = { checkText };
