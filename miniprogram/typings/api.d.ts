// 社区便民 · 接口出入参类型（严格照抄 contracts/api-contract.md v1.2）
// 命名规则：`<资源><动作>Params` / `<资源><动作>Result`，与云函数 name 一一对应。

/* ============================== auth ============================== */
/* eslint-disable @typescript-eslint/no-empty-object-type -- 契约入参就是空对象，保留类型名以便 service 层引用 */
declare interface AuthLoginParams {
  // 契约：入参 {}
}
declare interface AuthLoginResult {
  profile: User;
}

/* ============================== user ============================== */
declare interface UserUpdateProfileParams {
  nickName?: string;
  phone?: string;
  building?: string;
  elderMode?: boolean;
  /** v1.2（CR-009）：社区账号，格式 /^[a-z][a-z0-9_]{3,19}$/ */
  accountId?: string;
  /** 头像（云存储 fileID cloud:// 或 http(s) 链接） */
  avatarUrl?: string;
}
declare interface UserUpdateProfileResult {
  profile: User;
}

/* ============================ workorder ============================ */
declare interface WorkOrderCreateParams {
  title: string;
  description: string;
  category: WorkOrder['category'];
  images?: string[];
}
declare interface WorkOrderCreateResult {
  id: string;
  aiSummary: string;
}
declare interface WorkOrderListParams {
  status?: WorkOrder['status'] | '';
  page?: number;
  pageSize?: number;
}
declare interface WorkOrderListResult {
  list: WorkOrder[];
  total: number;
}
declare interface WorkOrderDetailParams {
  id: string;
}
declare interface WorkOrderDetailResult {
  workorder: WorkOrder;
}
declare interface WorkOrderCancelParams {
  id: string;
}
declare interface WorkOrderCancelResult {
  ok: boolean;
}
declare interface WorkOrderHandleParams {
  id: string;
  /** v1.2 契约入参；兼容读法（后端仍支持） */
  action: 'assign' | 'process' | 'done';
  /**
   * CR-011（架构师待补，主理人 2026-10-14 裁决）：业务参数**定稿名** `handleAction`。
   * 原因：`action` 与云函数分发键同名会产生歧义，故新增可选参数；与 action 同值下发，后端优先读它。
   */
  handleAction?: 'assign' | 'process' | 'done';
  note?: string;
}
declare interface WorkOrderHandleResult {
  workorder: WorkOrder;
}

/* ============================== notice ============================== */
declare interface NoticeListParams {
  type?: Notice['type'];
  page?: number;
  pageSize?: number;
  /** v1.2 新增可选入参，默认 false（过滤已过期紧急通知） */
  includeExpired?: boolean;
}
declare interface NoticeListResult {
  list: Notice[];
  total: number;
}
declare interface NoticeDetailParams {
  id: string;
}
declare interface NoticeDetailResult {
  notice: Notice;
}
declare interface NoticeUrgentLatestParams {
  /** 默认 5，上限 10；< 1 按 1 处理 */
  limit?: number;
}
declare interface NoticeUrgentLatestResult {
  list: Notice[];
  total: number;
}

/* ============================== circle ============================== */
declare interface CircleListParams {
  type?: CirclePost['type'];
  /** 精确匹配标签项 */
  tag?: string;
  /** 标题 + 正文 + tags 模糊匹配 */
  keyword?: string;
  page?: number;
  pageSize?: number;
}
declare interface CircleListResult {
  list: CirclePost[];
  total: number;
}
declare interface CircleDetailParams {
  id: string;
}
declare interface CircleDetailResult {
  post: CirclePost;
}

/* ============================== service ============================== */
declare interface ServiceListParams {
  /** 缺省返回全部上线分类 */
  key?: ServiceCategory['key'];
}
declare interface ServiceListResult {
  /** 不分页，固定 ≤4 条，按 sort 升序 */
  list: ServiceCategory[];
}

/* ============================= phonebook ============================= */
declare interface PhonebookListParams {
  category?: PhoneItem['category'];
}
declare interface PhonebookListResult {
  /** 按 sort 升序，不分页 */
  list: PhoneItem[];
}

/* ================================ qa ================================ */
declare interface QaAskParams {
  question: string;
  elderMode?: boolean;
  sessionId?: string;
}
declare interface QaAskResult {
  answerId: string;
  sessionId: string;
  answer: string;
  sources: string[];
  degraded: boolean;
  /**
   * CR-012（安全护栏，架构师待登记）：高风险问题命中标记。
   * 'medical' | 'legal' | 'emergency' 时 answer 为固定安全话术、degraded 恒为 true 且不调用大模型。
   * 前端据此切换降级引导文案；字段可选，老版本后端不返回时按 'none' 处理。
   */
  _riskLevel?: 'none' | 'medical' | 'legal' | 'emergency';
  /** 服务端降级原因：web_ok / web_fallback_timeout / kb_miss 等，便于展示真实状态 */
  _aiReason?: string;
  /** 本次回答使用的实时网页来源数量 */
  _webCount?: number;
}
declare interface QaHistoryParams {
  sessionId?: string;
  page?: number;
  pageSize?: number;
}
declare interface QaHistoryResult {
  list: QaTurn[];
  total: number;
}
declare interface QaClearParams {
  sessionId?: string;
}
declare interface QaClearResult {
  ok: boolean;
}
declare interface QaFeedbackParams {
  answerId: string;
  useful: boolean;
}
declare interface QaFeedbackResult {
  ok: boolean;
}
declare interface QaSuggestParams {
  // 契约：入参 {}
}
/* eslint-enable @typescript-eslint/no-empty-object-type */
declare interface QaSuggestResult {
  questions: string[];
}
