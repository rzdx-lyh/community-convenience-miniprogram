/** auth 资源服务（契约 auth:login） */
import { ENV, STORAGE_KEYS } from '../config/env';
import { store } from '../store/global';
import { call } from '../utils/request';

/**
 * 静默登录：首次登录自动建档（role 默认 resident）。
 * 成功后把 profile 写入全局 store（含 v1.2 的 accountId），首页用户信息条直接读。
 */
export function login(): Promise<User> {
  return call<AuthLoginResult>('auth:login', {}).then((res) => {
    store.set(STORAGE_KEYS.PROFILE, res.profile);
    store.set(STORAGE_KEYS.PROFILE_CHANNEL, CHANNEL());
    return res.profile;
  });
}

/** 当前通道标识 */
const CHANNEL = (): string => (ENV.USE_MOCK ? 'mock' : 'cloud');

/**
 * 读取已缓存 profile；无缓存时走一次静默登录。
 *
 * ⚠ 必须校验「缓存是哪个通道写的」：
 * USE_MOCK=true 时期写入的 profile（含 mock 的 accountId/openid）在云端并不存在，
 * 若直接复用，`auth:login` 会被跳过 → 云端没有这条用户 → 所有 requireUser 接口 401。
 * 线上表现就是「公告加载失败 + 各页空态」，但代码看起来完全正常。
 */
export function getProfile(): Promise<User> {
  const tag = store.peek<string>(STORAGE_KEYS.PROFILE_CHANNEL, '');
  const cached = store.peek<User | null>(STORAGE_KEYS.PROFILE, null);
  if (tag === CHANNEL() && cached && cached.accountId) return Promise.resolve(cached);
  // 通道不一致（或缓存残缺）：丢弃旧 profile，重新静默登录建档
  return login();
}
