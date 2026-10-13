# API 契约（唯一契约，前后端共同遵守）

> 版本：**v1.4**｜更新日期：2026-10-13｜资源 **8 个**（auth / user / workorder / notice / circle / service / phonebook / qa）｜动作 **19 个**｜错误码 **8 个**（本版零新增）
> 计数口径：按独立的 `<资源>:<动作>` 逐个计数，当前 **19 个**
> - **新增 4 个（v1.2）**：`notice:urgentLatest`、`circle:list`、`circle:detail`、`service:list`
> - **扩展 3 个（v1.2）**：`notice:list`（+`includeExpired`、+`type=urgent`）、`user:updateProfile`（+`accountId`）、`auth:login`（出参 +`accountId`）
> - 资源清单（8）：`auth` `user` `workorder` `notice` `circle` `service` `phonebook` `qa`
>
> ## ⚠ 调用形态（**唯一合法写法 · 形态 B**，全篇通用，见 CR-011-a）
> ```js
> wx.cloud.callFunction({
>   name: '<资源>',                          // ① 云函数名 = 资源名，**不含冒号**
>   data: { action: '<动作>', ...业务参数 }   // ② 动作一律放在 data.action，恒为分发键
> })
> // 例：wx.cloud.callFunction({ name: 'notice', data: { action: 'urgentLatest', limit: 5 } })
> ```
> - 文档中的 `xxx:yyy`（如 `notice:urgentLatest`）只是**逻辑名记法**，用于指代某个动作；**它不能出现在 `name` 字段里**。
>   ✅ 正确：`{ name:'notice', data:{ action:'urgentLatest' } }`　❌ 错误：`{ name:'notice:urgentLatest' }`
> - 理由：① **微信云函数名不支持冒号**；② 后端已按「资源 + action 分发」实现 8 个云函数。
> - ⚠ **`data.action` 恒为分发键**：任何调用里 `data.action` 只能取该资源下的动作名。**禁止**把业务参数也命名为 `action`
>   → 这是 `workorder:handle` 必须改用 `handleAction` 的根因，见该接口章节与 CR-011-b。
> - 前端 `utils/request.ts` 已按形态 B 实现：对外的 `'notice:list'` 会被自动拆成 `name='notice'` + `data.action='list'`，与本节约定一致。
>
> 风格要点：`callFunction` 直调，一资源一函数，函数内以 `event.action` 路由。
> 统一响应：`{ code: 0, msg: "ok", data: ... }`；`code !== 0` 为失败，`msg` 为可展示文案。
> 分页：`page` 从 1 起，`pageSize` 默认 10 上限 50；时间格式 ISO8601；图片走云存储 fileID。
> 鉴权：云函数自动取 `wxContext.OPENID`，写操作按 `users.role` 校验；不另发 token。
> 冻结：本契约发布后冻结。变更必须更新本文件并在 `contracts/契约变更记录.md` 登记，同步前后端。
>
> **v1.4 变更（CR-012 · AI 安全话术护栏，纯向后兼容增强）**：
> - `qa:ask` 新增**高风险安全护栏**：命中涉医 `medical` / 涉法 `legal` / 紧急求助 `emergency` 三类关键词时，**不调用大模型、不返回知识库原文**，返回**契约内的固定安全话术**，`degraded` 恒为 `true`
> - 新增**可选**出参字段 **`_riskLevel`**（`'none' | 'medical' | 'legal' | 'emergency'`）；老后端不返回时前端按 `'none'` 处理
> - ⚠️ **澄清 `degraded=true` 语义**：它**不等于"没答案"**，只代表"本次回答不是知识库的正常答案"。**前端必须照常渲染服务端下发的 `answer`**，严禁用本地写死的兜底文案覆盖——历史 bug：界面显示"没查到"把「请尽快就医或拨打 120」吞掉了
> - **零新增错误码**（仍为 8 个）、零删除、零语义变更
>
> **v1.3 变更（CR-011，措辞修正 + 参数定名，非破坏性，详见《契约变更记录》）**：
> - **调用形态定稿为「形态 B」**：纠正抬头 `name="<资源>:<动作>"` 与示例的矛盾写法，全文统一 `name='<资源>' + data.action='<动作>'`（CR-011-a）
> - **`workorder:handle` 业务参数定名 `handleAction`**（`assign` / `process` / `done`）；原 `action` 标注 **deprecated**，`to` 为过渡别名；后端兼容读取顺序 **`handleAction` → `to` → `action`**；新对接方一律用 `handleAction`（CR-011-b）
> - **计数口径订正**：资源 8 个、动作 19 个、错误码 8 个（CR-011-e，修正档案残留的旧口误）
>
> - **`notice:urgentLatest` 的 `total`** 定稿为**截断后的 `list.length`**（CR-011-c）
> - **`qa:ask` 知识库未命中**：`code=0` + `degraded=true` + 兜底话术 + 便民电话，**本期不新增字段**；前端按降级态渲染，**不做错误 toast**（CR-011-d）
>
> **v1.2 变更**（详见《契约变更记录》**CR-005 ~ CR-010**，承接已批准变更 C1「首页改版」）：
> - `notice`：`type` 增加 `urgent` 枚举值；新增 `level` / `startAt` / `endAt` / `summary` 字段；新增 **`notice:urgentLatest`**（首页紧急区专用，取当前有效紧急通知）
> - 新增 **`circle`** 只读模块：`circle:list` / `circle:detail`（社区圈子，集合 `circle_post`；**发帖/评论明确列为 P2，本期不做**）
> - 新增 **`service`** 模块：`service:list`（四类服务宫格聚合，集合 `service_category`；**不新增任何页面**，靠 `targetType` 复用现有页跳转）
> - `user` 新增 **`accountId`**（社区账号，替代微信不开放给小程序的「用户微信号」）；`user:updateProfile` 扩展入参并做唯一性校验
> - 路由变更：`app.json` TabBar 改 4 项（首页/服务订单/社区圈子/我的），新增 `pages/circle/index`（**详见「附 A：路由与 TabBar 约定」**）
>
> **v1.1 变更**：qa 分组补齐会话能力 —— `qa:ask` 增加 `sessionId`，新增 `qa:history`、`qa:clear`。
>
> **向后兼容总纲**：① 不删除任何既有字段；② 不修改任何既有入参/出参语义；③ 只做「新增字段、新增枚举值、新增可选参数、新增接口」四类动作；④ 不新增任何错误码（完整复用下方 8 码表）。
> **`v1.4` 向后兼容性**：CR-012 为**可选字段 + 新分支**，不删除不改名不改语义、零新增错误码。未命中高风险时响应结构与 v1.3 完全一致，老前端零改动即可继续使用；新字段 `_riskLevel` 缺省按 `'none'` 处理。
> **`v1.3` 向后兼容性**：CR-011 全部为**措辞修正 + 参数定名**，无删除、无语义变更、无新错误码。已按旧写法实现的代码在 v1.3 下仍可正常工作（唯一需注意的是 `workorder:handle`，但因后端保留三态兼容读取，**前后端均无需返工**）。

