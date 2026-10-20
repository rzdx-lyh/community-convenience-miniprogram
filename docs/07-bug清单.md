# 07-bug清单（社区便民小程序）

> 被测版本：main HEAD `14a5fec`（无 tag，静态走查轮 · 2026-10-14）
> 测试方式：自动化（vitest 155/155 ✅、tsc --noEmit ✅、后端自测 167/167 ✅）+ 前端全量静态走查（WXML↔TS 逐页对照）
> 说明：本轮为静态/自动化轮，未上真机；每条均附代码证据与触发场景，可按要求补模拟器截图。

## 汇总视图

| 编号 | 标题 | 级别 | 模块 | 状态 | 回归用例 |
|---|---|---|---|---|---|
| BUG-001 | 服务订单首进列表数据重复（分页竞态） | P1 | 报修列表 | 已修复待回归 | TC-13 |
| BUG-002 | 快速切筛选 Tab 混入旧条件数据（三页同根因） | P1 | 报修列表/通知/圈子 | 已修复待回归 | TC-14 |
| BUG-003 | 通知详情弹层点内容即被关闭 | P1 | 通知 | 已修复待回归 | TC-34 |
| BUG-004 | request 层吞掉后端 400 具体文案，与契约口径矛盾 | P2 | 全站请求层 | 新建 | TC-09/IT-02 |
| BUG-005 | 报修详情加载失败后白屏无重试 | P2 | 报修详情 | 新建 | TC-41 |
| BUG-006 | AI 助手页双导航栏（json 漏配 custom） | P2 | AI 助手 | 新建 | TC-24 |
| BUG-007 | 空分类下 hasMore 永不收敛，触底无限发空请求 | P3 | 分页工具 | 新建 | TC-47 |
| **BUG-008** | **云函数线上 `Cannot find module 'response'`（部署版本与本地不一致）** | **P0** | **全部 8 个云函数** | **已修复（2026-10-20 重部署）** | 云调用冒烟 |

---

## BUG-001｜服务订单页首次进入列表数据重复（分页竞态）

- 严重级：P1｜模块：报修列表（服务订单 Tab）｜机型：模拟器全机型（mock 300ms 窗口下稳定复现）｜频率：必现
- 前置：居民已登录，首次进入「服务订单」Tab
- 复现步骤：1. 启动小程序 2. 点底部「服务订单」Tab 3. 观察列表
- 预期：第 1 页 10 条工单只出现一次
- 实际：第 1 页数据出现两遍（20 条中 10 条重复）；且内部页码被推进两次，后续「加载更多」跳过真实第 2 页
- 代码证据：
  - `miniprogram/pages/repair/list/index.ts:74-84` —— `onLoad` 与 `onShow` 都无条件 `void this.refresh()`；首次进入 onLoad→onShow 连续触发
  - `miniprogram/utils/pagination.ts:47-52` —— `reset()` 把 `isLoading` 一并清成 false，使第二个 refresh 能通过 `pager.loading()` 检查，发起**第二个第 1 页请求**；两个响应各自 `this.data.list.concat(...)` → 重复
- 修复建议：refresh 加请求代际（generation）守卫；`Pager.reset()` 不清 `isLoading`；repair/list 去掉 `onLoad` 里的 refresh（保留 `onShow` 即可）

## BUG-002｜快速切换筛选 Tab 会混入旧条件数据（三页同根因）

- 严重级：P1｜模块：报修列表 / 通知列表 / 社区圈子｜频率：必现（mock 300ms 窗口内连点）
- 复现步骤：1. 进入通知列表 2. 在请求未返回时连点两个类型 Tab（或下拉刷新后立即切 Tab）3. 观察列表
- 预期：只显示当前筛选条件的数据
- 实际：旧条件的响应后返回时 `concat` 进新列表，两类数据混杂且条目重复
- 代码证据：
  - `pages/circle/index.ts:132-154`、`pages/notice/list/index.ts:191-213`、`pages/repair/list/index.ts:119-139` —— `refresh()` 无代际守卫 + `pager.reset()` 清 loading 锁（同 BUG-001 根因）
  - 确定性触发路径：首页「最近路况」pill → `goCircleRoad()` → 首次进 circle Tab：onLoad 的 refresh（无筛选）未返回，onShow 消费 `pendingCircleFilter` 又发一次 refresh（type=road）
- 修复建议：与 BUG-001 同一次修复覆盖（代际标记丢弃过期响应）

## BUG-003｜通知详情弹层「点内容即关闭」

