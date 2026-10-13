/**
 * 字典文案集中维护（FE-0 · C7）
 * 禁止在 wxml 里散落三元表达式，所有状态/分类中文映射一律走这里。
 */

/** 工单状态（契约 WorkOrder.status 全集） */
export const STATUS_LABELS: Record<WorkOrder['status'], string> = {
  pending: '待受理',
  assigned: '已派单',
  processing: '处理中',
  done: '已完成',
  closed: '已关闭',
  canceled: '已取消',
};

/** 工单分类（契约 WorkOrder.category 全集） */
export const CATEGORY_LABELS: Record<WorkOrder['category'], string> = {
  water: '水电',
  electric: '电路',
  door: '门窗',
  public: '公共设施',
  other: '其他',
};

/** 通知类型（v1.2 增加 urgent） */
export const NOTICE_TYPE_LABELS: Record<Notice['type'], string> = {
  notice: '通知',
  activity: '活动',
  urgent: '紧急',
};

/** 紧急级别 */
export const NOTICE_LEVEL_LABELS: Record<NonNullable<Notice['level']>, string> = {
  critical: '特别紧急',
  high: '紧急',
  normal: '一般',
};

/** 圈子类型（契约 CirclePost.type 全集） */
export const CIRCLE_TYPE_LABELS: Record<CirclePost['type'], string> = {
  road: '路况',
  notice: '公告',
  activity: '活动',
};

/** 圈子作者角色 */
export const CIRCLE_ROLE_LABELS: Record<CirclePost['authorRole'], string> = {
  official: '官方',
  resident: '居民',
};

/** 电话簿分类 */
export const PHONE_CATEGORY_LABELS: Record<PhoneItem['category'], string> = {
  property: '物业',
  government: '政务',
  medical: '医疗',
  life: '生活',
  emergency: '急救',
};

/** 用户角色（契约 User.role 全集） */
export const ROLE_LABELS: Record<User['role'], string> = {
  resident: '居民',
  property: '物业',
  admin: '管理员',
};

/** 兜底取值：字典缺失时回退原始值，绝不返回空字符串导致白块 */
export function labelOf<K extends string>(dict: Record<K, string>, key: string, fallback = ''): string {
  return dict[key as K] ?? key ?? fallback;
}
