/**
 * mock 假数据（FE-0 · C2）
 * ⚠ 结构严格对齐契约出参，USE_MOCK=false 切到真实云函数时前端代码零改动。
 * ⚠ 全部为演示用假数据，联调阶段由真实云函数 + scripts/seed.mjs 覆盖，届时整文件删除。
 */
import { LOCAL_SERVICE_CATEGORIES } from '../config/service-grid';
import { tryBuildRiskAnswer } from './risk-rules';

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

function iso(offsetMs: number): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

/* ============================== 用户 ============================== */
const MOCK_USER: User = {
  _id: 'u_mock_001',
  _openid: 'o_mock_openid_001',
  nickName: '阿明的小院',
  phone: '13812345678',
  accountId: 'linju_0523', // v1.2 · 社区账号（真实环境由服务端懒生成）
  role: 'resident',
  building: '3栋2单元',
  elderMode: false,
  createdAt: iso(-30 * DAY),
  updatedAt: iso(-HOUR),
};

/* ========================= 紧急通知（首页轮播） ========================= */
const MOCK_URGENT_NOTICES: Notice[] = [
  {
    _id: 'n_urgent_1',
    title: '停水通知',
    content: '因主管道检修，3 号楼将于 09:00-17:00 停水，请提前储水。',
    type: 'urgent',
    status: 'published',
    publishAt: iso(-2 * HOUR),
    location: '3号楼',
    level: 'high',
    startAt: iso(-1 * HOUR),
    endAt: iso(10 * HOUR),
    summary: '10-14 09:00-17:00 · 3 号楼，请提前储水',
  },
  {
    _id: 'n_urgent_2',
    title: '道路检修',
    content: '2 号门因道路检修封闭施工，请绕行东门。',
    type: 'urgent',
    status: 'published',
    publishAt: iso(-6 * HOUR),
    location: '2号门',
    level: 'high',
    startAt: iso(-5 * HOUR),
    endAt: iso(2 * DAY),
    summary: '10-15 起 2 号门封闭施工，请绕行东门',
  },
  {
    _id: 'n_urgent_3',
    title: '停电通知',
    content: '5-8 号楼例行电力检修，08:00-12:00 停电。',
    type: 'urgent',
    status: 'published',
    publishAt: iso(-10 * HOUR),
    location: '5-8号楼',
    level: 'normal',
    startAt: iso(-8 * HOUR),
    endAt: iso(1 * DAY),
    summary: '10-16 08:00-12:00 · 5-8 号楼例行检修',
  },
];

/* ============================ 通知 / 活动 ============================ */
const MOCK_NOTICES: Notice[] = [
  {
    _id: 'n_notice_1',
    title: '本周公益活动：爱心义诊进社区',
    content: '本周六 9:00-11:30 在社区广场开展免费义诊，欢迎居民参加。',
    type: 'activity',
    status: 'published',
    publishAt: iso(-1 * DAY),
    location: '社区广场',
    signupDeadline: iso(2 * DAY),
  },
  {
    _id: 'n_notice_2',
    title: '长者饭堂助餐服务开始登记',
    content: '60 岁以上居民可登记助餐服务，周一至周五供应午餐。',
    type: 'activity',
    status: 'published',
    publishAt: iso(-2 * DAY),
    location: '社区服务中心',
  },
  {
    _id: 'n_notice_3',
    title: '垃圾分类投放时间调整',
    content: '自本月起，厨余垃圾投放时间调整为 7:00-9:00 与 18:00-20:00。',
    type: 'notice',
    status: 'published',
    publishAt: iso(-3 * DAY),
  },
  {
    _id: 'n_notice_4',
    title: '关于电梯维保的通知',
    content: '3 栋电梯将于本周三进行例行维保，届时暂停使用。',
    type: 'notice',
    status: 'published',
    publishAt: iso(-4 * DAY),
    location: '3栋',
  },
];

