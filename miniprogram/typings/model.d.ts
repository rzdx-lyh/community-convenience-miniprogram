// 社区便民 · 数据模型类型定义（严格照抄 contracts/api-contract.md v1.2「数据结构定义」）
// ⚠ 本文件只做契约转译，禁止私自增删字段；契约变更同步更新本文件。

/** 用户档案（users 集合） */
declare interface User {
  _id: string;
  _openid: string;
  nickName?: string;
  /** 展示时一律脱敏；存储为 AES 密文 */
  phone?: string;
  /** v1.2 · 社区账号，服务端懒生成，必返回且永远有值 */
  accountId: string;
  role: 'resident' | 'property' | 'admin';
  building?: string;
  elderMode?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 报修工单（workorders 集合） */
declare interface WorkOrder {
  _id: string;
  _openid: string;
  title: string;
  description: string;
  category: 'water' | 'electric' | 'door' | 'public' | 'other';
  /** 云存储 fileID 数组 */
  images: string[];
  status: 'pending' | 'assigned' | 'processing' | 'done' | 'closed' | 'canceled';
  aiSummary?: string;
  assignee?: string;
  handleNote?: string;
  createdAt: string;
  updatedAt: string;
}

/** 社区通知 / 活动 / 紧急通知（notices 集合） */
declare interface Notice {
  _id: string;
  title: string;
  content: string;
  /** v1.2 增加 'urgent' */
  type: 'notice' | 'activity' | 'urgent';
  status: 'draft' | 'published';
  publishAt: string;
  location?: string;
  signupDeadline?: string;
  /* ↓ v1.2 新增（CR-005），全部可选，老数据无需迁移 */
  /** 紧急级别；缺省按 'normal' */
  level?: 'critical' | 'high' | 'normal';
  /** 事项起始时间，如停水开始 09:00 */
  startAt?: string;
  /** 事项结束时间；非空且 < now 判为已过期 */
  endAt?: string;
  /** 紧急区单行摘要 ≤40 字；缺省时前端回退 title */
  summary?: string;
}

/** 社区圈子帖（circle_post 集合，v1.2 新增 · 只读） */
declare interface CirclePost {
  _id: string;
  title: string;
  content: string;
  /** 路况 / 公告 / 活动 */
  type: 'road' | 'notice' | 'activity';
  /** 标签，如 ['停水','3号楼'] */
  tags: string[];
  /** 展示用作者名（种子数据可含虚拟居民，如「3栋王阿姨」） */
  authorName: string;
  /** 官方(居委会/物业) / 居民；official 在 UI 上带「官方」徽标 */
  authorRole: 'official' | 'resident';
  /** 真实作者 openid，仅 authority-side 使用，不下发前端 */
  authorOpenid?: string;
  /** fileID ≤3 */
  images: string[];
  /** manual=人工/种子维护；sync=与 notices 自动生成同步 */
  sourceType: 'manual' | 'sync';
  /** sourceType=sync 时关联的 noticeId */
  refId?: string;
  status: 'draft' | 'published';
  /** 置顶 */
  topFlag: boolean;
  /** 浏览量，circle:detail 原子自增 */
  viewCount: number;
  publishAt: string;
  createdAt: string;
  updatedAt: string;
}

/** 四类服务子项（ServiceCategory.items[]，v1.2 新增） */
declare interface ServiceItem {
  /** 子项标识，如 'register' */
  key: string;
  /** 子项名，如 '挂号' */
  name: string;
  targetType: 'page' | 'notice' | 'circle' | 'assistant' | 'phone' | 'toast';
  /** targetType='page' 时的页面路径 */
  targetPath?: string;
  /** 透传参数（query / 筛选 / 预设问题 / 电话号码） */
  targetParams?: Record<string, string>;
  /** targetType='toast' 时的提示文案 */
  tip?: string;
  sort: number;
}

/** 四类服务分类（service_category 集合，v1.2 新增） */
declare interface ServiceCategory {
  _id: string;
  /** 分类唯一 key */
  key: 'life' | 'elder' | 'support' | 'culture';
  /** 分类标题，如「生活基础服务」 */
  title: string;
  /** 宫格小字，如「挂号｜义诊｜疫苗档案」 */
  subtitle: string;
  /** 图标资源名或 fileID */
  icon: string;
  /** green=第1/2格主绿；warm=第3/4格暖橙 */
  iconTheme: 'green' | 'warm';
  /** 1~4 */
  sort: number;
  status: 'online' | 'offline';
  items: ServiceItem[];
}

/** 便民电话簿（phonebook 集合） */
declare interface PhoneItem {
  _id: string;
  name: string;
  phone: string;
  category: 'property' | 'government' | 'medical' | 'life' | 'emergency';
  sort: number;
  remark?: string;
}

/** AI 问答单轮（qa_sessions.turns[]） */
declare interface QaTurn {
  /** 提问方 / 回答方 */
  role: 'user' | 'assistant';
  /** 单条 ≤300 字 */
  content: string;
  createdAt: string;
  /** assistant 轮次才有，供 qa:feedback 引用 */
  answerId?: string;
  /** assistant 轮次才有，引用来源标题 */
  sources?: string[];
  /** assistant 轮次才有 */
  degraded?: boolean;
}

/** AI 会话（qa_sessions 集合） */
declare interface QaSession {
  _id: string;
  _openid: string;
  sessionId: string;
  turns: QaTurn[];
  turnCount: number;
  createdAt: string;
  updatedAt: string;
}