- 严重级：P1｜模块：通知列表｜频率：必现
- 复现步骤：1. 打开通知列表 2. 点任意通知打开详情弹层 3. 点击正文/元信息区域想查看或选择文字
- 预期：弹层保持打开，仅点遮罩或右上角 × 关闭
- 实际：点弹层内任意位置即关闭，只剩 × 可用
- 代码证据：`pages/notice/list/index.wxml:67` —— `<view class="sheet" catchtap="onCloseDetail">`：catchtap 绑的是**关闭方法本身**，原意是拦截冒泡（应绑空操作，对照首页紧急弹层 `catchtap="noop"`）；且注释所称「与社区圈子详情同一交互范式」已过时（circle 页现无 sheet/mask 结构）
- 修复建议：`catchtap` 改绑空操作方法

## BUG-004｜request 层吞掉后端 400 具体文案，与契约口径矛盾

- 严重级：P2｜模块：全站请求层（影响：社区账号修改、报修内容安全拦截）｜频率：必现
- 复现步骤 A：1. 「我的」→ 修改社区账号为已被占用账号 2. 提交
  - 预期（代码注释承诺）：toast「社区账号已被使用，换一个试试」
  - 实际：toast「提交内容有误，请检查后重试」——误导用户以为是格式问题
- 复现步骤 B：报修提交命中 msgSecCheck 违禁词 → 具体违禁原因被通用文案覆盖
- 代码证据：
  - `miniprogram/utils/request.ts:42` —— `ERROR_TOAST[code] ?? msg`：400/401/403/404/429/500 命中时永远用通用文案覆盖后端 msg
  - 契约口径证据：`services/user.ts:8`「被占用 → 400（msg 由 request 层 toast **原文**）」、`pages/profile/index.ts:9`「按后端 400 msg **原样 toast**，前端不另造文案」、`pages/repair/create/index.ts:146`「含 msgSecCheck 违禁词 400」
- 修复建议：400 类业务错误优先展示后端 `msg`，通用文案仅作 msg 为空时的兜底（口径冲突已记录，若改通用口径需架构师裁决）

## BUG-005｜报修详情页加载失败后白屏（无错误态/重试入口）

- 严重级：P2｜模块：报修详情｜频率：必现（断网/云函数异常时）
- 复现步骤：1. 断网 2. 从列表点进任一报修单详情
- 预期：展示错误态 + 重试按钮（项目规范「空态一律 empty-state，禁止白屏」）
- 实际：toast 一闪而过，页面完全空白，无任何可操作元素
- 代码证据：`pages/repair/detail/index.wxml:3-7` —— 只渲染 `loading` 与 `!loading && vm` 两个分支；`index.ts:146-160` catch 后 `vm` 保持 null

## BUG-006｜AI 助手页双导航栏（index.json 漏配 navigationStyle: custom）

- 严重级：P2｜模块：AI 助手｜频率：必现
- 复现步骤：1. 进入 AI 办事助手页 2. 观察顶部
- 预期：仅一套导航（自绘 .nav：返回 + 标题 + 朗读/清空）
- 实际：系统导航栏（标题「AI 办事助手」+ 系统返回键）与 WXML 自绘 `.nav`（又一个返回键 + 标题）同时出现，双标题双返回
- 代码证据：`pages/assistant/index.json` 仅含 `navigationBarTitleText`，未配 `"navigationStyle": "custom"`（对照 `pages/index/index.json:2` 已配）；`pages/assistant/index.wxml:6-14` 自绘 `.nav`
- 修复建议：json 补 `"navigationStyle": "custom"`，或删除自绘 .nav 用系统栏（二选一，与全站首页做法对齐为 custom）

## BUG-007｜空分类下 hasMore 永不收敛，触底无限发空请求（疑似→确认逻辑缺陷）

- 严重级：P3｜模块：分页工具（影响所有列表页空分类场景）｜频率：必现
- 复现步骤：1. 进入圈子「路况」等无数据分类 2. 反复触底
- 预期：首次请求返回 total=0 后不再发请求
- 实际：`hasMore()` 在 `total === 0` 时恒返回 true，每次触底都真实发起 page=2、3、4… 的空请求
- 代码证据：`miniprogram/utils/pagination.ts:53-55` —— `if (total === 0) return true; // 还没请求过` 把「未请求」与「已请求但为空」混为一谈
- 修复建议：增加「已发起过请求」标记位区分两种状态

---

## 处理记录

- 2026-10-14 测试 新建：静态走查轮登记 BUG-001~007
- 2026-10-14 修复（P1×3）：BUG-001 删除 repair/list `onLoad` 多余 refresh；BUG-001/002 在 repair/list、circle、notice/list 三页 refresh 引入 `genId` 代际守卫，过期响应直接丢弃；BUG-003 通知详情弹层 `sheet` 的 `catchtap` 由 `onCloseDetail` 改为 `noop`（新增 noop 方法）。tsc --noEmit 通过、vitest 155/155 通过
- 遗留：BUG-004~007（P2×3 / P3×1）不阻塞上线，入 backlog
- 回归计划：修复后按影响面回归 TC-09/13/14/24/34/41/47 + 冒烟集（TC-01/06/13/19/24）

