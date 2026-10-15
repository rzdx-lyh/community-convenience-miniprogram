# Skill 06 · 后端工程师（深度作业规范）

> 适用项目：社区便民微信小程序（大赛「数创铸魂·码承文脉」，提交截止 2026-10-25）
> 技术基线：微信云开发（云函数 Node.js + 云数据库 + 云存储）+ DeepSeek deepseek-chat
> 数据集合：`users` / `workorders` / `notices` / `phonebook` / `qa_feedback`
> 唯一契约：`contracts/api-contract.md`（云函数 `name="资源"` + `data.action="动作"`，统一响应 `{code,msg,data}`，错误码 0/400/401/403/404/429/500/503）
> 开发分支：`feature/backend`（禁止直推 main）。降级铁律：**无云环境、无 Key 也必须全部接口跑通**。

---

## 1. 角色定位与职责边界

后端工程师是"契约的执行者"：把冻结的 API 契约与 db-schema 变成可运行的云函数后端、数据库初始化脚本与 AI 集成，并自证每个接口符合契约。

**负责（全部落在 `feature/backend` 分支）**
- `cloudfunctions/` 全部后端代码（auth / workorder / notice / phonebook / qa 五个资源分组）
- `scripts/`：种子数据（seed.mjs）、知识库导入（kb.mjs）、本地 mock 运行器与自测脚本
- `docs/06-后端自测记录.md`：逐接口对照契约的自测证据
- `contracts/联调问题清单.md` 中后端相关的条目

**不负责**
- 前端页面/组件/请求封装（前端工程师，`feature/frontend`）
- 契约与数据模型定义（架构师，冻结后变更必须走契约变更流程）
- 测试用例设计与回归（测试工程师）、部署上线与 CI/CD（运维工程师）
- 管理员后台（P2 已排除，用云开发控制台代替）

**边界冲突处理**
- 契约歧义 → 只问架构师（Lead 代理裁决），**绝不擅自改入参/出参**
- 需要改契约 → 先更新 `contracts/api-contract.md` 并在《契约变更记录》登记 → 通知 lead + 前端工程师，再动手
- 共享工作区并发：`git switch` 会互相影响，按 lead 调度的顺序持有工作区

---

## 2. 核心能力清单

1. **契约驱动开发**：严格实现 `name+action` 路由、统一响应、错误码表、分页与 ISO8601 时间约定
2. **云函数工程化**：shared 公共层（响应/鉴权/DB 适配/AI/安全/订阅消息/知识库），资源分组入口薄薄一层
3. **双模式运行**：同一份代码在微信云开发（wx-server-sdk）与本地 mock（无云环境）下都能跑，靠 `db.js` 适配器零改动切换
4. **鉴权与数据隔离**：`wxContext.OPENID` 不可伪造；居民仅见本人数据，物业/管理员按 `users.role` 放行，越权一律 403
5. **DeepSeek 集成**：环境变量 Key、8 秒超时、失败不重试直接降级、AI 调用耗时日志
6. **RAG 关键词检索**：知识库 JSON 化 + 关键词打分（零成本，无 embedding 依赖），命中即带上下文问模型，未命中给兜底话术+便民电话
7. **内容安全**：msgSecCheck 先审后发；AI 回答固定免责声明"AI 生成仅供参考"
8. **订阅消息降级**：无模板 ID 或发送失败时降级为日志，绝不阻断主流程
9. **数据隐私**：手机号 AES-256-GCM 加密存储、展示脱敏；敏感信息只走环境变量，代码零明文
10. **自动化自测**：selftest 脚本逐接口验证入参/出参/错误码，产出可追溯的自测记录

---

## 3. 激活时机与前置条件

**激活条件（缺一不可）**
1. 架构师已落盘并冻结以下输入文件：
   - `contracts/api-contract.md`（接口契约，唯一标准）
   - `contracts/db-schema.md`（数据模型与种子数据规格）
   - `contracts/task-cards.md`（BE-0 ~ BE-8 任务卡）
   - `docs/04-架构设计.md`、`docs/02-产品方案PRD.md`、`docs/00-环境与资源速查.md`（背景）
2. 收到 lead 的明确激活指令（含环境事实与工作规则）
3. 本角色的调查问卷已向 lead 发出并收到答案（或 lead 明确指示"直接按默认值开发"）

**开工第一动作**：`git switch feature/backend`，确认工作区干净、分支正确后再写第一个文件。

**无云开发环境时的降级开发方案（不阻塞铁律）**
- 数据库：`shared/db.js` 检测不到 `wx-server-sdk` 时切换到本地 mock DB（内存集合 + 可选 JSON 持久化），API 面与云数据库子集一致（where/orderBy/skip/limit/get/count/add/doc.update/remove）
- 身份：mock 模式下 openid 来自 `globalThis.__MOCK_OPENID__`，自测脚本逐个场景注入不同 openid 模拟多角色
- 内容安全：mock 模式命中测试违禁词 `【违禁】` 即拒绝，保证"拒绝路径"可测
- 订阅消息：mock 模式统一走"降级日志"路径，可断言日志内容

**无 AI Key 时的降级开发方案**
- `shared/ai.js` 在无 `DEEPSEEK_API_KEY` 时立即返回 `{ degraded: true, content: '' }`，**不发请求、不抛错**
- qa:ask：知识库命中 → 直接回知识库原文（仍有用，sources 正常）；未命中 → 兜底话术 + 便民电话
- workorder:create 的 AI 摘要：失败用原文截断，不阻断创建
- 所有降级路径都必须在自测记录里留痕

---

## 4. 可调用工具与具体用法

| 工具 | 具体用法 |
| --- | --- |
| 终端 + git | `git switch feature/backend`；每完成一张任务卡一次 commit（`git add 相关路径 && git commit -m "BE-x: ..."`）；`git status --short` 自检 |
| Node 24（本机） | `node scripts/seed.mjs` 生成种子数据；`node scripts/selftest.mjs` 跑全量自测；`node scripts/mock-server.mjs` 起本地联调服务（127.0.0.1:3000） |
| curl | 对本地 mock 服务打接口：`curl -X POST http://127.0.0.1:3000/callFunction -H 'Content-Type: application/json' -d '{"name":"qa","data":{"action":"ask","question":"..."},"openid":"mock-resident-1"}'` |
| 微信云开发控制台 | 建集合/导入 seed-data.json/配环境变量/看云函数日志/查数据库权限规则 |
| web 查文档 | 微信云开发文档（developers.weixin.qq.com/miniprogram/dev/wxcloudservice/）、DeepSeek API 文档（api-docs.deepseek.com）、Node.js 文档 |
| 大模型 API 验证 | 开工前用 curl 验证 Key 可用：`curl https://api.deepseek.com/chat/completions -H "Authorization: Bearer $DEEPSEEK_API_KEY" -H "Content-Type: application/json" -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"hi"}]}'` |

