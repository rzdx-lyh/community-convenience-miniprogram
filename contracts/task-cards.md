# 任务卡（前后端并行工作依据）

> 版本：**v1.2**｜更新日期：2026-10-13（变更详见 `contracts/契约变更记录.md` **CR-005 ~ CR-010**）
> 粒度：1 卡 = 1 页面或 1 接口。依赖：无前置标注的卡可立即开工。
> 验收：完成=代码 + 自测通过 + 在本文档勾选。提交分支：前端→feature/frontend，后端→feature/backend。
>
> **v1.1 影响的任务卡**：FE-2（多轮 sessionId + 历史）、BE-6（会话读写 + 上下文压缩 + 双层护栏 + 未命中阈值）。其余卡不变。
>
> **v1.2 增量卡片（承接变更 C1 首页改版，本次新增）**：
> **FE-11 / FE-12 / FE-13**（前端，合计 2.0 人天，可并行，关键路径 ≈1.25 天）
> **BE-9 / BE-10 / BE-11 / BE-12**（后端，合计 1.75 人天，4 张全并行，关键路径 ≈0.75 天）
> ⏱ **关键路径增量合计 ≈ +1.0~1.25 天**。若不并入 FE/BE 既有排期会导致 10-20 开发完成节点失守 → 必须见文末「v1.2 增量排期与降级红线」。

## 前端任务卡（feature/frontend）

> 本节为 v1.1 既有卡（FE-0~FE-10）。**v1.2 新增的前端卡 FE-11~FE-13 见下文「v1.2 增量任务卡」章节**，勿遗漏。

### FE-0 工程与基础层（无依赖）
- 内容：`miniprogram/` 骨架（app.ts/app.json/app.wxss/sitemap.json）、utils（request/storage/format/pagination/logger）、config/env.ts、typings（model.d.ts/api.d.ts）
- 验收：`npm run typecheck` 通过；request 封装实现契约统一响应与错误码 toast
- 工时：0.5 天

### FE-1 首页（pages/index/index）
- 依赖：FE-0
- 内容：问候语+日期、AI 快捷提问入口（qa:suggest）、常用功能宫格（报修/电话簿/通知）、最新通知 3 条（notice:list）、报修进度入口
- 验收：静态渲染通过；接口 mock 可切换；空状态有引导

### FE-2 AI 助手对话页（pages/assistant/index）
- 依赖：FE-0
- 内容：对话气泡列表、输入框+发送、qa:ask 调用（loading/降级态）、**sessionId 缓存与回传（多轮，v1.1）**、**历史记录入口与清除（qa:history / qa:clear，v1.1）**、"AI 生成仅供参考"页脚、有用/无用反馈按钮（qa:feedback）、elderMode 大字适配
- 验收：**多轮上下文连贯（如问"物业费怎么交"→追问"能网上交吗"指向同一渠道）**；历史可查看可清除；降级态展示兜底文案+一键拨号；反馈可提交

> **v1.1 变更**：`sessionId` 为多轮的前提，前端必须缓存并在每次提问回传；不传则每次都是新会话（对应 TC-44 / AIQ-20 会失败）。

### FE-3 报修创建页（pages/repair/create/index）
- 依赖：FE-0
- 内容：分类选择、标题/描述输入、图片上传（云存储 fileID，≤6）、提交（workorder:create）、AI 摘要结果展示
- 验收：图片上传成功可预览；提交成功后跳详情；msgSecCheck 失败有提示

### FE-4 报修列表页（pages/repair/list/index）
- 依赖：FE-0
- 内容：状态筛选 Tab（全部/进行中/已完成）、workorder:list 分页下拉加载、状态标签组件复用
- 验收：分页正确；空状态；居民视角仅本人数据

### FE-5 报修详情页（pages/repair/detail/index）
- 依赖：FE-0
- 内容：工单全量信息、状态时间轴、AI 摘要卡片、图片预览、取消按钮（pending 可点）、物业处理备注展示
- 验收：状态流转展示正确；取消后列表刷新

### FE-6 通知列表页（pages/notice/list/index）
- 依赖：FE-0
- 内容：通知/活动双 Tab、notice:list 列表、活动卡片展示地点与报名截止、详情跳转
- 验收：分类筛选正确；空状态