/* ============================== 社区圈子 ============================== */
const MOCK_CIRCLE_POSTS: CirclePost[] = [
  {
    _id: 'c_1',
    title: '2 号门道路施工，建议绕行东门',
    content: '2 号门今早开始道路检修，预计持续两天，早高峰建议走东门，步行多 3 分钟但不用堵。',
    type: 'road',
    tags: ['施工', '2号门'],
    authorName: '社区居委会',
    authorRole: 'official',
    images: [],
    sourceType: 'manual',
    status: 'published',
    topFlag: true,
    viewCount: 328,
    publishAt: iso(-2 * HOUR),
    createdAt: iso(-2 * HOUR),
    updatedAt: iso(-2 * HOUR),
  },
  {
    _id: 'c_2',
    title: '3 号楼停水提醒（附储水建议）',
    content: '明天 09:00-17:00 停水，家里有老人的建议今晚先接两桶水，物业办公室也可取水。',
    type: 'road',
    tags: ['停水', '3号楼'],
    authorName: '3栋王阿姨',
    authorRole: 'resident',
    images: [],
    sourceType: 'sync',
    refId: 'n_urgent_1',
    status: 'published',
    topFlag: false,
    viewCount: 156,
    publishAt: iso(-5 * HOUR),
    createdAt: iso(-5 * HOUR),
    updatedAt: iso(-5 * HOUR),
  },
  {
    _id: 'c_3',
    title: '西门人行道路面破损已修复',
    content: '上周反馈的西门路面破损问题已经修好，晚上散步不用绕了，给物业点赞。',
    type: 'road',
    tags: ['路面', '已修复'],
    authorName: '物业服务中心',
    authorRole: 'official',
    images: [],
    sourceType: 'manual',
    status: 'published',
    topFlag: false,
    viewCount: 92,
    publishAt: iso(-1 * DAY),
    createdAt: iso(-1 * DAY),
    updatedAt: iso(-1 * DAY),
  },
  {
    _id: 'c_4',
    title: '本周六爱心义诊，免费测血压血糖',
    content: '社区联合卫生站开展义诊，测血压血糖免费，记得带上医保卡，现场还有健康档案登记。',
    type: 'activity',
    tags: ['义诊', '健康'],
    authorName: '社区居委会',
    authorRole: 'official',
    images: [],
    sourceType: 'sync',
    refId: 'n_notice_1',
    status: 'published',
    topFlag: false,
    viewCount: 210,
    publishAt: iso(-1 * DAY - 3 * HOUR),
    createdAt: iso(-1 * DAY - 3 * HOUR),
    updatedAt: iso(-1 * DAY - 3 * HOUR),
  },
  {
    _id: 'c_5',
    title: '长者饭堂助餐开始登记啦',
    content: '60 岁以上居民可登记助餐，午餐两荤一素，行动不便的可申请送餐上门。',
    type: 'activity',
    tags: ['助餐', '养老'],
    authorName: '社区养老服务中心',
    authorRole: 'official',
    images: [],
    sourceType: 'sync',
    refId: 'n_notice_2',
    status: 'published',
    topFlag: false,
    viewCount: 143,
    publishAt: iso(-2 * DAY),
    createdAt: iso(-2 * DAY),
    updatedAt: iso(-2 * DAY),
  },
  {
    _id: 'c_6',
    title: '垃圾分类投放时间调整公告',
    content: '厨余垃圾投放时间调整为 7:00-9:00 与 18:00-20:00，其他垃圾时间不变。',
    type: 'notice',
    tags: ['垃圾分类'],
    authorName: '社区居委会',
    authorRole: 'official',
    images: [],
    sourceType: 'sync',
    refId: 'n_notice_3',
    status: 'published',
    topFlag: false,
    viewCount: 187,
    publishAt: iso(-3 * DAY),
    createdAt: iso(-3 * DAY),
    updatedAt: iso(-3 * DAY),
  },
  {
    _id: 'c_7',
    title: '电梯周三维保，暂停使用半天',
    content: '3 栋电梯周三上午维保，家里有推车或行动不便的邻居请提前安排出行时间。',
    type: 'notice',
    tags: ['电梯', '维保'],
    authorName: '5栋李叔',
    authorRole: 'resident',
    images: [],
    sourceType: 'manual',
    status: 'published',
    topFlag: false,
    viewCount: 76,
    publishAt: iso(-4 * DAY),
    createdAt: iso(-4 * DAY),
    updatedAt: iso(-4 * DAY),
  },
  {
    _id: 'c_8',
    title: '谁家丢了一只橘猫？在凉亭附近',
    content: '晚上在凉亭看到一只很亲人的橘猫，戴着蓝色项圈，主人看到请联系门卫室。',
    type: 'notice',
    tags: ['邻里', '寻主'],
    authorName: '7栋小张',
    authorRole: 'resident',
    images: [],
    sourceType: 'manual',
    status: 'published',
    topFlag: false,
    viewCount: 134,
    publishAt: iso(-5 * DAY),
    createdAt: iso(-5 * DAY),
    updatedAt: iso(-5 * DAY),
  },
];