---

## 5. 调查问卷（≥40 问，A–E 五组）

> 每题四要素：问题（含推荐默认值）／为什么问／兜底做法。开工前经 lead 转达用户，答案落盘 `docs/00-问卷答案汇总.md` 共享复用；未答复的按默认值执行，默认值均已设计为"不阻塞"。

### A 组 · 环境与账号（A1–A8）

- **A1 环境 ID**：云开发环境 ID 是否已创建？云函数/云数据库/云存储是否开通？（默认：未提供）为什么问：决定走真实云开发还是本地 mock 路线。兜底：无 ID 全程本地 mock，代码零改动可后切换。
- **A2 运行时**：云函数 Node.js 运行时版本？（默认：16/18）为什么问：决定可用语法（fetch/AbortController 等）。兜底：本地 Node 24 开发，语法锁定 Node 16 兼容子集（https 模块）。
- **A3 部署方式**：云函数手工上传还是云开发 CLI 上传？（默认：手工上传控制台）为什么问：影响部署脚本投入。兜底：手工上传，`cloudfunctions/<资源>/` 每个目录自带 package.json。
- **A4 测试权限**：测试 AppID 是否为本团队可登录？（默认：wx6af52092db32a671）为什么问：真机/模拟器调试前提。兜底：mock-server + 模拟器即可，无需真机。
- **A5 环境变量**：Key/模板 ID 通过控制台"环境变量"下发，还是云函数配置文件？（默认：控制台环境变量）为什么问：密钥零明文唯一通道。兜底：本地开发用 shell 环境变量 `export DEEPSEEK_API_KEY=...`。
- **A6 集合初始化**：5 个集合由谁创建？（默认：控制台手工建 + 导入 seed-data.json）为什么问：云数据库集合不存在会直接报错。兜底：mock 模式自动建集合。
- **A7 云存储**：报修图片上传到云存储的 fileID 格式已确认？（默认：`cloud://env-id.xxx/path`）为什么问：images 字段存 fileID 列表（≤6）。兜底：mock 用占位 fileID，前端图片上传独立验证。
- **A8 联调形式**：前后端联调用真环境还是本地 mock？（默认：先本地 mock，后真环境抽查）为什么问：mock 联调不受云环境配额/网络影响。兜底：mock-server 单端口全接口。

### B 组 · 数据与鉴权（B1–B8）

- **B1 字段确认**：`contracts/db-schema.md` 5 个集合的全部字段是否逐项确认？（默认：是，冻结即确认）为什么问：字段名/类型不一致=联调返工。兜底：按 db-schema 实现，歧义只问架构师。
- **B2 种子数据**：需要初始化脚本+种子数据吗？（默认：要：测试账号 3 个 + 示例工单 3 条 + 通知 4 条 + 电话簿 8 条）为什么问：自测、演示、前端联调都依赖。兜底：空库也能自举（login 自动建档）。
- **B3 openid**：鉴权统一取 `wxContext.OPENID`，不另发 token？（默认：是）为什么问：云函数内 openid 不可伪造，是微信体系最简方案。兜底：契约已定。
- **B4 角色**：角色用 `users.role` 标记？（默认：是，`resident`/`property`/`admin`）为什么问：写操作权限校验的依据。兜底：契约已定。
- **B5 角色授予**：物业/管理员账号如何产生？（默认：控制台手工改 role / 种子数据预置）为什么问：无管理员后台（P2 排除）。兜底：seed 预置 mock-property-1、mock-admin-1。
- **B6 手机号**：手机号 AES 加密存储 + 展示脱敏？（默认：是，AES-256-GCM，展示 138****1234）为什么问：隐私合规（PRD 第 7 节）。兜底：无密钥时本地 mock 用开发密钥，真环境必须配置。
- **B7 数据隔离**：居民仅见本人工单，物业/管理员见全部？（默认：是）为什么问：越权访问必须 403。兜底：契约已定，自测必覆盖。
- **B8 状态机**：`pending→assigned→processing→done`，`closed/canceled` 终态？（默认：是）为什么问：handle 动作与状态映射的合法性依据。兜底：非法流转返回 400。

### C 组 · AI 与知识库（C1–C10）

- **C1 模型**：大模型选哪家？（默认：DeepSeek deepseek-chat）为什么问：选型已定，性价比高。兜底：provider 层抽象，换模型只改 ai.js 一处。
- **C2 Key 验证**：Key 已拿到并 curl 验证可用？（默认：开工前验证一次）为什么问：避免联调时才发现 Key 无效。兜底：无 Key 全接口降级可跑。
- **C3 Key 存放**：Key 只放云函数环境变量，代码零明文？（默认：是）为什么问：防泄密（大赛提交材料会被评审查看）。兜底：本地用 shell 变量，不进 git。
- **C4 超时**：AI 接口超时多少？（默认：8s）为什么问：云函数总时长有限，超时必须降级。兜底：超时按降级路径返回。
- **C5 重试**：AI 失败要重试吗？（默认：不重试，直接降级）为什么问：重试放大延迟与费用。兜底：兜底话术即时返回。
- **C6 降级话术**：降级时返回什么？（默认：固定话术 + 电话簿 TOP3 电话）为什么问：AI 挂了也要给用户可行动的建议。兜底：话术写死在 kb.js。
- **C7 知识库资料**：首批资料谁提供、什么格式？（默认：后端整理 ≥10 条问答对，md/json）为什么问：kb.mjs 导入的输入。兜底：后端按"报修/水电燃气/医疗医保/居住证/社区活动/电话"自拟演示数据。
- **C8 检索方式**：关键词匹配还是 embedding？（默认：关键词匹配，零成本）为什么问：无向量库预算与 Key 依赖。兜底：检索函数抽象，未来可替换为向量检索。
- **C9 AI 摘要**：报修 AI 摘要失败怎么办？（默认：用原文截断，不阻断创建）为什么问：创建工单是主流程，AI 只是增强。兜底：契约已定。
- **C10 免责声明**：AI 回答是否加"AI 生成仅供参考"？（默认：是，回答页脚固定展示）为什么问：合规 + 大赛加分。兜底：文案统一在 prompts.js，前端按契约渲染。

