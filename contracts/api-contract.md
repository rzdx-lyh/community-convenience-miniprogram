# API 契约（唯一契约，前后端共同遵守）

> 风格：云函数 `callFunction` 直调，按资源分组命名：`name = "<资源>:<动作>"`。
> 统一响应：`{ code: 0, msg: "ok", data: ... }`；`code !== 0` 为失败，`msg` 为可展示文案。
> 分页：`page` 从 1 起，`pageSize` 默认 10 上限 50；时间格式 ISO8601；图片走云存储 fileID。
> 鉴权：云函数自动取 `wxContext.OPENID`，写操作按 `users.role` 校验；不另发 token。
> 冻结：本契约发布后冻结。变更必须更新本文件并在《契约变更记录》登记，同步前后端。

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

## qa：AI 智能问答（RAG）
### qa:ask
- 入参：`{ question: string, elderMode?: boolean }`
- 出参：`{ answerId: string, answer: string, sources: string[], degraded: boolean }`
- 说明：调用链 = 小程序 → 云函数 → 大模型 API；知识库检索优先，无命中返回兜底话术+便民电话；`degraded=true` 表示 AI 不可用已降级；回答页脚固定展示"AI 生成仅供参考"

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
```
