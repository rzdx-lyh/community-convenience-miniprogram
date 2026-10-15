/**
 * 首页「核心功能」2×2 四类服务宫格 · 本地兜底常量（FE-11 · 白屏兜底）
 *
 * 契约 §service:list 明文约定：接口为空或调用失败时，前端回退本地常量。
 * 本文件内容与契约「四类服务承接方案」表逐条对齐（8 个子项，0 个 toast 死胡同）。
 * ⚠ 改文案/跳转路径前先看契约，targetType='page' 的 targetPath 必须在 app.json 中存在。
 */
/** ServiceCategory / ServiceItem 为 typings/model.d.ts 的全局类型，无需 import */

export const LOCAL_SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    _id: 'local_life',
    key: 'life',
    title: '生活基础服务',
    subtitle: '挂号｜义诊｜疫苗档案',
    icon: 'icon-func-life-green-72.png',
    iconTheme: 'green',
    sort: 1,
    status: 'online',
    items: [
      {
        key: 'register',
        name: '挂号',
        targetType: 'page',
        targetPath: '/pages/phonebook/index',
        targetParams: { category: 'medical' },
        sort: 1,
      },
      {
        key: 'clinic',
        name: '义诊',
        targetType: 'notice',
        targetParams: { type: 'activity' },
        sort: 2,
      },
      {
        key: 'vaccine',
        name: '疫苗档案',
        targetType: 'assistant',
        targetParams: { presetQuestion: '孩子的疫苗档案怎么查询？' },
        sort: 3,
      },
    ],
  },
  {
    _id: 'local_elder',
    key: 'elder',
    title: '健康养老服务',
    subtitle: '助餐｜助浴｜上门陪护',
    icon: 'icon-func-elder-green-72.png',
    iconTheme: 'green',
    sort: 2,
    status: 'online',
    items: [
      {
        key: 'meal',
        name: '助餐',
        targetType: 'notice',
        targetParams: { type: 'activity', tag: '助餐' },
        sort: 1,
      },
      {
        key: 'bath',
        name: '助浴',
        targetType: 'phone',
        // 占位号，真环境替换（lead 2026-10-14 统一口径）；后端 service:list 下发后立即覆盖本值
        targetParams: { phone: '020-88880000' },
        sort: 2,
      },
      {
        key: 'care',
        name: '上门陪护',
        targetType: 'assistant',
        targetParams: { presetQuestion: '社区有上门陪护服务吗？' },
        sort: 3,
      },
    ],
  },
  {
    _id: 'local_support',
    key: 'support',
    title: '便民配套服务',
    subtitle: '水电燃气｜适老化改造',
    icon: 'icon-func-support-warm-72.png',
    iconTheme: 'warm',
    sort: 3,
    status: 'online',
    items: [
      {
        key: 'utility',
        name: '水电燃气',
        targetType: 'page',
        targetPath: '/pages/repair/create/index',
        targetParams: { category: 'water' },
        sort: 1,
      },
      {
        key: 'renovation',
        name: '适老化改造',
        targetType: 'assistant',
        targetParams: { presetQuestion: '适老化改造有哪些补贴政策？' },
        sort: 2,
      },
    ],
  },
  {
    _id: 'local_culture',
    key: 'culture',
    title: '文化便民服务',
    subtitle: '每周义诊｜健康报告',
    icon: 'icon-func-culture-warm-72.png',
    iconTheme: 'warm',
    sort: 4,
    status: 'online',
    items: [
      {
        key: 'weekly_clinic',
        name: '每周义诊',
        targetType: 'notice',
        targetParams: { type: 'activity', tag: '义诊' },
        sort: 1,
      },
      {
        key: 'health_report',
        name: '健康报告',
        targetType: 'assistant',
        targetParams: { presetQuestion: '社区免费体检报告怎么领取？' },
        sort: 2,
      },
    ],
  },
];

/** 宫格右下角装饰小图标（按 iconTheme 取；无 PNG 素材前用文本字形占位） */
export const GRID_DECO_TEXT: Record<ServiceCategory['iconTheme'], string> = {
  green: '＋',
  warm: '＋',
};

/** 宫格主图标（无 PNG 素材前的文本字形占位，视觉落位由 wxss 控制） */
export const GRID_ICON_TEXT: Record<ServiceCategory['key'], string> = {
  life: '🏥',
  elder: '🧓',
  support: '🔧',
  culture: '🏮',
};

/**
 * 宫格点击后如何分发：本期宫格整卡热区 → 跳该分类的**第一个子项**。
 * 后续若要做「点开分类再选子项」的二级面板，只需替换本函数的调用方。
 */
export function firstItemOf(category: ServiceCategory): ServiceItem | undefined {
  if (!category.items || category.items.length === 0) return undefined;
  return category.items.reduce((min, cur) => (cur.sort < min.sort ? cur : min), category.items[0]);
}
