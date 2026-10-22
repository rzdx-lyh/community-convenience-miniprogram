/** v1.2.0 / CR-019：首页「社区动态」视图模型 */
import { describe, expect, it } from 'vitest';
import { FEED_LIMIT, FEED_TYPE_LABELS, toFeedVM } from '../miniprogram/pages/index/viewmodel';

function notice(over: Partial<Notice> = {}): Notice {
  const now = Date.now();
  return {
    _id: 'n_test',
    title: '本周公益活动：爱心义诊进社区',
    content: '本周六 9:00-11:30 在社区广场开展免费义诊。',
    type: 'activity',
    status: 'published',
    publishAt: new Date(now - (5 * 60 + 1) * 60 * 1000).toISOString(), // 5 小时零 1 分钟前
    ...over,
  };
}

describe('toFeedVM · 社区动态条', () => {
  it('类型标签 + 相对时间拼成 meta', () => {
    const vm = toFeedVM(notice());
    expect(vm.title).toBe('本周公益活动：爱心义诊进社区');
    expect(vm.typeLabel).toBe('活动');
    expect(vm.meta).toBe('活动 · 5 小时前');
  });

  it('紧急 / 公告 标签取自同一张字典', () => {
    expect(toFeedVM(notice({ type: 'urgent' })).typeLabel).toBe('紧急');
    expect(toFeedVM(notice({ type: 'notice' })).typeLabel).toBe('公告');
  });

  it('location 缺省为空串（wxml 用 wx:if 跳过渲染）', () => {
    expect(toFeedVM(notice()).location).toBe('');
    expect(toFeedVM(notice({ location: '社区广场' })).location).toBe('社区广场');
  });

  it('未知类型回退「通知」，不渲染 "undefined"', () => {
    const vm = toFeedVM(notice({ type: 'unknown' as Notice['type'] }));
    expect(vm.typeLabel).toBe('通知');
    expect(vm.meta.startsWith('通知')).toBe(true);
  });

  it('publishAt 非法时 meta 只保留类型标签，不出现 "Invalid"', () => {
    const vm = toFeedVM(notice({ publishAt: '' }));
    expect(vm.meta).toBe('活动');
  });
});

describe('FEED 常量', () => {
  it('首屏只放 3 条，类型字典覆盖契约三种 type', () => {
    expect(FEED_LIMIT).toBe(3);
    expect(Object.keys(FEED_TYPE_LABELS).sort()).toEqual(['activity', 'notice', 'urgent']);
  });
});
