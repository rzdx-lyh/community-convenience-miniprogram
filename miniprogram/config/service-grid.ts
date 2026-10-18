/**
 * 四类服务分类 · 本地兜底常量（FE-11 · 白屏兜底）
 *
 * 契约 §service:list：接口为空或调用失败时，前端回退本文件。
 * 结构：4 类 / 8 板块 / 38 项（与设计原型 docs/03-preview/demo.html 的 CATS 逐项对齐，名称一致）。
 *
 * 路由约定（不新增 targetType，零新增动作）：
 *   - 需预约登记的服务：targetType=page → 本分类页自身 + targetParams.book，页内弹层提交；
 *     这样 38 项不必各建一个表单页（契约 CR-022 已登记）
 *   - 通知/活动类：targetType=notice（带 type/tag 筛选）
 *   - 卫生站相关：targetType=page → /pages/phonebook/index?category=medical
 *   - 其余尚未建页的（缴费/生鲜/设备/租售等）：targetType=assistant + 预置问句
 *
 * ⚠ 改 targetPath 前必须确认页面已在 app.json 注册，否则点击无反应。
 */
/** ServiceCategory / ServiceItem 为 typings/model.d.ts 的全局类型，无需 import */

/** 把 groups 展平进 items：广场检索与首页宫格都读 items，两处必须同源，避免手工同步出错 */
function withFlattenedItems(list: ServiceCategory[]): ServiceCategory[] {
  list.forEach((category) => {
    const flat: ServiceItem[] = [];
    (category.groups ?? []).forEach((group) => flat.push(...group.items));
    category.items = flat;
  });
  return list;
}

