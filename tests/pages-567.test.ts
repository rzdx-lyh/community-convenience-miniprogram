/**
 * FE-5 报修详情 / FE-6 通知列表 / FE-7 电话簿 纯函数单测
 * 页面模块在 Node 下加载需要 Page 与 wx 桩，故先桩后动态 import（与 profile-account.test.ts 同法）。
 */
import { beforeAll, describe, expect, it } from 'vitest';

type DetailModule = typeof import('../miniprogram/pages/repair/detail/index');
type NoticeModule = typeof import('../miniprogram/pages/notice/list/index');
type PhoneModule = typeof import('../miniprogram/pages/phonebook/index');

let detail: DetailModule;
let notice: NoticeModule;
let phone: PhoneModule;

beforeAll(async () => {
  const g = globalThis as unknown as Record<string, unknown>;
  g.Page = () => ({});
  g.Component = () => ({});
  g.App = () => ({});
  g.wx = {
    showToast: () => undefined,
    showLoading: () => undefined,
    hideLoading: () => undefined,
    showModal: () => undefined,
    previewImage: () => undefined,
    navigateBack: () => undefined,
    navigateTo: () => undefined,
    switchTab: () => undefined,
    stopPullDownRefresh: () => undefined,
    getStorageSync: () => '',
    setStorageSync: () => undefined,
    removeStorageSync: () => undefined,
    getWindowInfo: () => ({ statusBarHeight: 20 }),
    cloud: { init: () => undefined, callFunction: () => undefined, uploadFile: () => undefined },
  };
  detail = await import('../miniprogram/pages/repair/detail/index');
  notice = await import('../miniprogram/pages/notice/list/index');
  phone = await import('../miniprogram/pages/phonebook/index');
});

/** 造一条工单，字段可覆盖 */
function order(patch: Partial<WorkOrder> = {}): WorkOrder {
  return {
    _id: 'w1',
    _openid: 'o1',
    title: '卫生间水管漏水',
    description: '厨房下水管道渗水，已持续两天',
    category: 'water',
    images: [],
    status: 'pending',
    createdAt: '2026-10-14T10:00:00.000Z',
    updatedAt: '2026-10-14T12:00:00.000Z',
    ...patch,
  };
}

/** 造一条通知，字段可覆盖 */
function noticeItem(patch: Partial<Notice> = {}): Notice {
  return {
    _id: 'n1',
    title: '3 号楼停水通知',
    content: '因主管更换，3 号楼 09:00-18:00 停水',
    type: 'urgent',
    status: 'published',
    publishAt: '2026-10-14T01:00:00.000Z',
    ...patch,
  };
}

/** 造一条电话簿条目，字段可覆盖 */
function phoneItem(patch: Partial<PhoneItem> = {}): PhoneItem {
  return {
    _id: 'p1',
    name: '物业服务中心',
    phone: '0769-8888 1234',
    category: 'property',
    sort: 1,
    ...patch,
  };
}

/* ============================== FE-5 时间轴 ============================== */

describe('FE-5 buildTimeline', () => {
  it('pending：仅「已提交」到达且为当前节点', () => {
    const { nodes, terminal } = detail.buildTimeline('pending');
    expect(terminal).toBe('');
    expect(nodes.map((n) => n.reached)).toEqual([true, false, false, false]);
    expect(nodes[0].current).toBe(true);
  });

  it('assigned：前两节点到达', () => {
    const { nodes } = detail.buildTimeline('assigned');
    expect(nodes.map((n) => n.reached)).toEqual([true, true, false, false]);
    expect(nodes[1].current).toBe(true);
  });

  it('processing：前三节点到达', () => {
    const { nodes } = detail.buildTimeline('processing');
    expect(nodes.map((n) => n.reached)).toEqual([true, true, true, false]);
  });

  it('done：四节点全到达，无终止文案', () => {
    const { nodes, terminal } = detail.buildTimeline('done');
    expect(nodes.map((n) => n.reached)).toEqual([true, true, true, true]);
    expect(terminal).toBe('');
  });

  it('canceled：终止态「已取消」，只点亮「已提交」，不标当前节点', () => {
    const { nodes, terminal } = detail.buildTimeline('canceled');
    expect(terminal).toBe('已取消');
    expect(nodes.map((n) => n.reached)).toEqual([true, false, false, false]);
    expect(nodes.every((n) => !n.current)).toBe(true);
  });

  it('closed：终止态「已关闭」，四节点全到达', () => {
    const { nodes, terminal } = detail.buildTimeline('closed');
    expect(terminal).toBe('已关闭');
    expect(nodes.every((n) => n.reached)).toBe(true);
  });
});

