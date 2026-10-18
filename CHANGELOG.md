# 更新日志

记录**小程序代码**（`miniprogram/` + `cloudfunctions/` + `tests/`）的版本。

> 设计原型 `docs/03-preview/demo.html` 与 `docs/` 下的设计文档走**独立版本轨**，不在本文件记录。
> 版本号唯一真源：`miniprogram/config/env.ts` 的 `APP_VERSION`，由 `tests/version.test.ts` 守护。

## 未发布（Unreleased）

> 这些改动发生在 v1.0.1 打标之后，**尚未升版**。等本批功能落齐后统一升 `v1.1.0`。

### 新增

- **服务分类页** `pages/service/category/index`（CR-022）：4 类 Tab + 8 板块分组 + 38 项服务；
  预约类服务在页内弹出表单，提交走 `workorder:create`（零新增云函数动作）
- **服务数据扩容**：`config/service-grid.ts` 由 4 类 / 10 项扩到 **4 类 / 8 板块 / 38 项**，
  新增 `groups` 结构，`items` 由 `withFlattenedItems()` 派生（物理上不可能不同步）
- **搜索同义词表**：`SEARCH_ALIASES` 由 26 条扩到 100+ 条，覆盖 38 项的口语说法；
  修正「漏水」由映射到缴费改为映射到管道疏通 / 家电维修
- **页面级 AI 询问入口**（CR-024）：新增 `components/ai-bar`，接入 7 个页面；
  回答链路＝本地问答库（45 条，离线可用）→ `qa:ask` 云函数 → 兜底转人工
- **办事大厅 AI 集群**（CR-024）：搜索框下方 8 张场景卡（办事指南 / 报修进度 / 健康咨询 /
  配餐营养 / 费用户号 / 找地点 / 邻里互助 / 应急求助），复用同一套问答面板
- **AI 场景配置**（CR-024）：`config/ai-scenes.ts` 收敛 8 场景 + 7 页面入口 + 45 条问答库
- **矢量图标系统**（CR-025）：`scripts/gen-icons.mjs` 把原型 83 枚 SVG symbol 转成
  `styles/icons.wxss`（83 深色 + 23 反白）+ `assets/tabbar/*.png`（4 Tab × 2 态），替换 emoji 占位
- **6 个新服务页**（CR-026）：智慧配餐（15 道菜按忌口/目标配餐，可换菜、出采购清单）/
  办事指南（8 项政务事项的材料·窗口·时限·跑腿次数·避坑）/ 缴费账单（阶梯水价试算 + 户号绑定）/
  健康档案（血压血糖自测 + 解读 + 家庭医生签约）/ 共享设备（6 类设备借用登记 + 4 点位）/
  快递代取（代取代寄申请 + 驿站点位 + 价目）；数据纯本地，**零新增云函数**

### 变更

- **首页宫格点击**：`wx.showActionSheet` → `navigateTo` 服务分类页（ActionSheet 保留为失败兜底）
- **契约**：`api-contract.md` 附 A.2 页面数 9 → 10；§service:list 范围裁定按 CR-022 局部修订
- **Design Token 换肤**（CR-023）：清新绿 v1.1 → **政务蓝 v1.5**（`--brand` `#1E8252` → `#1F5FD6`），
  新增 `--brand-mid/-press/-light/-brand-gradient`；中性色由暖米改冷灰；旧绿零残留
- **首页结构改版**（CR-023）：品牌行（logo/定位/紧急/头像）+ 搜索条 + 4 快捷入口 +
  纵向分类卡（含「N 项」）+ AI 入口 + 社区动态
- **TabBar**（CR-025）：由纯文字改为文字 + 图标（选中态政务蓝、未选中态冷灰）
- **服务宫格路由**（CR-026）：8 个服务项由 AI 兜底（`assistant`）改为直达新页（`page`）；
  「政务事项代办」更名「办事指南」；「家庭医生签约」迁入健康档案页（`?sign=1` 直达签约弹层）
- **搜索同义词**（CR-026）：新增「办事 / 证件 / 社保 / 居住证 / 借用 / 设备 / 借伞」等 9 组别名

### 测试

- 新增 `tests/service-category.test.ts`（23 条），含「所有 `targetPath` 必须在 `app.json` 注册」交叉校验
- `npm run verify`：typecheck + lint + **201 条 / 14 文件** 全绿
- 新增 `tests/ai-scenes.test.ts`（15 条），关键断言「所有预置问题本地库必命中」→ 断网也能演示
- 新增 `tests/icons.test.ts`（8 条）：图标引用有效性 + 反白版子集关系 + 包体积 <700KB 守卫
- `npm run verify`：typecheck + lint + **224 条 / 16 文件** 全绿；`cli preview` 编译通过（包 805KB / 上限 2MB）
- 新增 `tests/service-bill-record.test.ts`（25 条）+ `tests/service-tool-express.test.ts`（15 条）：
  守住**不收款 / 不诊断 / 不收押金**三条业务红线，以及阶梯水价对账、解读文案合规
- `npm run verify`：typecheck + lint + **283 条 / 19 文件** 全绿；
  `cli preview` 编译通过（已用「故意插入非法标签」做负向对照，确认编译检查真实生效）

---

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
