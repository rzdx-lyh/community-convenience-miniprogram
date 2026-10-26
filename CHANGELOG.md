# 更新日志

记录**小程序代码**（`miniprogram/` + `cloudfunctions/` + `tests/`）的版本。

> 设计原型 `docs/03-preview/demo.html` 与 `docs/` 下的设计文档走**独立版本轨**，不在本文件记录。
> 版本号唯一真源：`miniprogram/config/env.ts` 的 `APP_VERSION`，由 `tests/version.test.ts` 守护。

## v1.2.1 — 2026-10-26 · 定位接口替换（wx.getLocation 申请被驳回）

### 变更

- **移除 `wx.getLocation`**：微信「接口申请审核结果」不通过（2026-10-24，理由：使用场景未符合
  `wx.getLocation`（获取当前的地理位置、速度）接口的开放范围）。代码不再调用任何定位接口，
  `app.json` 删除 `requiredPrivateInfos:["getLocation"]` 与 `permission.scope.userLocation`。
- **新增「社区位置手选」**：`miniprogram/config/community.ts` 定义社区中心 + 6 个位置点
  （3/1/2 号楼、南门岗亭、西门、社区食堂）；首启页、首页定位胶囊、社区地图三处改为
  `wx.showActionSheet` 选择，结果持久化到 `STORAGE_KEYS.USER_LOCATION`。
- **距离仍按真实坐标算**：社区地图 9 个服务点的距离/步行分钟数改为按所选位置点 Haversine 实算、
  按近远排序；移除 `<map show-location>`，不再显示/读取系统定位点。
- **隐私文案同步**：首启 / 欢迎 / 登录三处由「读取一次位置」改为「手动选择社区位置，
  仅用于就近排序，不读取手机定位、不保存轨迹」。
- 版本号 v1.2.0 → **v1.2.1**（`env.ts` / `package.json` / `package-lock.json` / 8 个云函数包 / README 五处一致）。
- **名称统一**：UI 品牌位 / 导航标题 / 分享标题与 `docs/32/34/35/36` 全部统一为备案名称
  「**邻里百事通小助手**」（原「邻里小助手」）。

### 测试

- 新增 `tests/community.test.ts`（7 条）：位置点数据、默认点、最近点、旧缓存兼容、选择器上限；
- 新增 `tests/location-policy.test.ts`（3 条）：源码无 `wx.getLocation` 调用、`app.json` 无定位声明、
  地图无 `show-location`（防回归）；
- `tests/onboarding.test.ts` 补「手选位置不按时间过期」用例；
- `npm run verify`：typecheck + lint + **351 条 / 27 文件**全绿；
  `node scripts/check-pages.mjs`：34 页注册齐全、0 ERROR / 0 WARN。

### 待办（上线前）

- 小程序后台「用户隐私保护指引」去掉「位置信息」，只保留 openid / 相册（见 `docs/37` §4）；
- 重新上传体验版 v1.2.1，真机回归首页位置胶囊 / 首启位置选择 / 地图距离排序。

---

## v1.2.0 — 2026-10-23 · 首启资料 + 文化便民活动 + 部署修复

### 新增

- **首启资料设置** `pages/auth/setup`：头像（chooseAvatar + 云存储）、昵称、当前位置（gcj02 + 拒绝授权引导）、协议勾选；完成前路由守卫拦截，完成后进首页
- **文化便民活动页** `pages/service/activity`：每周义诊 / 邻里活动 / 长者手机课共用，6 个小功能卡 + 活动信息 + 报名弹层（走 `workorder:create`）
- 首页定位复用 setup 缓存，避免重复授权
- 通知页支持 `tag` / `title` 入口参数（含 URL 编码兜底解码）

### 修复

- 服务分类页 `findRawItem` / `countItems` 支持只含 `groups` 的分类数据，修复文化便民项点击无效
- 首页标题被右侧定位胶囊挤成竖排
- 文化入口 query 乱码导致标题 `%E6...` 与空列表
- 云函数按“根目录平铺 + `--remote-npm-install`”重新整理部署产物

