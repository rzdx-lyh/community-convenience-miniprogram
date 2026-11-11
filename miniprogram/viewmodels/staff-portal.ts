/** 三端工作台共用的纯视图模型：服务覆盖、工单卡片、筛选与统计。 */
import { LOCAL_SERVICE_CATEGORIES } from '../config/service-grid';
import { CATEGORY_LABELS, STATUS_LABELS, labelOf } from '../utils/dict';

export interface StaffServiceItemVM {
  key: string;
  name: string;
  desc: string;
}

export interface StaffServiceGroupVM {
  key: string;
  name: string;
  note: string;
  items: StaffServiceItemVM[];
}

export interface StaffServiceModuleVM {
  key: ServiceCategory['key'];
  title: string;
  subtitle: string;
  count: number;
  groupCount: number;
  tone: 'green' | 'teal' | 'warm' | 'indigo';
  icon: string;
  samples: string[];
  groups: StaffServiceGroupVM[];
}

const MODULE_META: Record<ServiceCategory['key'], { tone: StaffServiceModuleVM['tone']; icon: string }> = {
  life: { tone: 'green', icon: 'tools' },
  elder: { tone: 'teal', icon: 'stetho' },
  support: { tone: 'warm', icon: 'package' },
  culture: { tone: 'indigo', icon: 'book-open' },
};

export function buildServiceModules(categories: ServiceCategory[] = LOCAL_SERVICE_CATEGORIES): StaffServiceModuleVM[] {
  return categories
    .slice()
    .sort((a, b) => a.sort - b.sort)
    .map((category) => {
      const groups = (category.groups ?? []).map((group) => ({
        key: group.key,
        name: group.name,
        note: group.note || '',
        items: group.items.map((item) => ({ key: item.key, name: item.name, desc: item.desc || '' })),
      }));
      const meta = MODULE_META[category.key];
      return {
        key: category.key,
        title: category.title,
        subtitle: category.subtitle,
        count: category.items.length,
        groupCount: groups.length,
        tone: meta.tone,
        icon: meta.icon,
        samples: category.items.slice(0, 3).map((item) => item.name),
        groups,
      };
    });
}

export interface StaffOrderVM extends WorkOrder {
  statusLabel: string;
  statusTone: 'pending' | 'assigned' | 'processing' | 'done' | 'off';
  categoryLabel: string;
  createdAtText: string;
  cover: string;
  imageCount: number;
  locationName: string;
  sourceLabel: string;
  actionKind: 'assign' | 'process' | 'done' | '';
  actionLabel: string;
  isMine: boolean;
}

function actionForStatus(status: WorkOrder['status'], mode: 'management' | 'maintenance'): Pick<StaffOrderVM, 'actionKind' | 'actionLabel'> {
  if (status === 'pending') return { actionKind: 'assign', actionLabel: mode === 'management' ? '受理派单' : '立即接单' };
  if (mode === 'management') return { actionKind: '', actionLabel: '' };
  if (status === 'assigned') return { actionKind: 'process', actionLabel: '开始处理' };
  if (status === 'processing') return { actionKind: 'done', actionLabel: '确认完工' };
  return { actionKind: '', actionLabel: '' };
}

function toneForStatus(status: WorkOrder['status']): StaffOrderVM['statusTone'] {
  if (status === 'pending') return 'pending';
  if (status === 'assigned') return 'assigned';
  if (status === 'processing') return 'processing';
  if (status === 'done') return 'done';
  return 'off';
}

export function toStaffOrderVM(
  order: WorkOrder,
  staffId = '',
  mode: 'management' | 'maintenance' = 'maintenance',
): StaffOrderVM {
  const createdAt = String(order.createdAt || '').replace('T', ' ').slice(0, 16);
  const cover = Array.isArray(order.images) && order.images.length ? order.images[0] : '';
  const action = actionForStatus(order.status, mode);
  return {
    ...order,
    statusLabel: labelOf(STATUS_LABELS, order.status, order.status),
    statusTone: toneForStatus(order.status),
    categoryLabel: labelOf(CATEGORY_LABELS, order.category, order.category),
    createdAtText: createdAt,
    cover,
    imageCount: Array.isArray(order.images) ? order.images.length : 0,
    locationName: order.location?.name || '位置待确认',
    sourceLabel: /预约|登记/.test(`${order.title} ${order.description}`) ? '居民预约' : '居民报修',
    actionKind: action.actionKind,
    actionLabel: action.actionLabel,
    isMine: Boolean(staffId && order.assignee === staffId),
  };
}

export function decorateStaffOrders(
  orders: WorkOrder[],
  staffId = '',
  mode: 'management' | 'maintenance' = 'maintenance',
): StaffOrderVM[] {
  return orders.map((order) => toStaffOrderVM(order, staffId, mode));
}

export function filterStaffOrders(
  orders: StaffOrderVM[],
  query = '',
  status = '',
): StaffOrderVM[] {
  const keyword = query.trim().toLowerCase();
  return orders.filter((order) => {
    if (status && status !== 'all' && order.status !== status) return false;
    if (!keyword) return true;
    const haystack = [
      order.title,
      order.description,
      order.aiSummary,
      order.categoryLabel,
      order.locationName,
      order.statusLabel,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(keyword);
  });
}

export interface WorkorderStats {
  pending: number;
  assigned: number;
  processing: number;
  done: number;
  active: number;
}

export function buildWorkorderStats(orders: WorkOrder[]): WorkorderStats {
  const stats: WorkorderStats = { pending: 0, assigned: 0, processing: 0, done: 0, active: 0 };
  for (const order of orders) {
    if (order.status === 'pending') stats.pending += 1;
    else if (order.status === 'assigned') stats.assigned += 1;
    else if (order.status === 'processing') stats.processing += 1;
    else if (order.status === 'done') stats.done += 1;
    if (order.status === 'pending' || order.status === 'assigned' || order.status === 'processing') stats.active += 1;
  }
  return stats;
}

const IMAGE_STOP_WORDS = new Set(['维修', '报修', '问题', '需要', '社区', '居民', '处理', '检查', '可能']);

/** 识图结果 → 相似工单：优先同分类，再按标题/描述关键词回退。 */
export function filterOrdersByImageAnalysis(
  orders: StaffOrderVM[],
  analysis: WorkOrderImageAnalysis | null,
): StaffOrderVM[] {
  if (!analysis) return [];
  const sameCategory = orders.filter((order) => order.category === analysis.category);
  if (sameCategory.length) return sameCategory;
  const tokens = Array.from(
    new Set(
      `${analysis.title} ${analysis.description}`
        .split(/[\s，。；、,.;:：/|]+/)
        .map((token) => token.trim())
        .filter((token) => token.length >= 2 && !IMAGE_STOP_WORDS.has(token)),
    ),
  );
  if (!tokens.length) return [];
  return orders.filter((order) => {
    const text = `${order.title} ${order.description} ${order.aiSummary || ''}`;
    return tokens.some((token) => text.includes(token));
  });
}

export function managementHeadline(role: StaffRole): string {
  if (role === 'property') return '物业运营台';
  if (role === 'admin') return '社区治理台';
  return '平台总控台';
}

export function maintenanceHeadline(role: StaffRole): string {
  return role === 'maintenance' ? '维修调度台' : '工作人员工作台';
}