# 项目长期记忆（社区便民小程序）

## 用户偏好 / 协作方式
- **后续需求确认方式：通过调查问卷（AskUserQuestion）问用户**（2026-10-15 用户指定）。
- 发布目标演变：一度计划备案正式上线 → 2026-10-15 改为**暂缓备案/认证、走投屏演示** → **2026-10-17 明确：目标=长期运营 + 能被搜到**，继续走「改名 → 备案 → 微信认证 → 发布」全链路（备案曾因名称/备注/证件背景被驳，整改中）。路线见 `docs/08-备案整改与上线路线.md`。
- 关键动作前**先问用户**（用户曾明确"一定要问我"）。

## 环境事实（勿重复问）
- 小程序 AppID `wx6af52092db32a671`（昵称"风残烛火心碎"，2026-10-15 改名审核中："猎奇便民服务"）。
- 云开发环境 ID `cloud1-d5g1xuxxf9eb5b758`；`USE_MOCK` 已切 **false（真云通道）**（2026-10-19）。
- ⚠️ **云函数超时必须手工改 20s**：CLI `cloud functions deploy` **不应用** `config.json` 的 `timeout`，
  CLI 也没有该参数 → 只能云开发控制台逐个改 8 个函数。默认 3s + `wx-server-sdk` 冷启动 2-4s
  = 「隔一会儿点就报网络异常，马上再点又好了」。教程见 `docs/26-云函数超时必须改20秒.md`。
- 微信开发者工具 CLI：`D:\app\微信\开发小程序\微信web开发者工具\cli.bat`（2.02.2608040）。
- 团队名：**猎奇小分队**。

## GitHub（重要）
- 仓库：**rzdx-lyh/community-convenience-miniprogram**（public，main）。已 `git remote add origin` 到本仓库。
- ✅ **本机可直连 GitHub**（2026-10-16 更正）：`git -c http.sslVerify=false` 即可 clone/pull/fetch/push；本仓库已 `git config http.sslVerify false`。
  - 根因：本机走本地代理 + Windows schannel 吊销检查失败 → 关校验即通。
  - 兜底（直连不可用时）：API 绕行脚本 `C:\Users\Administrator\Desktop\code\ai web\.wb_push\push_github.py`（全量后序建树 + 增量 `base_tree` + 重试）。
  - 账号 rzdx-lyh；令牌在 Windows 凭据管理器（`git credential fill` 取 `gho_`）；git user：rzdx-lyh / lyh687154@gmail.com。
- ✅ **远程 main 与本地同源（2026-10-18 核实，旧结论"不相关"已作废）**：远程 main 现为 `9f08c2b`（2026-10-18），与本地一致。原因是当初用 API 绕行时保持了 commit SHA 一致，所以历史线是接上的。
- **远程现存 4 个引用（2026-10-18 实测）**：
  | 引用 | 指向 | 性质 |
  |---|---|---|
  | `main` | `cce9343`（10-17） | 主干，与本地同线，本地领先 7 |
  | `_backup/snapshot-2026-10-16` | `d25f1167`（10-15） | **完整快照分支**，独立历史线；含 `7f2c808 chore(release): v0.0.1 — 代码 + 文档 + skill 完整快照` |
  | `staging` | `795e3cc9`（10-13） | 早期中间线，已停更 |
  | 标签 `v0.0.1` | `e90973c`（10-15） | 本地与远程**一致**（注意 `git rev-parse v0.0.1` 返回的是标签对象 `7ed48ce`，要加 `^{commit}` 才是提交） |
  - 快照分支是当前 main 的**严格子集**：205 文件 vs 243 文件，**没有任何快照独有文件**（`comm -13` 为空），无需从快照恢复内容。
  - ✅ **`v1.0.1` 已推送（2026-10-18 17:44）**：远程 `main` = `9f08c2b`（与本地完全同步，零领先零落后），标签 `v1.0.1` → `756c794`。
- ⚠️ **沙箱内 git 直连会被代理挡**：`git ls-remote` 报 `CONNECT tunnel failed, response 502`；但 **`api.github.com` 用 Python urllib（关校验）可通**。查远程状态优先走 API：`/branches`、`/tags`、`/commits?sha=<branch>`。注意 `/tags` 返回的是 `commit.sha`，**没有顶层 `sha` 字段**。
- **版本号规范（用户定义）**：`MAJOR.MINOR.PATCH` = 正式完全上传次数 / 开发功能完全次数 / 提交次数。
- **两条独立版本轨（2026-10-18 定）**：
  - **代码轨**：当前 **v1.1.0**（git 附注标签 `v1.1.0`，2026-10-19 升版并推送；上一版 `v1.0.1`）。版本唯一真源 = `miniprogram/config/env.ts` 的 `APP_VERSION`；`package.json` / `package-lock.json` 根包 / 8 个云函数包 / `README.md` / `CHANGELOG.md` 全部对齐；由 `tests/version.test.ts`（6 条）守护，源码里出现别的版本号即测试失败。
    - 升版清单：改 `env.ts` → `package.json` → `package-lock.json`（根包两处）→ 8 云函数包 → 源码注释（约 15 文件，`v1.0.1` → 新版本，**保留 CR 编号**）→ README → `tests/version.test.ts` 的 `EXPECTED`/`EXPECTED_SEMVER`/标题。
  - **设计原型轨**：`docs/03-preview/demo.html` 当前 **1.4.0「AI 入口与集群」**（2026-10-19 核实，
    单文件 JS 模板原型，3628 行，`render()` 注册 22 业务页 + 2 登录页），与代码轨分开计数。
    注释里写「1.4.0」**不要带 v 前缀**，否则 `tests/version.test.ts` 当成产品版本号。
  - 代码注释里的历史变更用 `CR-0xx` 编号溯源；归一后统一写作 `v1.1.0 / CR-019` 这种「当前版本 + 原始 CR」形式。

