/** FE-11：首页视图模型（宫格小字两行拆分 / 宫格 VM / 紧急轮播 VM） */
import { describe, expect, it } from 'vitest';
import { LOCAL_SERVICE_CATEGORIES } from '../miniprogram/config/service-grid';
import { COMMUNITY_NAME, splitSubtitle, toGridVM, toUrgentVM } from '../miniprogram/pages/index/viewmodel';

describe('splitSubtitle · 宫格小字两行拆分', () => {
  it('3 项 → 前 2 项一行，剩余第二行', () => {
    expect(splitSubtitle('挂号｜义诊｜疫苗档案')).toEqual({
      line1: '挂号｜义诊',
      line2: '疫苗档案',
    });
  });

  it('2 项 → 第二行为空串（wxml 里 wx:if 跳过渲染）', () => {
    expect(splitSubtitle('水电燃气｜适老化改造')).toEqual({
      line1: '水电燃气｜适老化改造',
      line2: '',
    });
  });

  it('1 项 / 空串 / 非法入参 → 不抛错', () => {
    expect(splitSubtitle('每周义诊')).toEqual({ line1: '每周义诊', line2: '' });
    expect(splitSubtitle('')).toEqual({ line1: '', line2: '' });
    expect(splitSubtitle(undefined as unknown as string)).toEqual({ line1: '', line2: '' });
  });
});

describe('toGridVM', () => {
  it('生活基础服务：小字两行、绿系图标', () => {
    const vm = toGridVM(LOCAL_SERVICE_CATEGORIES[0]);
    expect(vm).toEqual({
      key: 'life',
      title: '生活基础服务',
      subLine1: '家政服务｜缴费代办',
      subLine2: '生鲜零售',
      iconText: '🏥',
      theme: 'green',
      count: 13,
      decoText: '＋',
    });
  });

  it('iconTheme 与分类一致（第 1/2 格 green，第 3/4 格 warm）', () => {
    expect(LOCAL_SERVICE_CATEGORIES.map((c) => toGridVM(c).theme)).toEqual([
      'green',
      'green',
      'warm',
      'warm',
    ]);
  });

  it('未知 key 回退默认图标字形，不返回空', () => {
    const vm = toGridVM({
      _id: 'x',
      key: 'life',
      title: 't',
      subtitle: '',
      icon: '',
      iconTheme: 'green',
      sort: 1,
      status: 'online',
      items: [],
    });
    expect(vm.iconText).toBeTruthy();
  });
});

describe('toUrgentVM · 紧急轮播', () => {
  it('优先取 summary', () => {
    const vm = toUrgentVM({
      _id: 'n1',
      title: '停水通知',
      content: '',
      type: 'urgent',
      status: 'published',
      publishAt: '2026-10-14T00:00:00.000Z',
      summary: '10-14 09:00-17:00 · 3 号楼',
    });
    expect(vm).toEqual({ id: 'n1', title: '停水通知', sub: '10-14 09:00-17:00 · 3 号楼' });
  });

  it('summary 为空时回退 title（契约约定）', () => {
    const vm = toUrgentVM({
      _id: 'n2',
      title: '道路检修',
      content: '',
      type: 'urgent',
      status: 'published',
      publishAt: '2026-10-14T00:00:00.000Z',
    });
    expect(vm.sub).toBe('道路检修');
  });
});

describe('COMMUNITY_NAME', () => {
  it('首页定位行社区名有值', () => {
    expect(COMMUNITY_NAME).toBeTruthy();
  });
});
