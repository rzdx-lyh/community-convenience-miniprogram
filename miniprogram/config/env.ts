/**
 * 全局环境配置（FE-0）
 * USE_MOCK 是全站唯一的 mock/真实双通道开关：true 走内存 mock，false 走云函数。
 */
export interface EnvConfig {
  /** mock 开关：true=内存 mock（后端未就绪），false=真实云函数（联调/演示） */
  USE_MOCK: boolean;
  /** 云开发环境 ID（DevTools 云开发控制台查） */
  CLOUD_ENV_ID: string;
  /** mock 模拟网络延迟（ms） */
  MOCK_DELAY: number;
  /** 订阅消息模板 ID（未申请 → 空数组，静默跳过） */
  SUBSCRIBE_TEMPLATE_IDS: string[];
  /** 分页默认条数（契约默认 10） */
  PAGE_SIZE: number;
  /** 分页单页上限（契约上限 50） */
  MAX_PAGE_SIZE: number;
  /** 工单图片上限 */
  MAX_IMAGES: number;
  /** AI 免责页脚文案（服务端也会注入，前端兜底展示） */
  AI_FOOTER_TEXT: string;
  /** 埋点开关 */
  TRACK_ENABLED: boolean;
  /** 首页紧急通知轮播条目上限（契约 limit 上限 10） */
  URGENT_LIMIT: number;
  /** 紧急通知轮播间隔（ms，设计预览 §0 定 3s） */
  URGENT_SWIPE_INTERVAL: number;
}

export const ENV: EnvConfig = {
  USE_MOCK: true, // TODO(FE-10): 联调通过后置 false
  CLOUD_ENV_ID: '', // TODO(FE-10): 云开发环境 ID
  MOCK_DELAY: 300,
  SUBSCRIBE_TEMPLATE_IDS: [], // TODO(E1): 模板 ID 未申请，空数组静默跳过
  PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
  MAX_IMAGES: 6,
  AI_FOOTER_TEXT: 'AI 生成仅供参考',
  TRACK_ENABLED: false,
  URGENT_LIMIT: 5,
  URGENT_SWIPE_INTERVAL: 3000,
};

/** storage 键名集中管理，避免各处硬编码字符串 */
export const STORAGE_KEYS = {
  ELDER_MODE: 'elderMode',
  AGREED_PRIVACY: 'agreedPrivacy',
  PROFILE: 'profile',
  QA_SESSION_ID: 'qaSessionId',
  /** 契约附 A.3：circle 为 Tab 页不支持 query，用全局态传递筛选 */
  PENDING_CIRCLE_FILTER: 'pendingCircleFilter',
} as const;