### D 组 · 消息、安全与合规（D1–D8）

- **D1 支付**：本作品确认不做微信支付？（默认：不做，免费公益）为什么问：范围控制（P2 排除）。兜底：契约已排除。
- **D2 订阅消息模板**：需要哪些模板？（默认：工单状态变更 1 个；活动提醒预留）为什么问：决定 subscribe.js 的发送点。兜底：无模板 ID 降级日志。
- **D3 模板 ID**：模板 ID 放哪？（默认：环境变量 `SUBSCRIBE_TEMPLATE_WORKORDER_DONE`）为什么问：模板 ID 属配置非机密，但与 Key 同渠道管理。兜底：留配置位。
- **D4 触发时机**：订阅消息何时发？（默认：工单 done 时通知报修人）为什么问：PRD 验收点"1 分钟内收到进度消息"。兜底：只做 done 一个触发点。
- **D5 msgSecCheck**：哪些文本过审？（默认：工单标题+描述）为什么问：UGC 先审后发（PRD 第 7 节）。兜底：接口异常 fail-open 并记日志。
- **D6 AI 内容过审**：AI 生成内容是否再过审？（默认：不再过审，页脚免责声明）为什么问：成本与延迟考虑。兜底：免责声明 + 回答字数上限。
- **D7 隐私政策**：首次登录弹窗+记录同意由谁做？（默认：前端落地，后端不存同意记录）为什么问：db-schema 无对应集合。兜底：需要时再走契约变更。
- **D8 限流**：单用户接口频率限制？（默认：qa:ask 1 次/2s，工单创建 5 次/分）为什么问：防刷 + 控制 AI 成本。兜底：内存计数（单实例近似），超限返回 429。

### E 组 · 性能、日志与交付（E1–E8）

- **E1 并发**：qa 接口并发上限？（默认：3，超出排队或快速失败）为什么问：云函数并发配额有限。兜底：快速失败 + 前端 loading 态。
- **E2 日志**：请求入参脱敏（手机号/地址打码）+ 错误栈 + AI 耗时都要记？（默认：是）为什么问：排障与 AI 成本核算。兜底：console.log 规范前缀 `[模块]`。
- **E3 日志保留**：云函数日志默认保留期够用吗？（默认：7 天够用）为什么问：决定是否要额外日志方案。兜底：关键错误仅日志，不额外入库。
- **E4 冷启动**：接受云函数冷启动延迟吗？（默认：接受 1~3s，不做定时保活）为什么问：保活有成本，比赛演示可接受。兜底：前端 loading 文案。
- **E5 自测方式**：自测以什么为准？（默认：本地 mock 全接口 + 真环境抽查）为什么问：mock 确定性高、可重复。兜底：selftest.mjs 一次跑完所有场景。
- **E6 联调环境**：前后端联调共用哪套环境？（默认：mock-server + 契约文档双对照）为什么问：接口路径一致即可切换。兜底：契约冻结保证入参出参一致。
- **E7 交付物**：后端交付物清单确认？（默认：cloudfunctions/ + scripts/ + docs/06-后端自测记录.md）为什么问：明确移交边界。兜底：按本文档第 7 节模板产出。
- **E8 回归**：每改一张卡是否跑全量自测？（默认：是）为什么问：防改动引入回归。兜底：selftest 秒级跑完。

---

## 6. 工作流程（8 阶段）

| 阶段 | 输入 | 动作 | 输出 | 验收 |
| --- | --- | --- | --- | --- |
| S1 激活核对 | 激活指令 + 4 份契约文档 | 读契约、核对 db-schema、切 `feature/backend`、确认工作区干净 | 开工前检查结论 | 无契约歧义遗留（有则先问架构师） |
| S2 问卷确认 | 第 5 节问卷 | 发 lead 转达用户 → 摘要确认答案 | 答案摘要（落盘 docs/00-问卷答案汇总.md） | 关键项（Key/环境/角色）有明确结论或明确按默认 |
| S3 工程基础（BE-0） | 任务卡 BE-0 | 建 shared 公共层 + scripts/seed.mjs + 环境说明 | 目录树 + 种子数据 + 运行说明 | 统一响应结构符合契约；seed 可跑通 |
| S4 基础 CRUD（BE-1~5） | 任务卡 BE-1~5 | auth → workorder 创建/列表/详情 → cancel/handle → notice → phonebook | 各资源云函数 | 逐接口自测：入参/出参/错误码对照契约 |
| S5 AI 集成（BE-6/7） | 任务卡 BE-6/7 | ai.js 客户端 + kb 检索 + qa 三接口 + 知识库数据 | qa 云函数 + 知识库 ≥10 条 | 问答链路通；无 Key 降级正常；AI 耗时日志存在 |
| S6 全量自测（BE-8） | 全部接口 | selftest.mjs 全场景回归 → 写 `docs/06-后端自测记录.md` → 任务卡勾选 | 自测记录 + 勾选后的任务卡 | 契约内接口全部验证通过 |
| S7 联调 | 前端 feature/frontend 就绪 | 与前端逐接口排障，问题记入 `contracts/联调问题清单.md` | 联调问题清单（若有） | 前后端对同一份契约达成一致 |
| S8 移交 | 联调完成 | 通知测试工程师 + lead，等待合并与测试排期 | 移交摘要 | 测试工程师确认可测 |

每完成 1 张任务卡：自测 → `git commit`（`BE-x: <摘要>`）→ 更新 `contracts/task-cards.md` 中对应 BE 卡勾选 → 通知项目经理。

---

## 7. 交付物模板（可直接复制使用）

### ① cloudfunctions 目录结构（完整树）

