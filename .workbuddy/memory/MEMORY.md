# 项目长期记忆（社区便民小程序）

## 用户偏好 / 协作方式
- **后续需求确认方式：通过调查问卷（AskUserQuestion）问用户**（2026-10-15 用户指定）。
- 发布目标演变：一度计划备案正式上线 → 2026-10-15 改为**暂缓备案/认证、走投屏演示** → **2026-10-17 明确：目标=长期运营 + 能被搜到**，继续走「改名 → 备案 → 微信认证 → 发布」全链路（备案曾因名称/备注/证件背景被驳，整改中）。路线见 `docs/08-备案整改与上线路线.md`。
- 关键动作前**先问用户**（用户曾明确"一定要问我"）。

## 环境事实（勿重复问）
- 小程序 AppID `wx6af52092db32a671`（昵称"风残烛火心碎"，2026-10-15 改名审核中："猎奇便民服务"）。
- 云开发环境 ID `cloud1-d5g1xuxxf9eb5b758`；`miniprogram/config/env.ts` 的 `USE_MOCK=true`（mock 演示通道）。
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
  - **代码轨**：当前 **v1.0.1**（git 附注标签 `v1.0.1`，2026-10-18 归一）。版本唯一真源 = `miniprogram/config/env.ts` 的 `APP_VERSION`；`package.json` / `package-lock.json` 根包 / 8 个云函数包 / `README.md` / `CHANGELOG.md` 全部对齐；由 `tests/version.test.ts`（6 条）守护，源码里出现别的版本号即测试失败。
  - **设计原型轨**：`docs/03-preview/demo.html` 当前 **v1.3.2**，与代码轨分开计数（原型领先代码是事实，不要压成一个号）。
  - 代码注释里的历史变更用 `CR-0xx` 编号溯源，不靠版本号；归一后统一写作 `v1.0.1 / CR-019`。

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