## 错误码表
| code | 含义 |
| --- | --- |
| 0 | 成功 |
| 400 | 参数错误 |
| 401 | 未登录/登录态失效 |
| 403 | 无权限（角色不符或越权访问他人工单） |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务内部错误 |
| 503 | AI 服务暂时不可用（已降级，见兜底文案） |

---

## auth：登录与用户
### auth:login
- 入参：`{}`
- 出参：`{ profile: User }`
- 说明：首次登录自动创建 users 记录（role 默认 resident）

### user:updateProfile
- 入参：`{ nickName?, phone?, building?, elderMode?, accountId? }`
- 出参：`{ profile: User }`
- 说明：手机号 AES 加密存储
- **v1.2 扩展（CR-009）**：新增可选入参 `accountId`（社区账号）。
  - **来源说明**：微信**未开放**「用户注册的微信号」字段（`wx.getUserProfile` 已废弃，`wx.login` 只给 openid/unionid），因此首页用户信息条第 3 行由原设计稿的「微信号」改为**用户自定义的「社区账号」**，可编辑、需唯一。
  - **格式规则（后端强校验）**：`/^[a-z][a-z0-9_]{3,19}$/` —— 小写字母开头，仅含小写字母/数字/下划线，长度 **4~20**；**后端入库前统一 `toLowerCase().trim()`**。
  - **唯一性**：命中他人已占用的 `accountId` → 返回 **400**，`msg` = `社区账号已被使用，换一个试试`；命中自己当前值 → 视为未修改，正常返回成功。
  - **其他错误码**：格式不符 → **400**，`msg` = `社区账号需 4-20 位小写字母开头，可含数字和下划线`；未登录 → **401**。
  - **默认生成规则（服务端，首次建档/懒迁移时执行，前端无需实现）**：
    1. 形态：`linju_` + 6 位随机串（字符集 `abcdefghjkmnpqrstuvwxyz23456789`，**排除易混淆的 `0/o/1/l/i`**），如 `linju_7k3m9a`；
    2. 生成后查库校验唯一，冲突则重生成，**最多重试 3 次**；
    3. 仍冲突（极低概率）则降级为 `linju_` + openid 末 6 位小写；
    4. **懒迁移**：`auth:login` 与 `user:updateProfile` 返回前若检测到该用户 `accountId` 为空，立即生成并写回 `users` 集合后再返回 —— 保证前端读到的 `profile.accountId` **永远有值**，无需跑数据迁移脚本。
  - **修改次数**：本期**不限制**修改次数（仅做唯一性与格式校验）；「30 天限改 3 次」等防刷策略列为 **P2**，见《待明确事项》U-3。

---

## workorder：报修工单
### workorder:create
- 入参：`{ title, description, category, images?: string[] }`
- 出参：`{ id: string, aiSummary: string }`
- 说明：创建后触发 AI 智能摘要（失败不阻断创建）；已接入 msgSecCheck

### workorder:list
- 入参：`{ status?, page?, pageSize? }`
- 出参：`{ list: WorkOrder[], total: number }`
- 说明：居民仅见本人；物业/管理员见全部

### workorder:detail
- 入参：`{ id: string }`
- 出参：`{ workorder: WorkOrder }`

### workorder:cancel
- 入参：`{ id: string }`
- 出参：`{ ok: boolean }`
- 说明：仅创建人本人，且状态为 pending 时可取消

### workorder:handle（物业/管理员）
- **v1.3 定稿入参（CR-011-b）**：`{ id: string, handleAction: "assign" | "process" | "done", note?: string }`
- 出参：`{ workorder: WorkOrder }`
- 说明：状态流转 pending→assigned→processing→done；done 时触发订阅消息通知报修人
- **⚠ 为什么必须叫 `handleAction` 而不能叫 `action`（冲突根因）**：
  本接口的实际调用形态是 `{ name:'workorder', data:{ action:'handle', ... } }`——**`data.action` 已被占用为分发键，其值恒为 `'handle'`**。
  若业务参数也命名为 `action`，后端按 `event.action` 分发到 `handle` 分支后，业务代码再读 `event.action` 只会得到 `'handle'`，**真正的流转指令被分发键覆盖丢失**（后端自测已实际踩到此坑）。
  → 故业务入参正式定名 **`handleAction`**。这是全文**唯一**允许业务字段带 "action" 字样的地方。
- **取值与状态映射（后端据此流转）**：

  | handleAction | 流转后 `status` | 含义 |
  | --- | --- | --- |
  | `assign` | `assigned` | 物业派单给处理人 |
  | `process` | `processing` | 处理人开始处理 |
  | `done` | `done` | 处理完成；触发订阅消息通知报修人 |

  > 注意：动作值是 `process`，目标状态是 `processing`，两者**不等名**，勿混写。
- **兼容与废弃策略（CR-011-b）**：

  | 参数名 | 状态 | 说明 |
  | --- | --- | --- |
  | `handleAction` | ✅ **正式** | **新对接方一律使用此名** |
  | `to` | ⚠️ 过渡别名 | 保留兼容，取值同 `handleAction`；不作文档推荐写法 |
  | `action`（业务入参） | 🚫 **deprecated** | 与分发键冲突，已废弃。**仅**作为历史调用的兜底读取，新代码禁止再写 |

- **后端兼容读取顺序（强制实现）**：**`handleAction` → `to` → `action`**，取第一个非空且合法的流转值；三者皆空或取值非法 → 返回 **400**。
  > `action` 必须排最后：形态 B 下它恒为 `'handle'`（非法流转值），只有在「调用方未走分发键」的历史路径里才可能携带真实值。
- **前端约定**：`services/workorder.ts` 采用形态 B 下发——`data.action='handle'`（**分发键，恒为 `'handle'`**）+ `data.handleAction='<流转指令>'`（**业务参，取 `assign`/`process`/`done`**）。两者键名不同、来源不同、职责分离，不可互相替代。
- 请求示例：
  ```js
  wx.cloud.callFunction({ name: 'workorder', data: { action: 'handle', id: 'wo_123', handleAction: 'process', note: '王师傅已上门' } })
  ```
- 响应示例：
  ```json
  { "code": 0, "msg": "ok", "data": { "workorder": { "id": "wo_123", "status": "processing", "handleNote": "王师傅已上门" } } }
  ```

---

## notice：社区通知/活动/紧急通知
> **v1.2 扩展（CR-005 / CR-006）**：`type` 枚举新增 `urgent`（紧急通知）；集合新增 `level`/`startAt`/`endAt`/`summary` 字段；新增 `notice:urgentLatest` 供首页紧急公告区使用。
> **兼容性**：`type` 仅**增加枚举值**，既有 `notice`/`activity` 行为与字段零改动；新字段全部可空，老数据无需迁移。

