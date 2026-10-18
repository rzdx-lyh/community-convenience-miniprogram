import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('C:/Users/Administrator/.workbuddy/binaries/node/workspace/');
const { JSDOM } = require('jsdom');

const FILE = 'C:/Users/Administrator/Desktop/code/ai web/社区便民小程序/docs/03-preview/demo.html';
const html = fs.readFileSync(FILE, 'utf8');

const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://x.test/' });
const { window } = dom;
const doc = window.document;
const $ = s => doc.querySelector(s);
const qa = s => [...doc.querySelectorAll(s)];
const ev = s => window.eval(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const txt = e => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
const click = e => { if (!e) throw new Error('element not found'); e.click(); };

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name + (extra !== undefined ? '  → ' + extra : '')); }
};

async function run() {
  await sleep(80);
  // v1.3.1 起开局有登录门禁，功能测试直接放行
  ev(`state.auth='done';state.page='home';render();`);
  await sleep(30);

  console.log('\n[1] 入口可发现性');
  // 首页有智慧配餐快捷入口
  ok('首页「附近服务」有智慧配餐入口', qa('.row').some(r => /智慧配餐/.test(txt(r))));
  // 分类里注册
  const found = ev(`JSON.stringify((function(){
    var r=null;
    for(var i=0;i<CATS.length;i++)for(var j=0;j<CATS[i].groups.length;j++){
      var g=CATS[i].groups[j];
      for(var k=0;k<g.items.length;k++) if(g.items[k].n==='智慧配餐') r={cat:CATS[i].name,grp:g.name,flow:g.items[k].flow};
    }
    return r;
  })())`);
  const F = JSON.parse(found);
  ok('注册在「健康养老 / 基础健康服务」', F && /健康养老/.test(F.cat) && /基础健康服务/.test(F.grp), found);
  ok('flow 标记为 meal', F && F.flow === 'meal', F && F.flow);

  // 从首页入口进入
  const homeRow = qa('.row').find(r => /智慧配餐/.test(txt(r)));
  click(homeRow);
  await sleep(30);
  ok('点击首页入口进入配餐页', ev('state.page') === 'meal', ev('state.page'));

  console.log('\n[2] 首次进入 = 设置页');
  ok('未设置时展示《智慧配餐》标题', /智慧配餐/.test(txt($('#screen'))));
  ok('展示 5 个配餐目标', qa('[data-act="meal-goal"]').length === 5, qa('[data-act="meal-goal"]').length);
  const goalNames = qa('[data-act="meal-goal"]').map(e => txt(e.querySelector('b')));
  ok('目标含 控糖/控压/减脂/术后恢复/老年软食',
    ['控糖', '控压', '减脂', '术后恢复', '老年软食'].every(n => goalNames.includes(n)), goalNames.join(','));
  ok('展示 4 档用餐人数', qa('[data-act="meal-people"]').length === 4, qa('[data-act="meal-people"]').length);
  ok('展示 5 个忌口选项', qa('[data-act="meal-taboo"]').length === 5, qa('[data-act="meal-taboo"]').length);
  ok('默认选中控糖', ev('state.meal.goal') === 'sugar', ev('state.meal.goal'));
  ok('底部固定条显示目标热量', /1600 kcal/.test(txt($('.fbar'))), txt($('.fbar')));

  console.log('\n[3] 配置目标 + 忌口');
  click(qa('[data-act="meal-goal"]').find(e => e.dataset.v === 'bp'));
  await sleep(20);
  ok('切到控压目标', ev('state.meal.goal') === 'bp');
  ok('控压高亮 ✓', !!qa('[data-act="meal-goal"]').find(e => e.dataset.v === 'bp' && e.classList.contains('on')));
  click(qa('[data-act="meal-people"]').find(e => e.dataset.v === '3'));
  await sleep(20);
  ok('人数切到 3 人', ev('state.meal.people') === 3);
  click(qa('[data-act="meal-taboo"]').find(e => e.dataset.v === '海鲜'));
  await sleep(20);
  ok('忌口勾选 海鲜', ev('state.meal.taboos').includes('海鲜'), JSON.stringify(ev('state.meal.taboos')));

  console.log('\n[4] 生成方案');
  click($('[data-act="meal-start"]'));
  await sleep(40);
  ok('已切到方案页', ev('state.meal.onboarded') === true);
  ok('出现 热量达成 环', /热量达成/.test(txt($('#screen'))));
  ok('出现 3 张菜品卡', qa('.dish').length === 3, qa('.dish').length);
  const dishNames = qa('.dish .dnm').map(txt);
  ok('三餐都有菜名', dishNames.length === 3 && dishNames.every(n => n.length > 2), dishNames.join(' | '));
  ok('忌口生效：无海鲜菜', !dishNames.some(n => /虾|鲈鱼/.test(n)), dishNames.join(' | '));

  // KPI = 三餐之和
  const kpi = +($('.pgh-num') ? txt($('.pgh-num')).match(/^(\d+)/)[1] : NaN);
  const sum = ev(`JSON.stringify((function(){var p=todayPlan();return planSum(p);})())`);
  const S = JSON.parse(sum);
  ok('KPI 热量 = 三餐之和', kpi === S.kcal, 'kpi=' + kpi + ' sum=' + S.kcal);
  const dsum = ev(`(function(){var p=todayPlan();return p.b.kcal+p.l.kcal+p.d.kcal;})()`);
  ok('三餐卡数值与 KPI 一致', dsum === kpi, 'dish=' + dsum + ' kpi=' + kpi);
  ok('三大营养素条 3 条', qa('.nbr').length === 3, qa('.nbr').length);
  ok('7 天日期条', qa('.wkd').length === 7, qa('.wkd').length);

  console.log('\n[5] 换一道 / 锁定');
  const before = txt(qa('.dish .dnm')[1]);
  click(qa('[data-act="meal-swap"]')[1]);
  await sleep(30);
  const after = txt(qa('.dish .dnm')[1]);
  ok('换一道后午餐菜名变化', before !== after, before + ' → ' + after);
  ok('换菜有 toast 提示', /已换成/.test(txt($('#toast'))), txt($('#toast')));

  click(qa('[data-act="meal-lock"]')[1]);
  await sleep(30);
  ok('锁定后按钮文案变 已锁定', /已锁定/.test(txt(qa('[data-act="meal-lock"]')[1])), txt(qa('[data-act="meal-lock"]')[1]));
  const lockedName = txt(qa('.dish .dnm')[1]);
  click(qa('[data-act="meal-swap"]')[1]);
  await sleep(30);
  ok('锁定后禁止换菜', txt(qa('.dish .dnm')[1]) === lockedName, lockedName + ' vs ' + txt(qa('.dish .dnm')[1]));
  ok('锁定换菜提示正确', /已锁定，先解锁再换/.test(txt($('#toast'))), txt($('#toast')));
  click(qa('[data-act="meal-lock"]')[1]);
  await sleep(30);
  ok('解锁恢复', /锁定$/.test(txt(qa('[data-act="meal-lock"]')[1])), txt(qa('[data-act="meal-lock"]')[1]));

  console.log('\n[6] 切换日期');
  click(qa('.wkd')[2]);
  await sleep(30);
  ok('切到第 3 天', ev('state.meal.day') === 2, ev('state.meal.day'));
  ok('日期高亮跟随', qa('.wkd')[2].classList.contains('on'));
  ok('切天后仍为 3 张卡', qa('.dish').length === 3, qa('.dish').length);

  console.log('\n[7] 食材清单 → 生鲜预订');
  click($('[data-act="meal-list"]'));
  await sleep(30);
  ok('打开食材清单弹层', /今日食材清单/.test(txt($('#sheet'))), txt($('#sheet')).slice(0, 30));
  const lis = qa('#sheet .it').length;
  ok('食材条目去重后非空', lis > 0, lis);
  const raw = ev(`(function(){var p=todayPlan(),a=[];['b','l','d'].forEach(function(k){if(p[k])p[k].ing.forEach(function(x){a.push(x)})});return a.length;})()`);
  ok('去重生效（条目数 ≤ 原始条数）', lis <= raw, 'uniq=' + lis + ' raw=' + raw);
  click($('[data-act="meal-buy"]'));
  await sleep(30);
  ok('跳到生鲜预订', ev('state.page') === 'fresh', ev('state.page'));
  ok('生鲜页展示蔬果', /生鲜|蔬果|蔬菜/.test(txt($('#screen'))));

  console.log('\n[8] 改目标 / 帮助');
  ev(`state.page='meal';render();`);
  await sleep(20);
  click($('[data-act="meal-reset"]'));
  await sleep(30);
  ok('改目标回到设置页', ev('state.meal.onboarded') === false);
  click($('[data-act="sheet-meal-help"]'));
  await sleep(30);
  ok('打开算法说明弹层', /配餐怎么算的/.test(txt($('#sheet'))), txt($('#sheet')).slice(0, 20));
  ok('含免责声明', /不替代医生或营养师处方/.test(txt($('#sheet'))));
  click($('#mask'));
  await sleep(20);

  console.log('\n[9] 回归：旧页面');
  ev(`state.page='circle';state.topic='全部';render();`);
  await sleep(40);
  ok('圈子 9 条帖子', qa('.post2').length >= 9, qa('.post2').length);
  ev(`state.page='hall';render();`);
  await sleep(30);
  ok('办事大厅 4 个一级 tab', qa('.tb .t').length === 4, qa('.tb .t').length);
  ev(`state.page='ai';render();`);
  await sleep(30);
  ok('AI 页有输入框', !!$('#aiIn'));
  ok('AI 页有快捷问', qa('[data-act^="ai-"]').length > 0);
  ev(`state.page='home';render();`);
  await sleep(30);
  const cnt = txt(qa('.st b').find(b => /项/.test(txt(b))) || $('.st'));
  ok('首页服务数文案为动态值', /\d+ 项/.test(txt($('#screen'))), cnt);

  console.log('\n[10] 回归：预约向导');
  ev(`state.page='hall';render();`);
  await sleep(20);
  ev(`openItem('家政服务','保洁')`);
  await sleep(30);
  ok('预约向导第 1 步', ev('state.book && state.book.step') === 1, ev('state.book && state.book.step'));
  ok('向导有服务图标', !!(ev('state.book') || {}).icon);

  console.log(`\n===== ${pass} passed, ${fail} failed =====`);
  process.exit(fail ? 1 : 0);
}
run().catch(e => { console.error('FATAL', e); process.exit(2); });
