import { describe, expect, it } from 'vitest';
import {
  buildServiceModules,
  buildWorkorderStats,
  decorateStaffOrders,
  filterOrdersByImageAnalysis,
  filterStaffOrders,
  managementHeadline,
} from '../miniprogram/viewmodels/staff-portal';

function order(patch: Partial<WorkOrder> = {}): WorkOrder {
  return {
    _id: 'wo-1',
    _openid: 'resident-1',
    title: '厨房水管漏水',
    description: '水槽下面一直滴水，需要上门处理',
    category: 'water',
    images: [],
    status: 'pending',
    assignee: '',
    handleNote: '',
    createdAt: '2026-11-12T08:30:00.000Z',
    updatedAt: '2026-11-12T08:30:00.000Z',
    ...patch,
  };
}

describe('三端工作人员视图模型', () => {
  it('完整映射居民端 4 类 38 项服务', () => {
    const modules = buildServiceModules();
    expect(modules).toHaveLength(4);
    expect(modules.reduce((sum, item) => sum + item.count, 0)).toBe(38);
    expect(modules.every((item) => item.groups.length > 0)).toBe(true);
    expect(modules.map((item) => item.title)).toEqual([
      '生活基础服务',
      '健康养老服务',
      '便民配套服务',
      '文化便民服务',
    ]);
  });

  it('工单状态会映射为可执行动作', () => {
    const rows = decorateStaffOrders([
      order({ _id: 'a', status: 'pending' }),
      order({ _id: 'b', status: 'assigned' }),
      order({ _id: 'c', status: 'processing' }),
      order({ _id: 'd', status: 'done' }),
    ]);
    expect(rows.map((item) => item.actionKind)).toEqual(['assign', 'process', 'done', '']);
    expect(rows.map((item) => item.actionLabel)).toEqual(['立即接单', '开始处理', '确认完工', '']);
    const managementRows = decorateStaffOrders([
      order({ _id: 'e', status: 'pending' }),
      order({ _id: 'f', status: 'assigned' }),
    ], '', 'management');
    expect(managementRows.map((item) => item.actionKind)).toEqual(['assign', '']);
  });

  it('关键词与状态筛选可组合', () => {
    const rows = decorateStaffOrders([
      order({ _id: 'a', title: '厨房水管漏水', status: 'pending' }),
      order({ _id: 'b', title: '楼道灯不亮', category: 'public', status: 'processing' }),
      order({ _id: 'c', title: '门锁损坏', category: 'door', status: 'pending' }),
    ]);
    expect(filterStaffOrders(rows, '漏水', 'pending').map((item) => item._id)).toEqual(['a']);
    expect(filterStaffOrders(rows, '', 'processing').map((item) => item._id)).toEqual(['b']);
    expect(filterStaffOrders(rows, '门锁', 'all').map((item) => item._id)).toEqual(['c']);
  });

  it('工单统计会区分待受理、进行中和累计完工', () => {
    const stats = buildWorkorderStats([
      order({ status: 'pending' }),
      order({ status: 'assigned' }),
      order({ status: 'processing' }),
      order({ status: 'done' }),
      order({ status: 'closed' }),
    ]);
    expect(stats).toEqual({ pending: 1, assigned: 1, processing: 1, done: 1, active: 3 });
  });

  it('图片识图结果优先匹配同分类工单', () => {
    const rows = decorateStaffOrders([
      order({ _id: 'a', category: 'water' }),
      order({ _id: 'b', category: 'electric', title: '配电箱跳闸' }),
    ]);
    const analysis: WorkOrderImageAnalysis = {
      category: 'electric',
      title: '电路故障',
      description: '疑似开关烧坏',
      urgency: 'high',
      safetyTip: '不要湿手触碰',
      confidence: 0.9,
    };
    expect(filterOrdersByImageAnalysis(rows, analysis).map((item) => item._id)).toEqual(['b']);
  });

  it('不同管理角色显示不同的工作台标题', () => {
    expect(managementHeadline('property')).toBe('物业运营台');
    expect(managementHeadline('admin')).toBe('社区治理台');
    expect(managementHeadline('super_admin')).toBe('平台总控台');
  });
});