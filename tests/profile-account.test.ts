/**
 * FE-13 社区账号格式校验（契约 CR-009 / 后端强校验同一正则）
 * + FE-8 隐私弹窗判定与关怀模式开关归一化
 * 页面模块在 Node 下加载需要 Page 与 wx 两个全局桩，故用动态 import 先桩后载。
 */
import { beforeAll, describe, expect, it } from 'vitest';

type ProfileModule = typeof import('../miniprogram/pages/profile/index');

let mod: ProfileModule;

beforeAll(async () => {
  const g = globalThis as unknown as Record<string, unknown>;
  g.Page = () => ({});
  g.Component = () => ({});
  g.App = () => ({});
  g.wx = {
    showToast: () => undefined,
    showModal: () => undefined,
    getStorageSync: () => '',
    setStorageSync: () => undefined,
    removeStorageSync: () => undefined,
    getWindowInfo: () => ({ statusBarHeight: 20 }),
    cloud: { init: () => undefined, callFunction: () => undefined },
  };
  mod = await import('../miniprogram/pages/profile/index');
});

describe('isValidAccountId · 合法', () => {
  it('服务端默认形态 linju_xxxxxx', () => {
    expect(mod.isValidAccountId('linju_7k3m9a')).toBe(true);
  });

  it('边界长度 4 与 20', () => {
    expect(mod.isValidAccountId('abcd')).toBe(true); // 4
    expect(mod.isValidAccountId('a'.repeat(20))).toBe(true); // 20
  });

  it('含数字与下划线', () => {
    expect(mod.isValidAccountId('a_b1')).toBe(true);
    expect(mod.isValidAccountId('z9_z9')).toBe(true);
  });
});

describe('isValidAccountId · 非法', () => {
  it('大写开头 / 全大写', () => {
    expect(mod.isValidAccountId('Abcd')).toBe(false);
    expect(mod.isValidAccountId('ABCD')).toBe(false);
  });

  it('长度不足 4 或超过 20', () => {
    expect(mod.isValidAccountId('ab')).toBe(false);
    expect(mod.isValidAccountId('abc')).toBe(false);
    expect(mod.isValidAccountId('a'.repeat(21))).toBe(false);
  });

  it('含空格 / 中文 / 特殊字符 / 空串', () => {
    expect(mod.isValidAccountId('a b c')).toBe(false);
    expect(mod.isValidAccountId('中文账号')).toBe(false);
    expect(mod.isValidAccountId('linju-0523')).toBe(false);
    expect(mod.isValidAccountId('')).toBe(false);
  });
});

describe('normalizeAccountId', () => {
  it('去首尾空白并转小写（与后端入库规则一致）', () => {
    expect(mod.normalizeAccountId('  LINJU_0523  ')).toBe('linju_0523');
    expect(mod.normalizeAccountId('Linju')).toBe('linju');
  });

  it('归一化后再校验：大小写+空格输入应判为合法', () => {
    expect(mod.isValidAccountId(mod.normalizeAccountId('  Linju_0523 '))).toBe(true);
  });
});

describe('shouldAgreePrivacy · 首启隐私弹窗判定（E2）', () => {
  it('未同意 / 空值 / 非布尔真值 → 需要弹窗', () => {
    expect(mod.shouldAgreePrivacy(false)).toBe(true);
    expect(mod.shouldAgreePrivacy(undefined)).toBe(true);
    expect(mod.shouldAgreePrivacy(null)).toBe(true);
    expect(mod.shouldAgreePrivacy('true')).toBe(true); // 字符串 'true' 不算已同意
  });

  it('显式 true → 不再弹窗', () => {
    expect(mod.shouldAgreePrivacy(true)).toBe(false);
  });
});

describe('normalizeElderMode · 关怀模式开关（D2）', () => {
  it('只有布尔 true 才算开启', () => {
    expect(mod.normalizeElderMode(true)).toBe(true);
    expect(mod.normalizeElderMode(false)).toBe(false);
    expect(mod.normalizeElderMode(undefined)).toBe(false);
    expect(mod.normalizeElderMode('true')).toBe(false);
    expect(mod.normalizeElderMode(1)).toBe(false);
  });
});

describe('ACCOUNT_FORMAT_TIP', () => {
  it('与契约 CR-009 / 后端 400 msg 逐字一致', () => {
    expect(mod.ACCOUNT_FORMAT_TIP).toBe('社区账号需 4-20 位小写字母开头，可含数字和下划线');
  });
});
