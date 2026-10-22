/**
 * URL query 兜底解码（2026-10-23）
 *
 * 微信小程序 `wx.navigateTo` 的 options 不保证自动 decode：
 * 文化便民入口用 `buildQuery()` 做了 encodeURIComponent，真机上
 * `options.title/tag` 可能仍是 `%E6%AF%8F...`。只在命中 %XX 时 decode，
 * 避免把用户正常输入的「5%」误当编码。
 */
export function decodeQueryValue(input: unknown): string {
  const raw = String(input ?? '').trim();
  if (!raw) return '';
  if (!/%[0-9A-Fa-f]{2}/.test(raw)) return raw;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
