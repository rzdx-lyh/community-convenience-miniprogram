/**
 * 全局环境配置（FE-0）
 * USE_MOCK 是全站唯一的 mock/真实双通道开关：true 走内存 mock，false 走云函数。
 */
export interface EnvConfig {
  /** mock 开关：true=内存 mock（后端未就绪），false=真实云函数（联调/演示） */
  USE_MOCK: boolean;
  /**
   * 演示模式开关（CR-017-c）。
   * `USE_MOCK=true` 且 `DEMO_MODE=false` 时，界面显示「演示数据模式 · 未连接云端」标识；
   * 演示当天置 `true` 即隐藏该标识（避免主动向评委自曝"这是演示数据"）。
   * ⚠ 它**只影响标识显隐**，不改变数据通道：DEMO_MODE=true 时数据仍来自 mock。
   */
  DEMO_MODE: boolean;
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
  USE_MOCK: false, // 2026-10-23 v1.2.0：云函数已按 --remote-npm-install 重部署，auth:whoami 通过，切真云
  // CR-017-c：默认 false（开发/自测时显示「演示数据模式」标识，演示当天置 true 隐藏）
  DEMO_MODE: false,
  CLOUD_ENV_ID: 'cloud1-d5g1xuxxf9eb5b758', // 用户提供（2026-10-14）
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

/**
 * CR-017-c：演示模式标识是否显示（纯函数，便于单测）。
 *
 * 显示条件：**`USE_MOCK === true` 且 `DEMO_MODE === false`**——
 * 即"数据来自本地 mock、且当前不是正式演示"时才提示，避免演示当天自曝。
 *
 * ⚠ 设计原则（CR-018-b）：只依赖**本地配置常量**，不读任何接口出参、不发请求——
 * 「我在降级」这类状态提示绝不能依赖它正在降级的那个通道来传递，否则故障时会一起失效。
 *
 * @param useMock 是否走 mock 通道
 * @param demoMode 是否为演示模式（演示当天置 true）
 */
export function shouldShowMockBanner(useMock: boolean, demoMode: boolean): boolean {
  return useMock === true && demoMode === false;
}

/**
 * 应用版本（唯一真源，v1.2.0）。
 *
 * 与 `package.json`、`cloudfunctions` 下各包的 `package.json`、`README.md` 三处保持一致；
 * `tests/version.test.ts` 会断言四者相等，并在源码里扫出任何非 v1.2.0 的版本字样。
 * 改版本只改这里 + 那三处清单，不要在注释里散落硬编码。
 */
export const APP_VERSION = 'v1.2.0';

/** storage 键名集中管理，避免各处硬编码字符串 */
export const STORAGE_KEYS = {
  ELDER_MODE: 'elderMode',
  AGREED_PRIVACY: 'agreedPrivacy',
  PROFILE: 'profile',
  /**
   * 通道标记：记录 profile 是在哪条通道下写入的（mock / cloud）。
   * 切通道后旧 profile 必须作废——mock 时期的 accountId/openid 在云端不存在，
   * 拿它去请求会让 requireUser 全部 401（表现：公告加载失败、各页空态）。
   */
  PROFILE_CHANNEL: 'profileChannel',
  QA_SESSION_ID: 'qaSessionId',
  /** 契约附 A.3：circle 为 Tab 页不支持 query，用全局态传递筛选 */
  PENDING_CIRCLE_FILTER: 'pendingCircleFilter',
  /** CR-026：缴费账单户号（本地存储，不上传云端） */
  BILL_ACCOUNTS: 'ccfBillAccounts',
  /** CR-026：健康档案自测记录（本地存储，不上传云端） */
  HEALTH_RECORDS: 'ccfHealthRecords',
  /** CR-026：共享设备借用台账（本地存储，登记状态非设备状态） */
  TOOL_BORROWS: 'ccfToolBorrows',
  /** CR-026：快递代取代寄申请记录（本地存储） */
  EXPRESS_ORDERS: 'ccfExpressOrders',
  /** 首启资料设置是否完成（头像/昵称/位置） */
  SETUP_DONE: 'ccfSetupDone',
  /** 首启设置的本地资料兜底（云端 401/断网时仍能显示） */
  SETUP_PROFILE: 'ccfSetupProfile',
  /** 最近一次授权定位（gcj02，含时间戳） */
  USER_LOCATION: 'ccfUserLocation',
} as const;