describe('FE-5 toDetailVM', () => {
  it('仅 pending 可取消', () => {
    expect(detail.toDetailVM(order({ status: 'pending' })).canCancel).toBe(true);
    expect(detail.toDetailVM(order({ status: 'processing' })).canCancel).toBe(false);
    expect(detail.toDetailVM(order({ status: 'done' })).canCancel).toBe(false);
  });

  it('无 AI 摘要时不渲染摘要块', () => {
    const vm = detail.toDetailVM(order());
    expect(vm.hasSummary).toBe(false);
    expect(vm.aiSummary).toBe('');
  });

  it('有 AI 摘要时渲染', () => {
    const vm = detail.toDetailVM(order({ aiSummary: '疑似下水管道老化，需更换密封圈' }));
    expect(vm.hasSummary).toBe(true);
  });

  it('处理人与处理备注任一有值才渲染物业处理块', () => {
    expect(detail.toDetailVM(order()).hasHandle).toBe(false);
    expect(detail.toDetailVM(order({ assignee: '张师傅' })).hasHandle).toBe(true);
    expect(detail.toDetailVM(order({ handleNote: '已上门更换' })).hasHandle).toBe(true);
  });

  it('状态与分类文案走字典，不返回空串', () => {
    const vm = detail.toDetailVM(order({ status: 'processing', category: 'door' }));
    expect(vm.statusLabel).toBe('处理中');
    expect(vm.categoryLabel).toBe('门窗');
  });
});

/* ============================== FE-6 通知 ============================== */

describe('FE-6 入参归一化', () => {
  it('type 非法或缺失一律回退 notice', () => {
    expect(notice.normalizeNoticeType(undefined)).toBe('notice');
    expect(notice.normalizeNoticeType('')).toBe('notice');
    expect(notice.normalizeNoticeType('bogus')).toBe('notice');
    expect(notice.normalizeNoticeType('URGENT')).toBe('urgent');
    expect(notice.normalizeNoticeType('activity')).toBe('activity');
  });

  it('tag 缺失为空串，有值则去空格', () => {
    expect(notice.normalizeTag(undefined)).toBe('');
    expect(notice.normalizeTag('  停水  ')).toBe('停水');
  });
});

describe('FE-6 时间文案', () => {
  it('起止都有 → 区间；只有一端 → 单端；都没有 → 空串', () => {
    expect(notice.toRangeText('2026-10-20T09:00:00.000Z', '2026-10-20T18:00:00.000Z')).toContain('至');
    expect(notice.toRangeText('2026-10-20T09:00:00.000Z', undefined)).toContain('起');
    expect(notice.toRangeText(undefined, '2026-10-20T18:00:00.000Z')).toContain('至');
    expect(notice.toRangeText()).toBe('');
  });

  it('报名截止文案，缺省为空串', () => {
    expect(notice.toDeadlineText('2026-10-20T12:00:00.000Z')).toContain('报名截止');
    expect(notice.toDeadlineText(undefined)).toBe('');
  });
});

