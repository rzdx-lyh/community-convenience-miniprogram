/**
 * 种子数据生成：node scripts/seed.mjs
 * 产出 scripts/seed-data.json —— ① 云开发控制台「数据库 → 导入」注入真环境
 *                              ② 本地 mock（cloudfunctions/shared/db.js）自动载入
 *
 * ⚠ 演示红线（风险 R-B）：紧急通知的 startAt/endAt 必须用【相对时间】生成（now ± Nd），
 *   绝不写死日期 —— 否则演示当天会显示"已过期"空态，直接丢掉体验分。
 *   10-23 打包前请重跑本脚本。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'seed-data.json');

// 号码真源：与 CR-012 安全话术共用 cloudfunctions/shared/hotline.js，
// 避免「话术让打 A 号、便民电话簿里是 B 号」（架构评审新增约束）。
const { HOTLINE } = require('../cloudfunctions/shared/hotline.js');

const NOW = Date.now();
const H = 3600000;
const D = 86400000;
const iso = (ms) => new Date(ms).toISOString();
const at = (offsetMs) => iso(NOW + offsetMs);
const md = (ms) => {
  const d = new Date(ms);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
};
const hm = (ms) => {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/* ----------------------------- users（3 个测试账号 + 1 个懒迁移演示账号） ----------------------------- */
const nowIso = iso(NOW);
const users = [
  {
    _id: 'u-resident-1', _openid: 'mock-resident-1', nickName: '居民甲', role: 'resident',
    building: '3栋2单元', elderMode: false, accountId: 'linju_7k3m9a',
    createdAt: at(-30 * D), updatedAt: at(-30 * D),
  },
  {
    _id: 'u-property-1', _openid: 'mock-property-1', nickName: '物业小王', role: 'property',
    building: '1栋物业前台', elderMode: false, accountId: 'linju_p2q8zt',
    createdAt: at(-30 * D), updatedAt: at(-30 * D),
  },
  {
    _id: 'u-admin-1', _openid: 'mock-admin-1', nickName: '社区管理员', role: 'admin',
    building: '社区居委会', elderMode: false, accountId: 'linju_h4v6rc',
    createdAt: at(-30 * D), updatedAt: at(-30 * D),
  },
  // ⚠ 仅用于 BE-12 验收项「懒迁移」演示（accountId 为空的历史用户，登录时服务端自动补值）。
  // 导入真环境时可直接删除本条，不影响任何业务。
  {
    _id: 'u-legacy-1', _openid: 'mock-legacy-1', nickName: '老用户（懒迁移演示）', role: 'resident',
    building: '6栋1单元', elderMode: true, accountId: '',
    createdAt: at(-60 * D), updatedAt: at(-60 * D),
  },
];

/* ----------------------------------------- workorders ----------------------------------------- */
const workorders = [
  {
    _id: 'wo-1', _openid: 'mock-resident-1', title: '厨房水管漏水',
    description: '厨房水槽下方水管接头漏水，已关闭总阀，请求上门维修。',
    category: 'water', images: [], status: 'pending',
    aiSummary: '厨房水管接头漏水，建议 24 小时内上门更换密封垫，优先级：高。',
    createdAt: at(-2 * D), updatedAt: at(-2 * D),
  },
  {
    _id: 'wo-2', _openid: 'mock-resident-1', title: '楼道灯不亮',
    description: '3栋2单元 4 楼楼道灯不亮，晚上出行不便。',
    category: 'public', images: [], status: 'processing', assignee: 'mock-property-1',
    handleNote: '已派电工上门，预计今日完成。',
    aiSummary: '楼道照明故障，需更换灯管，优先级：中。',
    createdAt: at(-5 * D), updatedAt: at(-1 * D),
  },
  {
    _id: 'wo-3', _openid: 'mock-resident-1', title: '单元门禁失灵',
    description: '单元门禁刷卡无反应，需刷卡或密码才能进入。',
    category: 'door', images: [], status: 'done', assignee: 'mock-property-1',
    handleNote: '门禁读头更换完成，已恢复正常。',
    aiSummary: '门禁读头故障，已更换，优先级：高。',
    createdAt: at(-10 * D), updatedAt: at(-8 * D),
  },
];