### notice:list
- 入参：`{ type?, page?, pageSize?, includeExpired? }`
- 出参：`{ list: Notice[], total: number }`
- 说明：仅返回 status=published
- **v1.2 新增可选入参 `includeExpired?: boolean`（默认 `false`）**
  - `false`（默认）：额外过滤掉**已过期的紧急通知**（判定条件：`type === 'urgent'` 且 `endAt` 非空且 `endAt < now`）。对 `notice`/`activity` 两种类型**无任何影响**。
  - `true`：不过滤，返回全部（供后台/演示回放使用）。
  - ⚠️ 这是本次唯一的**行为微调**（返回集合变小，结构与字段不变）。理由：过期停水通知若继续出现在列表会误导居民；当前无线上数据与真实用户，迁移成本为 0。已登记在 CR-005「影响面」。
- 错误码：400（type 取值非法）｜401（未登录）

### notice:detail
- 入参：`{ id: string }`
- 出参：`{ notice: Notice }`
- 错误码：404（不存在或 status ≠ published）

### notice:urgentLatest（v1.2 新增 · 首页紧急公告区专用）
- 入参：`{ limit?: number }`
- 出参：`{ list: Notice[], total: number }`
- 说明：紧急公告区一次性取数，供设计预览 §0「通知卡标题 + 紧急事项 3s 轮播」使用。
  - **筛选条件（后端硬实现）**：`status === 'published'` **且** `type === 'urgent'` **且** `startAt` 为空或 `startAt <= now` **且** `endAt` 为空或 `endAt >= now`。
  - **排序**：`level` 权重降序（`critical=3` > `high=2` > `normal=1`）→ `startAt` 降序 → `publishAt` 降序。
  - **截断**：取前 `limit` 条，`limit` 默认 **5**、上限 **10**（超出按 10 处理，不报错）。`limit < 1` 按 1 处理。
  - **`total` 口径定稿（CR-011-c）**：`total` = **截断后的 `list.length`**，**不是**库中满足条件的总数。
    - 理由：接口用途是「给首页轮播卡片取 TopN」，不是给「查看全部」做分页计数。若返库内总数（如 8）而 `list` 只有 5 条，前端会误判"还有 3 条没加载"从而渲染错误的分页/入口。
    - 前端据此直接决定是否展示「查看全部」入口：`list.length > 0` → 展示；`= 0` → 空态。
    - ⚠️ 「符合条件的总条数」如需统计，请调 `notice:list({ type: 'urgent', pageSize: 1 })` 读其 `total`。
  - **空态协议（重要）**：无数据时返回 `{ code: 0, msg: "ok", data: { list: [], total: 0 } }`，**不是错误**。前端收到空数组即渲染空态（文案「暂无紧急通知，社区运行正常」）。
  - **展示字段约定**：紧急区轮播单行文案优先取 `summary`，`summary` 为空时回退 `title`；详情页跳转用 `_id`。
- 错误码：401（未登录）｜500（服务内部错误）
- 请求示例：
  ```js
  wx.cloud.callFunction({ name: 'notice', data: { action: 'urgentLatest', limit: 5 } })
  ```
- 响应示例：
  ```json
  { "code": 0, "msg": "ok", "data": {
      "list": [{
        "_id": "n_9f2a",
        "title": "10月15日 3号楼停水通知",
        "summary": "10-15 09:00-17:00 · 3号楼",
        "type": "urgent",
        "level": "high",
        "startAt": "2026-10-15T01:00:00.000Z",
        "endAt": "2026-10-15T09:00:00.000Z",
        "location": "3号楼",
        "publishAt": "2026-10-13T02:00:00.000Z"
      }],
      "total": 1
  } }
  ```

> **为什么新增 `notice:urgentLatest` 而不是只在 `notice:list` 加 filter？**（二选一的定稿理由）
> 1. **职责不同**：`notice:list` 是分页浏览接口（语义 = 翻页看完），而紧急区是「取当前有效的 TopN 做轮播卡片」，不需要 `page`、且需要有效期过滤 + `level` 复合排序。把两者揉进同一个 `list` 会让它同时服务两种语义，前端调用形态割裂（`pageless` vs `paged`）。
> 2. **冷启动成本**：云函数首调冷启动 1~3s（`04-架构师规范` §12 坑 #2），首屏应尽量减少调用轮次。专用接口一次返回 N 条，比「先 list 再客户端过滤排序」少一轮数据传输，前端也无需实现日期生效判定。
> 3. **工期与风险**：后端增量仅 1 个 action 分支（约 0.5 天），且不需要改动任何既有代码路径。
> 4. **降级通道已内置**：两者能力等价，`notice:list({ type: 'urgent', pageSize: 5 })` 可作为 `urgentLatest` 未就绪时的**临时替代**（唯一差异是不做 `level` 复合排序与 `startAt` 生效判定），工期告急时前端可平滑降级，契约不阻塞。

---

## circle：社区圈子（v1.2 新增 · 只读）
> **范围裁定：本期只有只读数据流（P0）。用户发帖 / 评论 / 点赞 / 关注明确列为 P2，本期不做。**
> 理由：UGC 发帖需接 `msgSecCheck` 先审后发 + 图片上传审核 + 举报/封禁机制 + 作者 profile，工期 +2~3 天；PRD P0 功能清单不含 UGC；10-25 提交、剩 12 天，风险登记 R1 已明确圈子页「最小版（公告流，无评论）」。
> 演示效果通过种子数据里的 `authorRole` 模拟（官方 / 居民发布者并存），视觉上仍是活的社区内容流。

### circle:list
- 入参：`{ type?, tag?, keyword?, page?, pageSize? }`
- 出参：`{ list: CirclePost[], total: number }`
- 说明：
  - `type` 枚举：`road`（路况）/ `notice`（公告）/ `activity`（活动）；**缺省不过滤**（返回全部）。
  - `tag` 为**精确匹配**标签项；`keyword` 为标题 + 正文 + tags 的模糊匹配（后端实现可为 `db.RegExp`，数据量小，无需全文索引）。
  - 仅返回 `status === 'published'`；排序：`topFlag` 降序 → `publishAt` 降序。
  - 首页「最近路况」pill → `circle:list({ type: 'road', pageSize: 5 })`（设计预览 §0 已定「最近路况」由社区圈子承载，零额外页面成本）。
- 错误码：401（未登录）｜500

### circle:detail
- 入参：`{ id: string }`
- 出参：`{ post: CirclePost }`
- 说明：返回 `status === 'published'` 的帖子完整正文；同时对 `viewCount` 做 +1 原子自增（失败不阻断，不抛错）。
- 错误码：404（不存在或未发布）｜401

---

## service：四类服务分类导航（v1.2 新增 · 聚合）
> **范围裁定：不新增任何页面。** 首页 2×2 四类服务宫格的分类与子项由本接口下发，子项通过 `targetType` 路由到**现有页面**或**现有能力**；「新建 4 个承接页」方案工期 +2.5~3 天，本轮禁止。

### service:list
- 入参：`{ key?: string }`（`key` 缺省返回全部上线分类）
- 出参：`{ list: ServiceCategory[] }`（**不分页**，固定 ≤4 条，按 `sort` 升序）
- 说明：只返回 `status === 'online'` 的分类。前端应以接口数据为准渲染；**接口为空或调用失败时，回退本地常量** `miniprogram/config/service-grid.ts`（契约提供的兜底路径，见 CR-008 降级方案）。
- 错误码：401（未登录）｜500