describe('FE-6 toNoticeVM', () => {
  it('紧急项无 summary 时回退 title', () => {
    const vm = notice.toNoticeVM(noticeItem({ summary: undefined }));
    expect(vm.summary).toBe('3 号楼停水通知');
  });

  it('紧急项有 summary 时优先取 summary', () => {
    const vm = notice.toNoticeVM(noticeItem({ summary: '3 号楼 09:00-18:00 停水' }));
    expect(vm.summary).toBe('3 号楼 09:00-18:00 停水');
  });

  it('紧急 + critical/high 显示级别徽标', () => {
    expect(notice.toNoticeVM(noticeItem({ level: 'critical' })).levelLabel).toBe('特别紧急');
    expect(notice.toNoticeVM(noticeItem({ level: 'high' })).levelLabel).toBe('紧急');
  });

  it('紧急 + normal 不高亮（避免列表一片红）', () => {
    expect(notice.toNoticeVM(noticeItem({ level: 'normal' })).levelLabel).toBe('');
    expect(notice.toNoticeVM(noticeItem({ level: undefined })).levelLabel).toBe('');
  });

  it('非紧急类型即使带 level 也不渲染徽标', () => {
    expect(notice.toNoticeVM(noticeItem({ type: 'notice', level: 'critical' })).levelLabel).toBe('');
  });
});

describe('FE-6 matchTag 本地关键词筛选', () => {
  it('空 tag 全部放行', () => {
    expect(notice.matchTag(noticeItem(), '')).toBe(true);
    expect(notice.matchTag(noticeItem(), '   ')).toBe(true);
  });

  it('命中标题或正文', () => {
    expect(notice.matchTag(noticeItem(), '停水')).toBe(true);
    expect(notice.matchTag(noticeItem({ title: '无', content: '无' }), '停水')).toBe(false);
  });
});

/* ============================== FE-7 电话簿 ============================== */

describe('FE-7 分类入参归一化', () => {
  it('合法值原样返回，非法/缺失回退空串（= 全部）', () => {
    expect(phone.normalizePhoneCategory('medical')).toBe('medical');
    expect(phone.normalizePhoneCategory('EMERGENCY')).toBe('emergency');
    expect(phone.normalizePhoneCategory('bogus')).toBe('');
    expect(phone.normalizePhoneCategory(undefined)).toBe('');
  });
});

describe('FE-7 filterPhoneItems 本地搜索', () => {
  const items: PhoneItem[] = [
    phoneItem({ _id: 'p1', name: '物业服务中心', phone: '0769-8888 1234' }),
    phoneItem({ _id: 'p2', name: '社区卫生站', phone: '0769-8888 5678', remark: '可预约疫苗', category: 'medical' }),
  ];

  it('空关键词不过滤', () => {
    expect(phone.filterPhoneItems(items, '')).toHaveLength(2);
  });

  it('名称命中', () => {
    expect(phone.filterPhoneItems(items, '物业').map((i) => i._id)).toEqual(['p1']);
  });

  it('号码命中（含数字片段）', () => {
    expect(phone.filterPhoneItems(items, '5678').map((i) => i._id)).toEqual(['p2']);
  });

  it('备注命中且大小写不敏感', () => {
    expect(phone.filterPhoneItems(items, '疫苗').map((i) => i._id)).toEqual(['p2']);
    expect(phone.filterPhoneItems(items, '社区卫生站').map((i) => i._id)).toEqual(['p2']);
  });

  it('无命中返回空数组', () => {
    expect(phone.filterPhoneItems(items, '火警')).toEqual([]);
  });
});

describe('FE-7 buildPhoneSections 分组', () => {
  it('按固定分类顺序分组，无数据的分组不渲染', () => {
    const sections = phone.buildPhoneSections([
      phoneItem({ _id: 'p2', category: 'emergency', name: '急救' }),
      phoneItem({ _id: 'p1', category: 'property', name: '物业' }),
    ]);
    expect(sections.map((s) => s.key)).toEqual(['property', 'emergency']);
    expect(sections[0].label).toBe('物业');
    expect(sections[0].items.map((i) => i._id)).toEqual(['p1']);
  });

  it('未知分类兜底进「其他」，绝不丢数据', () => {
    const sections = phone.buildPhoneSections([
      phoneItem({ _id: 'p9', category: 'bogus' as PhoneItem['category'] }),
    ]);
    expect(sections).toHaveLength(1);
    expect(sections[0].key).toBe('other');
    expect(sections[0].label).toBe('其他');
  });

  it('空列表返回空分组', () => {
    expect(phone.buildPhoneSections([])).toEqual([]);
  });
});