---

## BUG-008｜云函数线上报 `Cannot find module 'response'`（P0 · 2026-10-20）

- 严重级：**P0**｜模块：全部 8 个云函数｜频率：必现｜发现方式：模拟器点「提交预约」
- 现象：任何云调用失败，Console 报
  ```
  [tcb] cloud.worker 调用异常: cloud.callFunction:fail
  errCode: -504002 functions execute fail
  errMsg: Error: Cannot find module 'response'
  Require stack:
  - /var/user/index.js
  at Object.<anonymous> (/var/user/index.js:2:15)
  ```
- 根因（**2026-10-20 17:50 最终定位，前两次判断均错误**）：
  **共享模块副本目录 `shared/` 与微信云函数运行时注入的同名目录冲突。**
  - 报错栈底部出现 `at /var/user/shared/function.js:8`，而 `function.js` **不在我们的代码包里**
    → 它是运行时注入到 `/var/user/shared/` 的入口包装。
  - 我们的副本目录也叫 `shared/`，解压后被运行时目录覆盖 → `response.js` 等共享模块全部消失
    → `require('./shared/response')` 报 Cannot find module。
  - 前两次误判为「部署滞后」：因为本地加载正常、部署包下载核对也齐全（下载的是**部署包**，
    不是运行时解压后的目录），所以看起来"代码和包都对"。真正的线索只在**运行时报错栈**里。
  - 证据链：① 本地 8 函数 require 全通过 ② 云端部署包含 `shared/` 16 文件
    ③ 运行时栈出现 `shared/function.js`（我们没这个文件）⇒ 同名目录被占用。
- 修复（最终）：
  - `scripts/build-cf.mjs` 打包目标 `shared/` → **`lib/`**
  - 8 个 `index.js` 共 **38 处** `require('./shared/` → `./lib/`
  - `scripts/cloud-preflight.mjs` 新增「禁止残留 `shared/` 副本」硬检查
  - 删除 8 个函数目录下旧的 `shared/` 副本（源 `cloudfunctions/shared/` 保留）
  - 验证：预检 3 项绿 → 8 函数本地加载 OK → 部署 5846 文件成功 →
    云端产物顶层只有 `lib`、无 `shared`、`index.js` 第 5 行指 `./lib/response` → 加载成功
- 修复（2026-10-20 13:30 完成）：
  1. `node scripts/build-cf.mjs --clean`（重建 8 个函数目录下的 `shared/`，不动 node_modules）
  2. `cli cloud functions deploy --env <env> --names <8 个函数> --project <根目录>`
     **不加 `--remote-npm-install`**（否则依赖靠云端装，不可靠）
  3. 结果：8 个函数全部 `success=true`、`filesCount=5846`、`packSize=6.7 MB`
- 验证：
  - `cli cloud functions download` 拉回云端产物 → `index.js` 第 5 行确为 `./shared/response`、
    `shared/response.js` 存在
  - 本地 `require('下载目录/index.js')` 成功，`exports.main` 为 function
  - **8 个包全部 `filesCount=5846`**（同构），逐包抽查 `workorder` / `phonebook` 的 `shared/` 均为 16 文件

- ⚠️ **部署有「中间态」，别在部署窗口内验收**（2026-10-20 13:51 二次报错即此原因）：
  8 个包共 **53MB**，从开始部署到全部传完约需 **5–10 分钟**。期间：
  - 已传完的函数：新版正常
  - 未传完的函数：仍是旧包 → 报 `Cannot find module 'response'`（无路径前缀）
  - 正在传的函数：新 `index.js` 已上、`shared/` 还没上 → 报 `Cannot find module './shared/response'`（**带路径前缀**）

  **判据：看报错里的模块名有没有 `./shared/` 前缀** ——
  无前缀 = 整包是旧版；有前缀 = 新代码已上但依赖目录缺失（正在传）。
  两种都只需等部署完成，不是代码问题。
  部署后必须等 CLI 打出 `√ deploy cloudfunctions` 与 filesCount 表格再用模拟器验收。
- 预防：
  - **改完 `cloudfunctions/**` 必须重新部署**，本地对 ≠ 云端对
  - `scripts/cloud-preflight.mjs` 只能校验本地源码的 require 路径，
    **校验不到「云端跑的是不是当前版本」**——部署后要抽查 filesCount 或用 download 核对

### 同轮确认的遗留项（非本 BUG，但同批暴露）

| 项 | 实测值 | 影响 |
|---|---|---|
| 云函数 `timeout` | **3s**（`config.json` 写的是 20，**CLI 部署不应用**） | `shared/ai.js` 超时 8s > 函数 3s → AI 必然降级，表现为「配了 Key 还是降级」 |
| 云函数 runtime | `Nodejs16.13` | `ai.js` 用原生 `https.request`，不受影响；若将来改 `fetch` 会挂 |
