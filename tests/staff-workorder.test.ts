import { beforeEach, describe, expect, it } from 'vitest';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- cloud function is CommonJS
const workorder = require('../cloudfunctions/workorder/index.js') as {
  main: (event: Record<string, unknown>) => Promise<{ code: number; msg: string; data: unknown }>;
};
// eslint-disable-next-line @typescript-eslint/no-require-imports -- cloud function is CommonJS
const workorderDb = require('../cloudfunctions/workorder/db.js') as {
  db: { __mock: { load: (data: Record<string, unknown>) => void } };
};
// eslint-disable-next-line @typescript-eslint/no-require-imports -- cloud function is CommonJS
const staffAuth = require('../cloudfunctions/workorder/staffAuth.js') as {
  createStaffSession: (
    staff: Record<string, unknown>,
    portalMode: string,
    device: Record<string, unknown>,
  ) => Promise<{ token: string; expiresAt: string }>;
};

const staff = {
  _id: 'staff-repair-01',
  username: 'repair01',
  displayName: '维修师傅老张',
  role: 'maintenance',
  skills: ['water', 'electric'],
  status: 'active',
  mustChangePassword: false,
  failedCount: 0,
  lockUntil: '',
};

function wo(id: string, status: WorkOrder['status'], assignee = '', category: WorkOrder['category'] = 'water'): WorkOrder {
  return {
    _id: id,
    _openid: 'resident-1',
    title: `工单 ${id}`,
    description: '厨房水管漏水',
    category,
    images: [],
    status,
    assignee,
    assigneeName: assignee ? '已有处理人' : '',
    handleNote: '',
    createdAt: `2026-11-12T08:0${id.slice(-1)}:00.000Z`,
    updatedAt: '2026-11-12T08:00:00.000Z',
  };
}

describe('工作人员工单接口', () => {
  beforeEach(() => {
    workorderDb.db.__mock.load({
      staff_accounts: [staff],
      staff_sessions: [],
      workorders: [
        wo('wo-1', 'pending'),
        wo('wo-2', 'assigned', staff._id),
        wo('wo-3', 'assigned', 'staff-other'),
      ],
    });
  });

  it('维修端只能看到待接单与自己名下的工单', async () => {
    const session = await staffAuth.createStaffSession(staff, 'maintenance', {});
    const result = await workorder.main({ action: 'staffList', token: session.token });
    expect(result.code).toBe(0);
    const data = result.data as { scope: string; list: WorkOrder[] };
    expect(data.scope).toBe('maintenance');
    expect(data.list.map((item) => item._id).sort()).toEqual(['wo-1', 'wo-2']);
  });

  it('管理端受理后回到待派单池，不占用维修人员名额', async () => {
    const admin = {
      ...staff,
      _id: 'staff-property-01',
      username: 'property01',
      displayName: '物业小王',
      role: 'property',
      skills: [],
    };
    workorderDb.db.__mock.load({
      staff_accounts: [staff, admin],
      staff_sessions: [],
      workorders: [wo('wo-1', 'pending')],
    });
    const session = await staffAuth.createStaffSession(admin, 'management', {});
    const result = await workorder.main({
      action: 'handle',
      handleAction: 'assign',
      id: 'wo-1',
      token: session.token,
    });
    expect(result.code).toBe(0);
    const data = result.data as { workorder: WorkOrder };
    expect(data.workorder.status).toBe('assigned');
    expect(data.workorder.assignee).toBe('');
    expect(data.workorder.assigneeRole).toBe('management');
  });
  it('维修人员可以用 staff token 接单，处理人写入会话账号', async () => {
    const session = await staffAuth.createStaffSession(staff, 'maintenance', {});
    const result = await workorder.main({
      action: 'handle',
      handleAction: 'assign',
      id: 'wo-1',
      token: session.token,
    });
    expect(result.code).toBe(0);
    const data = result.data as { workorder: WorkOrder };
    expect(data.workorder.status).toBe('assigned');
    expect(data.workorder.assignee).toBe(staff._id);
    expect(data.workorder.assigneeName).toBe(staff.displayName);
    expect(data.workorder.assigneeRole).toBe('maintenance');
  });
});