### FE-7 电话簿页（pages/phonebook/index）
- 依赖：FE-0
- 内容：分类分组列表（phonebook:list）、一键拨号（wx.makePhoneCall）、搜索过滤
- 验收：分组展示；拨号可用；搜索即时过滤

### FE-8 我的页面（pages/profile/index）
- 依赖：FE-0
- 内容：用户信息（user:updateProfile 编辑）、关怀模式开关（elderMode）、我的工单入口、隐私政策入口
- 验收：资料编辑保存成功；开关持久化（storage）

### FE-9 公共组件与适老化
- 依赖：FE-0
- 内容：empty-state、status-tag、loading、ai-bubble 组件；elderMode 全局样式类（大字号）
- 验收：组件有最小单测或渲染自测记录

### FE-10 联调与自测
- 依赖：FE-1~9 + BE 联调
- 内容：按契约逐页联调；产出 `docs/05-前端自测记录.md`
- 验收：P0 页面全部走通主链路；问题记入 contracts/联调问题清单.md

---

## v1.2 增量任务卡（承接变更 C1 首页改版）

> 📍 **本节同时包含前端卡（FE-11~13）与后端卡（BE-9~12）**，是 2026-10-13 变更 C1 通过后的新增工作量，
> 编号接既有序列向后延续（既有 FE-0~10 / BE-0~8 见上文，本节不重复列出）。

> **总工期：前端 2.0 人天 / 后端 1.75 人天；关键路径增量 ≈ +1.0~1.25 天（并行后）。**
> **所有卡都标注了「降级方案」——10-19 未完成则按降级交付，不得拖垮 M5 开发完成节点。**

### FE-11 首页 v1.2 改版 + app.json 路由（pages/index/index）
- 负责人：前端工程师｜分支 `feature/frontend`｜**工期：1.0 天**
- 依赖：FE-0（request 封装）、FE-9（公共组件）、契约 `notice:urgentLatest`、`service:list`、`auth:login`（accountId）、设计预览 v1.1 §0
- 内容：
  1. **顶部绿色渐变头部**（460rpx）：定位行、用户信息条（头像 + 昵称 + **`accountId` 社区账号 24rpx 白70%**）、紧急求助行（红徽标 + 白 pill 按钮）
  2. **白色通知卡**（负边距 -72rpx 叠压）：紧急通知标题 + 摘要轮播（3s）+ 右侧插画区；点击 → `pages/notice/list/index?type=urgent`
  3. 「本周公告」「最近路况」双 pill → 通知列表 / 圈子 `road` 筛选
  4. **2×2 四类服务宫格**：调 `service:list` 渲染（title / subtitle / icon / iconTheme）
  5. **app.json**：TabBar 改 4 项 + `selectedColor: #1E8252` + pages 数组调整 + TabBar 图标就位
  6. 紧急求助半屏弹层（110/119/120 + 值班电话，号码 `phonebook:list` 分类 emergency/property + 本地兜底常量）
- 验收标准：
  1) ⚠ **头部与内容必须在同一滚动容器内再做负边距叠压**（设计预览 §0 v1.2 修复项：否则通知卡顶部被裁切）；
  2) 紧急区：`notice:urgentLatest` 有数据→轮播；**空数组→空态文案「暂无紧急通知，社区运行正常」**（不得报错）；接口 500→区内「公告加载失败」+ 重试按钮；
  3) 宫格：`service:list` 失败或返回空 → **回退本地常量** `config/service-grid.ts`，4 格仍可渲染可点击（0 白屏）；
  4) 宫格 8 个子项点击全部**可达且有内容**（不得出现「建设中」toast）；6 种 `targetType` 分发工具函数单测覆盖；
  5) TabBar 4 项切换正常；AI 助手**不再是 Tab**，但从首页宫格/入口 `navigateTo` 可达且左上角有返回；
  6) 关怀模式下宫格改 1 列 4 行、头部行高 +25%，无溢出；
  7) 首屏 ≤2s（含 2 次云函数调用：`urgentLatest` + `service:list`，建议 Promise.all 并发）。
- 受影响文件：`miniprogram/app.json`、`pages/index/index.{wxml,wxss,ts,json}`、`utils/navigator.ts`（targetType 分发）、`config/service-grid.ts`（本地兜底常量）、`assets/icons/icon-tab-*-81.png`
- **降级方案（-0.25 天）**：宫格数据直接写死本地常量，不接 `service:list`；紧急区降级为 `notice:list({type:'urgent',pageSize:5})`。

