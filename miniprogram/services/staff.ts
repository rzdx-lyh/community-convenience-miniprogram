/** 工作人员 / 维修人员会话服务 */
import { STORAGE_KEYS } from '../config/env';
import { store } from '../store/global';
import { call } from '../utils/request';

export function getStaffToken(): string {
  return store.peek<string>(STORAGE_KEYS.STAFF_TOKEN, '');
}

export function getCachedStaffProfile(): StaffProfile | null {
  return store.peek<StaffProfile | null>(STORAGE_KEYS.STAFF_PROFILE, null);
}

export function getCachedPortalMode(): PortalMode {
  return store.peek<PortalMode>(STORAGE_KEYS.PORTAL_MODE, 'resident');
}

function persistStaffAuth(result: AuthStaffLoginResult, portalMode: Exclude<PortalMode, 'resident'>): StaffProfile {
  store.set(STORAGE_KEYS.STAFF_TOKEN, result.token);
  store.set(STORAGE_KEYS.STAFF_PROFILE, result.profile);
  store.set(STORAGE_KEYS.STAFF_TOKEN_EXPIRES_AT, result.expiresAt);
  store.set(STORAGE_KEYS.PORTAL_MODE, portalMode);
  return result.profile;
}

export function clearStaffAuth(): void {
  store.set(STORAGE_KEYS.STAFF_TOKEN, '');
  store.set(STORAGE_KEYS.STAFF_PROFILE, null);
  store.set(STORAGE_KEYS.STAFF_TOKEN_EXPIRES_AT, '');
  store.set(STORAGE_KEYS.PORTAL_MODE, 'resident');
}

export async function staffLogin(params: AuthStaffLoginParams): Promise<AuthStaffLoginResult> {
  const result = await call<AuthStaffLoginResult>('auth:staffLogin', { ...params });
  persistStaffAuth(result, params.portalMode);
  return result;
}

export async function refreshStaffSession(): Promise<AuthStaffSessionResult> {
  const token = getStaffToken();
  if (!token) throw new Error('缺少工作人员会话');
  const result = await call<AuthStaffSessionResult>('auth:staffSession', { token });
  store.set(STORAGE_KEYS.STAFF_PROFILE, result.profile);
  store.set(STORAGE_KEYS.STAFF_TOKEN_EXPIRES_AT, result.expiresAt);
  return result;
}

export async function logoutStaff(): Promise<void> {
  const token = getStaffToken();
  try {
    if (token) await call<AuthStaffLogoutResult>('auth:staffLogout', { token });
  } finally {
    clearStaffAuth();
  }
}

export async function changeStaffPassword(oldPassword: string, newPassword: string): Promise<AuthStaffLoginResult> {
  const token = getStaffToken();
  if (!token) throw new Error('缺少工作人员会话');
  const result = await call<AuthStaffLoginResult>('auth:staffChangePassword', {
    token,
    oldPassword,
    newPassword,
  });
  const portal = result.profile.portalMode;
  persistStaffAuth(result, portal);
  return result;
}