/* ============================== 便民电话 ============================== */
/**
 * 便民电话 11 条 —— 与后端 scripts/seed-data.json 的 phonebook（pb-1 … pb-11）**逐字段对齐**
 * （_id / name / phone / category / sort / remark 全部同源）。
 * ⚠ 原 mock 只有 8 条，其中「社区卫生站 020-87651120」「自来水报修 020-87653333」
 *   是**虚构号段 020-8765xxxx**，演示时会显示一套根本不存在的号码，已按真源修正为 020-8888xxxx。
 * ⚠ 后端若改种子，本表必须同步（tests/mock-phonebook.test.ts 会用条数 + 号码集合兜底）。
 */
const MOCK_PHONEBOOK: PhoneItem[] = [
  { _id: 'pb-1', name: '物业服务中心', phone: '020-88888888', category: 'property', sort: 1, remark: '24 小时值班' },
  { _id: 'pb-2', name: '社区居委会', phone: '020-88886666', category: 'government', sort: 2 },
  { _id: 'pb-3', name: '社区卫生服务站', phone: '020-88885555', category: 'medical', sort: 3 },
  { _id: 'pb-4', name: '自来水供水热线', phone: '020-88884444', category: 'life', sort: 4 },
  { _id: 'pb-5', name: '供电服务热线', phone: '020-88883333', category: 'life', sort: 5 },
  { _id: 'pb-6', name: '燃气服务热线', phone: '020-88882222', category: 'life', sort: 6 },
  { _id: 'pb-7', name: '开锁服务', phone: '020-88881111', category: 'life', sort: 7, remark: '公安局备案' },
  { _id: 'pb-8', name: '急救中心', phone: '120', category: 'emergency', sort: 8 },
  {
    _id: 'pb-9',
    name: '社区养老服务中心',
    phone: '020-88880000',
    category: 'life',
    sort: 9,
    remark: '助餐｜助浴｜上门陪护',
  },
  { _id: 'pb-10', name: '报警求助', phone: '110', category: 'emergency', sort: 10, remark: '匪警·治安求助' },
  { _id: 'pb-11', name: '火警', phone: '119', category: 'emergency', sort: 11, remark: '火灾报警救援' },
];

/* ============================== 报修工单 ============================== */
const MOCK_WORKORDERS: WorkOrder[] = [
  {
    _id: 'w_1',
    _openid: 'o_mock_openid_001',
    title: '厨房水管漏水',
    description: '厨房水槽下方水管接口滴水，已用盆接水，请尽快上门处理。',
    category: 'water',
    images: [],
    status: 'processing',
    aiSummary: '厨房水管接口漏水，需上门检修并更换密封件。',
    createdAt: iso(-1 * DAY),
    updatedAt: iso(-6 * HOUR),
  },
  {
    _id: 'w_2',
    _openid: 'o_mock_openid_001',
    title: '楼道灯不亮',
    description: '5 层楼道灯不亮，晚上出行不便。',
    category: 'public',
    images: [],
    status: 'done',
    aiSummary: '公共区域照明故障，需更换灯泡。',
    handleNote: '已更换 LED 灯泡，恢复正常。',
    createdAt: iso(-5 * DAY),
    updatedAt: iso(-4 * DAY),
  },
];

/* ============================ mock 路由表 ============================ */
type Handler = (data: Record<string, unknown>) => unknown;

function paginate<T>(list: T[], data: Record<string, unknown>): { list: T[]; total: number } {
  const page = Number(data.page ?? 1);
  const pageSize = Number(data.pageSize ?? 10);
  const start = (page - 1) * pageSize;
  return { list: list.slice(start, start + pageSize), total: list.length };
}