**`targetType` 路由表（前端统一由一个小工具函数分发）**

| targetType | 含义 | 前端动作 | 使用 `targetPath` | 使用 `targetParams` |
| --- | --- | --- | --- | --- |
| `page` | 跳既有页面 | `wx.navigateTo` / `wx.switchTab` | ✅ 页面路径 | ✅ 透传为 query |
| `notice` | 通知/活动列表（带筛选） | `wx.navigateTo` → `pages/notice/list/index` | — | ✅ `{ type?, tag? }` |
| `circle` | 社区圈子（带筛选） | `wx.switchTab` → `pages/circle/index` + 全局筛选态 | — | ✅ `{ type?, tag? }` |
| `assistant` | AI 助手（预填提问） | `wx.navigateTo` → `pages/assistant/index` | — | ✅ `{ presetQuestion }` |
| `phone` | 一键拨号 | `wx.makePhoneCall` | — | ✅ `{ phone }` |
| `toast` | 暂未开通 | `wx.showToast({ icon: 'none' })` | — | ✅ 取 `tip` 文案 |

> `circle` 为 Tab 页，`switchTab` 不支持 query，约定：前端把 `targetParams` 写入全局 store / storage 键 `pendingCircleFilter`，`pages/circle/index` 的 `onShow` 读取并消费后清除。

**四类服务承接方案（定稿，全部复用现有页面）**

| 分类 key | 标题 | 宫格小字 | 子项 | targetType | 承接目标 | 可演示性 |
| --- | --- | --- | --- | --- | --- | --- |
| `life` | 生活基础服务 | 挂号｜义诊｜疫苗档案 | 挂号 | `page` | `pages/phonebook/index?category=medical` | ✅ 卫生站电话一键拨号 |
| | | | 义诊 | `notice` | `{ type: 'activity' }` | ✅ 社区义诊活动列表 |
| | | | 疫苗档案 | `assistant` | `{ presetQuestion: '孩子的疫苗档案怎么查询？' }` | ✅ AI 真实回答（AI 20% 分） |
| `elder` | 健康养老服务 | 助餐｜助浴｜上门陪护 | 助餐 | `notice` | `{ type: 'activity', tag: '助餐' }` | ✅ 长者饭堂通知 |
| | | | 助浴 | `phone` | `{ phone: '<社区养老服务中心电话>' }` | ✅ 真实拨号入口 |
| | | | 上门陪护 | `assistant` | `{ presetQuestion: '社区有上门陪护服务吗？' }` | ✅ AI 真实回答 |
| `support` | 便民配套服务 | 水电燃气｜适老化改造 | 水电燃气 | `page` | `pages/repair/create/index?category=water` | ✅ **主链路**：直接进报修（AI 摘要） |
| | | | 适老化改造 | `assistant` | `{ presetQuestion: '适老化改造有哪些补贴政策？' }` | ✅ AI 真实回答 |
| `culture` | 文化便民服务 | 每周义诊｜健康报告 | 每周义诊 | `notice` | `{ type: 'activity', tag: '义诊' }` | ✅ 活动列表 |
| | | | 健康报告 | `assistant` | `{ presetQuestion: '社区免费体检报告怎么领取？' }` | ✅ AI 真实回答 |

> 8 个子项中 **0 个**落到 `toast`（无"建设中"死胡同），全部可达且可在演示视频中真实操作。
> **工期成本对比**：本方案前端 ≈0.5 天（改 4 个现有页读 URL 参数）+ 后端 ≈0.5 天；**4 个新页面方案 ≈ +2.5~3 天**，本轮禁止。

---

## phonebook：便民电话簿
### phonebook:list
- 入参：`{ category? }`
- 出参：`{ list: PhoneItem[] }`（按 sort 升序，不分页）

---

## qa：AI 智能问答（RAG + 多轮会话）
### qa:ask
- 入参：`{ question: string, elderMode?: boolean, sessionId?: string }`
- 出参：`{ answerId: string, sessionId: string, answer: string, sources: string[], degraded: boolean, _riskLevel?: RiskLevel }`（`_riskLevel` 为 **v1.4 新增可选字段**）
- 说明：调用链 = 小程序 → 云函数 → **输入护栏 → 高风险判定（v1.4）→ 知识库检索** → 大模型 API → 输出护栏 → 返回。
  - `sessionId` 缺省时服务端新建会话并在出参返回；前端需缓存并在后续提问回传，否则无法多轮。
  - **多轮上下文规则（硬性，防 token 爆炸）**：仅保留最近 **3 轮**；单条 message 截断至 **300 字**；总上下文超 **2000 tokens（估算）** 时丢弃最早轮次；会话最后活动 **2 小时**后失效。
  - **🛡 高风险安全护栏（v1.4 新增，CR-012）**：位于「输入护栏之后、知识库检索之前」。命中以下三类高风险关键词时，**不调用大模型、不返回知识库原文**，直接返回**固定安全话术**：
    - `medical` 涉医（如"胸痛怎么办""吃什么药"）
    - `legal` 涉法（如"这算不算工伤""能不能起诉"）
    - `emergency` 紧急求助（如"有人晕倒""着火了"）
    - 响应形态：`{ code: 0, msg: 'ok', data: { answerId, sessionId, answer: <固定安全话术>, sources: [], degraded: true, _riskLevel: <命中类别> } }`
    - `_riskLevel` 未命中时为 `'none'`；**前端必须按可选字段处理**（见下方兼容性）。
    - 🔒 **话术唯一来源**：三类话术原文见本节末尾「安全话术表」，**前后端各自实现时一律以此为准，禁止各写一套**。
  - 本表已与后端实装版本（`cloudfunctions/shared/safety.js`）**逐字一致**—— 2026-10-13 起以**已实现的后端实装版本**为准（含真实可拨号码，自测 148/148 全绿）；后端重构只搬位置、**措辞不动**。
    - 💰 附带收益：命中即短路，不消耗 DeepSeek token，也不给模型"自由发挥"产生医疗/法律误导的机会。
  - 知识库检索优先；最高分低于阈值视为**未命中**，直接返回兜底话术 + 便民电话，**不调用大模型**。
    - **未命中时的响应口径定稿（CR-011-d）**：`{ code: 0, msg: 'ok', data: { answerId, sessionId, answer: <兜底话术>, sources: [], degraded: true, <便民电话> } }`。
    - **本期不新增任何字段**——复用既有 `degraded` + `sources` + 兜底文案里的电话信息表达"未命中"。
    - ⚠️ **前端约定：按降级态渲染，不做错误 toast。** 未命中不是失败，`code` 为 **0**，`request` 封装层**不得**触发错误提示；渲染要求：回答区展示兜底话术 + 便民电话一键拨号，页脚保留"AI 生成仅供参考"。
    - ❌ 对齐约定：不返回 404，不返回 503——**503 只用于 AI 服务调用失败**，**未命中一律走 `code=0 + degraded=true`**，两者前端分支必须区分处理。
  - ⚠️ **`degraded=true` 的语义澄清（CR-012，务必读）**：`degraded=true` **只表示"本次回答不是知识库的正常答案"**，**绝不等于"没有答案"**。
    它至少涵盖三种**都带着完整 `answer` 文本**的情形：① 高风险触发→固定安全话术；② 未命中→兜底话术+电话；③ LLM 失败→降级话术。
    🚫 **前端严禁**在 `degraded=true` 时把气泡正文替换成自己写死的兜底文案（如"这个问题我没查到，你可以直接打电话问"）——那会把服务端返回的「请尽快就医或拨打 120」吞掉，界面显示与安全话术完全相反，属**P0 事故**。
    ✅ 正确做法：**气泡正文照常渲染服务端下发的 `answer`**；额外提示由 `_riskLevel` 驱动（见下方渲染约定）。
  - `degraded=true` 表示 AI 不可用已降级，此时**必须**同时返回便民电话，不得只给文案。
  - 回答页脚展示"AI 生成仅供参考"（**服务端注入**：追加到 `answer` 尾部，前端不另行渲染），**注入口径见 CR-014-b**；回答字数上限 500 字。
    - ⚠️ **CR-014-b（注入范围澄清）**：该免责语**只对「大模型生成」的回答注入**。
      **命中安全话术（`_riskLevel !== 'none'`）时 `answer` 是人工编写的固定文本，一律不注入**——
      「请尽快就医或拨打 120」下面挂「AI 生成仅供参考」，既自相矛盾（它根本不是 AI 生成的），又削弱紧急指令的严肃性，评委一眼能抓。
      此时的免责由**引导卡文案**「以上为安全提示，社区无法提供专业医疗或法律意见」承担。
    - ✅ 顺带消除的契约自相矛盾：本节「使用约定」要求安全话术 `answer` **逐字返回、不得增删改**，
      若再叠加"页脚固定注入"就两头打架；CR-014-b 划定注入范围后，两条规则各自成立、互不冲突。
  - 输出护栏：回答中出现的电话号码 / 政策名称 / 金额必须能在本次命中知识库文档中找到，否则替换为原文片段，仍无则降级。
  - 输入护栏：空输入、超长（>300 字）、提示注入、非社区域问题一律拦截，**不调用大模型**。

