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
const type = (sel, v) => { const el = $(sel); el.value = v; el.dispatchEvent(new window.Event('input', { bubbles: true })); };
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('  ✓ ' + n); } else { fail++; console.log('  ✗ ' + n + (x !== undefined ? '  → ' + x : '')); } };

async function run() {
  await sleep(110);

  console.log('\n[1] 开局即登录页');
  ok('默认 auth=login', ev('state.auth') === 'login', ev('state.auth'));
  ok('首屏是登录页（有登录按钮）', !!$('[data-act="login-wx"]'));
  ok('显示品牌名', /猎奇便民服务/.test(txt($('#screen'))));
  ok('显示社区副标题', /阳光社区/.test(txt($('#screen'))));
  ok('三点卖点', qa('.au-pts > div').length === 3, qa('.au-pts > div').length);
  ok('底部导航在登录页隐藏', $('#tabbar').hidden === true);
  ok('未登录时无法看到首页内容', !/常用服务/.test(txt($('#screen'))));

  console.log('\n[2] 协议强同意（合规核心）');
  ok('默认未勾选', ev('state.agree') === false);
  ok('勾选框无默认对勾', (txt($('#ckAgree')) || '').indexOf('✓') < 0);
  click($('[data-act="login-wx"]')); await sleep(40);
  ok('未勾选点登录 → 被拦截', ev('state.auth') === 'login');
  ok('拦截提示文案', /请先阅读并勾选同意协议/.test(txt($('#toast'))), txt($('#toast')));
  ok('勾选框高亮成警示色', $('#ckAgree').classList.contains('warn'));
  ok('没有进入完善资料', ev('state.auth') !== 'welcome');

  console.log('\n[3] 协议正文可查看');
  click($('[data-act="doc-user"]')); await sleep(40);
  ok('《用户协议》弹层', /用户协议/.test(txt($('#sheet'))), txt($('#sheet')).slice(0, 20));
  ok('写明不收款不担保', /不收款、不担保交易/.test(txt($('#sheet'))));
  click($('#mask')); await sleep(20);
  click($('[data-act="doc-priv"]')); await sleep(40);
  ok('《隐私政策》弹层', /隐私政策/.test(txt($('#sheet'))));
  ok('写明位置不保存轨迹', /不保存轨迹/.test(txt($('#sheet'))));
  ok('点协议链接不会误勾选', ev('state.agree') === false);
  click($('#mask')); await sleep(20);

  console.log('\n[4] 手机号登录如实标注');
  click($('[data-act="login-phone"]')); await sleep(30);
  ok('提示个人主体无法取手机号', /个人主体无法获取手机号/.test(txt($('#toast'))), txt($('#toast')));

  console.log('\n[5] 勾选后登录');
  click($('#ckAgree')); await sleep(30);
  ok('勾选生效', ev('state.agree') === true);
  ok('勾选后出现对勾', $('#ckAgree').classList.contains('on'));
  click($('[data-act="login-wx"]')); await sleep(30);
  ok('点击后进入 loading 态', ev('state.loginBusy') === true);
  ok('按钮文案变成正在登录', /正在登录/.test(txt($('.au-btn'))), txt($('.au-btn')));
  ok('loading 时按钮不可重复点', $('.au-btn').classList.contains('busy'));
  await sleep(800);
  ok('700ms 后进入完善资料', ev('state.auth') === 'welcome', ev('state.auth'));
  ok('loading 态已复位', ev('state.loginBusy') === false);

  console.log('\n[6] 完善资料');
  ok('有昵称输入框', !!$('#welcomeName'));
  ok('有楼栋房号输入框', !!$('#welcomeAddr'));
  ok('头像色板 8 色', qa('[data-act="welcome-color"]').length === 8, qa('[data-act="welcome-color"]').length);
  ok('昵称已预填便于演示', ($('#welcomeName').value || '').length >= 2, $('#welcomeName').value);
  ok('房号已预填', /3 号楼/.test($('#welcomeAddr').value || ''), $('#welcomeAddr').value);
  ok('底部条显示昵称与房号', /3 号楼 2 单元 502/.test(txt($('.fbar'))), txt($('.fbar')));

  // 校验分支
  type('#welcomeName', '阿'); await sleep(20);
  click($('[data-act="welcome-ok"]')); await sleep(30);
  ok('昵称 1 字被拦', /昵称至少 2 个字/.test(txt($('#toast'))), txt($('#toast')));
  ok('拦截后仍在欢迎页', ev('state.auth') === 'welcome');
  type('#welcomeName', '阿明'); await sleep(20);
  type('#welcomeAddr', ''); await sleep(20);
  click($('[data-act="welcome-ok"]')); await sleep(30);
  ok('房号为空被拦', /请填写楼栋房号/.test(txt($('#toast'))), txt($('#toast')));

  console.log('\n[7] 定位自动填写');
  click($('[data-act="addr-auto"]')); await sleep(40);
  ok('自动填写房号', /3 号楼 2 单元 502/.test($('#welcomeAddr').value || ''), $('#welcomeAddr').value);
  ok('底部条同步更新', /3 号楼 2 单元 502/.test(txt($('.fbar'))));
  ok('自动填写有提示', /已按定位填写/.test(txt($('#toast'))));

  console.log('\n[8] 进入社区');
  type('#welcomeName', '阿明家的院子'); await sleep(20);
  click(qa('[data-act="welcome-color"]')[3]); await sleep(40);
  ok('换头像色后昵称不丢', ($('#welcomeName').value || '') === '阿明家的院子', $('#welcomeName').value);
  click($('[data-act="welcome-ok"]')); await sleep(60);
  ok('登录完成 auth=done', ev('state.auth') === 'done', ev('state.auth'));
  ok('落在首页', ev('state.page') === 'home');
  ok('底部导航恢复显示', $('#tabbar').hidden === false);
  ok('欢迎 toast 带昵称', /欢迎，阿明家的院子/.test(txt($('#toast'))), txt($('#toast')));
  ok('昵称已写入资料', ev('state.prof.name') === '阿明家的院子', ev('state.prof.name'));
  ok('头像字取首字', ev('state.prof.av') === '阿');
  ok('头像色已保存', ev('state.prof.color') === '#A86A05', ev('state.prof.color'));

  console.log('\n[9] 登录结果贯穿全站');
  ev(`state.page='circle';render();`); await sleep(40);
  ok('圈子作者名变成新昵称', /阿明家的院子/.test(txt($('#screen'))));
  ev(`state.page='profile';render();`); await sleep(30);
  ok('我的页昵称同步', /阿明家的院子/.test(txt($('.pnm'))), txt($('.pnm')));
  ok('我的页房号同步', /3 号楼 2 单元 502/.test(txt($('#screen'))));

  console.log('\n[10] 返回与重看登录');
  click($('[data-act="prof-edit"]')); await sleep(30);
  click($('#mask')); await sleep(20);
  ev(`document.querySelector('#swLogin').click()`); await sleep(40);
  ok('工具栏可回到登录页', ev('state.auth') === 'login');
  ok('回登录页时协议重置为未勾选', ev('state.agree') === false);
  ok('回登录页导航再次隐藏', $('#tabbar').hidden === true);
  click($('[data-act="login-wx"]')); await sleep(30);
  ok('未勾选仍然被拦（不是一次勾选永久放行）', /请先阅读并勾选同意协议/.test(txt($('#toast'))));

  console.log('\n[11] 登录后可正常办事（回归）');
  ev(`state.auth='done';state.page='home';render();`); await sleep(40);
  ok('首页宫格在', qa('.gi').length >= 8, qa('.gi').length);
  ev(`state.page='hall';render();`); await sleep(30);
  ok('办事大厅 4 tab', qa('.tb .t').length === 4, qa('.tb .t').length);
  ev(`state.page='meal';render();`); await sleep(30);
  ok('配餐页可进', /智慧配餐/.test(txt($('#screen'))));

  console.log(`\n===== ${pass} passed, ${fail} failed =====`);
  process.exit(fail ? 1 : 0);
}
run().catch(e => { console.error('FATAL', e.message); process.exit(2); });