export const mockHandlers: Record<string, Handler> = {
  /* ---------- auth ---------- */
  'auth:login': () => ({ profile: MOCK_USER }),

  /* ---------- user ---------- */
  'user:updateProfile': (data) => ({
    profile: { ...MOCK_USER, ...(data as Partial<User>), updatedAt: new Date().toISOString() },
  }),

  /* ---------- notice ---------- */
  'notice:list': (data) => {
    const type = data.type as Notice['type'] | undefined;
    const list = type === 'urgent' ? MOCK_URGENT_NOTICES : MOCK_NOTICES.filter((n) => !type || n.type === type);
    return paginate<Notice>(list, data);
  },
  'notice:detail': (data) => {
    const id = String(data.id ?? '');
    const notice = [...MOCK_URGENT_NOTICES, ...MOCK_NOTICES].find((n) => n._id === id);
    return { notice: notice ?? MOCK_NOTICES[0] };
  },
  'notice:urgentLatest': (data) => {
    const limit = Math.min(Math.max(Number(data.limit ?? 5), 1), 10);
    return { list: MOCK_URGENT_NOTICES.slice(0, limit), total: MOCK_URGENT_NOTICES.length };
  },

  /* ---------- circle ---------- */
  'circle:list': (data) => {
    const type = data.type as CirclePost['type'] | undefined;
    const tag = data.tag as string | undefined;
    const keyword = String(data.keyword ?? '').trim();
    let list = MOCK_CIRCLE_POSTS.filter((p) => p.status === 'published');
    if (type) list = list.filter((p) => p.type === type);
    if (tag) list = list.filter((p) => p.tags.indexOf(tag) >= 0);
    if (keyword) {
      list = list.filter(
        (p) => p.title.indexOf(keyword) >= 0 || p.content.indexOf(keyword) >= 0 || p.tags.indexOf(keyword) >= 0,
      );
    }
    // 契约排序：topFlag 降序 → publishAt 降序
    list = [...list].sort((a, b) => {
      if (a.topFlag !== b.topFlag) return a.topFlag ? -1 : 1;
      return new Date(b.publishAt).getTime() - new Date(a.publishAt).getTime();
    });
    return paginate<CirclePost>(list, data);
  },
  'circle:detail': (data) => {
    const id = String(data.id ?? '');
    const post = MOCK_CIRCLE_POSTS.find((p) => p._id === id);
    return { post: post ?? MOCK_CIRCLE_POSTS[0] };
  },

  /* ---------- service ---------- */
  'service:list': (data) => {
    const key = data.key as ServiceCategory['key'] | undefined;
    const list = key ? LOCAL_SERVICE_CATEGORIES.filter((c) => c.key === key) : LOCAL_SERVICE_CATEGORIES;
    return { list };
  },

  /* ---------- phonebook ---------- */
  'phonebook:list': (data) => {
    const category = data.category as PhoneItem['category'] | undefined;
    const list = category ? MOCK_PHONEBOOK.filter((p) => p.category === category) : MOCK_PHONEBOOK;
    return { list: [...list].sort((a, b) => a.sort - b.sort) };
  },

  /* ---------- workorder ---------- */
  'workorder:create': (data) => ({
    id: `w_mock_${Date.now()}`,
    aiSummary: `（mock）${String(data.title ?? '')}：已生成智能摘要，等待物业受理。`,
  }),
  'workorder:list': (data) => paginate<WorkOrder>(MOCK_WORKORDERS, data),
  'workorder:detail': (data) => ({
    workorder: MOCK_WORKORDERS.find((w) => w._id === String(data.id ?? '')) ?? MOCK_WORKORDERS[0],
  }),
  'workorder:cancel': () => ({ ok: true }),
  'workorder:handle': (data) => ({
    // CR-011：优先读定稿参数 handleAction，兼容读 action
    workorder: { ...MOCK_WORKORDERS[0], status: String(data.handleAction ?? data.action ?? 'processing') },
  }),

  /* ---------- qa ---------- */
  'qa:suggest': () => ({
    questions: ['物业费怎么交？', '停水通知在哪里看？', '老年卡怎么办？'],
  }),
  'qa:ask': (data) => {
    const question = String(data.question ?? '');
    const sessionId = String(data.sessionId ?? `s_mock_${Date.now()}`);
    // CR-012：高风险问题在 mock 通道同样短路返回固定安全话术（语义与后端 cloudfunctions/qa/index.js
    // 完全一致，且不调用大模型、不进知识库检索），保证 USE_MOCK=true 的演示现场也能演示出安全话术。
    const riskAnswer = tryBuildRiskAnswer(question, sessionId);
    if (riskAnswer) return riskAnswer;
    return {
      answerId: `a_mock_${Date.now()}`,
      sessionId,
      answer: `（mock 回答）关于「${question}」，建议联系社区居委会或物业服务中心咨询。`,
      sources: ['社区办事指南'],
      degraded: false,
      _riskLevel: 'none',
    };
  },
  'qa:history': () => ({ list: [], total: 0 }),
  'qa:clear': () => ({ ok: true }),
  'qa:feedback': () => ({ ok: true }),
};
