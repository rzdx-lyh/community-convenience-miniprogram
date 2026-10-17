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
- ⚠️ **本地历史与远程历史不相关**：本地是 46 条真实开发历史；远程 main 是"快照式"（API 推的大提交 + 几个提交）。协作前建议先统一（见 `docs/11-协作与分支操作指南.md`）。
- **版本号规范（用户定义）**：`MAJOR.MINOR.PATCH` = 正式完全上传次数 / 开发功能完全次数 / 提交次数。当前 **v0.0.1**。

## 项目约定
- 前端源码是 **.ts**；磁盘**不留 page/app 级 .js**（DevTools 空 `Page({})` 模板会顶替真实页面 → 白屏/宫格不显示）。
- 云函数调用形态 **B**：`name='<资源>'` + `data.action='<动作>'`（云函数名不含冒号）。
- 备案类目：官方备案"服务内容"表**无"社区服务"**；个人主体可选「工具」，单位主体可「生活服务-社区服务」。
- 电话簿 11 条中 `020-8888xxxx` 段为**占位号需替换**；**110/119/120 是真号严禁替换**。
- 密钥只进云函数环境变量，源码零明文；`keys/`、`project.private.config.json` 已 gitignore。
