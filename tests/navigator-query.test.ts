/** FE-11：buildQuery 拼串（中文编码 / 空值跳过 / 无参返回空串） */
import { describe, expect, it } from 'vitest';
import { buildQuery } from '../miniprogram/utils/navigator';

describe('buildQuery', () => {
  it('中文参数按 encodeURIComponent 编码（「义诊」→ %E4%B9%89%E8%AF%8A）', () => {
    expect(buildQuery({ type: 'activity', tag: '义诊' })).toBe('?type=activity&tag=%E4%B9%89%E8%AF%8A');
  });

  it('跳过空字符串与 undefined，不产生空 = 号', () => {
    expect(buildQuery({ type: '', tag: undefined })).toBe('');
    expect(buildQuery({ type: 'urgent', tag: undefined })).toBe('?type=urgent');
  });

  it('空对象返回空串（不带问号）', () => {
    expect(buildQuery({})).toBe('');
  });

  it('多参数以 & 连接且保持传入顺序', () => {
    expect(buildQuery({ type: 'activity', tag: '助餐', keyword: '长者' })).toBe(
      `?type=activity&tag=${encodeURIComponent('助餐')}&keyword=${encodeURIComponent('长者')}`,
    );
  });

  it('接受 CircleFilter（type/tag 可选字段）入参', () => {
    expect(buildQuery({ type: 'road' })).toBe('?type=road');
    expect(buildQuery({ tag: '停水' })).toBe(`?tag=${encodeURIComponent('停水')}`);
  });
});
