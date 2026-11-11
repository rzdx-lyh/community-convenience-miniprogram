import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PORTAL_TABS, portalHome, roleAllowedForPortal, staffRoleLabel } from '../miniprogram/config/portal';


// eslint-disable-next-line @typescript-eslint/no-require-imports -- cloud function is CommonJS
const staffAuth = require('../cloudfunctions/shared/staffAuth.js') as {
  normalizeUsername: (value: unknown) => string;
  createPasswordRecord: (password: string) => { passwordHash: string; passwordSalt: string; hashAlgorithm: string };
  verifyPassword: (password: string, staff: Record<string, unknown>) => boolean;
  roleAllowedForPortal: (role: string, portal: string) => boolean;
  toStaffProfile: (staff: Record<string, unknown>) => StaffProfile;
};

describe('阶段 4 · 三端账号与会话底座', () => {
  it('三端入口固定为居民、管理端、维修端', () => {
    expect(PORTAL_TABS.map((item) => item.key)).toEqual(['resident', 'management', 'maintenance']);
    expect(portalHome('management')).toBe('/pages/management/home/index');
    expect(portalHome('maintenance')).toBe('/pages/maintenance/home/index');
  });

  it('角色与登录端严格匹配', () => {
    expect(roleAllowedForPortal('admin', 'management')).toBe(true);
    expect(roleAllowedForPortal('super_admin', 'management')).toBe(true);
    expect(roleAllowedForPortal('property', 'management')).toBe(true);
    expect(roleAllowedForPortal('maintenance', 'maintenance')).toBe(true);
    expect(roleAllowedForPortal('maintenance', 'management')).toBe(false);
    expect(roleAllowedForPortal('admin', 'maintenance')).toBe(false);
    expect(staffRoleLabel('super_admin')).toBe('超级管理员');
  });

  it('密码只生成 scrypt 哈希，正确密码可验证、错误密码拒绝', () => {
    const record = staffAuth.createPasswordRecord('StrongPass123');
    const staff = { ...record, _id: 's1' };
    expect(record.hashAlgorithm).toBe('scrypt');
    expect(record.passwordHash).not.toContain('StrongPass123');
    expect(record.passwordSalt.length).toBeGreaterThanOrEqual(32);
    expect(staffAuth.verifyPassword('StrongPass123', staff)).toBe(true);
    expect(staffAuth.verifyPassword('WrongPass123', staff)).toBe(false);
  });

  it('账号统一小写去空格，会话资料不泄露密码字段', () => {
    expect(staffAuth.normalizeUsername('  Admin01 ')).toBe('admin01');
    const profile = staffAuth.toStaffProfile({
      _id: 's1',
      username: 'ADMIN01',
      displayName: '管理员',
      role: 'admin',
      skills: [],
      mustChangePassword: true,
      passwordHash: 'secret',
      passwordSalt: 'salt',
    });
    expect(profile.username).toBe('admin01');
    expect(profile.portalMode).toBe('management');
    expect(profile.mustChangePassword).toBe(true);
    expect(profile).not.toHaveProperty('passwordHash');
    expect(profile).not.toHaveProperty('passwordSalt');
  });

  it('认证云函数暴露四个工作人员动作，页面已注册', () => {
    const auth = readFileSync(join(process.cwd(), 'cloudfunctions/auth/index.js'), 'utf8');
    for (const action of ['staffLogin', 'staffSession', 'staffLogout', 'staffChangePassword']) {
      expect(auth).toContain(`case '${action}'`);
    }
    const app = JSON.parse(readFileSync(join(process.cwd(), 'miniprogram/app.json'), 'utf8')) as { pages: string[] };
    expect(app.pages).toContain('pages/auth/staff-password/index');
    expect(app.pages).toContain('pages/management/home/index');
    expect(app.pages).toContain('pages/maintenance/home/index');
  });
});