### FE-12 社区圈子页（pages/circle/index）
- 负责人：前端工程师｜分支 `feature/frontend`｜**工期：0.5 天**
- 依赖：FE-0、契约 `circle:list` / `circle:detail`、设计预览 §6「社区圈子」
- 内容：
  1. 页面骨架（**第一步必须先建空壳并注册进 app.json，否则 TabBar 编译报错**）
  2. Tag 分类 Tab（全部 / 路况 / 公告 / 活动）+ `circle:list` 分页下拉加载
  3. 卡片：标题 + 摘要 2 行省略 + 作者（`authorRole=official` 显示「官方」徽标）+ tags + 相对时间
  4. `circle:detail` 详情页（或半屏展开）
  5. 消费全局 `pendingCircleFilter`（来自首页「最近路况」pill 与宫格 `circle` 跳转），`onShow` 读取后立即清除
- 验收标准：
  1) TabBar 第 3 项可点且选中色 `#1E8252`；
  2) 列表默认展示 8 条种子数据，路况 Tab 有 ≥3 条；
  3) 空态用 `empty-state` 组件（文案「还没有邻居发言」），**不得白屏**；
  4) 从首页「最近路况」进圈子时自动切到「路况」Tab 并完成筛选，返回再进不残留筛选；
  5) 分页触底加载正确，`total` 到底显示「没有更多了」；
  6) 详情页 404（帖子被下架）→ toast + 返回列表。
- 受影响文件：`pages/circle/index.*`（新增）、`pages/circle/detail/index.*`（新增，若做二级页）、`app.json`
- **降级方案（-0.25 天）**：取消详情页，列表卡点击后由 `wx.showActionSheet` 或卡片内联展开全文 —— 少 1 个页面，验收项 6 改为内联展开。

### FE-13 现有页 URL 入参改造 + 社区账号编辑
- 负责人：前端工程师｜分支 `feature/frontend`｜**工期：0.5 天**
- 依赖：FE-0、契约 `user:updateProfile`（accountId）、`auth:login`
- 内容（对照契约「附 A.3」）：
  1. `pages/repair/create/index` 支持 `?category=`；`pages/phonebook/index` 支持 `?category=`；
  2. `pages/notice/list/index` 支持 `?type=`（含 `urgent`）与 `?tag=`；
  3. `pages/assistant/index` 支持 `?presetQuestion=`（**只填充输入框，不自动发送**）；
  4. 「我的」页新增**社区账号**编辑项（调 `user:updateProfile({accountId})`），首页 userInfo 条展示 `auth:login` 返回的 `profile.accountId`；
  5. 「服务订单」页标题文案改动（`pages/repair/list/index`）。
- 验收标准：
  1) 4 个页面 URL 入参生效，无参数时行为与改造前**完全一致**（回归项）；
  2) 社区账号编辑：非法格式 → 后端 400，`request` 层按契约 toast 原文；被占用 → toast「社区账号已被使用，换一个试试」；成功 → 首页账号即时刷新；
  3) `assistant` 的 presetQuestion 只填充不发送（防止演示误触发 LLM 计费）；
  4) 服务订单页 navbar 标题为「服务订单」，数据仍是 `workorder:list`，列表行为无回归。
- 受影响文件：`pages/repair/create/index.ts`、`pages/phonebook/index.ts`、`pages/notice/list/index.ts`、`pages/assistant/index.ts`、`pages/profile/index.{wxml,ts}`、`pages/repair/list/index.json`
- **降级方案（-0.25 天）**：accountId 编辑项不做（仅展示服务端生成的默认值），保留 URL 入参改造即可。

---

### BE-9 notice 扩展：urgent 类型 + notice:urgentLatest
- 负责人：后端工程师｜分支 `feature/backend`｜**工期：0.5 天**
- 依赖：BE-0、BE-4（`notice:list`/`detail`）
- 内容：
  1. `notices` 集合补字段（集合本身无需重建，新字段可空）
  2. 新增 action `notice:urgentLatest`：`status=published AND type=urgent AND startAt<=now(空则跳过) AND endAt>=now(空则跳过)`，排序 `level` 权重 → `startAt` → `publishAt` 降序，取 `limit`（默认 5、上限 10）
  3. `notice:list` 增加可选入参 `includeExpired`（默认 false → 过滤已过期 urgent）
  4. `scripts/seed.mjs` 补 3 条 `type=urgent` 种子，**日期用相对时间生成**
  5. 索引：`type + endAt`（可选，见慢查询再补）
