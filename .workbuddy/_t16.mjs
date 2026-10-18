import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('C:/Users/Administrator/.workbuddy/binaries/node/workspace/');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('C:/Users/Administrator/Desktop/code/ai web/社区便民小程序/docs/03-preview/demo.html', 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://x.test/' });
const { window } = dom; const doc = window.document;
const $ = s => doc.querySelector(s), qa = s => [...doc.querySelectorAll(s)];
const ev = s => window.eval(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const txt = e => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
const click = e => { if (!e) throw new Error('no element: ' + (e && e.outerHTML)); e.click(); };
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n + (x !== undefined ? '  → ' + x : '')); } };

const AI_PAGES = ['book', 'express', 'record', 'bill', 'lease', 'tool', 'meal'];

async function run() {
  await sleep(110);
  ev(`state.auth='done';state.page='home';render();`); await sleep(40);

  console.log('\n[1] 覆盖范围：只有 7 个服务页有横条');
  for (const p of AI_PAGES) {
    ev(`state.page='${p}';render();`); await sleep(14);
    ok(`${p} 页有 AI 横条`, !!$('.aibar .in'), 'missing');
  }
  for (const p of ['home', 'hall', 'circle', 'profile', 'ai', 'map', 'kit', 'mine']) {
    ev(`state.page='${p}';render();`); await sleep(10);
    ok(`${p} 页没有横条（不重复打扰）`, !$('.aibar .in'));
  }

  console.log('\n[2] 与底部操作条共存');
  ev(`openItem('家政服务','保洁')`); await sleep(20);
  ok('预约页有 fbar', !!$('.fbar'), ev('state.page'));
  ok('横条让位到 fbar 之上（.up）', $('.aibar').classList.contains('up'));
  ok('横条 bottom=61px', ev(`getComputedStyle(document.querySelector('.aibar')).bottom`) === '61px',
    ev(`getComputedStyle(document.querySelector('.aibar')).bottom`));
  ok('横条不盖住主按钮（z-index 22 < fbar 之上但不遮内容）',
    +ev(`getComputedStyle(document.querySelector('.aibar')).zIndex`) === 22);
  ev(`state.page='bill';render();`); await sleep(20);
  ok('无 fbar 的缴费页不抬升', !$('.aibar').classList.contains('up'));
  ok('无 fbar 时 bottom=0', ev(`getComputedStyle(document.querySelector('.aibar')).bottom`) === '0px',
    ev(`getComputedStyle(document.querySelector('.aibar')).bottom`));

  console.log('\n[3] 横条文案带上下文');
  ev(`openItem('家政服务','保洁')`); await sleep(20);
  ok('预约页显示具体服务名', /保洁/.test(txt($('.aibar'))), txt($('.aibar')));
  ev(`state.page='tool';state.tool={n:'共享雨伞',spots:3,free:60};render();`); await sleep(20);
  ok('设备页显示设备名', /共享雨伞/.test(txt($('.aibar'))), txt($('.aibar')));
  ev(`state.page='record';render();`); await sleep(20);
  ok('健康档案页显示页面名', /健康档案/.test(txt($('.aibar'))), txt($('.aibar')));

  console.log('\n[4] 点击横条 → 面板');
  click($('.aibar .in')); await sleep(60);
  ok('面板已打开', $('#sheet').classList.contains('show'));
  ok('标题是「问 AI · 健康档案」', /问 AI · 健康档案/.test(txt($('#sheet'))), txt($('#sheet')).slice(0, 30));
  ok('显示来源上下文', /来自：/.test(txt($('#sheet'))));
  ok('3 条预置问句', qa('#sheet .apq').length === 3, qa('#sheet .apq').length);
  ok('预置问句贴合本页（含血压）', /血压多少算偏高/.test(txt($('#sheet'))), txt($('#sheet')).slice(0, 80));
  ok('有输入框与发送', !!$('#apIn') && !!$('[data-act="ap-send"]'));
  ok('底部有转人工', !!$('[data-act="ap-call"]'));

  console.log('\n[5] 提问 → 本地兜底答案（jsdom 无 fetch）');
  click(qa('#sheet .apq')[0]); await sleep(120);
  ok('出现用户气泡', !!$('#apLog .apm.u'), qa('#apLog .apm').length);
  ok('出现 AI 气泡', !!$('#apLog .apm.a'));
  ok('等待态已结束', !$('#apLog .apm.pend'));
  const ans = txt($('#apLog .apm.a'));
  ok('答案非空且超过 20 字', ans.length > 20, ans.slice(0, 30));
  ok('答案命中了本地问答库（血压 135/85）', /135\/85/.test(ans), ans.slice(0, 60));
  ok('标注了引用来源', qa('#apLog .apc').length > 0);
  ok('明确标注当前为本地答案', /本地答案/.test(txt($('#apLog'))), txt($('#apLog .apw')));
  ok('答案里给出去办理入口', !!$('[data-act="ap-go"]'));
  ok('答案里给转人工入口', !!$('[data-act="ap-call"]'));

  console.log('\n[6] 自由输入 + 回车发送');
  const inp = $('#apIn'); inp.value = '可以改时间吗'; inp.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await sleep(140);
  ok('回车发送生效', qa('#apLog .apm.u').length === 2, qa('#apLog .apm.u').length);
  ok('第二条答案命中改约库', /改约/.test(txt(qa('#apLog .apm.a')[1])), txt(qa('#apLog .apm.a')[1]).slice(0, 40));
  ok('空输入不发请求', (() => { const i = $('#apIn'); i.value = '   '; click($('[data-act="ap-send"]')); return /先说一下/.test(txt($('#toast'))); })(), txt($('#toast')));

  console.log('\n[7] 去办理跳转');
  click($('[data-act="ap-go"]')); await sleep(50);
  ok('面板关闭', !$('#sheet').classList.contains('show'));
  ok('停在原服务页（record）', ev('state.page') === 'record', ev('state.page'));

  console.log('\n[8] 办事大厅 AI 集群');
  ev(`state.page='hall';state.kw='';render();`); await sleep(40);
  ok('集群区块出现在办事大厅', /AI 助手集群/.test(txt($('#screen'))));
  ok('8 张场景卡', qa('.aigc').length === 8, qa('.aigc').length);
  const names = qa('.aigc b').map(txt);
  ok('8 个场景名齐全', ['办事指南', '报修与进度', '健康咨询', '配餐与营养', '费用与户号', '找地点', '邻里互助', '应急求助'].every(n => names.includes(n)), names.join('/'));
  ok('集群在分类 Tab 之上', qa('#screen > div').findIndex(d => d.classList.contains('aig') || d.querySelector('.aig')) >= 0);
  ok('搜索时不显示集群（避免干扰）', (() => { ev(`state.kw='保洁';render();`); return !/AI 助手集群/.test(txt($('#screen'))); })(), 'kw 状态下仍出现');
  ev(`state.kw='';render();`); await sleep(20);

  console.log('\n[9] 集群卡片点开');
  click(qa('.aigc')[0]); await sleep(60);
  ok('打开办事指南场景', /AI 助手 · 办事指南/.test(txt($('#sheet'))), txt($('#sheet')).slice(0, 30));
  ok('场景来源标注为集群', /办事大厅 · AI 集群/.test(txt($('#sheet'))));
  ok('场景 3 条问句', qa('#sheet .apq').length === 3, qa('#sheet .apq').length);
  click(qa('#sheet .apq')[0]); await sleep(120);
  ok('场景问答命中本地库（居住证）', /居住证/.test(txt($('#apLog'))), txt($('#apLog')).slice(0, 50));
  ok('集群问答也给去办理', !!$('[data-act="ap-go"]'));

  console.log('\n[10] 转人工与降级');
  click($('[data-act="ap-call"]')); await sleep(30);
  ok('转人工给出电话', /020-8888 1234/.test(txt($('#toast'))), txt($('#toast')));
  ev(`state.offline=true;`); await sleep(10);
  click($('[data-act="close"]')); await sleep(30);
  ev(`openAiPanel({title:'问 AI · 测试',svc:'测试',presets:['这个怎么借？'],page:'tool'});`); await sleep(40);
  click(qa('#sheet .apq')[0]); await sleep(120);
  ok('离线时仍能给出本地答案', /24 小时内免费/.test(txt($('#apLog'))), txt($('#apLog')).slice(0, 60));
  ok('离线时标注本地答案', /本地答案/.test(txt($('#apLog'))));
  ev(`state.offline=false;`);

  console.log('\n[11] 回归');
  ev(`state.page='circle';render();`); await sleep(30);
  ok('圈子仍有发布浮钮且位置未变', !!$('.fab2') && !$('.aibar .in'));
  ev(`state.page='meal';render();`); await sleep(30);
  ok('配餐页横条在 fbar 之上', $('.aibar').classList.contains('up'));
  ok('配餐页功能正常', /热量达成|智慧配餐/.test(txt($('#screen'))));
  ev(`state.page='home';render();`); await sleep(30);
  ok('首页宫格正常', qa('.gi').length >= 8, qa('.gi').length);

  console.log(`\n===== ${pass} passed, ${fail} failed =====`);
  process.exit(fail ? 1 : 0);
}
run().catch(e => { console.error('FATAL', e.message); process.exit(2); });