#### 🛡 安全话术表（CR-012 · **唯一来源，前后端共用同一份文案**）

> **本表于 2026-10-13 按「后端已实现的实装版本」回写契约（调整方向：契约向代码对齐，而非代码向契约追）。**
>
> 🔎 **CR-013 裁定（2026-10-13，防误读）**：唯一来源 = **后端 `shared/safety.js` 实装版本**，本表即其**逐字副本**。
> 若你手上看到的仍是「您描述的情况涉及身体健康…」「请前往「便民电话」查询社区法律援助渠道…」这类措辞，说明读到的是**回写前的旧文件**——请重新打开本文件，不要据旧文案下判断或改代码。
> 原因：后端已实现并跑出 **148/148 全绿**，且实装版本带**真实可拨号码**，比通用表述更可用；若改成契约早先写的通用版本，后端自测断言（`answer` 必须含 12348 / 居委会号）会直接挂，等于把已验证的产出推翻重来。
>
> **实现规范（已采纳，后端已派单）**：三类话术定义在 **`cloudfunctions/shared/safety.js`** 常量中，**禁止散落在各分支内硬编码**—— 改一处漏一处，前端拿到的文案会漂移。**本次重构只搬位置，措辞不动。**
>
> **使用约定**：命中高风险关键词时，`answer` 字段**原样返回**下表「话术原文」列的完整文本，**逐字不得增删改。**
> 文本内含编号步骤（「现在就做：1）… 2）…」），前端渲染时**必须保留换行与编号结构**，不得压成一段。
> **话术必须给出明确动作，禁止「建议」「可以」这类模糊表述。**

| `_riskLevel` | 触发示例 | **话术原文（`answer` 的完整内容）** | 必含动作 | 强制要求 |
| --- | --- | --- | --- | :-: |
| `medical` 涉医 | “胸痛怎么办”<br>“吃什么药”<br>“孩子发烧 39 度” | 身体不适我不能给出判断，请尽快就医或拨打 120。现在就做：1）立即停止自行用药与自行处理；2）让家人陪同前往最近医院急诊；3）独居老人可按紧急呼叫按钮或拨打物业值班电话 020-88888888 求助；4）出现意识不清、呼吸困难、大量出血时直接打 120，不要自行前往。 | 就医 / **120** / 物业值班电话 | 必须出现「请尽快就医或拨打 120」，且必须给出物业值班号码 **020-88888888** |
| `legal` 涉法 | “这算不算工伤”<br>“能不能起诉物业”<br>“欠条怎么写” | 法律纠纷我不能给出结论性意见。现在就做：1）携带身份证、合同、照片与缴费凭证等材料；2）到社区居委会（020-88886666）申请免费法律援助，由值班律师当面解答；3）需要即时咨询请拨打公共法律服务热线 12348；4）涉及人身安全或正在发生的违法行为，先拨打 110。 | 居委会免费法律援助 / **12348** / 110 | 必须给出公共法律服务热线 **12348** 与居委会号 **020-88886666** 两个实号 |
| `emergency` 紧急求助 | “有人晕倒了”<br>“着火了”<br>“漏水很严重” | 这是紧急情况，请立刻拨打应急电话：火警 119 / 报警 110 / 急救 120。接通后说明小区名称、楼栋单元与现场情况，并在安全位置等待救援。如需联系物业协助，请拨打物业值班电话 020-88888888；更多号码可在小程序「便民电话簿」查看。 | **119 / 110 / 120** + 物业协助 + 便民电话簿入口 | 必须给出 119/110/120 三个号码，并提示「便民电话簿」可查更多号码 |

**号码一致性校验（演示前必查，新增约束）**

> 话术里写死了真实号码，就多了一个新的一致性义务：**话术里的号码必须与「便民电话簿」里看到的号码一致**（物业值班 020-88888888、居委会 020-88886666）。
> 否则会出现「安全话术说打 A 号，便民电话簿里却是 B 号」——评委现场照着打就能发现矛盾，比“没号码”更伤分数。
>
> **真源与派生物（CR-014-a，后端已实装，契约予以追认）**：
>
> | 层 | 角色 | 约束 |
> | --- | --- | --- |
> | `cloudfunctions/shared/hotline.js` | ✅ **唯一真源**（代码常量，可 diff、可断言、版本可控） | `PROPERTY / COMMITTEE / FIRE / POLICE / MEDICAL / LEGAL_AID` |
> | `shared/safety.js` 话术 | 派生物 | 用**模板串**取号，**禁止再写字面量号码** |
> | `scripts/seed.mjs` → `phonebook` 集合 | 派生物 | 引**同一份**常量生成（已用 `createRequire`） |
> | `miniprogram/mock/risk-rules.ts` | 逐字副本 | 拿不到后端常量，改号必须**人工同步** |
>
> ⛔ **依赖方向不可倒置**：真源是**代码常量**，**不是 `phonebook` 集合**。
> 集合是 seed 的产物，**禁止在云控制台手工编辑 phonebook 的号码**——那会让代码真源与库里的数据各说一套，且没有断言兜得住。
>
> **改号的唯一路径**：改 `hotline.js` → 重跑 seed → 前端同步 mock 副本 → 跑一致性自测。
> **演示前必查（10-23 打包前）**：seed 必须重跑，且断言「话术常量 == phonebook 同名条目号码」双向成立（后端已加 CR-013 自测组 15 条）。
>
> ⛔ **CR-016 红线：119 / 110 / 120 任何环境下都不得替换。**
> 它们出现在**安全话术**与**便民电话簿**两处，且**都是国家公开紧急号码、都是真号码**——
> 真环境落地时若随"占位号整体替换"一起被换掉，居民照话术打过去就是空号或错号，属**安全事故**，不是体验问题。
> 替换范围共 **8 条**（`020-8888xxxx` 段，含物业服务中心与社区居委会），**不含**这 3 条。详见 `db-schema.md` 种子数据段。