- 验收标准：
  1) `urgentLatest` 返回**当前未过期**的紧急通知，含 `summary` 字段；
  2) **过期验证**：把某条 `endAt` 改成昨天 → 该条立即消失；`startAt` 改成明天 → 同样消失（未到生效时间）；
  3) 无任何 urgent 数据时返回 `{code:0,msg:'ok',data:{list:[],total:0}}`，**不得返回 404/500**；
  4) `notice:list({type:'notice'})` 行为与 v1.1 **完全一致**（回归测试必做）；
  5) `notice:list({type:'urgent'})` 默认过滤过期；`includeExpired:true` 时全部返回；
  6) `limit` 越界（0 / 999）不报错，按 1 / 10 处理。
- 受影响文件：`cloudfunctions/notice/index.js`（或 handlers）、`scripts/seed.mjs`、`contracts/db-schema.md`
- **降级方案（-0.25 天）**：跳过 `urgentLatest` 与 `includeExpired`，前端直接用 `notice:list({type:'urgent'})`（唯一损失：`level` 排序与 `startAt` 未生效过滤）。

### BE-10 circle 只读接口 + 种子数据
- 负责人：后端工程师｜分支 `feature/backend`｜**工期：0.5 天**
- 依赖：BE-0
- 内容：
  1. 新建 `cloudfunctions/circle/`（index.js + package.json + config.json，`timeout: 20`）
  2. `circle:list`：`status=published`，支持 `type`/`tag`（精确）/`keyword`（模糊），排序 `topFlag` → `publishAt` 降序，分页
  3. `circle:detail`：返回 published 单条 + `viewCount` 原子自增（`_.inc(1)`，失败静默）
  4. **`authorOpenid` 不下发**给前端（出参剔除）
  5. `scripts/seed.mjs` 补 8 条种子（road≥3 / notice 3 / activity 2，official 4 / resident 4，含 1 条置顶 + 1 条带图）
  6. 索引：`status+publishAt`、`type+status+publishAt`、`tags`
- 验收标准：
  1) `circle:list({type:'road'})` 返回 ≥3 条（首页「最近路况」必须有数据）；
  2) 无参调用返回全部 8 条，`draft` 的 0 条（若灌了 draft 必须被过滤）；
  3) `tag` 精确匹配、`keyword` 模糊匹配可用；
  4) `circle:detail` 连续调用 2 次，`viewCount` 递增 2；不存在的 id → 404；
  5) 出参**不含** `authorOpenid`；
  6) 响应严格 `{code,msg,data}`；列表空时 `list:[]` 不报错。
- 受影响文件：`cloudfunctions/circle/*`（新增）、`scripts/seed.mjs`
- **降级方案（-0.25 天）**：种子缩减到 4 条（road 2 / notice 1 / activity 1），接口保持 2 个不变（删一期会失去 Tab 页数据源，不建议）。

### BE-11 service:list + service_category 集合 + 种子
- 负责人：后端工程师｜分支 `feature/backend`｜**工期：0.5 天**
- 依赖：BE-0
- 内容：
  1. 新建 `cloudfunctions/service/`，实现 `service:list`（支持 `key?`，只返 `status=online`，按 `sort` 升序，**不分页**）
  2. `service_category` 集合建 `key` 唯一索引、`status+sort` 索引
  3. `scripts/seed.mjs` 灌 4 条分类 + 共 8~11 个子项（按契约 §service:list 承接方案表）
  4. 兜底：接口异常时**仍返回 `{code:0, data:{list:[]}}`** 而非 500（让前端走本地常量回退）
- 验收标准：
  1) `service:list` 返回 4 条分类，每条含 `items` 数组，字段与 `ServiceCategory`/`ServiceItem` 完全一致；
  2) `service:list({key:'life'})` 只返 1 条；key 不存在 → `list:[]` **不报错**；
  3) `items[].targetType` 取值只在契约枚举内；`targetType=page` 的 `targetPath` 必须是 **app.json 中已存在的页面**（后端需人工核对一遍清单）；
  4) `phone` 类型的 `targetParams.phone` 为纯数字/含 `-` 的合法号码字符串；
  5) 8 个子项中 **0 个** `targetType=toast`。
