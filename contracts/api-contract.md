# API 契约（唯一契约，前后端共同遵守）

> 版本：**v1.2**｜更新日期：2026-10-13｜资源 **8 个**（auth / user / workorder / notice / circle / service / phonebook / qa）｜动作 **19 个**（v1.1 的 15 个 + v1.2 新增 4 个）
> 计数口径：`name:action` 逐个计数（v1.1 抬头的「14」为旧口径笔误，以本行 15 为准）。
> 风格：云函数 `callFunction` 直调，按资源分组命名：`name = "<资源>:<动作>"`。
> 统一响应：`{ code: 0, msg: "ok", data: ... }`；`code !== 0` 为失败，`msg` 为可展示文案。
> 分页：`page` 从 1 起，`pageSize` 默认 10 上限 50；时间格式 ISO8601；图片走云存储 fileID。
> 鉴权：云函数自动取 `wxContext.OPENID`，写操作按 `users.role` 校验；不另发 token。
> 冻结：本契约发布后冻结。变更必须更新本文件并在 `contracts/契约变更记录.md` 登记，同步前后端。
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
> **v1.2 向后兼容总纲**：① 不删除任何既有字段；② 不修改任何既有入参/出参语义；③ 只做「新增字段、新增枚举值、新增可选参数、新增接口」四类动作；④ 不新增任何错误码（完整复用下方 8 码表）。

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
- 入参：`{ id: string, action: "assign" | "process" | "done", note?: string }`
- 出参：`{ workorder: WorkOrder }`
- 说明：状态流转 pending→assigned→processing→done；done 时触发订阅消息通知报修人

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
- 出参：`{ answerId: string, sessionId: string, answer: string, sources: string[], degraded: boolean }`
- 说明：调用链 = 小程序 → 云函数 → 输入护栏 → 知识库检索 → 大模型 API → 输出护栏 → 返回。
  - `sessionId` 缺省时服务端新建会话并在出参返回；前端需缓存并在后续提问回传，否则无法多轮。
  - **多轮上下文规则（硬性，防 token 爆炸）**：仅保留最近 **3 轮**；单条 message 截断至 **300 字**；总上下文超 **2000 tokens（估算）** 时丢弃最早轮次；会话最后活动 **2 小时**后失效。
  - 知识库检索优先；最高分低于阈值视为**未命中**，直接返回兜底话术 + 便民电话，**不调用大模型**。
  - `degraded=true` 表示 AI 不可用已降级，此时**必须**同时返回便民电话，不得只给文案。
  - 回答页脚固定展示"AI 生成仅供参考"（**服务端注入**，不依赖前端渲染）；回答字数上限 500 字。
  - 输出护栏：回答中出现的电话号码 / 政策名称 / 金额必须能在本次命中知识库文档中找到，否则替换为原文片段，仍无则降级。
  - 输入护栏：空输入、超长（>300 字）、提示注入、非社区域问题一律拦截，**不调用大模型**。

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

## 附 B：错误码使用说明（v1.2）

> **本轮不新增任何错误码**，全部复用上方 8 码表。新增接口的码表归属如下，前后端按此实现，避免各自发挥：

| 接口 | 400 | 401 | 403 | 404 | 429 | 500 | 503 |
| --- | --- | :-: | :-: | :-: | :-: | :-: | :-: |
| `notice:list`（含 type=urgent） | ✅ type 非法 | ✅ | — | — | — | ✅ | — |
| `notice:urgentLatest` | — | ✅ | — | — | — | ✅ | — |
| `circle:list` | ✅ 参数非法 | ✅ | — | — | — | ✅ | — |
| `circle:detail` | — | ✅ | — | ✅ 不存在/未发布 | — | ✅ | — |
| `service:list` | — | ✅ | — | — | — | ✅ | — |
| `user:updateProfile` | ✅ 格式非法 / 账号被占用 | ✅ | — | — | — | ✅ | — |

**空态统一协议**：`list` 类接口在数据为空时一律 `{ code: 0, msg: 'ok', data: { list: [], total: 0 } }`，**禁止**用 404 表示"没数据"；只有按 ID 查询的单条接口才用 404。
