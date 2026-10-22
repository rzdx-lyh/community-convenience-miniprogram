import { describe, it, expect } from 'vitest';
import { decodeQueryValue } from '../miniprogram/utils/query';

describe('query · URL 参数字典兜底解码', () => {
  it('解码中文与空格', () => {
    expect(decodeQueryValue('%E6%AF%8F%E5%91%A8%E4%B9%89%E8%AF%8A')).toBe('每周义诊');
    expect(decodeQueryValue('hello%20world')).toBe('hello world');
  });

  it('普通中文/英文原样返回，不误伤 5%', () => {
    expect(decodeQueryValue('每周义诊')).toBe('每周义诊');
    expect(decodeQueryValue('5%')).toBe('5%');
  });

  it('空值与非法编码不抛错', () => {
    expect(decodeQueryValue(undefined)).toBe('');
    expect(decodeQueryValue('%E6%AF')).toBe('%E6%AF');
  });
});