**自测口径：负向断言必须配正向对照（CR-015-b，后端已采纳）**

> 规则：**凡是"不允许出现 X"的负向断言，必须同时存在一条"允许出现 X"的正向对照断言。**
>
> 反例：只断言「三类安全话术不含『AI 生成仅供参考』」——
> 后来人把**整个免责注入逻辑删掉**，这条断言依然全绿，于是"对的被改错"且**没有任何测试报警**。
>
> 正例（后端现行实现，164/164）：
> - ✅ 负向：`medical` / `legal` / `emergency` **三类**出参均不含免责页脚（**三类都要覆盖**，只测一类会留下"只改坏一条分支"的缝）
> - ✅ 正向：降级回知识库原文时**注入**免责声明（证明注入逻辑本身没坏）
>
> 一正一负，才叫真锁死。

**命中判定与优先级（后端实现口径）**

| 规则 | 说明 |
| --- | --- |
| 检测顺序 | `emergency` → `medical` → `legal`，**命中即返回**，不再继续判定，也不进检索 |
| 判定依据 | 关键词匹配（命中词表由后端维护并随 seed 版本化），**不调用大模型做意图识别**——省 token 且避免模型"越权回答" |
| 词表迭代（CR-013） | 增删关键词**由后端维护，不触发契约变更、不占 CR 号**；但**必须与前端 `miniprogram/mock/risk-rules.ts` 逐字同步**——改任一侧不同步另一侧，就会出现「mock 绿 ≠ 真机不一致」 |
| 多类命中 | 按上表顺序取**第一个**命中类别，`_riskLevel` 只返回一个值 |
| `sources` | 固定为 `[]`（未取用知识库） |
| `degraded` | 固定为 `true` |
| `_riskLevel` | 未命中任何类别时为 `'none'`（此时走正常检索/问答链路） |
| 错误码 | **零新增**。命中安全话术仍是 `code=0` 的正常响应，不是错误 |

**前端渲染约定（CR-012）**

| 项 | 约定 |
| --- | --- |
| 气泡正文 | **始终渲染服务端下发的 `answer`**，不得用本地兜底文案覆盖 |
| 降级引导卡文案 | 由 `toDegradedTip(_riskLevel)` 决定：<br>`_riskLevel === 'none'`（或未返回该字段）→ 原降级引导文案<br>`_riskLevel !== 'none'` → **「以上为安全提示，社区无法提供专业医疗或法律意见」** |
| 历史回归依据 | 曾出现「后端返回『请尽快就医或拨打 120』，界面却显示『没查到』」的 bug，根因是前端把降级气泡文案写死。**已修复，本条为回归红线** |
| 反馈按钮 | 命中安全话术时建议隐藏 👍/👎 反馈（`qa:feedback` 对固定话术无统计意义），非强制 |

**向后兼容**

- `_riskLevel` 为**可选**字段；**老版本后端不返回该字段时，前端按 `'none'` 处理**（`toDegradedTip(undefined)` 走原降级文案分支）。
- 未命中高风险时，响应结构与 v1.3 **完全一致**（不返回或返回 `'none'` 均可），老前端无需改动。
- **零新增错误码**，错误码总数仍为 **8**。

### qa:history（v1.1 新增）
- 入参：`{ sessionId?: string, page?: number, pageSize?: number }`
- 出参：`{ list: QaTurn[], total: number }`
- 说明：`sessionId` 缺省时返回该用户最近一次会话；按时间正序返回，供 AI 助手页"历史记录"展示。

### qa:clear（v1.1 新增）
- 入参：`{ sessionId?: string }`
- 出参：`{ ok: boolean }`
- 说明：删除该会话全部轮次（含 `qa_sessions` 记录）；`sessionId` 缺省时清除该用户最近一次会话。仅本人可操作。

### qa:feedback
- 入参：`{ answerId: string, useful: boolean }`
- 出参：`{ ok: boolean }`

### qa:suggest（首页快捷提问）
- 入参：`{}`
- 出参：`{ questions: string[] }`

---