- 受影响文件：`cloudfunctions/service/*`（新增）、`scripts/seed.mjs`
- **降级方案（-0.5 天）**：整卡不做，前端用本地常量 `config/service-grid.ts` 硬编码。**这是工期告急时的第一顺位砍项**（前端 UX 完全一致，仅失去"不发版改文案"能力）。

### BE-12 user.accountId 生成与唯一性校验
- 负责人：后端工程师｜分支 `feature/backend`｜**工期：0.25 天**
- 依赖：BE-0、BE-1（auth/user）
- 内容：
  1. `auth:login` 建档时生成默认 `accountId`（`linju_` + 6 位随机串，字符集排除 `0/o/1/l/i`；查库校验唯一，最多重试 3 次；仍冲突 → 降级 openid 末 6 位）
  2. **懒迁移**：`auth:login` / `user:updateProfile` 返回前检测 `accountId` 为空则生成并写回
  3. `user:updateProfile` 支持 `accountId` 入参：`trim().toLowerCase()` → 正则 `/^[a-z][a-z0-9_]{3,19}$/` 校验 → 查库唯一（排除本人 `_id`）
  4. `users` 集合建 `accountId` **唯一索引**
  5. 出参 `profile` 剔除内部字段，保留 `accountId`
  6. 3 个种子测试账号补 `accountId`
- 验收标准：
  1) 新用户登录 → `profile.accountId` **必有值**且格式合法；
  2) 同一个钉钉串生成 +n 次不重复（跑 20 次生成，0 冲突）；
  3) 改为他人已用账号 → 400 + msg「社区账号已被使用，换一个试试」；
  4) 改为自己当前账号 → 200 成功（**不得**报重复）；
  5) 非法格式（`Abc`、`ab`、`a b c`、`中文`）→ 400 + msg「社区账号需 4-20 位小写字母开头，可含数字和下划线」；
  6) 手把一个老用户的 `accountId` 置空后调 `auth:login` → 自动补回（懒迁移生效）；
  7) `users.accountId` 唯一索引存在（并发重复写入会被数据库拒绝，不产生脏数据）。
- 受影响文件：`cloudfunctions/auth/index.js`、`cloudfunctions/user/index.js`（或 handlers）、`scripts/seed.mjs`
- **降级方案：不可降级**（首页用户信息条第 3 行依赖该字段，属 P0）。工期已满工期 0.25 天，无压缩空间。

---

## v1.2 增量排期与降级红线

### 工期合计

| 角色 | 新增卡 | 串行人天 | **并行后关键路径** |
| --- | --- | --- | --- |
| 前端 | FE-11 / FE-12 / FE-13 | 2.0 | **≈1.25 天**（FE-11 与 FE-12/13 部分并行） |
| 后端 | BE-9 / BE-10 / BE-11 / BE-12 | 1.75 | **≈0.75 天**（4 卡互不依赖，全并行） |
| **合计** | **7 张** | **3.75 人天** | **≈ +1.0~1.25 天（关键路径）** |

### 建议排期（终点 2026-10-25 23:59）

| 日期 | 动作 |
| --- | --- |
| 10-14 | FE/BE 并行：原有 FE-0~10 / BE-0~8 开工；后端优先做 **BE-12（0.25 天，前端 FE-11 依赖）** |
| 10-15~16 | 后端完成 BE-9/10/11/12 全部；前端完成 FE-0/FE-9 公共层 |
| 10-15~18 | 前端 FE-11（首页改版）/ FE-12（圈子）/ FE-13（入参改造）并行推进 |
| 10-19 | **M5 开发完成**（含 v1.2 增量），未达标则当日触发降级 |
| 10-20~21 | 联调 + 缓冲（缓冲只剩 2 天，很薄） |
| 10-21~22 | 测试（G5） |
| 10-23 | 体验版 + 演示视频 + 重跑种子脚本（确认紧急通知未过期） |
| 10-24 | 预打包演练 |
| 10-25 | 打包提交 G6 |

### 降级优先级（工期不足时按顺序砍，先砍最便宜的）

