# 数据库 Schema（云开发文档型数据库）

> 契约文件之一：`db-schema.md`。由架构师维护，冻结后变更须记入 `contracts/契约变更记录.md`。
> 版本：**v1.1**｜更新日期：2026-10-13｜集合 **6 个**
>
> **v1.1 变更**：新增 `qa_sessions`（多轮会话）；明确知识库落地位置为 `cloudfunctions/shared/kb/kb.json`（**不是集合**）；`qa_feedback` 收敛为纯反馈表。

## 集合清单

| 集合 | 用途 | 关键索引 |
| --- | --- | --- |
| `users` | 用户档案与角色 | openid（唯一）、role |
| `workorders` | 报修工单 | status、createdAt、_openid |
| `notices` | 社区通知/公告 | status、publishAt |
| `phonebook` | 便民电话簿 | category、sort |
| `qa_feedback` | AI 问答反馈（有用/无用） | _openid、answerId、createdAt |
| `qa_sessions` | **AI 多轮会话（v1.1 新增）** | _openid + sessionId（唯一）、updatedAt |

> **知识库不是集合。** 知识库以 JSON 文件形式内置在 `cloudfunctions/shared/kb/kb.json`，随代码部署，便于版本化与审阅。理由与结构见 `api-contract.md` 末节「附：知识库落地位置」。

## users
| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| _id | string | 自动 | 云数据库自动生成 |
| _openid | string | 自动 | 微信 openid（不可伪造） |
| nickName | string | 否 | 昵称（脱敏展示） |
| phone | string | 否 | 手机号，**AES 加密存储**，展示时 138****1234 |
| role | string | 是 | `resident`（居民）/ `property`（物业）/ `admin`（管理员） |
| building | string | 否 | 楼栋号，如"3 栋 2 单元" |
| elderMode | boolean | 否 | 是否开启关怀模式（大字+语音播报） |
| createdAt | string | 是 | ISO8601 |
| updatedAt | string | 是 | ISO8601 |

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
| type | string | 是 | `notice`（通知）/`activity`（活动） |
| status | string | 是 | `draft`/`published` |
| publishAt | string | 是 | ISO8601 |
| location | string | 否 | 活动地点 |
| signupDeadline | string | 否 | 活动报名截止 |

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

## 种子数据（scripts/seed.mjs 生成）
- 测试账号：resident-1（居民）、property-1（物业）、admin-1（管理员）
- 示例工单 3 条（覆盖 pending/processing/done）
- 示例通知 4 条（2 通知 + 2 活动）
- 电话簿 8 条（物业/居委会/卫生服务站/供水/供电/燃气/开锁/急救）
- 知识库 ≥10 条问答对（写入 `shared/kb/kb.json`，**不是集合**）
- 会话数据不预置（由用户实际提问产生）

## 权限规则（云数据库安全规则）
- `users`：仅本人与管理员可读写完整记录
- `workorders`：仅本人（创建者）+ 物业/管理员可见；**居民间工单不可互看**
- `notices`：所有人可读，仅管理员可写
- `phonebook`：所有人可读，仅管理员可写
- `qa_feedback`：仅本人可写，管理员可读统计
- `qa_sessions`：**仅本人可读写**（`_openid` 隔离）；管理员只读聚合统计，不可读 `turns` 内容
