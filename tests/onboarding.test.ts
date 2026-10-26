import { describe, it, expect } from 'vitest';
import {
  avatarText,
  formatCoords,
  isFreshLocation,
  isUsableLocation,
  isValidNickName,
  normalizeNickName,
  NICKNAME_MAX,
} from '../miniprogram/utils/onboarding';

describe('onboarding · 首启资料设置（2026-10-22）', () => {
  it('昵称去首尾空白并压连续空白', () => {
    expect(normalizeNickName('  张   三  ')).toBe('张 三');
    expect(normalizeNickName(null)).toBe('');
  });

  it('昵称 1–20 字有效，空/超长无效', () => {
    expect(isValidNickName('邻')).toBe(true);
    expect(isValidNickName('a'.repeat(NICKNAME_MAX))).toBe(true);
    expect(isValidNickName('a'.repeat(NICKNAME_MAX + 1))).toBe(false);
    expect(isValidNickName('   ')).toBe(false);
  });

  it('头像占位取昵称首字，空昵称用「邻」', () => {
    expect(avatarText('王阿姨')).toBe('王');
    expect(avatarText('')).toBe('邻');
    expect(avatarText('  ')).toBe('邻');
  });

  it('坐标保留 4 位小数，非法值返回空', () => {
    expect(formatCoords(23.128944, 113.264111)).toBe('23.1289, 113.2641');
    expect(formatCoords(Number.NaN, 113)).toBe('');
  });

  it('定位缓存 10 分钟内新鲜，过期为 false', () => {
    const now = 1_000_000;
    expect(isFreshLocation({ latitude: 23, longitude: 113, ts: now - 60_000 }, now)).toBe(true);
    expect(isFreshLocation({ latitude: 23, longitude: 113, ts: now - 11 * 60_000 }, now)).toBe(false);
    expect(isFreshLocation(null, now)).toBe(false);
  });

  it('社区位置点（手选）不按时间过期，只校验坐标', () => {
    expect(isUsableLocation({ latitude: 23, longitude: 113, ts: 1 })).toBe(true);
    expect(isUsableLocation({ latitude: 23, longitude: 113, ts: 0 })).toBe(true);
    expect(isUsableLocation({ latitude: Number.NaN, longitude: 113, ts: 1 })).toBe(false);
    expect(isUsableLocation(null)).toBe(false);
  });
});