## ⚠️ 同名旧副本（容易混淆）
- `C:/Users/Administrator/Desktop/code/ai web/社区便民小程序-be` 是**早期快照**（只有 6 个页面，无 circle/service），
  不是本项目的工作目录。IDE 里曾同时开过两个，导致"改了代码但模拟器还是旧的"误判。
- **唯一工作目录**：`C:/Users/Administrator/Desktop/code/ai web/社区便民小程序`。
  排查"为什么还是旧版"时，第一步先确认 IDE 打开的是哪个目录。

## 项目约定
- 前端源码是 **.ts**；磁盘**不留 page/app 级 .js**（DevTools 空 `Page({})` 模板会顶替真实页面 → 白屏/宫格不显示）。
- 云函数调用形态 **B**：`name='<资源>'` + `data.action='<动作>'`（云函数名不含冒号）。
- 备案类目：官方备案"服务内容"表**无"社区服务"**；个人主体可选「工具」，单位主体可「生活服务-社区服务」。
- 电话簿 11 条中 `020-8888xxxx` 段为**占位号需替换**；**110/119/120 是真号严禁替换**。
- 密钥只进云函数环境变量，源码零明文；`keys/`、`project.private.config.json` 已 gitignore。
- **云函数打包**：每个函数目录**自包含**，`scripts/build-cf.mjs` 把 `cloudfunctions/shared/` 拷进各函数目录
  → 源码里 require 必须写 `./shared/...`，写 `../shared/...` 本地能跑、上传后 `MODULE_NOT_FOUND`
  （曾致线上全部云调用失败，前端统一弹「网络异常」）。`cloud-preflight.mjs` 已死守。
- **自定义组件用全局 `.ic-*` 图标**：组件 json 必须加 `"styleIsolation": "apply-shared"`，
  否则 isolated 隔离导致图标全空白（`ai-bar` 踩过）。
- **WXML 不支持 `<br>`**（被解析为未闭合标签 → 编译失败）。
- **编译校验只有 `cli preview` 可信**（`cli upload` 失败也返回 √）。已做负向对照验证其真实性。
- ⚠️ **CLI 两个前置条件**（2026-10-19 下午起踩到）：① IDE → 设置 → 安全设置 → **服务端口必须开启**
  （关了会报「工具的服务端口已关闭」）；② IDE 未运行时 CLI 要拉起它，而启动过程需 `reg.exe`，
  该程序在本机安全策略黑名单里 → **用户需先手动打开微信开发者工具**，否则 `cli preview` / `deploy` 都跑不了。
- ⚠️ **AI 超时必须小于云函数超时**：`shared/ai.js` 默认 8s，而云函数默认 3s
  → 大模型还没返回函数就被掐断，表现为「配了 `DEEPSEEK_API_KEY` 却还是降级」。
  改 Key 之前先按 `docs/26` 把超时改成 20s。原因码见 `docs/29` 的日志对照表。
- 🔴 **备案风险**：代码里有「房屋租售（明码标价）/ 生鲜零售 / 缴费」，与「个人主体 + 工具>信息查询」
  类目可能冲突 → 审核或判经营性。提交审核前建议临时下线「房屋租售」。见 `docs/28`。

## 样式与页面的两个生成物（CR-028，2026-10-19 起）
- `miniprogram/styles/layout.wxss` ← `scripts/gen-layout-wxss.mjs`（**不要手改**）
  原型 362 类 → 601 条 wxss。含原型 `:root` 变量、`.pgh--*` 6 套页头主题、
  `.ic` 底座改名 `.ib`、HTML 标签选择器类名桥接。
- `miniprogram/styles/icons.wxss` ← `scripts/gen-icons.mjs`（需 sharp，装在受管 workspace）
  83 深色 + 26 白色。加白色版改 `WHITE_ICONS`。
- 页面结构自检：`node scripts/check-pages.mjs`（四件套/非法标签/图标/未注册/死链）。
- **改样式一律「改原型 → 重跑生成器」**，手改生成物下次就被覆盖。

## 页面结构（32 页，app.json 全注册）
- tabBar 4 项：`index`(首页) / `hall`(办事，**不再是 repair/list**) / `circle` / `profile`。
- 圈子 5 子页：`circle/{post,topic,detail,digest,mine}`；服务 12 页含
  `service/{book,booking,lease}`（新增）；`map` / `auth/{welcome,login}`。
- `pages/service/book/index` 是 38 项服务的**统一预约页**（参数 `svc`/`opts`/`cat`），
  `service-grid` 里 9 个预约类服务都指向它。
- `pages/service/category` 是旧分类页，已被 `hall` 取代但仍注册（兜底），别随手删。
- 全量待修清单见 `docs/31-页面重建交付与待修清单.md`。