/* ------------------------------------------- notices ------------------------------------------- */
// v1.1 既有 4 条（2 通知 + 2 活动，其中 1 条 draft 不应出现在列表）
const notices = [
  {
    _id: 'nt-1', title: '关于小区停水检修的通知',
    content: '本周六 9:00-17:00 将对小区主管网进行停水检修，请提前储水。',
    type: 'notice', status: 'published', publishAt: at(-3 * D),
  },
  {
    _id: 'nt-2', title: '燃气安全入户检查安排',
    content: '下周起逐栋入户检查燃气管道与阀门，请家中留人配合。',
    type: 'notice', status: 'published', publishAt: at(-2 * D),
  },
  {
    _id: 'nt-3', title: '重阳节敬老活动报名',
    content: `${md(NOW + 8 * D)} 社区广场开展义诊与文艺汇演，欢迎 60 岁以上居民报名参加。`,
    type: 'activity', status: 'published', publishAt: at(-1 * D),
    location: '社区广场', signupDeadline: at(5 * D),
  },
  {
    _id: 'nt-4', title: '内部草稿（不应出现在列表）',
    content: '草稿内容', type: 'notice', status: 'draft', publishAt: at(-1 * D),
  },
];

// v1.2 增量：3 条 type=urgent（相对时间，保证演示当天「当前有效」）
// 起始一律取「已生效」（now - Nh），结束一律取「未到期」（now + Nd），
// 保证任何时刻跑脚本都不会出现过期/未生效的空态。
const waterStart = NOW - 1 * H;
const waterEnd = NOW + 2 * D;
const roadStart = NOW - 6 * H;
const roadEnd = NOW + 7 * D;
const liftStart = NOW - 2 * D;
const liftEnd = NOW + 2 * D;

notices.push(
  {
    _id: 'nu-1',
    title: `${md(waterStart)} 3号楼停水通知`,
    content:
      `因主管网检修，3 号楼自 ${md(waterStart)} ${hm(waterStart)} 起停水，预计 48 小时内恢复。` +
      '请提前储水，恢复供水后可能出现短暂浑浊，排放数分钟即可。',
    type: 'urgent', status: 'published', publishAt: at(-12 * H),
    location: '3号楼', level: 'high',
    startAt: iso(waterStart), endAt: iso(waterEnd),
    summary: `${md(waterStart)} ${hm(waterStart)} 起停水 · 3号楼`,
  },
  {
    _id: 'nu-2',
    title: '小区南门道路检修施工',
    content: '南门进出道路分段检修，施工期间车道变窄，建议车辆由西门绕行，行人注意安全。',
    type: 'urgent', status: 'published', publishAt: at(-20 * H),
    location: '小区南门', level: 'normal',
    startAt: iso(roadStart), endAt: iso(roadEnd),
    summary: '南门道路检修，车辆请绕行西门',
  },
  {
    _id: 'nu-3',
    title: '5号楼电梯年检停用',
    content:
      `${md(liftStart)} 至 ${md(liftEnd)} 期间 5 号楼两台电梯进行年检，` +
      '每日 10:00-16:00 停用，请高层住户提前安排出行。',
    type: 'urgent', status: 'published', publishAt: at(-30 * H),
    location: '5号楼', level: 'critical',
    startAt: iso(liftStart), endAt: iso(liftEnd),
    summary: '5号楼电梯年检，10:00-16:00 停用',
  },
);

/* ----------------------------------------- phonebook ----------------------------------------- */
const phonebook = [
  { _id: 'pb-1', name: '物业服务中心', phone: HOTLINE.PROPERTY, category: 'property', sort: 1, remark: '24 小时值班' },
  { _id: 'pb-2', name: '社区居委会', phone: HOTLINE.COMMITTEE, category: 'government', sort: 2 },
  { _id: 'pb-3', name: '社区卫生服务站', phone: '020-88885555', category: 'medical', sort: 3 },
  { _id: 'pb-4', name: '自来水供水热线', phone: '020-88884444', category: 'life', sort: 4 },
  { _id: 'pb-5', name: '供电服务热线', phone: '020-88883333', category: 'life', sort: 5 },
  { _id: 'pb-6', name: '燃气服务热线', phone: '020-88882222', category: 'life', sort: 6 },
  { _id: 'pb-7', name: '开锁服务', phone: '020-88881111', category: 'life', sort: 7, remark: '公安局备案' },
  { _id: 'pb-8', name: '急救中心', phone: HOTLINE.MEDICAL, category: 'emergency', sort: 8 },
  // v1.2 增量：宫格「助浴」一键拨号的承接目标（契约 §service:list 承接方案）
  // ⚠ 020-88880000 为占位号，真环境请替换为社区养老服务中心真实号码（改这里即可，service_category 与知识库已同步引用该号）
  { _id: 'pb-9', name: '社区养老服务中心', phone: '020-88880000', category: 'life', sort: 9, remark: '助餐｜助浴｜上门陪护' },
  // 国家公开紧急号码：匪警 110 / 火警 119（与急救 120 共同支撑首页「紧急求助」面板）
  { _id: 'pb-10', name: '报警求助', phone: HOTLINE.POLICE, category: 'emergency', sort: 10, remark: '匪警·治安求助' },
  { _id: 'pb-11', name: '火警', phone: HOTLINE.FIRE, category: 'emergency', sort: 11, remark: '火灾报警救援' },
];

