# API 契约（唯一契约，前后端共同遵守）

> 版本：**v1.1**｜更新日期：2026-10-13｜资源 5 个 / 动作 **14 个**
> 风格：云函数 `callFunction` 直调，按资源分组命名：`name = "<资源>:<动作>"`。
> 统一响应：`{ code: 0, msg: "ok", data: ... }`；`code !== 0` 为失败，`msg` 为可展示文案。
> 分页：`page` 从 1 起，`pageSize` 默认 10 上限 50；时间格式 ISO8601；图片走云存储 fileID。
> 鉴权：云函数自动取 `wxContext.OPENID`，写操作按 `users.role` 校验；不另发 token。
> 冻结：本契约发布后冻结。变更必须更新本文件并在 `contracts/契约变更记录.md` 登记，同步前后端。
>
> **v1.1 变更**（详见《契约变更记录》）：qa 分组补齐会话能力 —— `qa:ask` 增加 `sessionId`，新增 `qa:history`、`qa:clear`。
> 原因：`07-测试工程师` 的 TC-29 / TC-44 / AIQ-20 要求多轮上下文与历史记录，v1.0 的无状态设计无法满足。

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
- 入参：`{ nickName?, phone?, building?, elderMode? }`
- 出参：`{ profile: User }`
- 说明：手机号 AES 加密存储

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

## notice：社区通知/活动
### notice:list
- 入参：`{ type?, page?, pageSize? }`
- 出参：`{ list: Notice[], total: number }`
- 说明：仅返回 status=published

### notice:detail
- 入参：`{ id: string }`
- 出参：`{ notice: Notice }`

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
  type: 'notice' | 'activity';
  status: 'draft' | 'published';
  publishAt: string; location?: string; signupDeadline?: string;
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