## 数据结构定义
```ts
interface User {
  _id: string; _openid: string;
  nickName?: string; phone?: string;   // phone 展示脱敏
  accountId: string;                   // v1.2 · 社区账号，必返回且永远有值（服务端懒生成），替代无法获取的微信「微信号」
  role: 'resident' | 'property' | 'admin';
  building?: string; elderMode?: boolean;
  createdAt: string; updatedAt: string;
}

interface WorkOrder {
  _id: string; _openid: string;
  title: string; description: string;
  category: 'water' | 'electric' | 'door' | 'public' | 'other';
  images: string[];
  status: 'pending' | 'assigned' | 'processing' | 'done' | 'closed' | 'canceled';
  aiSummary?: string; assignee?: string; handleNote?: string;
  createdAt: string; updatedAt: string;
}

interface Notice {
  _id: string;
  title: string; content: string;
  type: 'notice' | 'activity' | 'urgent';   // v1.2 增加 'urgent'
  status: 'draft' | 'published';
  publishAt: string; location?: string; signupDeadline?: string;
  /* ↓ v1.2 新增（CR-005），全部可选，老数据无需迁移 */
  level?: 'critical' | 'high' | 'normal';   // 紧急级别；缺省按 'normal'。urgent 类型建议填 'high'
  startAt?: string;                          // 事项起始时间（如停水开始 09:00）
  endAt?: string;                            // 事项结束时间；非空且 < now 判为已过期
  summary?: string;                          // 紧急区单行摘要 ≤40 字；缺省时前端回退 title
}

// v1.2 新增（CR-007）
interface CirclePost {
  _id: string;
  title: string; content: string;
  type: 'road' | 'notice' | 'activity';  // 路况 / 公告 / 活动
  tags: string[];                        // 标签，如 ['停水','3号楼']
  authorName: string;                    // 展示用作者名（种子数据可含虚拟居民，如「3栋王阿姨」）
  authorRole: 'official' | 'resident';   // 官方(居委会/物业) / 居民；official 在 UI 上带「官方」徽标
  authorOpenid?: string;                 // 真实作者 openid，仅 authority-side 使用，不下发前端
  images: string[];                      // fileID ≤3
  sourceType: 'manual' | 'sync';         // manual=人工/种子维护；sync=与 notices 自动生成同步
  refId?: string;                        // sourceType=sync 时关联的 noticeId
  status: 'draft' | 'published';
  topFlag: boolean;                      // 置顶
  viewCount: number;                     // 浏览量，circle:detail 原子自增
  publishAt: string; createdAt: string; updatedAt: string;
}

// v1.2 新增（CR-008）
interface ServiceItem {
  key: string;            // 子项标识，如 'register'
  name: string;           // 子项名，如 '挂号'
  targetType: 'page' | 'notice' | 'circle' | 'assistant' | 'phone' | 'toast';
  targetPath?: string;    // targetType='page' 时的页面路径
  targetParams?: Record<string, string>;  // 透传参数（query / 筛选 / 预设问题 / 电话号码）
  tip?: string;           // targetType='toast' 时的提示文案
  sort: number;
}

interface ServiceCategory {
  _id: string;
  key: 'life' | 'elder' | 'support' | 'culture';   // 分类唯一 key
  title: string;          // 分类标题，如「生活基础服务」
  subtitle: string;       // 宫格小字，如「挂号｜义诊｜疫苗档案」
  icon: string;           // 图标资源名或 fileID，如 'icon-func-life-green-72.png'
  iconTheme: 'green' | 'warm';   // green=第1/2格主绿；warm=第3/4格暖橙
  sort: number;           // 1~4
  status: 'online' | 'offline';
  items: ServiceItem[];   // 内嵌子项（4 类 × ≤3 项，数据量极小，不做子集合）
}

interface PhoneItem {
  _id: string;
  name: string; phone: string;
  category: 'property' | 'government' | 'medical' | 'life' | 'emergency';
  sort: number; remark?: string;
}

// v1.4 新增（CR-012）
type RiskLevel = 'none' | 'medical' | 'legal' | 'emergency';
// 仅 qa:ask 出参使用；可选字段，缺省按 'none' 处理。
// medical=涉医 / legal=涉法 / emergency=紧急求助；命中时 degraded 恒为 true 且 answer 为固定安全话术。

interface QaTurn {
  role: 'user' | 'assistant';        // 提问方 / 回答方
  content: string;                    // 单条 ≤300 字
  createdAt: string;                  // ISO8601
  answerId?: string;                  // assistant 轮次才有，供 qa:feedback 引用
  sources?: string[];                 // assistant 轮次才有，引用来源标题
  degraded?: boolean;                 // assistant 轮次才有
}

interface QaSession {
  _id: string; _openid: string;
  sessionId: string;                  // 客户端生成或服务端返回
  turns: QaTurn[];                    // 服务端只保留最近 3 轮
  turnCount: number;                  // 累计轮次（不受保留策略影响）
  createdAt: string; updatedAt: string;
}
```

---

## 附：知识库落地位置（v1.1 定稿，消除歧义）

> v1.0 期间有三处说法不一致：`db-schema.md` 集合清单无知识库、`04-架构师-skill.md` 假设塞进 `qa_feedback`、`06-后端工程师-skill.md` 称"知识库 JSON 化"。**v1.1 统一如下**：

| 项 | 定稿 |
| --- | --- |
| 存放位置 | `cloudfunctions/shared/kb/kb.json`（代码内置 JSON 文件） |
| 为什么不用数据库 | 知识库规模小（≥10 条，演示级）、变更频率低、免接口免权限、重新部署即生效、零成本 |
| 数据结构 | 每条含 `id / title / content / category / keywords[] / synonyms[]` |
| 检索方式 | 关键词 + 同义词打分（同义词命中 0.8 分、keyword 1 分、标题整句 5 分），取 Top3 |
| 未命中阈值 | 最高分 < 1.0 → 判定未命中，走兜底话术，**不调用大模型** |
| `qa_feedback` 集合 | **收敛为纯反馈表**（不再承担知识库职责），字段见 `db-schema.md` |

---

## 附 A：路由与 TabBar 约定（v1.2 · CR-010）

> 本节为 `miniprogram/app.json` 的**配置契约**。由前端落地，**架构师不改代码文件**。

### A.1 TabBar 4 项（变更 C1）

| # | 文案 | pagePath | 图标（81×81px，双态） | 说明 |
| --- | --- | --- | --- | --- |
| 1 | 首页 | `pages/index/index` | `assets/icons/icon-tab-home-81.png` / `icon-tab-home-active-81.png` | 沿用 |
| 2 | 服务订单 | `pages/repair/list/index` | `assets/icons/icon-tab-order-81.png` / `icon-tab-order-active-81.png` | **原「报修」改名**，仅改文案与标题，数据源仍 `workorder:list`，筛选口径不变 |
| 3 | 社区圈子 | `pages/circle/index` | `assets/icons/icon-tab-circle-81.png` / `icon-tab-circle-active-81.png` | **新增页**（FE-12） |
| 4 | 我的 | `pages/profile/index` | `assets/icons/icon-tab-mine-81.png` / `icon-tab-mine-active-81.png` | 沿用 |

**关键配置值**（对齐 `docs/03-design-tokens.md` v1.1 CHANGELOG #3 清新绿）：

| 键 | 值 | 备注 |
| --- | --- | --- |
| `color` | `#9B9B9B` | 未选中（`--text-3`） |
| `selectedColor` | **`#1E8252`** | ⚠ 必须换绿（当前 `app.json` 仍是 `#C0522F` 旧砖红） |
| `backgroundColor` | `#FFFFFF` | |
| `borderStyle` | `white` | 分割线自绘 2rpx `--line` |

> ⚠️ **编译红线**：`pages/circle/index` 未创建前，TabBar 第 3 项**不要先配**（会导致编译报错）。落地顺序：先建 `pages/circle/index` 空骨架（FE-12 第一步）→ 再改 `app.json` tabBar.list。

### A.2 pages 数组（v1.2 定稿）

```jsonc
"pages": [
  "pages/index/index",            // 首页（Tab）
  "pages/repair/list/index",      // 服务订单（Tab，原报修列表改名）
  "pages/circle/index",           // 社区圈子（Tab，v1.2 新增）
  "pages/profile/index",          // 我的（Tab）
  "pages/repair/create/index",    // 报修创建
  "pages/repair/detail/index",    // 报修详情
  "pages/notice/list/index",      // 通知/活动列表
  "pages/assistant/index",        // AI 助手（已移出 TabBar，保留路由）
  "pages/phonebook/index"         // 便民电话簿
]
```

- **AI 助手移出 TabBar**：路由保留，属非 Tab 页，`navigateTo` 可跳；页面左上角需补「‹ 返回」（设计预览 §6）。
- 视觉阵营约束：TabBar 只允许 4 项；任何新页面不得挂 Tab，只能 `navigateTo`。

### A.3 现有页面需支持的 URL 入参（v1.2 增量，服务宫格承接依赖）