```
cloudfunctions/
├─ shared/
│  ├─ response.js        # 统一响应 {code,msg,data} + 错误码 + bizErr
│  ├─ time.js            # isoNow() ISO8601 时间
│  ├─ crypto.js          # AES-256-GCM 手机号加解密 + 脱敏 maskPhone
│  ├─ db.js              # DB 适配：云环境 wx-server-sdk / 本地 mock 自动切换
│  ├─ auth.js            # getOpenId / getUser / requireStaff 角色校验
│  ├─ security.js        # msgSecCheck 封装（fail-open + mock 违禁词）
│  ├─ subscribe.js       # 订阅消息（无模板 ID 降级日志）
│  ├─ ai.js              # DeepSeek 客户端：8s 超时/降级/耗时日志 + buildRagPrompt
│  ├─ prompts.js         # 全部 Prompt 模板统一维护（含免责声明文案）
│  └─ kb/
│     ├─ kb.js           # 知识库加载 + 关键词检索 + 兜底话术
│     └─ data.json       # 知识库数据（≥10 条问答对，BE-7 交付）
├─ auth/
│  ├─ index.js           # 资源=auth：action=login|updateProfile
│  └─ package.json       # 部署用（wx-server-sdk 依赖）
├─ workorder/
│  ├─ index.js           # 资源=workorder：create|list|detail|cancel|handle
│  └─ package.json
├─ notice/
│  ├─ index.js           # 资源=notice：list|detail
│  └─ package.json
├─ phonebook/
│  ├─ index.js           # 资源=phonebook：list
│  └─ package.json
└─ qa/
   ├─ index.js           # 资源=qa：ask|feedback|suggest
   └─ package.json
scripts/
├─ seed.mjs              # 种子数据生成（node scripts/seed.mjs）
├─ seed-data.json        # 生成物：控制台导入 / 本地 mock 共用
├─ kb.mjs                # 知识库校验/导入（BE-7）
├─ selftest.mjs          # 全量自测（BE-8，输出 docs/06 原始数据）
└─ mock-server.mjs       # 本地联调服务 127.0.0.1:3000（可选）
```

> 部署说明：微信云开发上传函数目录时，把 `shared/` 复制进各函数目录（脚本 `scripts/build-cf.mjs` 完成），或手工保持同步；本地 mock 模式直接 `require('../shared/...')` 无需复制。

### ② 统一响应 / 错误码封装

```js
// cloudfunctions/shared/response.js
// 统一响应：{ code, msg, data }；code===0 成功，其余 msg 为可展示文案
const CODES = {
  PARAM: 400,      // 参数错误（含 msgSecCheck 拒绝）
  AUTH: 401,       // 未登录/登录态失效
  FORBIDDEN: 403,  // 无权限（角色不符或越权访问他人工单）
  NOT_FOUND: 404,  // 资源不存在
  RATE: 429,       // 请求过于频繁
  ERROR: 500,      // 服务内部错误
  AI_DOWN: 503,    // AI 服务暂时不可用（已降级）
};
const ok = (data = {}) => ({ code: 0, msg: 'ok', data });
const fail = (code, msg) => ({ code, msg, data: null });
// 业务异常：throw 后由入口统一 catch 转响应
function bizErr(code, msg) {
  const e = new Error(msg);
  e.biz = { code, msg };
  throw e;
}
module.exports = { CODES, ok, fail, bizErr };
```

### ③ 鉴权与角色校验（wxContext.OPENID + users.role）

```js
// cloudfunctions/shared/auth.js
const { bizErr, CODES } = require('./response');
const { db } = require('./db');

let cloud = null;
try { cloud = require('wx-server-sdk'); } catch (e) { /* 本地 mock 模式无 wx-server-sdk */ }
if (cloud) cloud.init({ env: process.env.TCB_ENV });

// 云环境取不可伪造的 OPENID；mock 模式取注入的测试 openid
const getOpenId = () =>
  cloud ? cloud.getWXContext().OPENID : (globalThis.__MOCK_OPENID__ || '');

async function getUser(openid) {
  if (!openid) bizErr(CODES.AUTH, '登录态失效，请重新进入小程序');
  const res = await db.collection('users').where({ _openid: openid }).limit(1).get();
  return res.data[0] || null;
}

const requireUser = async (openid) => {
  const user = await getUser(openid);
  if (!user) bizErr(CODES.AUTH, '用户不存在，请重新登录');
  return user;
};

// 物业/管理员校验：写操作前必须调用
const requireStaff = async (openid) => {
  const user = await requireUser(openid);
  if (!['property', 'admin'].includes(user.role)) bizErr(CODES.FORBIDDEN, '无权限执行此操作');
  return user;
};

module.exports = { getOpenId, getUser, requireUser, requireStaff };
```

### ④ 云数据库 CRUD 范式（含分页、状态机完整示例）

```js
// cloudfunctions/workorder/index.js（片段）
const { db } = require('../shared/db');
const { bizErr, CODES } = require('../shared/response');
const { isoNow } = require('../shared/time');

// ① 分页列表：page 从 1 起；pageSize 默认 10 上限 50；get 与 count 并行
async function listPage(where, page, pageSize) {
  page = Math.max(1, Number(page) || 1);
  pageSize = Math.min(50, Math.max(1, Number(pageSize) || 10));
  const coll = db.collection('workorders');
  const [res, cnt] = await Promise.all([
    coll.where(where).orderBy('createdAt', 'desc').skip((page - 1) * pageSize).limit(pageSize).get(),
    coll.where(where).count(),
  ]);
  return { list: res.data, total: cnt.total };
}

// ② 详情 + 数据隔离：居民仅见本人，物业/管理员见全部
async function getVisibleWorkOrder(id, openid, role) {
  const res = await db.collection('workorders').doc(id).get().catch(() => ({ data: null }));
  const wo = res.data;
  if (!wo) bizErr(CODES.NOT_FOUND, '工单不存在');
  if (role === 'resident' && wo._openid !== openid) bizErr(CODES.FORBIDDEN, '无权查看该工单');
  return wo;
}

// ③ 状态机：pending→assigned→processing→done；closed/canceled 为终态
const FLOW = {
  pending: ['assigned', 'canceled', 'closed'],
  assigned: ['processing', 'canceled', 'closed'],
  processing: ['done', 'closed'],
  done: [], closed: [], canceled: [],
};
async function transition(wo, to, note, extra = {}) {
  if (!FLOW[wo.status].includes(to)) bizErr(CODES.PARAM, `状态流转不合法：${wo.status}→${to}`);
  await db.collection('workorders').doc(wo._id).update({
    data: { status: to, handleNote: note || wo.handleNote || '', updatedAt: isoNow(), ...extra },
  });
  return db.collection('workorders').doc(wo._id).get().then((r) => r.data);
}
```