/* ---------------------------------------- circle_post ---------------------------------------- */
// v1.2：8 条（road 3 / notice 3 / activity 2；official 4 / resident 4；1 条置顶 + 1 条带图）
const PLACEHOLDER_IMG = 'cloud://community-demo.placeholder/circle/';
const circle_post = [
  {
    _id: 'cp-1', title: '南门道路施工，注意绕行',
    content: '南门主干道本周分段施工，早晚高峰车道变窄，建议由西门进出。施工预计持续一周，带来不便敬请谅解。',
    type: 'road', tags: ['施工', '南门'], authorName: '阳光社区居委会', authorRole: 'official',
    authorOpenid: 'mock-admin-1', images: [`${PLACEHOLDER_IMG}road-1.png`, `${PLACEHOLDER_IMG}road-2.png`],
    sourceType: 'manual', status: 'published', topFlag: true, viewCount: 268,
    publishAt: at(-2 * H), createdAt: at(-2 * H), updatedAt: at(-2 * H),
  },
  {
    _id: 'cp-2', title: '3号楼前车位紧张，请勿占道',
    content: '近期 3 号楼前消防通道常被占用，存在安全隐患，请邻居们把车停到地下车库。',
    type: 'road', tags: ['停车', '3号楼'], authorName: '3栋王阿姨', authorRole: 'resident',
    authorOpenid: 'mock-resident-1', images: [], sourceType: 'manual', status: 'published',
    topFlag: false, viewCount: 132, publishAt: at(-8 * H), createdAt: at(-8 * H), updatedAt: at(-8 * H),
  },
  {
    _id: 'cp-3', title: '西门出入口早晚高峰拥堵',
    content: '7:30-8:30 与 18:00-19:00 西门车流较大，步行接送孩子的邻居建议走小门。',
    type: 'road', tags: ['拥堵', '西门'], authorName: '5栋李叔', authorRole: 'resident',
    authorOpenid: 'mock-resident-1', images: [], sourceType: 'manual', status: 'published',
    topFlag: false, viewCount: 96, publishAt: at(-26 * H), createdAt: at(-26 * H), updatedAt: at(-26 * H),
  },
  {
    _id: 'cp-4', title: '社区便民服务日安排',
    content: '每月第一个周六上午 9:00-11:30，社区广场提供免费理发、磨刀、法律咨询与量血压服务。',
    type: 'notice', tags: ['便民服务'], authorName: '阳光社区居委会', authorRole: 'official',
    authorOpenid: 'mock-admin-1', images: [], sourceType: 'manual', status: 'published',
    topFlag: false, viewCount: 210, publishAt: at(-3 * D), createdAt: at(-3 * D), updatedAt: at(-3 * D),
  },
  {
    _id: 'cp-5', title: '燃气安全入户检查安排',
    content: '下周起逐栋入户检查燃气管道与阀门，工作人员持证上岗，请家中留人配合。',
    type: 'notice', tags: ['燃气', '安全检查'], authorName: '阳光社区居委会', authorRole: 'official',
    authorOpenid: 'mock-admin-1', images: [], sourceType: 'sync', refId: 'nt-2', status: 'published',
    topFlag: false, viewCount: 175, publishAt: at(-2 * D), createdAt: at(-2 * D), updatedAt: at(-2 * D),
  },
  {
    _id: 'cp-6', title: '3栋电梯年检已完成',
    content: '3 栋两台电梯年检完成，检验合格证已张贴在轿厢内，运行噪音比之前小多了。',
    type: 'notice', tags: ['电梯', '3栋'], authorName: '3栋王阿姨', authorRole: 'resident',
    authorOpenid: 'mock-resident-1', images: [], sourceType: 'manual', status: 'published',
    topFlag: false, viewCount: 88, publishAt: at(-5 * D), createdAt: at(-5 * D), updatedAt: at(-5 * D),
  },
  {
    _id: 'cp-7', title: '周末亲子手工课堂报名',
    content: `${md(NOW + 6 * D)} 下午 3 点社区活动室开设亲子手工课堂，材料免费，限 20 组家庭，报满即止。`,
    type: 'activity', tags: ['亲子', '手工课堂'], authorName: '6栋陈女士', authorRole: 'resident',
    authorOpenid: 'mock-legacy-1', images: [], sourceType: 'manual', status: 'published',
    topFlag: false, viewCount: 143, publishAt: at(-4 * D), createdAt: at(-4 * D), updatedAt: at(-4 * D),
  },
  {
    _id: 'cp-8', title: '社区义诊活动本周六开展',
    content: '联合社区卫生服务站开展免费义诊，含血压血糖检测、慢病用药咨询与中医推拿，携带身份证即可参加。',
    type: 'activity', tags: ['义诊', '健康'], authorName: '阳光社区居委会', authorRole: 'official',
    authorOpenid: 'mock-admin-1', images: [], sourceType: 'manual', status: 'published',
    topFlag: false, viewCount: 302, publishAt: at(-6 * D), createdAt: at(-6 * D), updatedAt: at(-6 * D),
  },
];

