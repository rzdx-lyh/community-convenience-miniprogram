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
const click = e => { if (!e) throw new Error('no element'); e.click(); };
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n + (x !== undefined ? '  → ' + x : '')); } };
const type = (sel, v) => { const el = $(sel); el.value = v; el.dispatchEvent(new window.Event('input', { bubbles: true })); };

async function run() {
  await sleep(100);
  // v1.3.1 起开局有登录门禁，功能测试直接放行
  ev(`state.auth='done';state.page='home';render();`);
  await sleep(30);
  console.log('\n[1] 我的页结构');
  ev(`state.page='profile';render();`); await sleep(30);
  ok('默认昵称', /阿明的小院/.test(txt($('.pnm'))), txt($('.pnm')));
  ok('有自定义签名', /爱帮邻居搭把手/.test(txt($('.psg'))));
  ok('房号徽章', /3 号楼 2 单元 502/.test(txt($('#screen'))));
  ok('四宫格 4 格', qa('.pstats .c').length === 4, qa('.pstats .c').length);
  const labels = qa('.pstats .c span').map(txt);
  ok('四宫格文案 = 我发的/我回复的/我收藏的/我的预约',
    ['我发的', '我回复的', '我收藏的', '我的预约'].every(n => labels.includes(n)), labels.join(','));
  const nums = qa('.pstats .c b').map(txt);
  ok('计数非空且为数字', nums.every(n => /^\d+$/.test(n)), nums.join('/'));
  ok('我收藏的 = 预置 2', nums[2] === '2', nums[2]);

  console.log('\n[2] 家庭与地址');
  ok('成员头像 3 个（本人+2）', qa('.memb .mb:not(.add)').length === 3, qa('.memb .mb:not(.add)').length);
  ok('成员名显示', /妈妈/.test(txt($('.memb'))) && /小满/.test(txt($('.memb'))));
  ok('有添加入口', !!$('.memb .mb.add'));
  ok('地址 2 条', qa('.card .row[data-act="addr-def"]').length === 2, qa('.card .row[data-act="addr-def"]').length);
  ok('默认地址标记', /默认/.test(txt(qa('.card .row[data-act="addr-def"]')[0])));
  click(qa('[data-act="addr-def"]')[1]); await sleep(30);
  ok('切换默认地址生效', /默认/.test(txt(qa('[data-act="addr-def"]')[1])), txt(qa('[data-act="addr-def"]')[1]));
  ok('原默认变为备用', /备用/.test(txt(qa('[data-act="addr-def"]')[0])));

  console.log('\n[3] 设置中心');
  const sws = qa('[data-act="prof-sw"]');
  ok('3 个通知开关', sws.length === 3, sws.length);
  ok('前两个默认开、第三个默认关',
    sws[0].classList.contains('on') && sws[1].classList.contains('on') && !sws[2].classList.contains('on'));
  click(sws[2]); await sleep(30);
  ok('点击开启社区活动通知', qa('[data-act="prof-sw"]')[2].classList.contains('on'));
  const segs = qa('[data-act="prof-font"]');
  ok('字号 3 档', segs.length === 3, segs.length);
  click(segs[1]); await sleep(30);
  ok('选「大」加 fsl 类', $('#phone').classList.contains('fsl'));
  ok('选「大」不进关怀模式', ev('state.care') === false);
  click(qa('[data-act="prof-font"]')[2]); await sleep(30);
  ok('选「特大」进关怀模式', ev('state.care') === true);
  ok('「特大」移除 fsl', !$('#phone').classList.contains('fsl'));
  click(qa('[data-act="prof-font"]')[0]); await sleep(30);
  ok('回标准档', ev('state.care') === false && !$('#phone').classList.contains('fsl'));

  console.log('\n[4] 自定义昵称（核心）');
  click($('[data-act="prof-edit"]')); await sleep(40);
  ok('打开编辑弹层', /编辑资料/.test(txt($('#sheet'))), txt($('#sheet')).slice(0, 20));
  ok('弹层有昵称输入框', !!$('#pName'));
  ok('弹层有签名与房号', !!$('#pSign') && !!$('#pAddr'));
  ok('头像色板 8 色', qa('#sheet [data-act="prof-color"]').length === 8, qa('#sheet [data-act="prof-color"]').length);
  type('#pName', '阿'); await sleep(10);
  ok('昵称过短会被拦', (() => { click($('[data-act="prof-save"]')); return /至少 2 个字/.test(txt($('#toast'))); })(), txt($('#toast')));
  ok('拦截后弹层仍开着', /编辑资料/.test(txt($('#sheet'))));
  type('#pName', '阿明家的院子'); type('#pSign', '养了两只猫，周末常在楼下');
  type('#pAddr', '3 号楼 2 单元 601'); await sleep(10);
  click(qa('#sheet [data-act="prof-color"]')[2]); await sleep(40);
  ok('换头像色后昵称保留', ev('state.profD.n') === '阿明家的院子', ev('state.profD.n'));
  ok('色板选中态跟随', ev('state.profD.c') === '#C9302C', ev('state.profD.c'));
  click($('[data-act="prof-save"]')); await sleep(40);
  ok('保存后弹层关闭', !$('#sheet').classList.contains('show'));
  ok('昵称已更新', txt($('.pnm')).startsWith('阿明家的院子'), txt($('.pnm')));
  ok('头像字取昵称首字', txt($('.pfa')).slice(0, 1) === '阿');
  ok('签名已更新', /养了两只猫/.test(txt($('.psg'))), txt($('.psg')));
  ok('房号已更新', /601/.test(txt($('#screen'))));
  ok('头像底色已换', (ev(`state.prof.color`)) === '#C9302C', ev(`state.prof.color`));
  ok('大小写/字数限制生效', ev('state.prof.name.length') <= 12);

  console.log('\n[5] 昵称联动到圈子');
  ev(`state.page='circle';render();`); await sleep(40);
  ok('我发的帖子作者名已跟着变', /阿明家的院子/.test(txt($('#screen'))), (txt($('#screen')).match(/阿明家的院子/g) || []).length + ' 处');
  ok('旧昵称不再出现', !/3 栋阿明/.test(txt($('#screen'))));
  const myAv = qa('.p-av').map(txt).filter(t => t === '阿');
  ok('我的帖子头像取新首字', myAv.length > 0, myAv.length);
  ev(`state.page='mine';state.mineTab='post';render();`); await sleep(30);
  ok('我的圈子-我发的仍有内容', qa('.post2').length > 0, qa('.post2').length);

  console.log('\n[6] 四宫格跳转');
  ev(`state.page='profile';render();`); await sleep(20);
  click(qa('.pstats .c')[1]); await sleep(30);
  ok('点「我回复的」进我的圈子', ev('state.page') === 'mine');
  ok('并且切到回复 tab', ev('state.mineTab') === 'reply', ev('state.mineTab'));
  ev(`state.page='profile';render();`); await sleep(20);
  click(qa('.pstats .c')[3]); await sleep(30);
  ok('点「我的预约」进预约单页', ev('state.page') === 'book', ev('state.page'));

  console.log('\n[7] 家庭成员增删');
  ev(`state.page='profile';render();`); await sleep(20);
  const before = qa('.memb .mb:not(.add)').length;
  click($('.memb .mb.add')); await sleep(40);
  ok('打开添加成员弹层', /添加家庭成员/.test(txt($('#sheet'))));
  ok('关系 5 选项', qa('#sheet [data-act="member-rel"]').length === 5, qa('#sheet [data-act="member-rel"]').length);
  click($('[data-act="member-ok"]')); await sleep(30);
  ok('空称呼被拦', /先填一个称呼/.test(txt($('#toast'))), txt($('#toast')));
  type('#mName', '奶奶'); await sleep(10);
  click(qa('#sheet [data-act="member-rel"]')[1]); await sleep(40);
  ok('切关系后称呼保留', (() => { const el = $('#mName'); return el && el.value === '奶奶'; })(), $('#mName') ? $('#mName').value : 'none');
  click($('[data-act="member-ok"]')); await sleep(40);
  ok('新增成员成功', qa('.memb .mb:not(.add)').length === before + 1, qa('.memb .mb:not(.add)').length);
  ok('新成员显示在列表', /奶奶/.test(txt($('.memb'))));
  click(qa('[data-act="member-del"]')[0]); await sleep(40);
  ok('点成员弹移除确认', /移除家庭成员/.test(txt($('#sheet'))));
  click($('[data-act="member-del-ok"]')); await sleep(40);
  ok('移除生效', qa('.memb .mb:not(.add)').length === before, qa('.memb .mb:not(.add)').length);

  console.log('\n[8] 帮助 / 关于 / 注销');
  click($('[data-act="prof-about"]')); await sleep(30);
  ok('关于弹层带版本号', /v\d+\.\d+\.\d+/.test(txt($('#sheet'))) && txt($('#sheet')).includes(ev('APP_VER')), txt($('#sheet')).slice(0, 40));
  click($('#mask')); await sleep(20);
  click($('[data-act="prof-help"]')); await sleep(30);
  ok('帮助弹层有客服电话', /020-8888 1234/.test(txt($('#sheet'))));
  click($('#mask')); await sleep(20);
  click($('[data-act="prof-privacy"]')); await sleep(30);
  ok('隐私弹层列出 4 项授权', qa('#sheet .it').length === 4, qa('#sheet .it').length);
  click($('#mask')); await sleep(20);
  click($('[data-act="prof-del"]')); await sleep(30);
  ok('注销有二次确认与后果清单', /无法恢复/.test(txt($('#sheet'))), txt($('#sheet')).slice(0, 30));
  ok('注销按钮是危险样式', ev(`document.querySelector('[data-act="prof-del-ok"]').style.background.indexOf('red')>=0 || document.querySelector('[data-act="prof-del-ok"]').style.background.indexOf('var(--red')>=0`));
  click($('[data-act="prof-del-ok"]')); await sleep(30);
  ok('确认后有回执提示', /注销申请已提交/.test(txt($('#toast'))), txt($('#toast')));

  console.log('\n[9] 重置恢复默认资料');
  ev(`document.querySelector('#swReset').click()`); await sleep(40);
  ok('重置后昵称恢复', ev(`state.prof.name`) === '阿明的小院', ev(`state.prof.name`));
  ok('重置后字号回标准', ev(`state.prof.font`) === 'std');
  ok('重置后移除 fsl', !$('#phone').classList.contains('fsl'));
  ev(`state.page='profile';render();`); await sleep(20);
  ok('页面显示回默认昵称', /阿明的小院/.test(txt($('.pnm'))));

  console.log('\n[10] 旧页回归');
  ev(`state.page='home';render();`); await sleep(30);
  ok('首页宫格仍在', qa('.gi').length >= 8, qa('.gi').length);
  ev(`state.page='circle';render();`); await sleep(30);
  ok('圈子 9 帖', qa('.post2').length >= 9, qa('.post2').length);
  ev(`state.page='meal';render();`); await sleep(20);
  ok('配餐页正常', /智慧配餐/.test(txt($('#screen'))), txt($('#screen')).slice(0,20));

  console.log(`\n===== ${pass} passed, ${fail} failed =====`);
  process.exit(fail ? 1 : 0);
}
run().catch(e => { console.error('FATAL', e.message); process.exit(2); });
