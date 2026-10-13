/** auth 资源服务（契约 auth:login） */
import { STORAGE_KEYS } from '../config/env';
import { store } from '../store/global';
import { call } from '../utils/request';

/**
 * 静默登录：首次登录自动建档（role 默认 resident）。
 * 成功后把 profile 写入全局 store（含 v1.2 的 accountId），首页用户信息条直接读。
 */
export function login(): Promise<User> {
  return call<AuthLoginResult>('auth:login', {}).then((res) => {
    store.set(STORAGE_KEYS.PROFILE, res.profile);
    return res.profile;
  });
}

/** 读取已缓存 profile；无缓存时走一次静默登录 */
export function getProfile(): Promise<User> {
  const cached = store.peek<User | null>(STORAGE_KEYS.PROFILE, null);
  if (cached && cached.accountId) return Promise.resolve(cached);
  return login();
}