/* -------------------------------------- service_category -------------------------------------- */
/**
 * 分类真源 = `miniprogram/config/service-grid.ts`（前端兜底常量）。
 *
 * 为什么不再手写一份：种子曾经自己写死 4 类 / 10 子项，而前端已扩到 38 项 ——
 * 库里是 10 项、代码是 38 项，真机上分类页只会显示 10 项，且没有任何板块分组。
 * 这种"三份副本漂移"只有上云才会暴露，本地 mock 永远看不出来。
 *
 * 做法：用 TypeScript 编译器把 .ts 转成 CommonJS 再求值，取 LOCAL_SERVICE_CATEGORIES。
 */
function loadServiceCatalog() {
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const file = path.join(ROOT, 'miniprogram/config/service-grid.ts');
  const ts = require('typescript');
  const js = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
  }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', js)(mod, mod.exports, require);
  const cats = mod.exports.LOCAL_SERVICE_CATEGORIES;
  if (!Array.isArray(cats) || cats.length === 0) {
    throw new Error('无法从 miniprogram/config/service-grid.ts 解析出分类');
  }
  return cats;
}

const service_category = loadServiceCatalog().map((c) => ({
  ...c,
  createdAt: nowIso,
  updatedAt: nowIso,
}));

const data = { users, workorders, notices, phonebook, circle_post, service_category };
writeFileSync(OUT, JSON.stringify(data, null, 2));

/* -------------------------------------- 生成结果自检提示 -------------------------------------- */
const urgent = notices.filter((n) => n.type === 'urgent');
const inEffect = urgent.filter((n) => {
  const s = !n.startAt || n.startAt <= nowIso;
  const e = !n.endAt || n.endAt >= nowIso;
  return s && e;
});
console.log('已生成 seed-data.json：');
console.log(`  users=${users.length}  workorders=${workorders.length}  notices=${notices.length}  phonebook=${phonebook.length}  circle_post=${circle_post.length}  service_category=${service_category.length}`);
console.log(`  紧急通知 ${urgent.length} 条，其中当前有效 ${inEffect.length} 条：` +
  urgent.map((n) => `${n._id}(${n.level}${inEffect.includes(n) ? '·有效' : '·不在有效期'})`).join(' '));
console.log('  ⚠ 10-23 打包前请重跑本脚本，确保紧急通知仍在有效期内。');
console.log('  ⚠ phonebook 共 11 条，替换范围分两类（CR-015-a / CR-016）：');
console.log('     可替换 8 条：020-8888xxxx 段社区服务号（演示占位号，真环境替换为各社区实际号码）');
console.log('     ⛔ 严禁替换 3 条：110 / 119 / 120 —— 国家公开紧急号码，');
console.log('        换掉会导致居民照安全话术拨错号，属安全事故，不是体验问题。');
console.log('     改号唯一路径：改 shared/hotline.js → 重跑本脚本 → 重新导入 → 通知前端同步 mock → 跑 selftest。');
console.log('     ⛔ 禁止在云控制台手工编辑 phonebook 号码（hotline.js 是唯一真源）。');