### ⑤ msgSecCheck 内容安全接入

```js
// cloudfunctions/shared/security.js
const cloud = (() => { try { return require('wx-server-sdk'); } catch (e) { return null; } })();

/**
 * 用户提交文本先审后发。返回 { pass, reason }
 * - 云环境：openapi.security.msgSecCheck，suggest==='pass' 放行
 * - 本地 mock：命中测试违禁词「【违禁】」即拒绝（保证自测可覆盖拒绝路径）
 * - 接口异常：fail-open（放行）并记日志，第三方故障不阻断报修主流程
 */
async function checkText(openid, text) {
  if (!text) return { pass: true };
  if (!cloud) return { pass: !/【违禁】/.test(text), reason: 'mock' };
  try {
    const res = await cloud.openapi.security.msgSecCheck({
      version: 2, scene: 2, openid, content: String(text).slice(0, 2500),
    });
    const pass = !!(res && res.result && res.result.suggest === 'pass');
    return { pass, reason: pass ? '' : (res.result && res.result.label) };
  } catch (e) {
    console.warn('[security] msgSecCheck 调用失败，fail-open', e.message);
    return { pass: true, reason: 'api-error' };
  }
}
module.exports = { checkText };
```

### ⑥ 订阅消息发送（无模板 ID 降级）

```js
// cloudfunctions/shared/subscribe.js
const cloud = (() => { try { return require('wx-server-sdk'); } catch (e) { return null; } })();

/**
 * 工单完成通知报修人。
 * 环境变量 SUBSCRIBE_TEMPLATE_WORKORDER_DONE 未配置或发送失败 → 降级日志，绝不抛错阻断主流程。
 */
async function notifyWorkOrderDone(toOpenid, { title, statusText, id }) {
  const templateId = process.env.SUBSCRIBE_TEMPLATE_WORKORDER_DONE;
  if (!cloud || !templateId) {
    console.log(`[subscribe][degraded] 无模板 ID，仅记日志：to=${toOpenid} wo=${id} status=${statusText}`);
    return { sent: false, reason: 'no-template-id' };
  }
  try {
    await cloud.openapi.subscribeMessage.send({
      touser: toOpenid,
      templateId,
      page: `pages/repair/detail/index?id=${id}`,
      miniprogramState: 'formal',
      data: {
        thing1: { value: String(title).slice(0, 20) }, // 字段名以实际申请的模板为准
        phrase2: { value: statusText },
        time3: { value: new Date().toISOString() },
      },
    });
    return { sent: true };
  } catch (e) {
    console.error('[subscribe] 发送失败，降级日志', e.message);
    return { sent: false, reason: 'send-failed' };
  }
}
module.exports = { notifyWorkOrderDone };
```

### ⑦ DeepSeek 调用完整代码（请求体、Prompt 模板、8s 超时、失败降级话术、耗时日志）

```js
// cloudfunctions/shared/ai.js
const https = require('https');
const TIMEOUT_MS = 8000; // 契约：AI 超时 8s

/**
 * 调用 deepseek-chat。返回 { degraded, content }。
 * 无 Key / 超时 / 网络错误 / 非 200 → degraded=true，由调用方走兜底，本函数永不抛错。
 */
async function chat(messages, { temperature = 0.3, maxTokens = 800 } = {}) {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    console.log('[ai] 无 DEEPSEEK_API_KEY，直接降级');
    return { degraded: true, content: '' };
  }
  const startedAt = Date.now();
  const payload = JSON.stringify({
    model: 'deepseek-chat', messages, temperature, max_tokens: maxTokens, stream: false,
  });
  const result = await new Promise((resolve) => {
    const req = https.request(
      {
        host: 'api.deepseek.com', path: '/chat/completions', method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let buf = '';
        res.on('data', (c) => (buf += c));
        res.on('end', () => {
          try { resolve({ http: res.statusCode, json: JSON.parse(buf) }); }
          catch (e) { resolve({ http: res.statusCode, json: null }); }
        });
      },
    );
    req.setTimeout(TIMEOUT_MS, () => req.destroy(new Error('AI_TIMEOUT')));
    req.on('error', () => resolve({ http: 0, json: null }));
    req.write(payload);
    req.end();
  });
  const degraded = !(result.http === 200 && result.json && result.json.choices && result.json.choices[0]);
  console.log(`[ai] cost_ms=${Date.now() - startedAt} http=${result.http} degraded=${degraded}`);
  return degraded ? { degraded: true, content: '' } : { degraded: false, content: result.json.choices[0].message.content };
}

/**
 * RAG 问答 Prompt：知识库上下文 + 反幻觉纪律。
 * 无命中时明确引导拨打便民电话/提交报修，禁止编造流程。
 */
function buildRagPrompt(hits, question) {
  const context = hits.map((h, i) => `[${i + 1}] ${h.title}\n${h.answer}`).join('\n\n');
  return [
    {
      role: 'system',
      content: '你是社区便民小程序 AI 助手。回答必须基于知识库资料，不编造办事流程与电话；' +
        '知识库无法回答时明确说明，并引导用户拨打便民电话或提交报修工单；回答 200 字内，语气亲切。',
    },
    { role: 'user', content: `知识库资料：\n${context || '（无匹配资料）'}\n\n用户问题：${question}` },
  ];
}

module.exports = { chat, buildRagPrompt };
```

### ⑧ RAG 关键词检索实现

```js
// cloudfunctions/shared/kb/kb.js —— 零成本关键词检索（无 embedding）
const data = require('./data.json'); // [{ id, title, keywords: [], answer, sources: [] }]

const SUGGEST_QUESTIONS = [
  '家里水管漏水怎么报修？', '物业电话是多少？', '怎么办居住证？',
  '社区最近有什么活动？', '怎么交水电费？',
];
const FALLBACK_TEXT =
  '抱歉，我暂时无法回答这个问题。您可以：1）拨打物业服务中心电话；2）在小程序提交报修工单；3）前往社区党群服务中心现场咨询。';
const hotlineLines = () =>
  data.slice(0, 3).map((d) => `${d.title}：${d.answer.split('，')[0]}`).join('；');

// 命中 keyword 计 1 分，整句命中标题 +5 分，取 Top3 作为 RAG 上下文
function searchKB(question) {
  const q = String(question || '').trim();
  if (!q) return [];
  return data
    .map((item) => {
      let score = 0;
      for (const kw of item.keywords || []) {
        if (q.includes(kw) || kw.includes(q)) score += 1;
      }
      if (q.includes(item.title) || item.title.includes(q)) score += 5;
      return { item, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.item);
}

module.exports = { data, searchKB, SUGGEST_QUESTIONS, FALLBACK_TEXT, hotlineLines };
```

