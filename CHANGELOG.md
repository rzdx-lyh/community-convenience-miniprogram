# 更新日志

记录**小程序代码**（`miniprogram/` + `cloudfunctions/` + `tests/`）的版本。

> 设计原型 `docs/03-preview/demo.html` 与 `docs/` 下的设计文档走**独立版本轨**，不在本文件记录。
> 版本号唯一真源：`miniprogram/config/env.ts` 的 `APP_VERSION`，由 `tests/version.test.ts` 守护。

## v1.0.1 — 2026-10-18 · 代码基线

**版本归一**：源码注释、`package.json` / `package-lock.json`、8 个云函数包、`README.md` 四处版本号统一为 `v1.0.1`；
散落的 `v1.0.2` / `v1.0.4` 注释标记改为 `v1.0.1`，**保留 `CR-019` / `CR-020` 变更编号**作为溯源锚点。

**本版覆盖**

| 层 | 内容 |
|---|---|
| 页面（9） | 首页、办事大厅、社区圈子、我的、报修新建 / 详情 / 列表、通知列表、AI 助手、社区电话簿 |
| 云函数（8） | `auth` / `circle` / `notice` / `phonebook` / `qa` / `service` / `user` / `workorder` |
| 自测 | 13 个测试文件 / 178 条用例；`npm run verify` = typecheck + lint + test 全绿 |
| 契约 | 云函数调用形态 B（`name:'<资源>'` + `data.action`），动作 19 个 |

**已知未完成**

- 服务分类页与统一表单页尚未落地，首页宫格当前仍直接指向既有页面（详见 `docs/14`）
- 设计原型已迭代到 `v1.3.2`（图标体系、P1~P7 页面骨架、智慧配餐、个人中心、开局登录），代码尚未对齐
- `USE_MOCK` 仍为 `true`（CR-017），真机联调与云函数上传未开始

---

## v0.0.1 — 2026-10-10

初始脚手架：项目结构、Design Token、mock 数据层、云函数骨架、TypeScript 与 ESLint 配置。
