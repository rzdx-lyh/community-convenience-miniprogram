/**
 * 时间/文本格式化工具（FE-0）
 * ⚠ iOS 真机对 '2026-10-13T02:00:00.000Z' 之外的非标准串会解析为 Invalid Date，
 *   所有展示时间必须先过本文件的 parseDate 归一化。
 */

/** 归一化解析：支持 'YYYY-MM-DDTHH:mm:ss.sssZ' / 'YYYY-MM-DD HH:mm:ss' / 时间戳 */
export function parseDate(input: string | number | Date | undefined | null): Date | null {
  if (input === undefined || input === null || input === '') return null;
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
  if (typeof input === 'number') return new Date(input);

  // ISO8601：把空格替换为 T、补全无时区串的 T 分隔
  const normalized = input.trim().replace(' ', 'T');
  const withZone = /[Zz]$|[+-]\d{2}:?\d{2}$/.test(normalized) ? normalized : `${normalized}Z`;
  const date = new Date(withZone);
  if (!Number.isNaN(date.getTime())) return date;

  // 兜底：手动拆分（应对部分安卓 WebView 对带毫秒 Z 的兼容差异）
  const m = normalized.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  return new Date(
    Date.UTC(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      Number(m[4]),
      Number(m[5]),
      Number(m[6] ?? '0'),
    ),
  );
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** 'YYYY-MM-DD HH:mm' */
export function toDateTime(input: string | number | Date | undefined | null): string {
  const d = parseDate(input);
  if (!d) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}`;
}

/** 'YYYY-MM-DD' */
export function toDate(input: string | number | Date | undefined | null): string {
  const d = parseDate(input);
  if (!d) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 'MM-DD HH:mm' —— 紧急通知摘要、列表时间首选 */
export function toShortDateTime(input: string | number | Date | undefined | null): string {
  const d = parseDate(input);
  if (!d) return '';
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 相对时间：刚刚 / N 分钟前 / N 小时前 / N 天前 / MM-DD */
export function toRelativeTime(input: string | number | Date | undefined | null): string {
  const d = parseDate(input);
  if (!d) return '';
  const diff = Date.now() - d.getTime();
  if (diff < 0) return toShortDateTime(d); // 未来的时间（如活动开始）直接显示日期
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} 小时前`;
  const day = Math.floor(hour / 24);
  if (day < 8) return `${day} 天前`;
  return toShortDateTime(d);
}

/** 手机号脱敏：138****1234（PIPL + db-schema 要求，展示必过此函数） */
export function maskPhone(phone: string | undefined | null): string {
  if (!phone) return '';
  const str = String(phone).trim();
  if (str.length < 7) return str; // 110/119/120 等短号原样展示
  return `${str.slice(0, 3)}****${str.slice(-4)}`;
}

/** 昵称兜底：未登录/空昵称时给稳定展示文案 */
export function displayName(name: string | undefined | null, fallback = '居民朋友'): string {
  const str = (name ?? '').trim();
  return str || fallback;
}

/** 昵称首字（头像内文字占位，未上传头像时展示） */
export function initialOf(name: string | undefined | null): string {
  const str = (name ?? '').trim();
  return str ? str.slice(0, 1) : '邻';
}