export const LOCAL_SERVICE_CATEGORIES: ServiceCategory[] = withFlattenedItems([
  {
    _id: 'local_life',
    key: 'life',
    title: '生活基础服务',
    subtitle: '家政服务｜缴费代办｜生鲜零售',
    icon: 'icon-func-life-green-72.png',
    iconTheme: 'green',
    sort: 1,
    status: 'online',
    items: [],
    groups: [
      {
        key: 'house',
        name: '家政服务',
        note: '认证师傅 · 明码标价 · 乱收费全额退款',
        render: 'grid',
        sort: 1,
        items: [
          {
            key: 'house_clean',
            name: '保洁',
            desc: '60 元/小时起',
            targetType: 'page',
            targetPath: '/pages/service/category/index',
            targetParams: { book: '保洁', cat: 'life', opts: '日常保洁|深度保洁|玻璃清洗|开荒保洁' },
            sort: 1,
          },
          {
            key: 'house_repair',
            name: '家电维修',
            desc: '空调/冰箱/洗衣机',
            targetType: 'page',
            targetPath: '/pages/service/category/index',
            targetParams: { book: '家电维修', cat: 'life', opts: '空调|冰箱|洗衣机|热水器' },
            sort: 2,
          },
          {
            key: 'house_drain',
            name: '管道疏通',
            desc: '马桶/地漏/下水',
            targetType: 'page',
            targetPath: '/pages/service/category/index',
            targetParams: { book: '管道疏通', cat: 'life', opts: '马桶|地漏|厨房下水|阳台' },
            sort: 3,
          },
          {
            key: 'house_nanny',
            name: '保姆钟点工',
            desc: '按次或长期',
            targetType: 'page',
            targetPath: '/pages/service/category/index',
            targetParams: { book: '保姆钟点工', cat: 'life', opts: '钟点工|住家保姆|白班保姆' },
            sort: 4,
          },
          {
            key: 'house_lock',
            name: '开锁换锁',
            desc: '需房产证明',
            targetType: 'page',
            targetPath: '/pages/service/category/index',
            targetParams: { book: '开锁换锁', cat: 'life', opts: '开门|换锁芯|装智能锁' },
            sort: 5,
          },
          {
            key: 'house_ac',
            name: '空调清洗',
            desc: '挂机80/柜机150',
            targetType: 'page',
            targetPath: '/pages/service/category/index',
            targetParams: { book: '空调清洗', cat: 'life', opts: '挂机|柜机|中央空调' },
            sort: 6,
          },
        ],
      },
      {
        key: 'bill',
        name: '缴费代办',
        note: '只绑户号与登记，资金在微信「生活缴费」完成',
        render: 'grid',
        sort: 2,
        items: [
          {
            key: 'bill_utility',
            name: '水电燃气代缴',
            desc: '查欠费·代缴',
            targetType: 'page',
            targetPath: '/pages/service/bill/index',
            sort: 1,
          },
          {
            key: 'bill_express',
            name: '快递代取代寄',
            desc: '驿站代收·上门取',
            targetType: 'page',
            targetPath: '/pages/service/express/index',
            sort: 2,
          },
          {
            key: 'bill_gov',
            name: '办事指南',
            desc: '材料·窗口·时限',
            targetType: 'page',
            targetPath: '/pages/service/guide/index',
            sort: 3,
          },
        ],
      },
      {
        key: 'fresh',
        name: '生鲜零售',
        note: '30 分钟配送到家 · 满 39 元免配送费',
        render: 'grid',
        sort: 3,
        items: [
          {
            key: 'fresh_veg',
            name: '当日鲜菜',
            desc: '每日 6:00 到货',
            targetType: 'assistant',
            targetParams: { presetQuestion: '当日鲜菜几点到货？怎么预订？' },
            sort: 1,
          },
          {
            key: 'fresh_clear',
            name: '临期特惠',
            desc: '低至 5 折',
            targetType: 'assistant',
            targetParams: { presetQuestion: '临期特惠在哪里看？当天能取吗？' },
            sort: 2,
          },
          {
            key: 'fresh_group',
            name: '邻里拼单',
            desc: '满 20 单成团',
            targetType: 'assistant',
            targetParams: { presetQuestion: '邻里拼单怎么发起？满多少单成团？' },
            sort: 3,
          },
          {
            key: 'fresh_pickup',
            name: '次日自提',
            desc: '1 号楼驿站取',
            targetType: 'assistant',
            targetParams: { presetQuestion: '次日自提在哪个门取？几点开门？' },
            sort: 4,
          },
        ],
      },
    ],
  },
  {
    _id: 'local_elder',
    key: 'elder',
    title: '健康养老服务',
    subtitle: '基础健康服务｜老年专属服务',
    icon: 'icon-func-elder-green-72.png',
    iconTheme: 'green',
    sort: 2,
    status: 'online',
    items: [],
    groups: [
      {
        key: 'health',
        name: '基础健康服务',
        note: '卫生服务站 · 65 岁以上免挂号费',
        render: 'grid',
        sort: 1,
        items: [
          {
            key: 'health_reg',
            name: '社区门诊挂号',
            desc: '免排队取号',
            targetType: 'page',
            targetPath: '/pages/phonebook/index',
            targetParams: { category: 'medical' },
            sort: 1,
          },
          {
            key: 'health_clinic',
            name: '义诊活动',
            desc: '本周六 9:00',
            targetType: 'notice',
            targetParams: { type: 'activity', tag: '义诊' },
            sort: 2,
          },
          {
            key: 'health_vaccine',
            name: '疫苗预约',
            desc: '儿童/成人/流感',
            targetType: 'assistant',
            targetParams: { presetQuestion: '疫苗怎么预约？儿童要带什么？' },
            sort: 3,
          },
          {
            key: 'health_record',
            name: '健康档案',
            desc: '建档·自测记录',
            targetType: 'page',
            targetPath: '/pages/service/record/index',
            sort: 4,
          },
          {
            key: 'health_meal',
            name: '智慧配餐',
            desc: '按病配餐',
            targetType: 'page',
            targetPath: '/pages/service/meal/index',
            sort: 5,
          },
          {
            key: 'health_bp',
            name: '测血压血糖',
            desc: '自测记录·解读',
            targetType: 'page',
            targetPath: '/pages/service/record/index',
            sort: 6,
          },
          {
            key: 'health_report',
            name: '体检报告代取',
            desc: '代取并解读',
            targetType: 'assistant',
            targetParams: { presetQuestion: '体检报告能代取吗？要带什么？' },
            sort: 7,
          },
        ],
      },
      {
        key: 'elderly',
        name: '老年专属服务',
        note: '60 岁以上可申请，行动不便可上门',
        render: 'grid',
        sort: 2,
        items: [
          {
            key: 'elderly_chronic',
            name: '慢性病咨询',
            desc: '高血压/糖尿病',
            targetType: 'assistant',
            targetParams: { presetQuestion: '慢性病咨询找谁？要带病历吗？' },
            sort: 1,
          },
          {
            key: 'elderly_meal',
            name: '助餐',
            desc: '可送餐上门',
            targetType: 'notice',
            targetParams: { type: 'activity', tag: '助餐' },
            sort: 2,
          },
          {
            key: 'elderly_bath',
            name: '助浴',
            desc: '上门助浴',
            targetType: 'page',
            targetPath: '/pages/service/category/index',
            targetParams: { book: '助浴', cat: 'elder', opts: '上门助浴|陪护助浴' },
            sort: 3,
          },
          {
            key: 'elderly_escort',
            name: '上门陪护',
            desc: '白天/夜间',
            targetType: 'page',
            targetPath: '/pages/service/category/index',
            targetParams: { book: '上门陪护', cat: 'elder', opts: '白天陪护|夜间陪护|24 小时' },
            sort: 4,
          },
          {
            key: 'elderly_reno',
            name: '适老化改造',
            desc: '可申请补贴',
            targetType: 'page',
            targetPath: '/pages/service/category/index',
            targetParams: { book: '适老化改造', cat: 'elder', opts: '防滑地面|安全扶手|坐便改造|全屋适老' },
            sort: 5,
          },
          {
            key: 'elderly_doctor',
            name: '家庭医生签约',
            desc: '基础/慢病包',
            targetType: 'page',
            targetPath: '/pages/service/record/index',
            targetParams: { sign: '1' },
            sort: 6,
          },
        ],
      },
    ],
  },
  {
    _id: 'local_support',
    key: 'support',
    title: '便民配套服务',
    subtitle: '便民工具｜物业延伸',
    icon: 'icon-func-support-warm-72.png',
    iconTheme: 'warm',
    sort: 3,
    status: 'online',
    items: [],
    groups: [
      {
        key: 'tools',
        name: '便民工具',
        note: '扫码借用 · 异地归还 · 到期提醒',
        render: 'grid',
        sort: 1,
        items: [
          {
            key: 'tools_umbrella',
            name: '共享雨伞',
            desc: '24h 内免费',
            targetType: 'page',
            targetPath: '/pages/service/tool/index',
            targetParams: { kind: 'umbrella' },
            sort: 1,
          },
          {
            key: 'tools_toolkit',
            name: '维修工具',
            desc: '电钻·梯子·通厕器',
            targetType: 'page',
            targetPath: '/pages/service/tool/index',
            targetParams: { kind: 'toolkit' },
            sort: 2,
          },
          {
            key: 'tools_power',
            name: '共享充电宝',
            desc: '前 1 小时免费',
            targetType: 'page',
            targetPath: '/pages/service/tool/index',
            targetParams: { kind: 'power' },
            sort: 3,
          },
        ],
      },
      {
        key: 'ext',
        name: '物业延伸',
        note: '物业与业主共治，社区只做信息登记',
        render: 'grid',
        sort: 2,
        items: [
          {
            key: 'ext_takeout',
            name: '外卖代收',
            desc: '存放点·预约上门',
            targetType: 'assistant',
            targetParams: { presetQuestion: '外卖代收放在哪？能放多久？' },
            sort: 1,
          },
          {
            key: 'ext_stray',
            name: '流浪动物',
            desc: '养宠·公约·救助',
            targetType: 'assistant',
            targetParams: { presetQuestion: '遇到流浪动物怎么办？可以投喂吗？' },
            sort: 2,
          },
          {
            key: 'ext_lease',
            name: '房屋租售',
            desc: '真实房源·业主发布',
            targetType: 'assistant',
            targetParams: { presetQuestion: '社区房源怎么发布？是业主本人吗？' },
            sort: 3,
          },
        ],
      },
    ],
  },
  {
    _id: 'local_culture',
    key: 'culture',
    title: '文化便民服务',
    subtitle: '文化便民',
    icon: 'icon-func-culture-warm-72.png',
    iconTheme: 'warm',
    sort: 4,
    status: 'online',
    items: [],
    groups: [
      {
        key: 'culture',
        name: '文化便民',
        note: '社区活动室 · 免费参加',
        render: 'grid',
        sort: 1,
        items: [
          {
            key: 'culture_weekly',
            name: '每周义诊',
            desc: '固定排期',
            targetType: 'notice',
            targetParams: { type: 'activity', tag: '义诊' },
            sort: 1,
          },
          {
            key: 'culture_hr',
            name: '健康报告',
            desc: '年度体检汇总',
            targetType: 'assistant',
            targetParams: { presetQuestion: '健康报告在哪看？多久更新一次？' },
            sort: 2,
          },
          {
            key: 'culture_neighbor',
            name: '邻里活动',
            desc: '本周活动',
            targetType: 'notice',
            targetParams: { type: 'activity' },
            sort: 3,
          },
          {
            key: 'culture_lib',
            name: '图书角借阅',
            desc: '借书/还书',
            targetType: 'assistant',
            targetParams: { presetQuestion: '图书角在哪里？怎么借书还书？' },
            sort: 4,
          },
          {
            key: 'culture_class',
            name: '四点半课堂',
            desc: '放学后托管',
            targetType: 'assistant',
            targetParams: { presetQuestion: '四点半课堂怎么报名？收费吗？' },
            sort: 5,
          },
          {
            key: 'culture_phone',
            name: '长者手机课',
            desc: '基础/进阶',
            targetType: 'notice',
            targetParams: { type: 'activity', tag: '手机课' },
            sort: 6,
          },
        ],
      },
    ],
  },
]);


/** 宫格右下角装饰字符（按主题） */
export const GRID_DECO_TEXT: Record<ServiceCategory['iconTheme'], string> = {
  green: '＋',
  warm: '＋',
};

/** 分类宫格的图标字符（无图标资源时的稳定降级） */
export const GRID_ICON_TEXT: Record<ServiceCategory['key'], string> = {
  life: '🏥',
  elder: '🧓',
  support: '🔧',
  culture: '🏮',
};

/**
 * 取分类下排序最前的子项。
 * 注：CR-022 起宫格点击改为进入服务分类页，本函数保留给
 * 「整卡跳首项」的旧入口与单测使用，不要删。
 */
export function firstItemOf(category: ServiceCategory): ServiceItem | undefined {
  if (!category.items || category.items.length === 0) return undefined;
  return category.items.reduce((min, cur) => (cur.sort < min.sort ? cur : min), category.items[0]);
}