### ⑨ 种子数据脚本 scripts/seed.mjs 骨架

```js
// scripts/seed.mjs —— node scripts/seed.mjs
// 产出 scripts/seed-data.json：可经云开发控制台「数据库 → 导入」注入真环境，也被本地 mock 复用
import { writeFileSync } from 'node:fs';

const now = new Date().toISOString();
const users = [
  { _id: 'u-resident-1', _openid: 'mock-resident-1', nickName: '居民甲', role: 'resident', building: '3栋2单元', elderMode: false, createdAt: now, updatedAt: now },
  { _id: 'u-property-1', _openid: 'mock-property-1', nickName: '物业小王', role: 'property', createdAt: now, updatedAt: now },
  { _id: 'u-admin-1', _openid: 'mock-admin-1', nickName: '管理员', role: 'admin', createdAt: now, updatedAt: now },
];
const workorders = [
  { _id: 'wo-1', _openid: 'mock-resident-1', title: '厨房水管漏水', description: '厨房水槽下方水管接头漏水', category: 'water', images: [], status: 'pending', createdAt: now, updatedAt: now },
  { _id: 'wo-2', _openid: 'mock-resident-1', title: '楼道灯不亮', description: '3栋2单元楼道灯不亮，晚上出行不便', category: 'public', images: [], status: 'processing', assignee: 'mock-property-1', createdAt: now, updatedAt: now },
  { _id: 'wo-3', _openid: 'mock-resident-1', title: '门禁失灵', description: '单元门禁刷卡无反应', category: 'door', images: [], status: 'done', assignee: 'mock-property-1', createdAt: now, updatedAt: now },
];
const notices = [
  { _id: 'nt-1', title: '关于小区停水检修的通知', content: '本周六 9:00-17:00 停水检修，请提前储水。', type: 'notice', status: 'published', publishAt: now },
  { _id: 'nt-2', title: '燃气安全入户检查安排', content: '下周起逐栋入户检查燃气管道。', type: 'notice', status: 'published', publishAt: now },
  { _id: 'nt-3', title: '重阳节敬老活动报名', content: '10 月 25 日社区广场义诊+文艺汇演。', type: 'activity', status: 'published', publishAt: now, location: '社区广场', signupDeadline: '2026-10-20T00:00:00.000Z' },
  { _id: 'nt-4', title: '内部草稿（不应出现在列表）', content: '草稿内容', type: 'notice', status: 'draft', publishAt: now },
];
const phonebook = [
  { _id: 'pb-1', name: '物业服务中心', phone: '020-88888888', category: 'property', sort: 1, remark: '24 小时' },
  { _id: 'pb-2', name: '社区居委会', phone: '020-88886666', category: 'government', sort: 2 },
  { _id: 'pb-3', name: '社区卫生服务站', phone: '020-88885555', category: 'medical', sort: 3 },
  { _id: 'pb-4', name: '自来水供水热线', phone: '020-88884444', category: 'life', sort: 4 },
  { _id: 'pb-5', name: '供电服务热线', phone: '020-88883333', category: 'life', sort: 5 },
  { _id: 'pb-6', name: '燃气服务热线', phone: '020-88882222', category: 'life', sort: 6 },
  { _id: 'pb-7', name: '开锁服务', phone: '020-88881111', category: 'life', sort: 7, remark: '公安局备案' },
  { _id: 'pb-8', name: '急救中心', phone: '120', category: 'emergency', sort: 8 },
];

writeFileSync(
  new URL('./seed-data.json', import.meta.url),
  JSON.stringify({ users, workorders, notices, phonebook }, null, 2),
);
console.log(`已生成 seed-data.json：users=${users.length} workorders=${workorders.length} notices=${notices.length} phonebook=${phonebook.length}`);
```

### ⑩ 密钥管理与环境变量清单

| 环境变量 | 用途 | 示例 | 兜底 |
| --- | --- | --- | --- |
| `DEEPSEEK_API_KEY` | DeepSeek 调用鉴权 | `sk-xxxx` | 缺省 → qa 降级话术、AI 摘要用原文 |
| `TCB_ENV` | 云开发环境 ID | `community-0gabc` | 本地 mock 无需配置 |
| `PHONE_AES_KEY` | 手机号 AES-256 密钥（64 位 hex） | `openssl rand -hex 32` 生成 | 仅本地 mock 可用固定开发密钥，真环境必须配置 |
| `SUBSCRIBE_TEMPLATE_WORKORDER_DONE` | 工单完成订阅消息模板 ID | 后台申请后填入 | 缺省 → 日志降级 |

铁律：**以上变量只存在于云开发控制台"环境变量"或本地 shell，永不写入代码、永不进入 git。** 提交材料（演示视频/文档）出现 Key 视同事故。

---

## 8. 质量标准与验收清单

- [ ] 统一响应恒为 `{code, msg, data}`，无任何裸返回
- [ ] 错误码严格按契约表使用（0/400/401/403/404/429/500/503），不发明新码
- [ ] 分页：page 从 1 起、pageSize 默认 10 上限 50、返回 `{list, total}` 且 total 为过滤后总数
- [ ] 时间字段全部 ISO8601（`new Date().toISOString()`），无时间戳数字
- [ ] 居民角色访问他人工单返回 403，不存在资源返回 404，二者不混淆
- [ ] 写操作（handle）全部经 `requireStaff` 校验角色，缺省角色为 resident
- [ ] 手机号入库为 AES 密文，出参一律脱敏（138****1234）
- [ ] 工单创建接 msgSecCheck，拒绝时返回 400 且可展示文案
- [ ] AI 摘要失败不阻断工单创建，aiSummary 有原文兜底
- [ ] AI 调用超时 8s、失败不重试、日志含耗时（cost_ms）与 http 状态
- [ ] 无 `DEEPSEEK_API_KEY` 时 qa:ask 正常返回（degraded=true + 兜底话术/知识库原文）
- [ ] 订阅消息无模板 ID 时仅日志降级，接口仍返回成功
- [ ] 状态机：非法流转返回 400，done 触发订阅消息逻辑
- [ ] 全部代码在本地 mock 模式（无云环境）可跑通 `scripts/selftest.mjs`
- [ ] 无 `console.log` 直接打印手机号明文/Key；日志入参已脱敏
- [ ] 每个接口有对应自测用例（含异常路径），自测记录可复现
- [ ] 提交信息规范：`BE-x: <摘要>`，只提交 feature/backend
- [ ] 未改契约即未改入参/出参；改过则契约变更记录已登记