### 测试

- `npm run verify`：typecheck + lint + **340 条 / 25 文件**全绿
- 页面 34 页 check-pages 通过

---

## 未发布（Unreleased，历史记录）

> 这些改动发生在 v1.1.0 打标之后，**尚未升版**。等本批功能落齐后统一升 `v1.2.0`。

### 新增

- **13 个 AI 兜底项全部做成真页面**（CR-027），聚合为 4 个新页、用 `?tab=` 区分子频道：
  - **生鲜零售** `pages/service/fresh`：当日鲜菜 / 临期特惠（折扣标签）/ 邻里拼单（成团进度）/ 次日自提
  - **健康服务** `pages/service/health`：疫苗预约 / 体检报告代取（3 步流程）/ 慢性病咨询 / 年度体检
  - **文化服务** `pages/service/culture`：图书角借阅（6 分类 + 借阅规则）/ 四点半课堂（4 课程 + 余位进度）
  - **物业延伸** `pages/service/property`：外卖代收 / 流浪动物（公约 + 投喂点）/ 房屋租售（业主自发布）
- 改写后 `service-grid.ts` 中 `targetType: 'assistant'` 的服务项 **13 → 0**（不再有"点了只能问一句"的入口）
- `SEARCH_ALIASES` 新增 7 组（订菜 / 流感 / 接种 / 代收 / 投喂 / 二手房 等）
- 新增文档：`docs/28-备案整改操作清单.md`、`docs/29-DeepSeek密钥配置与AI通道验收.md`

### 变更

- **AI 降级原因可诊断**（CR-027）：`shared/ai.js` 的 `chat()` 增加 `reason`
  （`no_key` / `timeout` / `network` / `http_401` / `http_402` / `http_429` / `empty`）；
  `qa:ask` 新增**可选**出参 `_aiReason`，向后兼容、零新增错误码
- 新增环境变量 `AI_TIMEOUT_MS`（默认 8000，上限 15000）
- `PAGE_AI` 入口 13 → **17**；`app.json` 页面 16 → **20**

### 测试

- 新增 `tests/service-cr027.test.ts`（27 条）：守住"不收款 / 不诊断"红线 + 折扣价 < 原价 + 拼单进度解析
- `npm run verify`：typecheck + lint + **310 条 / 20 文件**全绿

---

## v1.1.0 — 2026-10-19 · 服务页补全 + 云调用健壮性

> 本版在 v1.0.1 打标之后累积，统一升版。
> 版本号含义（用户定义）：`MAJOR.MINOR.PATCH` = 正式完全上传次数 / 开发功能完全次数 / 提交次数。

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

### 修复

- **云函数致命 bug**（线上所有云调用失败，前端统一弹「网络异常」）：
  源码 `require('../shared/...')` 本地可跑，但云端包是**自包含**的（`shared/` 在函数包内部）→
  `MODULE_NOT_FOUND`。38 处改为 `./shared/`，重新打包并全量重新部署 8 个函数；
  `scripts/build-cf.mjs` 注释记录该坑，`cloud-preflight.mjs` 新增死守检查
- **AI 面板图标不显示**：`ai-bar` 自定义组件默认 `styleIsolation: isolated`，
  全局 `.ic-*` 进不去 → 补 `"styleIsolation": "apply-shared"`
- **云调用失败不可诊断**：失败时打印 `errMsg` 到 console 并附常见值速查
  （函数不存在 / 依赖缺失 / 超时 / 环境未初始化）
- **冷启动超时误报**：云函数默认超时 3s 而 `wx-server-sdk` 冷启动常 2-4s →
  前端对**超时类**失败静默重试一次（容器已热，第二次必成）；
  「函数不存在 / 依赖缺失」不重试，直接暴露
- **WXML 编译错误**：`<br>` 在 WXML 里被解析为未闭合标签 → 编译失败；改为两个 `<view>` 块

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
