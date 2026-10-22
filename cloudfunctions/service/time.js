'use strict';

/** 时间工具：全部 ISO8601 字符串（统一 `toISOString()`），禁止时间戳数字入库 */

const isoNow = () => new Date().toISOString();

const isBlank = (v) => v === undefined || v === null || v === '';

/**
 * ISO8601（均为 UTC `...Z` 同格式）可直接字典序比较 == 时间序比较。
 * 判定「事项是否当前有效」：startAt 为空或已生效，且 endAt 为空或未过期。
 */
function isActiveNow(startAt, endAt, nowIso = isoNow()) {
  if (!isBlank(startAt) && String(startAt) > nowIso) return false; // 未到生效时间
  if (!isBlank(endAt) && String(endAt) < nowIso) return false; // 已过期
  return true;
}

/** endAt 非空且 < now → 已过期 */
const isExpired = (endAt, nowIso = isoNow()) => !isBlank(endAt) && String(endAt) < nowIso;

function addDays(base, days) {
  const t = base === undefined || base === null ? Date.now() : new Date(base).getTime();
  return new Date(t + Number(days) * 86400000);
}
const addDaysIso = (days, base) => addDays(base, days).toISOString();

/** 内存分页：page 从 1 起，pageSize 默认 10 上限 50 */
function paginate(rows, page, pageSize) {
  const p = Math.max(1, Math.floor(Number(page) || 1));
  const ps = Math.min(50, Math.max(1, Math.floor(Number(pageSize) || 10)));
  const list = (rows || []).slice((p - 1) * ps, p * ps);
  return { list, total: (rows || []).length, page: p, pageSize: ps };
}

module.exports = { isoNow, isBlank, isActiveNow, isExpired, addDays, addDaysIso, paginate };