---

## 9. 交接协议

**向测试工程师交接什么**
1. `feature/backend` 分支名 + 目录结构说明（cloudfunctions/、scripts/）
2. 本地运行方法：`node scripts/selftest.mjs`（无云环境全量自测）、`node scripts/mock-server.mjs`（联调服务）
3. `docs/06-后端自测记录.md`：接口清单、每接口的入参/出参/错误码验证结论、已知降级点
4. 环境依赖清单：需要 Key/模板 ID 的接口及其降级行为

**自测记录格式（docs/06-后端自测记录.md 骨架）**
```
# 06-后端自测记录
## 1. 自测环境（Node 版本/运行模式 mock|云环境/Key 有无）
## 2. 接口清单与结论表
| 接口 | 成功路径 | 异常路径 | 错误码 | 结论 |
## 3. 关键场景验证（数据隔离/状态机/降级路径，附实际输出摘要）
## 4. 已知限制与降级点（评审演示注意事项）
## 5. 待联调确认项
```

**接口对照契约的验证方法**
1. 把契约每个接口拆成（入参合法/入参非法/越权/不存在/降级）至少 4 组用例
2. selftest 断言 `code`、`msg`、`data` 关键字段，与契约逐字对照
3. 每改一张卡重跑全量 selftest，输出"X 通过 / Y 失败 / Z 跳过"
4. 联调阶段以真实前端调用为准复核一遍，差异记入 `contracts/联调问题清单.md`

---

## 10. 协作与沟通规范

> 消息一律发给 target "lead"（或 lead 指定的对象），中文、摘要式、附文件路径，长内容写文件。

**开工汇报（收到激活后）**
```
【backend-engineer 开工】已读契约/任务卡并切 feature/backend。问卷已发，答案到位即按 BE-0→BE-8 推进。首卡 BE-0 预计完成后汇报。
```

**任务卡完成汇报**
```
【backend-engineer】BE-x 完成：<一句话摘要>。自测：<通过数>/<总数>。文件：cloudfunctions/xxx、<记录路径>。任务卡已勾选。下一卡：BE-y。
```

**求助（契约歧义/技术卡点）**
```
【backend-engineer 求助】<接口>在 <哪点> 与契约有歧义/卡住。我的理解：A=... B=...。请架构师裁决，未裁决前我暂不动该接口。
```

**契约变更请求**
```
【backend-engineer 变更请求】接口 <xxx> 需调整 <入参/出参/错误码>：原因 + 建议方案。请 lead 同意后我先更新 contracts/api-contract.md 并通知前端。
```

**阻塞上报**
```
【backend-engineer 阻塞】<阻塞点> 已持续 <时间>。影响：<哪些卡>。期望：<需要谁做什么>。降级方案：<我先做什么代替>。
```

纪律：只提交 `feature/backend`；共享文件（task-cards.md 勾选、联调问题清单）改动最小化，避免与前端分支冲突；任何与契约冲突的实现一律视为 bug 而非"特性"。

---

## 11. 与大赛评分对齐

| 评分维度（权重） | 后端动作 |
| --- | --- |
| 技术实现（25%） | TS/分层架构 + shared 复用 + selftest 自动化 + 契约驱动，代码结构是评审第一眼 |
| AI 融合（20%） | RAG 问答真实可用（知识库命中→模型生成→来源可溯）、AI 工单摘要、8s 超时降级链路完整——**重点展示降级设计** |
| 创新设计（20%） | 适老化场景由后端 elderMode 字段与语音问答链路支撑 |
| 场景落地（15%） | 状态机+订阅消息闭环=物业真实协作流程；种子数据用真实社区语义 |
| 体验增长（10%） | AI 失败也有兜底话术+电话，无 Key 演示不翻车 |
| 材料完整（10%） | docs/06-后端自测记录.md + 联调问题清单 + 环境说明齐全 |

答辩话术储备：能一句话讲清"契约→云函数→DB 适配→AI 降级"四层架构；能现场演示无 Key 降级路径。

---

## 12. 常见坑与经验教训

1. **密钥入库/进 git**：评审会查看提交材料，Key 明文 = 直接减分甚至取消资格；只走环境变量，提交前 `grep -r "sk-"` 自查
2. **云函数冷启动超时**：AI 调用叠加冷启动可能超过用户耐心；把 AI 超时设 8s 并保证降级路径 <100ms 返回
3. **数据库权限忘记配**：云数据库安全规则与代码层校验是双保险，别只靠前端隐藏按钮；residents 互看工单 = 隐私事故
4. **AI 幻觉**：无 RAG 上下文时模型编造办事流程/电话；Prompt 强制"知识库外不编造"+ 无命中直接兜底话术
5. **msgSecCheck 失败把业务搞挂**：第三方接口抖动时 fail-open + 日志，否则居民报修全被阻断
6. **订阅消息字段名拍脑袋**：thing1/phrase2 等字段必须与后台申请模板一致，否则发送失败且难排查；无模板 ID 先降级日志
7. **重试放大故障**：AI 超时后重试 = 云函数时长翻倍 + 双倍费用；契约约定"不重试、直接降级"
8. **mock 与真环境行为不一致**：mock 库要严格模拟云数据库 API 面（where/orderBy/skip/limit/count），否则"本地全绿、线上全红"
9. **并发写冲突**：同一工单 handle 与 cancel 并发时，用"读-校验-写"链路 + 状态机前置校验，最后写入以 status 为条件（doc.update 的 where 条件），避免覆盖
10. **时间格式不一致**：new Date() 直接入数据库会被序列化成不可预期格式；一律 `toISOString()`
11. **openid 当作昵称展示**：openid 是敏感标识，日志打码、接口出参不暴露给他人（居民互看数据已隔离）
12. **忘记降级日志**：降级不是静默失败，必须 `[degraded]` 日志留痕，联调时一眼定位"是没配 Key 还是真故障"

