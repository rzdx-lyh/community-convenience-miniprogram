# 数据库 Schema（云开发文档型数据库）

> 契约文件之一：`db-schema.md`。由架构师维护，冻结后变更须记入 `contracts/契约变更记录.md`。
> 版本：**v1.2**｜更新日期：2026-10-13｜集合 **8 个**
>
> **v1.2 变更**（承接变更 C1 首页改版，详见《契约变更记录》CR-005 ~ CR-010）：
> - `notices`：`type` 增加 `urgent`；新增 `level` / `startAt` / `endAt` / `summary`（全部可选）
> - **新增 `circle_post`**（社区圈子，只读数据源）
> - **新增 `service_category`**（四类服务宫格导航，内嵌 `items` 子项）
> - `users` 新增 **`accountId`**（社区账号，唯一）
>
> **v1.1 变更**：新增 `qa_sessions`（多轮会话）；明确知识库落地位置为 `cloudfunctions/shared/kb/kb.json`（**不是集合**）；`qa_feedback` 收敛为纯反馈表。
>
> **v1.2 向后兼容声明**：不删除、不改名任何既存字段；新字段一律**可空**，历史数据与既有索引无需迁移重建。

## 集合清单

| 集合 | 用途 | 关键索引 | 版本 |
| --- | --- | --- | --- |
| `users` | 用户档案与角色 | openid（唯一）、**accountId（唯一）**、role | v1.1 → v1.2 |
| `workorders` | 报修工单 | status、createdAt、_openid | v1.1 |
| `notices` | 社区通知/公告/**紧急通知** | status、publishAt、**type、**level、startAt、endAt** | v1.2 扩展 |
| `phonebook` | 便民电话簿 | category、sort | v1.1 |
| `qa_feedback` | AI 问答反馈（有用/无用） | _openid、answerId、createdAt | v1.1 |
| `qa_sessions` | AI 多轮会话 | _openid + sessionId（唯一）、updatedAt | v1.1 |
| **`circle_post`** | **社区圈子帖（只读）** | **status + publishAt、type + status + publishAt、tags** | **v1.2 新增** |
| **`service_category`** | **四类服务分类导航** | **key（唯一）、status + sort** | **v1.2 新增** |

> **知识库不是集合。** 知识库以 JSON 文件形式内置在 `cloudfunctions/shared/kb/kb.json`，随代码部署，便于版本化与审阅。理由与结构见 `api-contract.md` 末节「附：知识库落地位置」。

## users
| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| _id | string | 自动 | 云数据库自动生成 |
| _openid | string | 自动 | 微信 openid（不可伪造） |
| nickName | string | 否 | 昵称（脱敏展示） |
| phone | string | 否 | 手机号，**AES 加密存储**，展示时 138****1234 |
| **accountId** | string | 是 | **v1.2 新增**：社区账号（替代无法获取的微信「微信号」）。小写字母开头，仅小写字母/数字/下划线，4~20 位。**唯一索引**。服务端建档时自动生成（规则见契约 CR-009），永不为空 |
| role | string | 是 | `resident`（居民）/ `property`（物业）/ `admin`（管理员） |
| building | string | 否 | 楼栋号，如"3 栋 2 单元" |
| elderMode | boolean | 否 | 是否开启关怀模式（大字+语音播报） |
| createdAt | string | 是 | ISO8601 |
| updatedAt | string | 是 | ISO8601 |

> **索引变更**：新增 `accountId` **唯一索引**（`users` 唯一性校验靠它，不能只靠应用层查询，否则并发下会撞号）。
> **懒迁移**：`accountId` 为空的历史文档在读取时由服务端补齐（见契约 CR-009），无需执行迁移脚本。

## workorders
| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| _id | string | 自动 | |
| _openid | string | 自动 | 报修人 |
| title | string | 是 | 标题（≤50 字） |
| description | string | 是 | 问题描述（≤500 字） |
| category | string | 是 | `water`/`electric`/`door`/`public`/`other`（水电/门禁/公共设施/其他） |
| images | string[] | 否 | 云存储 fileID 列表（≤6） |
| status | string | 是 | `pending`（待受理）→ `assigned`（已派单）→ `processing`（处理中）→ `done`（已完成）→ `closed`（已关闭）/ `canceled`（已取消） |
| aiSummary | string | 否 | AI 对描述的智能摘要/分类建议 |
| assignee | string | 否 | 物业处理人 openid |
| handleNote | string | 否 | 物业处理备注 |
| createdAt | string | 是 | ISO8601 |
| updatedAt | string | 是 | ISO8601 |

## notices
| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| _id | string | 自动 | |
| title | string | 是 | 标题 |
| content | string | 是 | 正文（支持换行） |
| type | string | 是 | `notice`（通知）/`activity`（活动）/**`urgent`（紧急通知，v1.2 新增）** |
| status | string | 是 | `draft`/`published` |
| publishAt | string | 是 | ISO8601 |
| location | string | 否 | 活动地点；**紧急通知复用本字段**填写事项地点（如"3 号楼"），不另开字段 |
| signupDeadline | string | 否 | 活动报名截止 |
| **level** | string | 否 | **v1.2 新增**：`critical`/`high`/`normal`，紧急级别。**缺省按 `normal` 处理**。排序权重 critical=3 > high=2 > normal=1 |
| **startAt** | string | 否 | **v1.2 新增**：事项起始时间（ISO8601），如停水开始 09:00。空=立即生效 |
| **endAt** | string | 否 | **v1.2 新增**：事项结束时间。非空且 `< now` 判定为**已过期**，`notice:urgentLatest` 与默认 `notice:list` 均不返回 |
| **summary** | string | 否 | **v1.2 新增**：紧急区单行摘要（≤40 字），供首页轮播展示。缺省时前端回退 `title` |

**索引**：`status + publishAt`（降序，既有）、`type`（既有，**v1.2 起值域扩展**）、**新增 `type + endAt`**（加速 `urgentLatest` 的 `type='urgent' AND endAt >= now` 判定）。
**数据量**：演示级 ≤20 条，`type + endAt` 索引非必需；若 `urgentLatest` 出现慢查询再补。

> **为何 `startAt/endAt` 不复用 `signupDeadline`**：`signupDeadline` 语义是「报名截止」，与「事项有效期」不同。混用会导致后续扩展（如「降水 downTime」逻辑）无法表达，故独立开字段并保持可空。

## phonebook
| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| _id | string | 自动 | |
| name | string | 是 | 名称，如"物业服务中心" |
| phone | string | 是 | 明文电话（公开便民数据，非个人隐私） |
| category | string | 是 | `property`/`government`/`medical`/`life`/`emergency` |
| sort | number | 是 | 排序权重，小的在前 |
| remark | string | 否 | 备注 |

## qa_feedback（纯反馈表，v1.1 收敛）
| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| _id | string | 自动 | |
| _openid | string | 自动 | 反馈人 |
| question | string | 是 | 用户问题（≤300 字，与 prompt 同上限） |
| answerId | string | 是 | 对应 QaTurn.answerId |
| sessionId | string | 否 | **v1.1 新增**，便于按会话回溯上下文 |
| useful | boolean | 是 | 是否有用 |
| createdAt | string | 是 | ISO8601 |

> v1.1 澄清：本集合**只存反馈**。早期草案（`04-架构师-skill.md`）曾设计用 `type` 字段在本集合内混存知识库条目与问答日志，**已废弃**——知识库改为 `shared/kb/kb.json`。

## qa_sessions（AI 多轮会话，v1.1 新增）
| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| _id | string | 自动 | |
| _openid | string | 自动 | 会话归属人（不可伪造） |
| sessionId | string | 是 | 会话 ID，客户端生成或服务端返回 |
| turns | array | 是 | `QaTurn[]`，**服务端只保留最近 3 轮** |
| turnCount | number | 是 | 累计轮次（不受保留策略影响，用于运营统计） |
| createdAt | string | 是 | ISO8601 |
| updatedAt | string | 是 | ISO8601，最后一次活动时间 |

**保留与清理规则（硬性）**：

| 规则 | 值 | 目的 |
| --- | --- | --- |
| 保留轮次 | 最近 3 轮 | 控制上下文长度 |
| 单条 content 上限 | 300 字 | 防超长输入 |
| 总上下文上限 | 2000 tokens（估算） | 超限丢弃最早轮次 |
| 会话过期 | 最后活动后 2 小时 | 懒清理（读取时判过期）或定时触发器清理 |

**权限**：仅本人（`_openid`）可读写自己的会话；管理员只读统计，不可读 `turns` 内容。

---

## circle_post（社区圈子帖，v1.2 新增）

> **范围：只读数据源。** 本期无用户发帖/评论/点赞（P2），数据由 `scripts/seed.mjs` 与云开发控制台维护。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| _id | string | 自动 | |
| title | string | 是 | 标题（≤50 字） |
| content | string | 是 | 正文（≤1000 字，支持换行） |
| type | string | 是 | `road`（路况）/`notice`（公告）/`activity`（活动） |
| tags | string[] | 否 | 标签数组，如 `["停水","3号楼"]`；`circle:list` 的 `tag` 参数为精确匹配 |
| authorName | string | 是 | 展示用作者名，如「阳光社区居委会」「3栋王阿姨」 |
| authorRole | string | 是 | `official`（官方：居委会/物业）/ `resident`（居民）；UI 据此显示「官方」徽标 |
| authorOpenid | string | 否 | 真实作者的 openid；**接口出参不下发**（避免暴露隐私），仅供将来 UGC 扩展 |
| images | string[] | 否 | 云存储 fileID 列表（≤3） |
| sourceType | string | 是 | `manual`（人工/种子维护）/`sync`（与 `notices` 自动同步生成） |
| refId | string | 否 | `sourceType=sync` 时关联的 `notices._id`，用于去重与溯源 |
| status | string | 是 | `draft`/`published`；接口只返回 `published` |
| topFlag | boolean | 是 | 置顶；排序时优先（降序） |
| viewCount | number | 否 | 浏览量，`circle:detail` 命中后原子自增 `_.inc(1)`；缺省按 0 |
| publishAt | string | 是 | ISO8601 |
| createdAt | string | 是 | ISO8601 |
| updatedAt | string | 是 | ISO8601 |

**索引**：`status + publishAt`（降序，主列表）、`type + status + publishAt`（类型筛选，首页「最近路况」用）、`tags`（数组索引，标签筛选）。
**排序规则**：`topFlag` 降序 → `publishAt` 降序（`circle:list` 与 `circle:detail` 共用）。
**与 notices 的关系**：`sourceType=sync` 的记录由 notices 同步而来，**只读镜像**，不允许反向写回 notices，避免双向同步脏数据。

---

## service_category（四类服务分类导航，v1.2 新增）

> **为什么要这个集合而不硬编码前端**：宫格文案/图标/跳转目标需要在演示前一天还能改（评委提问后快速调整），走集合可在云开发控制台改完即生效，**无需重新发版**。
> **降级**：前端必须同时内置一份等价本地常量 `miniprogram/config/service-grid.ts`，接口失败或返回空时回退，保证 Demo 不白屏。

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| _id | string | 自动 | |
| key | string | 是 | 分类唯一标识：`life`/`elder`/`support`/`culture` |
| title | string | 是 | 分类标题，如「生活基础服务」（≤6 字，宫格标题不换行） |
| subtitle | string | 是 | 宫格小字，`｜` 分隔且 UI 会按行拆分，如「挂号｜义诊｜疫苗档案」 |
| icon | string | 是 | 图标资源名或云存储 fileID，如 `icon-func-life-green-72.png` |
| iconTheme | string | 是 | `green`（第 1/2 格，主绿 `--brand`）/ `warm`（第 3/4 格，暖橙 `--accent-warm`），对齐设计预览 §0 |
| sort | number | 是 | 排序，1~4（2×2 宫格按行优先排列） |
| status | string | 是 | `online`/`offline`；接口只返 `online` |
| items | array | 是 | 内嵌子项数组，**不做子集合**（4 类 × ≤3 项，总量 ≤12，内嵌读取一次到位） |
| createdAt | string | 是 | ISO8601 |
| updatedAt | string | 是 | ISO8601 |

**items 子项结构**（内嵌对象，非独立文档）：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| key | string | 是 | 子项标识，如 `register` |
| name | string | 是 | 子项名，如「挂号」（≤4 字） |
| targetType | string | 是 | `page`/`notice`/`circle`/`assistant`/`phone`/`toast`（路由语义见契约 §service:list） |
| targetPath | string | 否 | `targetType=page` 时的页面路径 |
| targetParams | object | 否 | 透传参数，如 `{category:'medical'}`、`{presetQuestion:'…'}`、`{phone:'…'}` |
| tip | string | 否 | `targetType=toast` 时的 toast 文案 |
| sort | number | 是 | 子项排序 |

**索引**：`key`（唯一）、`status + sort`。
**权限**：所有人**只读**（走云函数）；仅 `admin` 可写（本期不建后台，直接在控制台改，或由 `scripts/seed.mjs` 重建）。

---

## 种子数据（scripts/seed.mjs 生成）
- 测试账号：resident-1（居民）、property-1（物业）、admin-1（管理员）
- 示例工单 3 条（覆盖 pending/processing/done）
- 示例通知 4 条（2 通知 + 2 活动）
- 电话簿 **11 条**（⚠️ **CR-015 勘误**：此处原写 **8 条**，为 119/110 补齐之前的陈旧值，已更正）
  - `phonebook` 共 **11 条**：**5 条**号码取自真源 `cloudfunctions/shared/hotline.js`（物业服务中心 020-88888888、社区居委会 020-88886666、急救中心 120、报警求助 110、火警 119），
    **6 条**为 seed 内单独定义的社区服务号（社区卫生服务站、自来水供水热线、供电服务热线、燃气服务热线、开锁服务、社区养老服务中心）
  - 其中社区养老服务中心 `020-88880000` 为**占位号，真环境需替换**
  - ⚠️ 公共法律服务热线 **12348 仅出现在安全话术中，不在本集合内**——**别把它算进集合条数**（首版曾误算，见 `契约变更记录.md` CR-015-a 勘误）
  - 真源与条数以 `scripts/seed.mjs` 为准；契约只锁**条数**与**真源引用**，不另起一份清单（见 CR-014-a）
  - 📌 **号码替换范围（CR-016，真环境落地必读）**：11 条中 **8 条为演示占位号需替换**、**3 条是真号码严禁替换**
    - 🔄 **需替换（8 条，`020-8888xxxx` 段占位号）**：物业服务中心 020-88888888、社区居委会 020-88886666、社区卫生服务站 020-88885555、自来水供水热线 020-88884444、供电服务热线 020-88883333、燃气服务热线 020-88882222、开锁服务 020-88881111、社区养老服务中心 020-88880000
    - ⛔ **严禁替换（3 条）**：**110 / 119 / 120**——国家公开紧急号码，**是真号码**，不在占位号范围内。
      误替换 = **安全事故**：居民照安全话术打过去是空号或错号
    - ⚠️ **口径禁令**：不要把这 11 条写成「整体替换」——它们**不是**同一性质，
      「整体替换」四个字会被运维误读成 11 条全换（本行前版正是这么写的，已修正）
    - 🔗 连带引用（改号时必须一并改，否则同号不同处不一致）：社区养老服务中心 → `service_category` 助浴子项 + `shared/kb/kb.json`；社区卫生服务站 → 前端 `mock/risk-rules.ts`（曾写成 020-87651120）
- 知识库 ≥10 条问答对（写入 `shared/kb/kb.json`，**不是集合**）
- 会话数据不预置（由用户实际提问产生）

### v1.2 种子数据增量（必须补，否则新页面空态无法演示）

| 集合 | 条数 | 具体要求 |
| --- | --- | --- |
| `notices` | **+3 条 `type=urgent`** | ①「10-15 停水通知」`level=high`，`startAt`/`endAt` 覆盖演示当天（确保 **当下未过期**）；②「道路检修」`level=normal`，location=「小区南门」；③「电梯年检」`level=critical`。每条必须带 `summary`（≤40 字，首页轮播用）。**⚠ 种子脚本里的 `startAt/endAt` 必须用相对时间生成（`now + Nd`），不要写死日期，否则过了 10-15 演示当天就是空态** |
| `circle_post` | **8 条** | 覆盖 `type` 三种：`road` ≥3 条（首页「最近路况」pill 必须有数据）、`notice` 3 条、`activity` 2 条；`authorRole` 混合（`official` 4 / `resident` 4）；至少 1 条带 `images`（1~2 张）、至少 1 条 `topFlag=true`；`status` 全部 `published` |
| `service_category` | **4 条**（`life`/`elder`/`support`/`culture`） | 分类与子项按契约 §service:list「四类服务承接方案」表逐条落地；全部 `status=online`，`sort` 1~4 |
| `users` | 3 个测试账号补 `accountId` | 如 `linju_7k3m9a` / `linju_p2q8zt` / `linju_h4v6rc`；**必须唯一**（唯一索引会拦截重复） |

> **演示红线**：10-24 预打包演练前必须重跑一遍种子脚本，确认紧急通知**仍在有效期内**、圈子页**非空**。空态 demo = 直接丢掉「产品体验与用户增长」10% 分。

## 权限规则（云数据库安全规则）
- `users`：仅本人与管理员可读写完整记录；**`accountId` 的全局唯一性由唯一索引保证**，昵称/账号等展示字段对外可读
- `workorders`：仅本人（创建者）+ 物业/管理员可见；**居民间工单不可互看**
- `notices`：所有人可读，仅管理员可写
- `phonebook`：所有人可读，仅管理员可写
- `qa_feedback`：仅本人可写，管理员可读统计
- `qa_sessions`：**仅本人可读写**（`_openid` 隔离）；管理员只读聚合统计，不可读 `turns` 内容
- **`circle_post`（v1.2）**：所有人可读（`status=published`），仅管理员可写。**本期禁止客户端直写**（无 UGC）
- **`service_category`（v1.2）**：所有人可读（`status=online`），仅管理员可写；**变更即生效，无需发版**