| 页面 | 支持参数 | 行为 | 默认行为（无参数） |
| --- | --- | --- | --- |
| `pages/repair/create/index` | `category` | 预选报修分类（如 `water`） | 不预选 |
| `pages/phonebook/index` | `category` | 预选分类 Tab（`medical`/`life`/`government`/`emergency`/`property`） | 全部 |
| `pages/notice/list/index` | `type`、`tag` | 预选 Tab + 标签筛选（如 `type=activity&tag=义诊`、`type=urgent`） | 通知 Tab |
| `pages/assistant/index` | `presetQuestion` | 首次进入自动填充提问（**不自动发送**，避免演示误触发 LLM）；保留 `sessionId` 机制 | 空输入框 + `qa:suggest` 快捷提问 |
| `pages/circle/index` | 无（Tab 页不支持 query） | 读全局 `pendingCircleFilter`（`{type?, tag?}`）后消费并清除 | 全部 |

### A.4 「服务订单」改名口径（零后端改动）

- 页面标题：微信导航栏文案 → 「服务订单」；
- 页内 Tab 文案：全部 / 进行中 / 已完成 **保持不变**；
- 数据接口：`workorder:list` **不变**，入参出参零改动；
- 「我的」页「我的报修」入口文案建议同步为「我的服务订单」（非必须）。

---

## 附 B：错误码使用说明（v1.2 / **v1.3 修订**）

> **本轮不新增任何错误码**，全部复用上方 8 码表。各接口的码表归属如下，前后端按此实现，避免各自发挥：

| 接口 | 400 | 401 | 403 | 404 | 429 | 500 | 503 |
| --- | --- | :-: | :-: | :-: | :-: | :-: | :-: |
| `notice:list`（含 type=urgent） | ✅ type 非法 | ✅ | — | — | — | ✅ | — |
| `notice:urgentLatest` | — | ✅ | — | — | — | ✅ | — |
| `circle:list` | ✅ 参数非法 | ✅ | — | — | — | ✅ | — |
| `circle:detail` | — | ✅ | — | ✅ 不存在/未发布 | — | ✅ | — |
| `service:list` | — | ✅ | — | — | — | ✅ | — |
| `user:updateProfile` | ✅ 格式非法 / 账号被占用 | ✅ | — | — | — | ✅ | — |
| `workorder:handle` | ✅ **`handleAction`/`to`/`action` 三者均空或非法流转** | ✅ | ✅ 非物业/管理员 | ✅ 工单不存在 | — | ✅ | — |
| `qa:ask` | ✅ 空输入 / 超长 / 注入 / 非社区域 | ✅ | — | — | ✅ 同 openid 10s 1 次 | ✅ | ✅ LLM 调用失败（**非未命中**） |

**空态统一协议**：`list` 类接口在数据为空时一律 `{ code: 0, msg: 'ok', data: { list: [], total: 0 } }`，**禁止**用 404 表示"没数据"；只有按 ID 查询的单条接口才用 404。

**v1.3 ~ v1.4 补充的判定边界（CR-011-c / CR-011-d / CR-012）**

| 场景 | `code` | `_riskLevel` | 前端动作 |
| --- | :-: | :-: | --- |
| `qa:ask` **知识库未命中**（命中分 < 阈值，未调 LLM） | **0** + `degraded=true` | `'none'` | 按**降级态**渲染（兜底话术 + 便民电话一键拨号 + 免责页脚），**不 toast** |
| `qa:ask` **LLM 调用失败/超时** | **0** + `degraded=true`（或 503） | `'none'` | 同上降级渲染；收到 503 时同样展示电话簿 Top3，**不得弹错误弹窗** |
| **`qa:ask` 命中高风险安全话术**（CR-012） | **0** + `degraded=true` | `'medical' / 'legal' / 'emergency'` | **照常渲染服务端下发的 `answer`**；降级引导卡文案改为「以上为安全提示，社区无法提供专业医疗或法律意见」；**不 toast**；建议隐藏 👍/👎 反馈 |
| `notice:urgentLatest` 无有效紧急通知 | **0** + `list:[]` | — | 渲染空态，不 toast |
| `service:list` 异常 | **0** + `list:[]`（后端不得返 500） | — | 回退本地常量 `config/service-grid.ts` |

> 一句话原则：**只有真正的业务失败（参数错/未登录/越权/不存在/限流/服务异常）才 toast；"查得到但结果为空/降级" 一律静默渲染。**
>
> 🚫 **`degraded=true` ≠ 没答案。** 上表三种 qa 场景的 `answer` **都带完整文案**。前端若把气泡替换成写死的“这个问题我没查到……”，会把「请尽快就医或拨打 120」吞掉 —— 这是 CR-012 明确要防的**回归红线**（详见 `qa:ask` 章节「前端渲染约定」）。

---

## 附 C：演示通道与验收口径约定（**CR-017 · 演示阻断级**）

> 背景：前端 `miniprogram/config/env.ts` 当前为 `USE_MOCK: true`（`// TODO(FE-10): 联调通过后置 false`）。
> 也就是说，**mock 是当前默认通道，不是备用通道**。只要这个开关没关，云函数、工单流转、CR-012 安全护栏**全部不参与运行**。

### CR-017-a · 演示通道红线

| 项 | 约定 |
| --- | --- |
| ⛔ **红线** | **10-23 打包前 `USE_MOCK` 必须为 `false`**。这是唯一的通道开关，漏了就是**全盘降级**：现场跑的是前端内存数据，云开发能力一分都演示不出来 |
| 切换时序（不可颠倒） | ① 联调冒烟通过 → ② 置 `USE_MOCK = false` → ③ **真机冒烟**（必须含 CR-012 端到端：问「胸痛怎么办」→ 界面出现 120）→ ④ 打包 |
| 归口 | 前端（改开关）+ 测试（第 ③ 步冒烟）+ PM（排进 10-23 checklist） |

### CR-017-b · 契约验收口径（**这条比开关本身更重要**）

> **所有契约一致性结论、接口验收、端到端断言，必须在 `USE_MOCK = false` 的通道下取得。**
> **mock 通道下的「全绿」不构成任何契约验收证据。**

理由：mock 返回的是前端自己写的数据，它只能证明"前端渲染逻辑对"，**证明不了任何契约约定**（云函数分发、错误码、降级字段、安全护栏全都不经过）。
mock 绿而真机不一致，是本项目反复出现的问题家族（CR-013 词表副本、CR-015 划分、CR-016 号码）的**根因同源**：
**用一份副本来证明原件是对的。**

⚠️ 因此凡出现「xxx 条测试全绿」的结论，必须同时说明**跑在哪个通道**；未说明通道的，一律视为无效验收。

### CR-017-c · 建议（P1，待 team-lead 拍）：mock 通道**降级可见化**

仅靠 checklist 记住"关开关"是弱的——人会忘。建议补一层**结构性防护**：

> `USE_MOCK = true` 时，界面**常驻**一个醒目标识（如顶部横幅「演示数据模式 · 未连接云端」）。

这样"忘了关"从**静默失败**变成**可见错误**：即使真有人漏了，现场一眼能看出来并补救，而不是演示完才发现跑的是假数据。
成本极低（≈0.1 天），收益覆盖整个演示风险面。**是否做由 team-lead 决定。**