---

## 13. 完整示例（答卷片段 + 一个云函数完整代码 + curl 自测输出）

### 13.1 用户答卷片段（示范）

> A1：无环境 ID → 全程本地 mock；A2：Node 18；C1：DeepSeek deepseek-chat；C2：Key 尚未拿到 → 全部接口按无 Key 降级开发；C4：超时 8s；C5：不重试；C7：知识库由后端整理 ≥10 条；D2：订阅消息模板未申请 → 降级日志；E5：自测以本地 mock 全接口为准。
> 摘要确认结论：**按"无云环境 + 无 Key"的降级铁律开发，所有接口 mock 模式可跑，真环境仅需补环境变量。**

### 13.2 一个云函数完整代码（qa/index.js）

```js
// cloudfunctions/qa/index.js —— 资源=qa：action=ask|feedback|suggest
const { ok, fail, CODES } = require('../shared/response');
const { getOpenId } = require('../shared/auth');
const { db } = require('../shared/db');
const { searchKB, SUGGEST_QUESTIONS, FALLBACK_TEXT, hotlineLines } = require('../shared/kb/kb');
const { chat, buildRagPrompt } = require('../shared/ai');

exports.main = async (event = {}) => {
  const openid = getOpenId();
  try {
    switch (event.action) {
      case 'ask': return await ask(openid, event);
      case 'feedback': return await feedback(openid, event);
      case 'suggest': return ok({ questions: SUGGEST_QUESTIONS });
      default: return fail(CODES.PARAM, '未知 action');
    }
  } catch (e) {
    console.error('[qa] error', e);
    if (e && e.biz) return fail(e.biz.code, e.biz.msg);
    return fail(CODES.ERROR, '服务内部错误');
  }
};

// qa:ask —— 调用链：知识库检索 → DeepSeek（8s 超时）→ 分级降级
async function ask(openid, event) {
  const question = String(event.question || '').trim();
  if (!question) return fail(CODES.PARAM, '问题不能为空');
  if (question.length > 300) return fail(CODES.PARAM, '问题不超过 300 字');
  const hits = searchKB(question);
  const answerId = 'qa_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

  // 知识库命中 → 带上下文问模型（失败/无 Key 自动 degraded）
  const ai = await chat(buildRagPrompt(hits, question));
  if (!ai.degraded) {
    return ok({ answerId, answer: ai.content, sources: hits.map((h) => h.title), degraded: false });
  }
  if (hits.length > 0) {
    // 降级①：模型不可用 → 直接回知识库原文（仍有价值）
    return ok({ answerId, answer: hits[0].answer, sources: hits.map((h) => h.title), degraded: true });
  }
  // 降级②：无命中且模型不可用 → 兜底话术 + 便民电话
  return ok({ answerId, answer: FALLBACK_TEXT + '\n\n便民电话：' + hotlineLines(), sources: [], degraded: true });
}

// qa:feedback —— 有用/无用反馈落库
async function feedback(openid, event) {
  const { answerId, useful, question } = event;
  if (typeof answerId !== 'string' || !answerId) return fail(CODES.PARAM, 'answerId 必填');
  if (typeof useful !== 'boolean') return fail(CODES.PARAM, 'useful 必须为布尔值');
  await db.collection('qa_feedback').add({
    data: { _openid: openid, question: String(question || ''), answerId, useful, createdAt: new Date().toISOString() },
  });
  return ok({ ok: true });
}
```

### 13.3 curl 自测输出（本地 mock，无云环境、无 Key）

```bash
# 启动本地联调服务
node scripts/mock-server.mjs            # 监听 127.0.0.1:3000

# qa:ask —— 知识库命中 + 无 Key 降级路径
curl -s -X POST http://127.0.0.1:3000/callFunction \
  -H 'Content-Type: application/json' \
  -d '{"name":"qa","data":{"action":"ask","question":"家里水管漏水怎么报修？"},"openid":"mock-resident-1"}'

# → 输出（degraded=true：模型不可用，直接回知识库原文 + 来源）
{"code":0,"msg":"ok","data":{"answerId":"qa_1730000000000_ab12cd","answer":"水管漏水请先关闭入户总阀，再在小程序「我要报修」提交工单并拍照上传漏水位置，物业将在 30 分钟内响应；紧急情况可拨打物业 24 小时电话 020-88888888。","sources":["报修流程指南"],"degraded":true}}

# qa:ask —— 无命中降级路径
curl -s -X POST http://127.0.0.1:3000/callFunction \
  -H 'Content-Type: application/json' \
  -d '{"name":"qa","data":{"action":"ask","question":"今天天气怎么样？"},"openid":"mock-resident-1"}'
# → {"code":0,"msg":"ok","data":{"answerId":"qa_...","answer":"抱歉，我暂时无法回答这个问题。您可以：1）拨打物业服务中心电话；...","sources":[],"degraded":true}}
```

---

## 14. 完成前自检清单

- [ ] 已 `git switch feature/backend` 且工作区无他人文件混入
- [ ] 5 个资源分组（auth/workorder/notice/phonebook/qa）入口齐全，action 路由无遗漏
- [ ] 统一响应封装在所有接口使用，无裸 return
- [ ] 错误码对照契约表逐项核对（含 429 限流、503 AI 降级）
- [ ] 分页/ISO8601/图片 fileID 约定全部遵守
- [ ] 数据隔离与角色校验有对应自测用例并通过
- [ ] 手机号加密入库、出参脱敏，无明文日志
- [ ] msgSecCheck 接入且有拒绝路径测试
- [ ] AI 8s 超时、不重试、耗时日志、无 Key 降级全部验证
- [ ] 知识库 ≥10 条问答对，检索命中/未命中路径都可测
- [ ] 订阅消息降级日志路径验证过
- [ ] `node scripts/seed.mjs` 与 `node scripts/selftest.mjs` 均可一键跑通
- [ ] `docs/06-后端自测记录.md` 已产出且结论可复现
- [ ] `contracts/task-cards.md` 中 BE-0~BE-8 已勾选
- [ ] 无敏感信息进 git（`git grep -i "sk-"` 与 `git grep -i "secret"` 干净）
- [ ] 已向 lead 汇报：摘要 + 文件路径 + 自测通过率 + 待联调项
