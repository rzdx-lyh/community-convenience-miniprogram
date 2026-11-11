'use strict';

const { db } = require('./db');
let searchKB;
try { searchKB = require('./kb').searchKB; } catch { searchKB = require('./kb/kb').searchKB; }

const DEFAULT_ORIGIN = { latitude: 23.12894, longitude: 113.26411 };
const PLACES = [
  { id: 'p1', name: '社区物业服务中心', latitude: 23.12916, longitude: 113.26386, desc: '报修/缴费/门禁', open: '8:30-18:00' },
  { id: 'p2', name: '社区卫生服务站', latitude: 23.12841, longitude: 113.26472, desc: '全科/慢病/疫苗', open: '8:00-21:00' },
  { id: 'p3', name: '社区活动室', latitude: 23.12888, longitude: 113.2632, desc: '图书角/四点半课堂', open: '9:00-21:00' },
  { id: 'p4', name: '共享雨伞 · 1 号楼大厅', latitude: 23.12933, longitude: 113.26452, desc: '可借 6 把', open: '24 小时' },
  { id: 'p5', name: '共享充电宝 · 南门岗亭', latitude: 23.12872, longitude: 113.26362, desc: '可借 12 个', open: '24 小时' },
  { id: 'p6', name: '快递柜 · 1 号楼架空层', latitude: 23.1291, longitude: 113.2643, desc: '丰巢柜', open: '24 小时' },
  { id: 'p8', name: '垃圾分类点 · 2 号楼东侧', latitude: 23.1286, longitude: 113.2642, desc: '四分类投放', open: '6:00-22:00' },
  { id: 'p9', name: '老年助餐点 · 社区食堂', latitude: 23.1295, longitude: 113.2641, desc: '助餐配送', open: '11:00-18:30' },
  { id: 'p10', name: 'AED · 物业服务中心', latitude: 23.12918, longitude: 113.2639, desc: '自动体外除颤器', open: '24 小时' },
  { id: 'p11', name: '微型消防站 · 南门', latitude: 23.1287, longitude: 113.2636, desc: '消防应急工具', open: '24 小时' },
];

