/** 三端入口与角色路由（纯函数，便于单测与页面复用） */
export const PORTAL_TABS: Array<{ key: PortalMode; label: string; desc: string }> = [
  { key: 'resident', label: '居民 / 家长', desc: 'AI 管家 · 38 项服务 · 一键报修' },
  { key: 'management', label: '管理端', desc: '物业运营 · 工单调度 · 服务全景' },
  { key: 'maintenance', label: '维修端', desc: '抢单 · 上门处理 · 完工同步' },
];

const MANAGEMENT_ROLES: StaffRole[] = ['property', 'admin', 'super_admin'];
const MAINTENANCE_ROLES: StaffRole[] = ['maintenance'];

export function isStaffRole(role: string): role is StaffRole {
  return MANAGEMENT_ROLES.concat(MAINTENANCE_ROLES).includes(role as StaffRole);
}

export function roleAllowedForPortal(role: string, portal: PortalMode): boolean {
  if (portal === 'management') return MANAGEMENT_ROLES.includes(role as StaffRole);
  if (portal === 'maintenance') return MAINTENANCE_ROLES.includes(role as StaffRole);
  return role === 'resident' || role === 'guardian';
}

export function portalHome(portal: PortalMode): string {
  if (portal === 'management') return '/pages/management/home/index';
  if (portal === 'maintenance') return '/pages/maintenance/home/index';
  return '/pages/index/index';
}

export function portalLabel(portal: PortalMode): string {
  return PORTAL_TABS.find((item) => item.key === portal)?.label ?? '居民 / 家长';
}

export function staffRoleLabel(role: StaffRole): string {
  return {
    property: '物业工作人员',
    admin: '社区管理员',
    super_admin: '超级管理员',
    maintenance: '维修人员',
  }[role];
}