| 顺序 | 砍法 | 省 | 损失 |
| --- | --- | --- | --- |
| 1 | **BE-11 整卡不做**（service:list） | 0.5 天 | 仅失去"控制台改宫格文案免发版"能力，前端 UX 不变 |
| 2 | **circle:detail 二级页**（FE-12 降级） | 0.25 天 | 详情页改为卡片内联展开 |
| 3 | **accountId 编辑项**（FE-13 部分降级） | 0.25 天 | 账号仍展示（服务端生成），只是不可编辑 |
| 4 | **notice:urgentLatest**（BE-9 降级） | 0.25 天 | 紧急区改用 `notice:list`，失去 level 排序与 startAt 生效判定 |
| ⛔ | **不可砍**：BE-12（accountId 生成）、BE-10（circle:list）、FE-11（首页改版本体） | — | 这三项是变更 C1 的验收面，砍了等于没做 C1 |

---

## 后端任务卡（feature/backend）

> 本节为 v1.1 既有卡（BE-0~BE-8）。**v1.2 新增的后端卡 BE-9~BE-12 见上文「v1.2 增量任务卡」章节**，勿遗漏。

### BE-0 工程与基础层（无依赖）
- 内容：`cloudfunctions/` 目录、共享工具（响应封装/错误码/时间格式化）、`scripts/seed.mjs` 种子数据脚本、云开发环境配置说明
- 验收：统一响应结构符合契约；种子脚本可跑通说明文档

### BE-1 auth 分组（login / updateProfile）
- 依赖：BE-0
- 验收：首次登录自动建档；手机号 AES 加密；越权返回 403

### BE-2 workorder:create / list / detail
- 依赖：BE-0、BE-1
- 验收：创建接 msgSecCheck；AI 摘要失败不阻断；列表按角色隔离；分页正确

### BE-3 workorder:cancel / handle
- 依赖：BE-2
- 验收：取消仅本人+pending；handle 状态机流转正确；done 触发订阅消息（无模板 ID 时降级日志）

### BE-4 notice:list / detail
- 依赖：BE-0
- 验收：仅返回 published；详情 404 处理

### BE-5 phonebook:list
- 依赖：BE-0
- 验收：按 sort 升序；分类过滤

### BE-6 qa 分组：ask / history / clear / feedback / suggest（AI 核心）
- 依赖：BE-0
- 内容：大模型 API 调用（Key 走环境变量）、知识库关键词检索（知识库存 `cloudfunctions/shared/kb/kb.json`）、超时 8s、失败降级话术+电话、反馈落库
- **v1.1 追加内容**：
  - **会话读写**：`sessionId` 缺省时新建会话并返回；`qa_sessions` 集合读写（`_openid` 隔离）
  - **上下文压缩**：仅保留最近 **3 轮**；单条 content 截断 300 字；总上下文超 2000 tokens（估算）丢弃最早轮次；会话 2 小时过期
  - **输入护栏**：空输入 / 超长 / 提示注入 / 非社区域问题一律拦截，**不调用大模型**
  - **未命中阈值**：检索最高分 < 1.0 判定未命中，直接兜底话术 + 便民电话，**不调用大模型**
  - **输出护栏**：回答中的电话 / 政策 / 金额必须命中知识库，否则替换原文片段或降级；服务端强制注入"AI 生成仅供参考"；回答 ≤500 字
  - **`degraded=true` 时必须同时返回便民电话**
- 验收：问答链路通；**多轮上下文连贯**；**历史可查可清**；无 Key 时降级正常返回；AI 调用耗时日志含 `cost_ms`；**503 降级时电话簿非空**

### BE-7 知识库初始化脚本
- 依赖：BE-0
- 内容：首批资料（办事指南/物业电话/常用流程）整理为 JSON，`scripts/kb.mjs` 导入
- 验收：知识库文件含 ≥10 条问答对

### BE-8 联调与自测
- 依赖：BE-1~7 + FE 联调
- 内容：按契约逐接口自测；产出 `docs/06-后端自测记录.md`
- 验收：契约内接口全部按入参/出参/错误码验证通过

## 联调协作约定
- 问题统一记入 `contracts/联调问题清单.md`（发现人/接口/现象/截图/结论）
- 后端未就绪时前端用 mock（FE-0 内置开关），接口路径不变
- 契约争议由架构师（Lead 代理）裁决，禁止私自改入参出参