function haversine(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

function detectRepairCategory(q) {
  const s = String(q || '');
  if (/(水|漏水|水管|下水|马桶|阀门)/.test(s)) return 'water';
  if (/(电|灯|插座|跳闸|停电|电路)/.test(s)) return 'electric';
  if (/(门|锁|门禁|窗|玻璃)/.test(s)) return 'door';
  if (/(电梯|楼道|路灯|公共|井盖)/.test(s)) return 'public';
  return 'other';
}

function buildRepairDraft(question) {
  const s = String(question || '');
  return { category: detectRepairCategory(s), title: s.slice(0, 30) || '社区报修', description: s.slice(0, 180) };
}

function planIntent(question) {
  const q = String(question || '').toLowerCase();
  if (/(报修|维修|漏水|没水|没电|灯坏|门锁|门禁|电梯|下水|堵塞|坏了)/.test(q)) return { intent: 'repair', tools: ['searchKnowledge', 'buildRepairDraft'], label: '报修办理' };
  if (/(工单|进度|处理到哪|派单|维修师傅)/.test(q)) return { intent: 'workorder_status', tools: ['queryWorkOrders', 'searchKnowledge'], label: '工单查询' };
  if (/(通知|公告|停水|停电|活动|报名)/.test(q)) return { intent: 'notice', tools: ['searchNotices', 'searchKnowledge'], label: '社区通知' };
  if (/(地图|怎么走|在哪|最近|附近|雨伞|充电宝|快递柜|食堂|AED|消防)/i.test(q)) return { intent: 'nearby', tools: ['findNearby', 'searchKnowledge'], label: '附近服务' };
  if (/(电话|联系|物业|居委会|卫生站|电话簿)/.test(q)) return { intent: 'contact', tools: ['searchPhonebook', 'searchKnowledge'], label: '联系社区' };
  return { intent: 'knowledge', tools: ['searchKnowledge'], label: '社区问答' };
}

function findNearby(question, location) {
  const origin = location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude) ? location : DEFAULT_ORIGIN;
  const q = String(question || '');
  return PLACES.map((p) => Object.assign({}, p, { distance: haversine(origin, p) }))
    .filter((p) => {
      if (/雨伞/.test(q)) return /雨伞/.test(p.name);
      if (/充电宝|充电/.test(q)) return /充电/.test(p.name);
      if (/快递/.test(q)) return /快递/.test(p.name);
      if (/食堂|吃饭|助餐/.test(q)) return /食堂|助餐/.test(p.name);
      if (/AED|除颤/i.test(q)) return /AED/i.test(p.name);
      if (/消防|灭火/.test(q)) return /消防/.test(p.name);
      if (/卫生|医院|看病|疫苗/.test(q)) return /卫生/.test(p.name);
      if (/物业/.test(q)) return /物业/.test(p.name);
      return true;
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
    .map((p) => Object.assign({}, p, { distanceText: p.distance < 1000 ? p.distance + ' m' : (p.distance / 1000).toFixed(1) + ' km' }));
}

async function searchNotices() {
  const res = await db.collection('notices').where({ status: 'published' }).orderBy('publishAt', 'desc').limit(3).get().catch(() => ({ data: [] }));
  return (res.data || []).map((n) => ({ id: n._id, title: n.title, content: n.content || '', location: n.location || '', publishAt: n.publishAt }));
}

async function searchPhonebook(question) {
  const res = await db.collection('phonebook').get().catch(() => ({ data: [] }));
  const q = String(question || '');
  return (res.data || []).filter((x) => (x.name + x.category + (x.remark || '')).includes(q) || q.includes(x.name)).slice(0, 5)
    .map((x) => ({ id: x._id, name: x.name, phone: x.phone, category: x.category, remark: x.remark || '' }));
}

async function queryWorkOrders(openid) {
  if (!openid) return [];
  const res = await db.collection('workorders').where({ _openid: openid }).orderBy('createdAt', 'desc').limit(3).get().catch(() => ({ data: [] }));
  return (res.data || []).map((x) => ({ id: x._id, title: x.title, status: x.status, updatedAt: x.updatedAt }));
}

function collectSources(results) {
  const out = [];
  results.forEach((r) => {
    (r.items || []).forEach((x) => out.push(r.tool + '：' + (x.title || x.name || '')));
  });
  return [...new Set(out)].slice(0, 6);
}

function buildActions(plan, results) {
  const actions = [];
  if (plan.intent === 'repair') {
    const r = results.find((x) => x.tool === 'buildRepairDraft');
    if (r && r.data) actions.push({ type: 'repair', label: '去提交报修', url: '/pages/repair/create/index?category=' + r.data.category + '&title=' + encodeURIComponent(r.data.title) + '&description=' + encodeURIComponent(r.data.description) });
  }
  if (plan.intent === 'nearby') {
    const r = results.find((x) => x.tool === 'findNearby');
    if (r && r.items && r.items[0]) actions.push({ type: 'map', label: '在地图查看', url: '/pages/map/index?focus=' + r.items[0].id });
  }
  if (plan.intent === 'notice') actions.push({ type: 'notice', label: '查看全部通知', url: '/pages/notice/list/index' });
  if (plan.intent === 'contact') actions.push({ type: 'phone', label: '打开电话簿', url: '/pages/phonebook/index' });
  if (plan.intent === 'workorder_status') actions.push({ type: 'workorder', label: '查看我的工单', url: '/pages/repair/list/index' });
  return actions;
}

function buildFallbackAnswer(plan, results) {
  const get = (tool) => (results.find((x) => x.tool === tool) || {}).items || [];
  const kb = get('searchKnowledge');
  const nearby = get('findNearby');
  const notices = get('searchNotices');
  const phones = get('searchPhonebook');
  const orders = get('queryWorkOrders');
  const parts = [];
  if (kb[0]) parts.push(kb[0].content);
  if (nearby[0]) parts.push('最近的是 ' + nearby[0].name + '，距离约 ' + nearby[0].distanceText + '，开放时间 ' + nearby[0].open + '。');
  if (notices[0]) parts.push('最新通知：' + notices[0].title + '。');
  if (phones[0]) parts.push(phones[0].name + '：' + phones[0].phone + '。');
  if (orders[0]) parts.push('你最近的工单「' + orders[0].title + '」当前状态为 ' + orders[0].status + '。');
  if (plan.intent === 'repair') parts.push('你可以点击下方按钮直接进入报修页。');
  return parts.join('\n') || '暂时没有找到可直接使用的社区资料，请转人工或查看社区公告。';
}

function buildAgentMessages(question, plan, results) {
  const context = results.map((r) => {
    const items = r.items || [];
    return '工具 ' + r.tool + '：\n' + items.map((x, i) => '[' + (i + 1) + '] ' + (x.title || x.name || '') + ' ' + (x.content || x.desc || '')).join('\n');
  }).join('\n\n');
  return [
    { role: 'system', content: '你是社区 AI 办事管家。根据工具结果回答，引用资料时保留来源名称；不要编造电话、金额和政策。回答不超过 300 字，并给出可执行的下一步。' },
    { role: 'user', content: '用户问题：' + question + '\n\nAgent计划：' + plan.label + '\n\n工具结果：\n' + context },
  ];
}

async function runAgent({ question, openid, location }) {
  const plan = planIntent(question);
  const results = [];
  for (const tool of plan.tools) {
    if (tool === 'searchKnowledge') results.push({ tool, items: searchKB(question, { topN: 4 }) });
    if (tool === 'findNearby') results.push({ tool, items: findNearby(question, location) });
    if (tool === 'buildRepairDraft') results.push({ tool, data: buildRepairDraft(question) });
    if (tool === 'searchNotices') results.push({ tool, items: await searchNotices() });
    if (tool === 'searchPhonebook') results.push({ tool, items: await searchPhonebook(question) });
    if (tool === 'queryWorkOrders') results.push({ tool, items: await queryWorkOrders(openid) });
  }
  return { plan, results, sources: collectSources(results), actions: buildActions(plan, results), fallbackAnswer: buildFallbackAnswer(plan, results), messages: buildAgentMessages(question, plan, results), toolsUsed: plan.tools.map((name) => ({ name, status: 'done' })) };
}

module.exports = { planIntent, findNearby, buildRepairDraft, runAgent, detectRepairCategory };



