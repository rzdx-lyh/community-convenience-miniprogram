'use strict';

/**
 * 内存限流（单实例近似，云函数多实例下不严格，仅防误触与刷量）
 * 超限 → 429；不依赖外部组件，无云环境同样生效。
 */
const buckets = new Map();

/** 返回 true 表示已超限 */
function overLimit(key, limit, windowMs) {
  const now = Date.now();
  const arr = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  buckets.set(key, arr);
  return arr.length > limit;
}

const RULE = {
  QA_ASK: { limit: 1, windowMs: 2000 }, // 1 次 / 2s
  WORKORDER_CREATE: { limit: 5, windowMs: 60000 }, // 5 次 / 分
};

module.exports = { overLimit, RULE };
