/** user 资源服务（契约 user:updateProfile，v1.2 增加 accountId） */
import { STORAGE_KEYS } from '../config/env';
import { store } from '../store/global';
import { call } from '../utils/request';

/**
 * 更新用户资料。
 * ⚠ accountId 的格式/唯一性由后端强校验：非法 → 400，被占用 → 400（msg 由 request 层 toast 原文）。
 */
export function updateProfile(params: UserUpdateProfileParams): Promise<User> {
  return call<UserUpdateProfileResult>(
    'user:updateProfile',
    params as unknown as Record<string, unknown>,
  ).then((res) => {
    store.set(STORAGE_KEYS.PROFILE, res.profile);
    return res.profile;
  });
}
