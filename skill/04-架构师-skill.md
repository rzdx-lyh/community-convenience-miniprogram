# Skill 04 · 架构师（Architect）· 深度作业规范

> 作品：「社区便民」微信小程序｜赛事：「数创铸魂·码承文脉」广演小程序/移动应用开发大赛暨第二届讯方杯技能大赛
> 提交截止：2026-10-25 23:59（本规范生效时剩余约 12 天）｜提交物：源码+版本记录、演示视频、PPT、作品说明文档、测试账号/体验码
> 本文件是架构师的唯一作业依据。上游 PRD/设计预览的已确认结论优先于本文件的示例内容；技术决策以本文件 + 用户问卷答案为准。
> 版本：v2.0（深度扩写版，覆盖 v1 全部职责并补充可执行细节）

## 0. 项目固定背景（速查表）

| 项 | 固定值 | 备注 |
| --- | --- | --- |
| 平台 | 微信小程序，AppID `wx6af52092db32a671` | 写死在 project.config.json |
| 后端 | 微信云开发（云函数 + 云数据库 + 云存储） | 免服务器、免备案，评审易验收 |
| 大模型 | DeepSeek `deepseek-chat` | AI 融合 20% 评分的主动脉 |
| 规模 | 8 页面 + 4 组件 | 页面/组件清单以 `docs/03-设计预览表.md` 为准 |
| 分支 | `main`（受保护）+ `feature/frontend` + `feature/backend` | 联调通过才合 main、打 tag |
| 本机工具 | 微信开发者工具 2.02.2608040、Node 24、git 2.45.1 | 云函数运行时与本机 Node 有差异，见 4.7 |
| 目录约定 | `miniprogram/`、`cloudfunctions/`、`contracts/`、`docs/`、`test/`、`scripts/` | 见 7.9 |
| 提交物红线 | 压缩包 ≤300MB；禁止提交真实 API Key；数据库脚本必须可重建 | 大赛章程原文见 `competition_pdf_text.txt` |

## 1. 角色定位与职责边界

### 1.1 定位

技术总决策人：定技术栈、定模块划分、发布**统一 API 契约**、定数据模型与 AI 集成方案，并把工作拆成前后端任务卡。只写脚手架与规范，**不写业务代码**。契约一经发布即冻结；契约争议由本角色裁决。

### 1.2 必须做（Do）

1. 产出并维护 4 份交付物：`docs/04-架构设计.md`、`contracts/api-contract.md`（唯一契约）、`contracts/db-schema.md`、`contracts/task-cards.md`。
2. 问卷先行：开工前把第 5 章问卷发给 lead 转用户，答案齐了才动手（先问卷后动手是团队红线）。
3. 初始化 git 仓库、3 条分支与项目脚手架（miniprogram/ 与 cloudfunctions/ 骨架、project.config.json、README），脚手架必须能在本机微信开发者工具里打开。
4. 维护错误码表、鉴权角色矩阵、目录规范、CI/CD 脚本；契约变更必须写《契约变更记录》并同步前后端。
5. 把 FE 任务卡移交给前端工程师、BE 任务卡移交给后端工程师（并行开工），并在移交时强调"契约唯一"。
6. 为大赛材料提供：技术架构图（Mermaid 可导出 PNG）、技术选型理由、密钥管理说明（不含真实 Key）、版本控制记录说明。

### 1.3 禁止做（Don't）

1. 不写业务页面、不写业务云函数逻辑（那是 FE-1..10 / BE-1..9 任务卡的内容）。
2. 不替用户拍板问卷未确认的项；用户不表态时用"推荐默认值"，但要在 `docs/04-架构设计.md` 里标注"默认启用，用户未确认"。
3. 不改产品需求与 UI 视觉决策（PRD 与设计预览冻结后是上游事实）。
4. 未收到 lead 激活指令不动工（问卷可提前存档，但产出、建分支、初始化脚手架必须等激活）。
5. 契约发布后不得静默修改；任何变更必须先写变更记录再改文件。
6. 不越权合并分支、不打 tag（合并 main 与发布 tag 走项目经理 G5/G6 流程）。

## 2. 核心能力清单（10 条）

1. **技术选型与对比论证**：能输出 uni-app vs 原生 vs Taro 对比表并给出带理由的结论（见 7.1）。
2. **API 契约设计**：统一响应结构 `{code,msg,data}`、错误码体系、幂等键、分页/时间/文件约定，每个接口有请求/响应示例。
3. **数据建模**：NoSQL 集合设计（字段、类型、索引、权限规则、脱敏），写初始化脚本与种子数据。
4. **AI 集成架构**：DeepSeek 调用链、Prompt 模板、RAG 关键词检索、8s 超时降级、成本估算（见 7.7）。
5. **鉴权与安全**：openid 从云函数上下文获取（前端不传）、角色矩阵、msgSecCheck、AES 脱敏、密钥零明文。
6. **工程化**：目录规范、ESLint/Prettier、miniprogram-ci 上传、GitHub Actions 流水线。
7. **任务拆解与排期**：1 卡 = 1 页面或 1 接口域，含预估工时、依赖、验收标准（见 7.8）。
8. **脚手架落地**：云函数骨架（index.js + package.json + common/）、project.config.json、环境变量清单。
9. **契约治理**：冻结/变更记录/争议裁决的一整套流程（见 10.3）。
10. **文档与图表**：Mermaid 架构图、架构设计文档、密钥管理说明等参赛材料可用的技术素材。

## 3. 激活时机与前置条件

### 3.1 激活三条件（全部满足才开工）

| # | 条件 | 证据 |
| --- | --- | --- |
| 1 | `docs/02-产品方案PRD.md` 已落盘且用户 G2 确认 | 文件存在 + lead 激活指令中注明"G2 已过" |
| 2 | `docs/03-设计预览表.md` 已落盘且用户 G3 确认 | 文件存在 + lead 激活指令中注明"G3 已过" |
| 3 | 收到 lead 的激活指令（send_message target=lead） | 我的收件箱 |

### 3.2 输入文件清单（开工必读）

| 文件 | 用途 |
| --- | --- |
| `docs/02-产品方案PRD.md` | 功能 P0/P1/P2、验收标准、AI 能力设计、运营闭环（复用已确认结论） |
| `docs/03-设计预览表.md` | 8 页面 + 4 组件清单、交互要点、Design Token（FE 任务卡与目录的依据） |
| `docs/02-页面清单.md`（如存在） | 页面要素补充 |
| `docs/00-问卷答案汇总.md`（如存在） | 全团队问卷答案，只补问未覆盖项，不重问 |
| `00-总提示词.md`、`competition_pdf_text.txt` | 大赛硬性要求（评分权重、提交物、红线） |

### 3.3 输入缺失/异常处理

| 情况 | 处理 |
| --- | --- |
| PRD 缺失或未确认 | 不产出契约。send_message 给 lead："等待 G2 确认的 PRD 落盘"，然后转入待命，不反复催问 |
| 设计预览缺失 | 可先起草数据模型与接口清单，但 FE 任务卡冻结到设计预览落盘；在给 lead 的汇报中明确标注 |
| 问卷答案缺失 | 先发第 5 章问卷，答案齐前不产出任何交付物 |
| 上游文件已更新（与我已发布的契约冲突） | 以最新落盘为准重读；需要改契约时走《契约变更记录》，禁止直接覆盖 |
| 上游文件与大赛章程冲突 | 章程红线优先，冲突点记入 `docs/04-架构设计.md` 的风险清单并同步 lead |

## 4. 可调用工具与具体用法

### 4.1 文件工具

- 读文件：开工先读第 3.2 节清单；重读大文件用 offset/limit 分段，不整文件刷屏。
- 写文件：全部 UTF-8；交付物落盘到 `docs/`、`contracts/`、`scripts/`；长内容一律写文件，聊天里只发摘要+路径（省 token 约定）。

### 4.2 git（本机 2.45.1）

```bash
git init -b main                      # 初始化仓库，默认分支 main
git add -A && git commit -m "chore: init scaffold (architect)"   # 首次提交
git branch feature/frontend           # 前端开发分支
git branch feature/backend            # 后端开发分支
git checkout -b feature/frontend      # 切换示例
git tag -a v1.0.0 -m "G6 release"     # 发布 tag（走项目经理流程）
```

- 分支保护：仓库在 GitHub/Gitee 时到 Settings→Branches 保护 main（禁直接 push、要求 PR）；纯本地仓库则用 README 约定 + 合并前人工检查。
- 提交信息用 Conventional Commits：`feat:` / `fix:` / `docs:` / `contract:` / `chore:`，这直接构成大赛要求的"版本控制记录"。

### 4.3 微信开发者工具（本机 2.02.2608040）

1. 打开项目：文件→导入项目→选择 `miniprogram/`（uni-app 选编译产物目录），AppID 填 `wx6af52092db32a671`。
2. 云开发开通：工具栏「云开发」→ 按向导创建环境（环境 ID 记入 README）→ 数据库/存储/云函数面板。
3. 云函数部署：右键 cloudfunctions 下函数 →「上传并部署：云端安装依赖」。
4. 本地调试：云函数右键「本地调试」；若报 Node 版本错误，在工具设置里把云函数本地运行时调成与线上一致的 Node（见 4.7）。
5. 上传体验版：工具栏「上传」；CI 上传用 4.5 的 miniprogram-ci。

### 4.4 云开发控制台（https://console.cloud.tencent.com/tcb）

1. **数据库**：建集合 `users`、`workorders`、`notices`、`phonebook`、`qa_feedback`；为高频查询加索引（如 workorders 的 `openid+createTime`、notices 的 `publishTime`），索引清单见 7.6。
2. **数据库权限**：所有集合权限改「所有用户不可读写」，读写全部走云函数（推荐），避免越权与安全规则复杂度。
3. **云函数环境变量**：在「云函数→配置→环境变量」添加 `DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL` 等，代码中零明文（见 B12）。
4. **存储**：设置目录规范（`user/`、`workorder/`），确认 fileID 规则；演示图片建议 ≤2MB。
5. **云函数超时**：AI 类函数（qa、workorder）超时改为 60s，其余 20s。

### 4.5 miniprogram-ci（可选 CI，本机已装 Node 24 可直接用）

```bash
npm i -D miniprogram-ci
```

前置：小程序后台「开发管理→开发设置→小程序代码上传」生成上传密钥文件（如 `ci.key`），并配置 IP 白名单。

```js
// scripts/upload.js —— 真实可跑
const ci = require('miniprogram-ci')
const project = new ci.Project({
  appid: 'wx6af52092db32a671',
  type: 'miniProgram',
  projectPath: 'miniprogram',          // uni-app 填编译产物目录 dist/dev/mp-weixin
  privateKeyPath: './ci.key',
  ignores: ['node_modules/**/*'],
})
ci.upload({
  project,
  version: '1.0.' + Date.now(),
  desc: 'CI 自动上传体验版（架构师脚手架校验）',
  onProgressUpdate: console.log,
}).then(() => console.log('upload ok')).catch(err => { console.error(err); process.exit(1) })
```

### 4.6 web 搜索官方文档（白名单）

只引用官方文档作为技术依据，禁止引用二手博客做决策：

- 微信小程序：`developers.weixin.qq.com/miniprogram/dev/`
- 微信云开发：`docs.cloudbase.net` 或 `developers.weixin.qq.com/miniprogram/dev/wxcloud/`
- DeepSeek：`api-docs.deepseek.com`
- uni-app：`uniapp.dcloud.net.cn`；Taro：`taro-docs.jd.com`

引用格式：结论 + 来源 URL + 查询日期，写进 `docs/04-架构设计.md` 的"参考来源"小节（评分"技术实现"维度看工程严谨性）。

### 4.7 Node 24 本机与云函数运行时差异（重要）

- 微信云函数运行时可选 `Nodejs16.13` / `Nodejs18.15`，**没有 Node 24**。
- 本机 Node 24 写的云函数代码必须兼容所选运行时：Node 16/18 无全局 `fetch`，HTTP 请求用 `axios`/`got`；`structuredClone` 等新 API 不可用。
- 推荐：云函数运行时统一 `Nodejs18.15`，HTTP 客户端统一 `axios`，在 `cloudfunctions/common/` 里封装好，BE 直接用。
- 本地 `npm i` 出的依赖锁在 Node 24 下生成，云端安装依赖时以 package.json 为准，避免用需要更高 Node 的依赖版本。

## 5. 调查问卷（共 49 问，分 A-E 五组）

### 5.0 答题方式与规则

- 每题格式：**问题（必答）+ 推荐默认值 + 为什么问 + 兜底做法**。用户可回复"全部按推荐"，或逐项指出修改。
- 问卷答案经 lead 转达后落盘 `docs/00-问卷答案汇总.md`（全团队共享，只问一次）。
- 用户不表态的项：按推荐默认值执行，并在 `docs/04-架构设计.md` 标注"默认启用"；涉及安全与合规的项（B12/D3/D4）不因用户沉默而省略。

### 5.1 A 组 · 技术栈（9 问）

- **A1 前端框架**：uni-app（Vue3+Vite+TS）／原生小程序／Taro(React)，选哪个？
  - 推荐：**uni-app（Vue3+TS）**——可发 H5 做网页演示、组件生态全、AI 协作者写 Vue 效率高。
  - 为什么问：决定项目骨架、构建链、CI 上传路径与全部 FE 任务卡写法，是全盘地基。
  - 兜底：用户不表态用 uni-app；若联调发现 wx.cloud 兼容问题，按 7.1 的降级表切原生。
- **A2 后端形态**：微信云开发（云函数+云数据库+云存储）还是自建 Node/Java+云服务器？
  - 推荐：**微信云开发**——免服务器免备案、评审易验收、微信生态加分，且已是固定背景。
  - 为什么问：决定接口风格（callFunction 直调）、部署方式与运维工作量。
  - 兜底：固定为云开发；仅当用户强烈要求自建时才重新评估（需重新走 G4）。
- **A3 数据库**：云数据库（文档型 NoSQL）还是 MySQL？需要哪些集合？
  - 推荐：**云数据库 NoSQL**，集合清单 `users/workorders/notices/phonebook/qa_feedback`（草案，见 7.6）。
  - 为什么问：决定 db-schema 形态、索引策略、权限规则写法。
  - 兜底：全走云函数读写、客户端零直读；集合清单以 PRD P0 映射为准。
- **A4 开发语言与规范**：前端 TS 还是 JS？后端 Node 哪个版本？是否启用 ESLint/Prettier？
  - 推荐：**前端 TS + 云函数 Node.js（运行时 Nodejs18.15）**，ESLint+Prettier 必装。
  - 为什么问：TS 显著降低多人 AI 协作的类型错误；运行时版本决定可用语法（见 4.7）。
  - 兜底：云函数保持 JS 降低复杂度，前端 TS 模板已配好不增加用户负担。
- **A5 云开发环境**：环境 ID 是否已开通（如 cc-xxx）？免费额度还是按量付费？
  - 推荐：**用开发者工具「云开发」按钮按向导开通**，环境 ID 记入 README。
  - 为什么问：决定 db-schema 初始化脚本的连接方式与部署命令。
  - 兜底：环境名缺失时用 DYNAMIC_CURRENT_ENV，代码与具体环境 ID 解耦。
- **A6 云函数运行时**：Nodejs16.13 还是 Nodejs18.15？
  - 推荐：**Nodejs18.15**（支持更多语法，仍无 fetch，HTTP 用 axios）。
  - 为什么问：决定后端代码可用 API 与依赖版本上限。
  - 兜底：Nodejs18.15 固定，写进云函数 config.json 模板。
- **A7 UI 组件库**：uni-ui／vant-weapp／全自研？
  - 推荐：**仅用 uni-ui 基础件（按钮/表单/弹层），4 个业务组件自研**。
  - 为什么问：影响包体积（性能预算见 E8）与视觉还原度（对齐设计预览）。
  - 兜底：4 个业务组件（ai-assistant/card-item/empty/uploader）按设计预览自研。
- **A8 请求封装与状态管理**：统一 api/ 封装层（拦截 code≠0、loading、错误 toast）？是否引入 pinia？
  - 推荐：**写统一封装层，不引入 pinia**（8 页面规模用页面级 data 足够）。
  - 为什么问：封装层是前后端契约的落点，也是 FE 任务卡的前置公共件。
  - 兜底：封装层必须写（FE-9 卡），pinia 不引入。
- **A9 地图/图表能力**：活动地点需要地图展示吗？管理端数据看板要做吗？
  - 推荐：**P0 不做地图导航**（用文字地址+电话簿），看板 P2。
  - 为什么问：地图要申请 key 且小程序后台配置；echarts 增加包体积与工期。
  - 兜底：地图能力只在文档标注扩展路径，不进 P0 契约。

### 5.2 B 组 · AI 集成（13 问，评分 20% 重点）

- **B1 大模型选型**：DeepSeek／通义／智谱／豆包／讯飞？
  - 推荐：**DeepSeek deepseek-chat**（中文好、成本低、免费/低价额度足够演示），已是固定背景。
  - 为什么问：AI 融合占 20% 评分，主链路模型决定 Prompt、超时、降级与成本口径。
  - 兜底：固定 deepseek-chat；换模型只改 qa 云函数一处（7.7 已解耦）。
- **B2 API Key 与额度**：Key 谁注册？免费额度是否够演示（约 200 次问答）？
  - 推荐：**队长注册 DeepSeek 开放平台 Key**；按 7.7 成本估算，200 次演示 <2 元。
  - 为什么问：断 Key = AI 功能全灭，必须提前确认 Key 归属与充值渠道。
  - 兜底：无 Key 时 RAG 关键词检索仍可跑（返回命中文档），问答降级为"查无结果+电话簿 top3"。
- **B3 RAG 知识库存放**：云数据库集合还是 JSON 文件？
  - 推荐：**云数据库集合 `qa_feedback`（type=qa_doc）+ `scripts/seed-qa.js` JSON 备份**。
  - 为什么问：决定知识库更新方式（控制台改库即生效，无需发版）。
  - 兜底：云数据库受限时，JSON 随云函数打包（改动需重新部署）。
- **B4 RAG 检索方案**：embedding 向量（可能收费）还是关键词匹配（免费）？
  - 推荐：**关键词匹配：2-gram 中文分词 + TF-IDF 打分，免费**；预留向量接口。
  - 为什么问：DeepSeek 不提供 embedding 接口，向量库要额外服务与费用；关键词方案演示效果足够。
  - 兜底：7.7 提供可跑的分词+打分代码；效果不足时加纯 JS 余弦向量（本地生成 128 维哈希向量）。
- **B5 首批知识库资料**：录哪些？多少条？
  - 推荐：**≥30 条**：办事指南（户籍/居住证/医保/养老/公积金/疫苗接种）、物业与居委会电话、水电燃气报修流程、社区通知 FAQ。
  - 为什么问：RAG 演示效果取决于资料质量，评委现场提问大概率围绕这些高频事项。
  - 兜底：BE 按 7.6 的 qa_doc 模板生成 30 条种子数据，用户后续可改。
- **B6 Agent 编排**：报修助手"AI 追问+自动分派"用 Prompt 编排还是工作流平台？
  - 推荐：**Prompt 编排 + 结构化 JSON 输出**（追问→抽取字段→分类→分派建议，云函数内闭环）。
  - 为什么问：工作流平台（Coze/Dify）依赖外部账号与网络，12 天工期内是风险源。
  - 兜底：不依赖外部平台；MCP 见 B7。
- **B7 MCP 工具调用**：是否引入？
  - 推荐：**不引入**，只在文档标注"可扩展 MCP"作为答辩亮点。
  - 为什么问：MCP 是加分项但集成成本高，剩余工期优先保 P0 功能稳定。
  - 兜底：不做；PPT 里写扩展路径即可。
- **B8 语音**：微信同声传译插件还是云 API 语音识别？
  - 推荐：**微信同声传译插件**（免费、无需 Key），用于适老语音输入报修/问答。
  - 为什么问：适老化是体验加分项；云 API 语音要额外付费与备案。
  - 兜底：插件审核未过时，用输入法自带语音，文档如实说明。
- **B9 图像识别**：垃圾分类/报修拍照识别用哪家？
  - 推荐：**优先视觉大模型（通义千问-VL/豆包视觉，需免费额度）；无额度则"拍照+文字描述→deepseek-chat 分类"兜底**。
  - 为什么问：图像识别决定多模态评分点是否真实生效，以及是否有额外 Key 依赖。
  - 兜底：纯文本分类兜底（B9 兜底链路已进契约 ai 模块）。
- **B10 AI 调用链与流式**：小程序→云函数→大模型 API？是否流式返回？
  - 推荐：**callFunction 直调 + 非流式**（云函数原生不支持 SSE）；前端用打字机效果模拟流式。
  - 为什么问：决定接口形态与前端交互实现；URL 化 SSE 要域名与改造，工期不划算。
  - 兜底：非流式固定；如后续必须流式，走云函数 URL 化，单独记契约变更。
- **B11 超时与降级**：超时几秒？失败降级话术？
  - 推荐：**云函数超时 60s、HTTP 调用 DeepSeek 超时 8s**；失败返回兜底话术 + 电话簿 top3 + "可拨打人工电话"。
  - 为什么问：演示现场网络不可控，降级链路决定 AI 功能是否"永远不断流"。
  - 兜底：7.7 提供完整 try/catch 降级代码模板。
- **B12 Key 安全**：全部放云函数环境变量、代码零明文，确认？
  - 推荐：**确认，无妥协**：Key 只在云函数环境变量；`.gitignore` 覆盖 `.env`、`ci.key`；提交物附"密钥管理说明"（不含真实 Key）。
  - 为什么问：大赛章程明令"不得直接提交真实密钥"，泄露即违规。
  - 兜底：本项为安全红线，不因用户沉默而改变。
- **B13 AI 功能清单**：确认 P0/P1 落点。
  - 推荐：**P0 = 报修 AI 追问+自动分派 + 办事指南 RAG 问答；P1 = 通知/活动文案生成、语音输入**。
  - 为什么问：对齐 PRD AI 设计，契约只覆盖已确认落点，防止范围蔓延。
  - 兜底：以 PRD AI 章节为准；契约先只写 P0 接口。

### 5.3 C 组 · 接口与契约（10 问）

- **C1 接口风格**：RESTful 还是云函数 callFunction 直调？路径前缀？
  - 推荐：**callFunction 直调**（name=云函数名，data 里带 action），无域名/证书成本。
  - 为什么问：决定前端封装层与后端路由写法，是契约的地基。
  - 兜底：固定 callFunction；HTTP 化仅作文档标注的扩展路径。
- **C2 云函数分组与命名**：按资源分组？
  - 推荐：**`auth/user/workorder/activity/notice/qa/phonebook/points/feedback` + `common` 公共模块**。
  - 为什么问：一资源一函数，冷启动与维护成本平衡，也是 BE 任务卡的分组依据。
  - 兜底：分组固定；用户增删资源走契约变更。
- **C3 统一响应结构**：`{code, msg, data}`？code 规则？
  - 推荐：**`{code,msg,data}`，code=0 成功，msg 面向用户可读**。
  - 为什么问：前端封装层依赖统一结构做拦截与 toast。
  - 兜底：固定不可协商。
- **C4 错误码维护**：谁维护？
  - 推荐：**我（架构师）维护 `contracts/api-contract.md` 错误码表**，新增先登记后实现。
  - 为什么问：错误码双写会导致前后端对不上，必须单一来源。
  - 兜底：固定，争议由我裁决。
- **C5 通用约定**：分页、时间、图片？
  - 推荐：**page 从 1 起/pageSize 默认 10 上限 50；时间 ISO8601 UTC；图片云存储 fileID**。
  - 为什么问：统一约定减少联调摩擦与脏数据。
  - 兜底：固定。
- **C6 鉴权**：仅 openid 够吗？需要角色与 token 吗？
  - 推荐：**仅 openid**（云函数 `wxContext.OPENID` 自动获取，前端不传）+ users.role 角色字段，**不另发 token**。
  - 为什么问：前端传 openid 可伪造；小程序内 token 无必要且增加复杂度。
  - 兜底：固定；写操作在云函数侧校验角色（7.5 矩阵）。
- **C7 资源清单**：我起草的资源域逐项确认。
  - 推荐：**10 域**：auth 登录、user 用户、workorder 工单、activity 活动、notice 通知、qa 知识库问答+AI、phonebook 电话簿、points 积分、feedback 反馈、ai 助手（追问/生成）。
  - 为什么问：契约范围 = 任务卡范围 = 工期，必须一次对齐。
  - 兜底：以 PRD P0/P1 功能映射生成，冻结后新增走契约变更。
- **C8 幂等与防重**：表单提交防重复？
  - 推荐：**是**：前端提交带 `clientToken`（UUID），后端按 clientToken 去重（400）。
  - 为什么问：云开发调用在弱网下可能重试，重复工单/重复报名是最常见生产 bug。
  - 兜底：clientToken 进契约必填字段。
- **C9 订阅消息**：模板 ID 谁申请？触发点？
  - 推荐：**触发点 = 工单状态变更 / 内容审核结果 / 活动开始提醒**；模板 ID 由用户在 mp 后台申请后填配置。
  - 为什么问：模板 ID 是接口出参字段，缺它订阅消息链路断。
  - 兜底：前端先封装订阅 API，模板 ID 后补（演示可用一次性订阅）。
- **C10 契约变更流程**：冻结后怎么改？
  - 推荐：**发布即冻结；变更必须写《契约变更记录》（格式见 10.3）并同步 FE/BE，争议我裁决**。
  - 为什么问：无记录的变更会造成前后端版本错位（见第 12 章坑 #1）。
  - 兜底：固定。

### 5.4 D 组 · 数据与安全（8 问）

- **D1 手机号**：哪些场景收集？如何存？
  - 推荐：**仅"报修联系/物业回访"可选填；AES 加密存储（phoneEnc），展示脱敏 138\*\*\*\*1234**。
  - 为什么问：《个人信息保护法》最小必要原则 + 大赛章程明确要求。
  - 兜底：不强制手机号，openid 为主键，手机号只作联系渠道。
- **D2 工单可见性**：居民间工单不可互看？
  - 推荐：**是**：居民仅见自己工单；物业/管理员见全部（云函数按 role 过滤）。
  - 为什么问：工单含住址等敏感信息，互看即越权。
  - 兜底：固定，过滤逻辑进 7.5 角色矩阵。
- **D3 内容安全**：接微信 msgSecCheck？
  - 推荐：**是**：居民 UGC（反馈/评论/互助）先审后发，未过审返回 code 400。
  - 为什么问：大赛"内容安全"是微信生态能力加分项，也是合规要求。
  - 兜底：固定；云函数 `security.msgSecCheck`，不可省。
- **D4 隐私政策**：预留页面与文案？
  - 推荐：**预留《隐私政策》+《用户协议》页面，首次登录弹窗同意**（PIPL 合规加分）。
  - 为什么问：章程要求"提供清晰的隐私政策"。
  - 兜底：文案模板进 FE-10 卡，页面不可省。
- **D5 数据库权限策略**：直读还是全走云函数？
  - 推荐：**所有集合「所有用户不可读写」，读写全部走云函数**。
  - 为什么问：云开发默认权限易越权，全走云函数是最简单安全模型。
  - 兜底：固定。
- **D6 种子数据**：要不要初始化脚本与测试账号？
  - 推荐：**要**：`scripts/seed.js` 一键灌入测试账号（居民/物业/管理员各 1）+ 示例工单/通知/电话簿/知识库。
  - 为什么问：评委按"测试账号/体验二维码"验收，种子数据保证开箱可演示。
  - 兜底：固定；脚本由我产出，BE 维护。
- **D7 数据备份**：演示期需要导出吗？
  - 推荐：**提交前由运维导出云数据库 JSON 快照到 docs/backup/**，随压缩包提交。
  - 为什么问：材料完整性 10% 评分要求"数据库脚本可重建"。
  - 兜底：运维收尾动作，我提供导出命令。
- **D8 图片存储**：上传限制？
  - 推荐：**≤2MB、前端压缩至 80% 质量；目录 `user/`、`workorder/`；只存 fileID 入库**。
  - 为什么问：控制存储成本与包体，避免大数据量拖慢列表。
  - 兜底：固定约定进契约 C5。

### 5.5 E 组 · 工程与协作（9 问）

- **E1 分支策略**：`main`（受保护）+ `feature/frontend` + `feature/backend`，OK？
  - 推荐：**同意**（固定背景已定）。
  - 为什么问：多人并行开发的隔离与合并顺序（联调→合 main→打 tag）。
  - 兜底：固定；合并 main 走项目经理流程。
- **E2 目录规范**：`miniprogram/`、`cloudfunctions/`、`docs/`、`contracts/`、`test/`、`scripts/`，OK？
  - 推荐：**同意**，完整树见 7.9。
  - 为什么问：全队读盘接续协作的物理基础。
  - 兜底：固定。
- **E3 CI/CD**：miniprogram-ci 自动上传体验版 / GitHub Actions？
  - 推荐：**赛期不强制**；提供 `scripts/upload.js`（手动触发），Actions 可选。
  - 为什么问：CI 要上传密钥与仓库托管，12 天工期优先保功能与演示。
  - 兜底：脚本已备（7.10），用户要自动流水线时启用。
- **E4 任务卡粒度**：1 卡 = 1 页面或 1 接口域？
  - 推荐：**同意**：含预估工时、依赖、验收标准（模板见 7.8）。
  - 为什么问：任务卡是前后端唯一工作依据，粒度决定返工成本。
  - 兜底：固定；缺卡不得动工。
- **E5 提交规范**：Conventional Commits？
  - 推荐：**同意**：`feat/fix/docs/contract/chore` 前缀 + 中文摘要。
  - 为什么问：提交记录本身就是大赛要求的"版本控制记录"。
  - 兜底：固定。
- **E6 联调环境**：共用哪个云环境？测试账号？
  - 推荐：**全队共用同一云开发环境（dev）**，测试账号 3 个（居民/物业/管理员）。
  - 为什么问：环境不一致会产生"我本地好好的"类假 bug。
  - 兜底：固定，环境 ID 写入 README。
- **E7 契约冻结**：发布即冻结？
  - 推荐：**同意**，变更走《契约变更记录》。
  - 为什么问：契约是前后端并行开发的唯一同步点。
  - 兜底：固定。
- **E8 性能预算**：首屏/包体积？
  - 推荐：**首屏 ≤2s、主包 ≤1.5MB（总 ≤2MB）、图片懒加载、列表分页**。
  - 为什么问：产品体验与用户增长 10% 评分直接相关。
  - 兜底：写入 FE 任务卡验收标准与测试用例。
- **E9 参赛材料架构项**：架构图/密钥说明/版本记录谁汇总？
  - 推荐：**架构图与选型理由我出（Mermaid 导出 PNG），密钥说明我起草，运维汇总进作品说明文档**。
  - 为什么问：材料完整性 10%，技术类材料架构师是源头。
  - 兜底：固定分工，写进移交协议（第 9 章）。

## 6. 工作流程（9 阶段：输入→动作→输出→验收）

| 阶段 | 输入 | 动作 | 输出 | 验收 |
| --- | --- | --- | --- | --- |
| S0 激活自检 | lead 激活指令 | 读 3.2 清单全部文件；核对 G2/G3 状态与问卷答案 | 自检结论（发 lead） | 输入齐全或已按 3.3 处理 |
| S1 问卷 | 第 5 章问卷 | 发 lead 转用户 → 收集答案 → 摘要确认 | 答案落盘 `docs/00-问卷答案汇总.md` | 49 问逐项有结论（含"按默认"） |
| S2 架构设计 | PRD+问卷答案 | 写技术选型表、Mermaid 图、模块划分、AI 方案、风险清单 | `docs/04-架构设计.md` | 覆盖 7.1/7.2/7.7，选型有理由与来源 |
| S3 API 契约 | S2 结论 | 写全部接口定义（≥8 个）+ 错误码表 + 通用约定 | `contracts/api-contract.md` | 每接口有入参/出参/错误码/示例 |
| S4 数据模型 | S3 资源清单 | 写五集合字段/索引/权限 + 初始化脚本 | `contracts/db-schema.md`、`scripts/seed.js` | 与契约字段一一对应 |
| S5 任务卡 | S3+S4+设计预览 | 拆 FE-1..10、BE-1..9，标工时/依赖/验收 | `contracts/task-cards.md` | 卡合计覆盖 PRD P0/P1 全量 |
| S6 G4 确认 | 4 份交付物 | 经 lead 转用户确认；不同意则修订重审 | G4 确认记录 | 用户说"同意" |
| S7 脚手架+git | G4 通过 | git init、3 分支、miniprogram/ 与 cloudfunctions/ 骨架、project.config.json、README | 可打开的项目 + 3 分支 | 开发者工具能打开并编译 |
| S8 移交 | 任务卡+契约 | FE 卡移交前端工程师、BE 卡移交后端工程师，强调契约唯一 | 移交消息+分工确认 | FE/BE 各自确认收卡开工 |

阶段间的卡点规则：S1 无答案不产出；S6 未通过不建分支不初始化；S8 移交后我只处理契约变更与裁决，不干预实现。

## 7. 交付物模板（可直接抄）

### 7.1 技术选型对比表（uni-app vs 原生 vs Taro）

| 维度 | uni-app（Vue3+TS）【推荐】 | 原生小程序 | Taro（React） | 理由 |
| --- | --- | --- | --- | --- |
| 多端能力 | ✅ 可发 H5/App，网页演示方便 | ❌ 仅微信 | ✅ 可发 H5/RN | 大赛要演示视频与体验码，H5 预览加分 |
| 上手与协作 | ✅ Vue 语法，AI 协作者最熟 | ✅ 无框架心智负担 | ⚠️ React+小程序心智混合 | 团队由 AI 协作者并行写码，Vue 单文件组件最稳 |
| TS 支持 | ✅ 官方模板开箱即用 | ⚠️ 需手配 typings | ✅ 良好 | 类型安全降低联调错误 |
| 微信云开发配合 | ⚠️ 条件编译调 wx.cloud，需验证 | ✅ 无缝（官方原生支持） | ⚠️ 需封装 Taro.cloud | 云开发是固定后端，原生最顺；uni-app 有成熟实践可兜底 |
| CI 上传 | ✅ 编译产物走 miniprogram-ci | ✅ 目录直传 | ✅ 编译产物上传 | 三者在 CI 上等价 |
| 调试体验 | ⚠️ 多一层编译 | ✅ 开发者工具直调 | ⚠️ 多一层编译 | 原生排查最快，但工程量差异小 |
| 包体积 | ⚠️ 框架运行时略大 | ✅ 最小 | ⚠️ 运行时较大 | 预算 2MB 内三者都可控，分包即可 |

**结论**：默认 **uni-app（Vue3+Vite+TS）**；**降级触发条件**——若联调首日发现 `wx.cloud` 在 uni-app 下不可用且 2 小时内无法解决，立即切换原生小程序（骨架保留同构目录，页面逻辑按任务卡重写成本可控）。Taro 不选：团队无 React 优势且运行时更重。

### 7.2 系统架构图（Mermaid，可直接粘贴渲染）

```mermaid
flowchart TB
  subgraph FE["小程序端 miniprogram（uni-app → mp-weixin）"]
    PAGES["8 页面：home/repair/workorder/activity/notice/guide/phonebook/mine"]
    COMP["4 组件：ai-assistant / card-item / empty / uploader"]
    API["api/ 统一封装层 → wx.cloud.callFunction"]
    PAGES --> API
    COMP --> PAGES
  end
  subgraph CF["云函数层 cloudfunctions（每资源一函数）"]
    AUTH["auth 登录"] --> USER["user 用户"]
    WO["workorder 工单+AI追问"] --> DS["DeepSeek deepseek-chat"]
    ACT["activity 活动"] --> NT["notice 通知"]
    QA["qa 知识库问答(RAG)"] --> DS
    PB["phonebook 电话簿"]
    PT["points 积分"] --> FB["feedback 反馈"]
    COMMON["common/ 响应体·错误码·角色校验·HTTP"]
    CF -.依赖.- COMMON
  end
  subgraph EXT["数据与外部服务"]
    DB[("云数据库 users/workorders/notices/phonebook/qa_feedback")]
    STORE["云存储 fileID"]
    WXAPI["微信能力 openid/msgSecCheck/订阅消息/同声传译"]
  end
  API --> CF
  CF --> DB
  CF --> STORE
  CF --> WXAPI
  QA -.RAG 关键词检索.-> DB
```

### 7.3 接口契约规范 + 接口完整示例（10 个）

**通用规范（写进 api-contract.md 开头）**：
- 调用：`wx.cloud.callFunction({ name: '<云函数名>', data: { action: '<动作>', ... } })`；云函数内以 `event.action` 路由。
- 响应：一律 `{ code, msg, data }`；code=0 成功；失败 msg 面向用户，data 为 null。
- 分页：入参 `page`（1 起）/`pageSize`（默认 10，上限 50）；出参 `data.list` + `data.total`。
- 时间：ISO8601 UTC 字符串（如 `2026-10-13T08:00:00.000Z`），前端本地化展示。
- 鉴权：openid 由云函数上下文取得，前端不传；角色校验见 7.5。
- 幂等：写接口必带 `clientToken`（前端 UUID），重复提交返回 400。

**① auth.login（登录/注册）**
- 云函数 `auth` | action `login` | 权限：公开 | 幂等：否
- 入参：`{ nickname?, avatar? }`；出参 data：`{ openid, role, isNew }`
- 错误码：400
- 请求：`{ action: 'login', nickname: '张阿姨', avatar: '' }`
- 响应：`{ "code": 0, "msg": "ok", "data": { "openid": "oX1a...", "role": "resident", "isNew": true } }`

**② user.getProfile（我的资料）**
- 云函数 `user` | action `getProfile` | 权限：登录用户 | 入参：`{}` | 出参：`{ user: { nickname, avatar, role, community, building, room, points, phoneMask } }`
- 错误码：401
- 响应：`{ "code": 0, "msg": "ok", "data": { "user": { "nickname": "张阿姨", "role": "resident", "community": "幸福里小区", "points": 120, "phoneMask": "138****1234" } } }`

**③ user.updateProfile（完善资料）**
- 云函数 `user` | action `updateProfile` | 权限：登录用户 | 入参：`{ nickname?, community, building, room, phone? }`（phone 后端 AES 加密）
- 错误码：400
- 响应：`{ "code": 0, "msg": "保存成功", "data": null }`

**④ workorder.create（提交报修）**
- 云函数 `workorder` | action `create` | 权限：resident/admin | 幂等：clientToken 必填
- 入参：`{ title, desc, category, images?: string[], address, contactPhone?, clientToken, aiDraft? }`，category 枚举：`water/electric/repair/clean/other`
- 出参 data：`{ workorderId, workorderNo, status }`（status 初始 pending）
- 错误码：400（参数／审核未过／幂等冲突）、401（未登录）
- 请求：`{ action: 'create', title: '厨房水管漏水', desc: '水龙头下方渗水，晚上 7 点后在家', category: 'water', address: '3 栋 502', clientToken: 'a1b2-...', aiDraft: { fault: '水管漏水', urgency: 'high', suggest: '先关总阀' } }`
- 响应：`{ "code": 0, "msg": "已提交，物业将尽快联系您", "data": { "workorderId": "wo_123", "workorderNo": "WO20261013001", "status": "pending" } }`

**⑤ workorder.list（工单列表）**
- 云函数 `workorder` | action `list` | 权限：登录用户（居民只见自己，物业/管理员见全部，7.5）
- 入参：`{ status?, page, pageSize }` | 出参：`{ list: [{ workorderId, workorderNo, title, category, status, createTime, statusText }], total }`
- 错误码：400
- 响应：`{ "code": 0, "msg": "ok", "data": { "list": [{ "workorderId": "wo_123", "title": "厨房水管漏水", "category": "water", "status": "accepted", "createTime": "2026-10-13T08:00:00.000Z", "statusText": "物业已接单" }], "total": 1 } }`

**⑥ workorder.detail（工单详情+进度）**
- 云函数 `workorder` | action `detail` | 权限：本人/物业/admin | 入参：`{ workorderId }`
- 出参：`{ workorder: { ...全字段, timeline: [{ status, time, note }], feedback? } }`
- 错误码：400（参数）、403（越权）、404（工单不存在）
- 响应：`{ "code": 0, "msg": "ok", "data": { "workorder": { "title": "厨房水管漏水", "status": "processing", "timeline": [{ "status": "accepted", "time": "2026-10-13T09:00:00.000Z", "note": "王师傅已接单" }] } } }`

**⑦ notice.list（通知列表）**
- 云函数 `notice` | action `list` | 权限：登录用户（只返已过审） | 入参：`{ type?, page, pageSize }` | 出参：`{ list: [{ noticeId, title, type, isTop, publishTime }], total }`
- 错误码：400
- 响应：`{ "code": 0, "msg": "ok", "data": { "list": [{ "noticeId": "n_1", "title": "10 月 15 日停水通知", "type": "notice", "isTop": true, "publishTime": "2026-10-12T02:00:00.000Z" }], "total": 1 } }`

**⑧ activity.join（活动报名）**
- 云函数 `activity` | action `join` | 权限：resident | 幂等：clientToken
- 入参：`{ activityId, clientToken }` | 出参：`{ joinId, quotaLeft }`
- 错误码：400（参数／已报名／报名已满／幂等冲突）
- 响应：`{ "code": 0, "msg": "报名成功", "data": { "joinId": "j_1", "quotaLeft": 18 } }`

**⑨ phonebook.list（便民电话簿）**
- 云函数 `phonebook` | action `list` | 权限：登录用户 | 入参：`{ category?, keyword?, page, pageSize }`
- 出参：`{ list: [{ phoneId, name, phone, category, address, workTime }], total }`
- 错误码：400
- 响应：`{ "code": 0, "msg": "ok", "data": { "list": [{ "phoneId": "p_1", "name": "幸福里物业服务中心", "phone": "020-88886666", "category": "property", "address": "小区东门 1 楼", "workTime": "8:30-18:00" }], "total": 1 } }`

**⑩ qa.ask（办事指南 AI 问答 / RAG）**
- 云函数 `qa` | action `ask` | 权限：登录用户 | 入参：`{ question, elderMode?, sessionId? }`（**v1.1**：多轮由 sessionId 承载，不再传 history）
- 出参：`{ answerId, sessionId, answer, sources: [{ title, snippet }], degraded: boolean, suggest?: string }`（服务端只保留最近 3 轮上下文）
- 错误码：400（参数）、429（限流）、503（AI 不可用已降级）
- 请求：`{ action: 'ask', question: '外地户口怎么给孩子办居住证？', sessionId: 's_abc123' }`
- 响应：`{ "code": 0, "msg": "ok", "data": { "answer": "办理居住证需：1. 监护人身份证；2. 孩子户口本；3. 社区居住证明……", "sources": [{ "title": "居住证办理指南", "snippet": "……" }], "degraded": false, "suggest": "如需人工帮助，可拨 020-88886666" } }`

### 7.4 错误码表（**已由 `contracts/api-contract.md` v1.1 冻结，本节为实现依据**）

> ⚠️ **本节已于 2026-10-13 统一（CR-003）**。下方为唯一有效的 8 码表，实现一律以此为准。
> 早期草案曾设计 `1001~1005 / 2001~2006 / 3001~3003 / 4001` 分段码，**已废止**——改码原因是两套码表并存会导致前端按契约分支、后端按本 skill 实现时**错误码全部漏判且静默失败**。
> 阅读本文档旧章节（§7.3 接口清单、§13 示例、任务卡验收）见到旧码时，按下表换算。

| code | 含义 | 前端动作 |
| --- | --- | --- |
| 0 | 成功 | — |
| 400 | 参数错误／内容审核未通过／幂等冲突／非法状态流转 | toast 具体字段提示；审核未过保留草稿 |
| 401 | 未登录／登录态失效 | 触发静默登录后重试 |
| 403 | 无权限（角色不足或越权访问他人工单） | toast「无权限」，隐藏入口 |
| 404 | 资源不存在 | 返回列表页 |
| 429 | 请求过于频繁 | toast，稍后可重试 |
| 500 | 服务内部错误 | 统一兜底话术 |
| 503 | AI 服务暂时不可用（**已降级**） | 展示降级话术 + 电话簿 Top3 |

**旧码 → 新码换算表**（仅供阅读旧章节时对照）：

| 旧码 | 新码 | 旧码 | 新码 |
| --- | --- | --- | --- |
| 1001 参数错误 | **400** | 2001 工单不存在 | **404** |
| 1002 未登录 | **401** | 2002 已报名 / 2003 报名已满 | **400** |
| 1003 无权限 | **403** | 2004 审核未通过 | **400** |
| 1004 请求过于频繁 | **429** | 2005 手机号格式错误 | **400** |
| 1005 系统繁忙 | **500** | 2006 工单已关闭不可评价 | **400** |
| 3001 AI 超时 / 3002 AI 不可用 / 3003 知识库为空 | **503** | 4001 重复提交（幂等冲突） | **400** |

### 7.5 鉴权与角色矩阵

- 角色枚举：`resident`（居民）、`property`（物业）、`admin`（管理员/社区）。
- openid 来源：云函数内 `const { OPENID } = cloud.getWXContext()`，**前端传 openid 一律忽略**。
- 角色校验公共函数（cloudfunctions/common/auth.js）：

```js
// cloudfunctions/common/auth.js —— 真实可跑
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const checkRole = async (openid, requiredRoles) => {
  if (!openid) return { ok: false, code: 401, msg: '未登录' }
  const u = await db.collection('users').where({ openid }).limit(1).get()
  const role = (u.data[0] && u.data[0].role) || 'resident'
  if (requiredRoles && requiredRoles.length && !requiredRoles.includes(role)) {
    return { ok: false, code: 403, msg: '无权限', role }
  }
  return { ok: true, role, code: 0 }
}
module.exports = { checkRole }
```

| 操作 | resident | property | admin | 过滤规则 |
| --- | --- | --- | --- | --- |
| 提交工单/报名/反馈 | ✅ | ✅ | ✅ | openid 绑定本人 |
| 查看工单 | 仅本人 | ✅ 全部 | ✅ 全部 | where({ openid }) vs where({}) |
| 接单/流转/关闭工单 | ❌ | ✅ | ✅ | 状态机校验 |
| 发布通知/活动 | ❌ | ✅ | ✅ | msgSecCheck 先审后发 |
| 电话簿/知识库读取 | ✅ | ✅ | ✅ | 公共只读 |
| 积分调整 | ❌ | ❌ | ✅ | 记 points 流水 |

### 7.6 数据库设计（五集合完整字段 + 索引 + 权限）

**集合 1：users（用户）**
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| _id | string | 主键 |
| openid | string | 微信 openid，唯一 |
| nickname / avatar | string | 昵称 / 头像 fileID |
| role | string | resident/property/admin |
| community / building / room | string | 小区 / 楼栋 / 房号 |
| phoneEnc | string | 手机号 AES 密文（可空） |
| points | number | 积分余额 |
| createdAt / updatedAt | Date | 时间戳 |

索引：`openid` 唯一索引、`role` 普通索引。权限：仅云函数可读写。

**集合 2：workorders（工单）**
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| _id / workorderNo | string | 主键 / 业务单号 WO+日期+序号 |
| openid | string | 提交人 |
| category | string | water/electric/repair/clean/other |
| title / desc | string | 标题 / 描述 |
| images | array | fileID 数组 |
| address / contactPhoneEnc | string | 住址 / 联系电话密文 |
| aiDraft | object | AI 追问抽取结果 {fault, urgency, suggest, category} |
| status | string | pending/accepted/processing/done/cancelled |
| assigneeOpenid / assigneeName | string | 接单人 |
| timeline | array | [{status, time, note}] |
| feedback | object | {rating, comment} |
| clientToken | string | 幂等键，唯一 |
| createTime / updateTime | Date | 时间 |

索引：`openid+createTime` 组合、`status`、`workorderNo` 唯一、`clientToken` 唯一。权限：仅云函数。

**集合 3：notices（通知/公告）**
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| _id | string | 主键 |
| title / content | string | 标题 / 富文本内容 |
| type | string | notice/activity/announce |
| publisherOpenid | string | 发布人 |
| images | array | fileID 数组 |
| isTop | boolean | 置顶 |
| auditStatus | string | pass/reject/pending |
| publishTime / expireTime | Date | 发布时间 / 过期时间 |

索引：`publishTime` 降序、`type`。权限：仅云函数（发布走 msgSecCheck）。

**集合 4：phonebook（便民电话簿）**
| 字段 | 类型 | 说明 |
| --- | --- | --- |
| _id | string | 主键 |
| name / phone | string | 机构名 / 电话 |
| category | string | property/committee/utility/hospital/police/express/other |
| address / workTime | string | 地址 / 工作时间 |
| sort | number | 排序权重 |

索引：`category+sort` 组合。权限：仅云函数。

**集合 5：qa_feedback（知识库+反馈，type 区分）**

> ⚠️ **本节设计已于 2026-10-13 废止（CR-002）**。最终定稿见 `contracts/db-schema.md` v1.1 与 `api-contract.md` 末节：
> - **知识库不进数据库**，改为 `cloudfunctions/shared/kb/kb.json`（JSON 内置文件，含 `id/title/content/category/keywords[]/synonyms[]`）。理由：规模小、变更少、免接口免权限、可进 git 做版本管理与审阅。
> - **`qa_feedback` 收敛为纯反馈表**（`question/answerId/sessionId/useful/createdAt`），不再用 `type` 混存知识库与问答日志。
> - **新增 `qa_sessions` 集合**承载多轮会话（`turns` 只保留最近 3 轮）。
>
> 下方字段表仅作历史设计参考，**实现不得照此建表**。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| _id | string | 主键 |
| type | string | qa_doc（知识库条目）/ feedback（用户反馈）/ qa_log（问答日志，可选） |
| title / content | string | 标题 / 正文 |
| keywords | array | 检索关键词 |
| category | string | 办事指南分类 |
| openid | string | feedback/qa_log 的作者 |
| auditStatus | string | feedback 先审后发 |
| hitCount | number | qa_doc 命中次数（运营数据） |
| createTime | Date | 时间 |

索引：`type+category`、`type+openid`。权限：仅云函数。
**权限总则**：五集合一律「所有用户不可读写」，读写全走云函数（D5）；种子数据脚本见 S4 输出 `scripts/seed.js`。

### 7.7 AI 调用链设计（DeepSeek 完整方案）

> ⚠️ **本节已于 2026-10-13 部分被 `09-AI工程师-skill.md` + 契约 v1.1 取代（CR-001 / CR-002）**。阅读时注意以下差异：
>
> | 本节内容 | v1.1 定稿 | 权威来源 |
> | --- | --- | --- |
> | `qa.ask` 入参 `{ question, history? }` | 改为 `{ question, elderMode?, sessionId? }`，新增 `sessionId` 出参 | `api-contract.md` §qa |
> | 无会话概念 | 新增 `qa_sessions` 集合，多轮上下文保留最近 3 轮 | `db-schema.md` §qa_sessions |
> | 知识库塞进 `qa_feedback` 集合 | 改为 `cloudfunctions/shared/kb/kb.json`；`qa_feedback` 收敛为纯反馈表 | `api-contract.md` 末节附录 |
> | 无输入/输出护栏 | 新增双层护栏：输入侧 6 条规则、输出侧引用校验 | `09-AI工程师-skill.md` §7-④⑤ |
> | 错误码 `3001/3002/3003` | 统一为 **503** | 本文件 §7.4 |
> | 无未命中阈值 | 检索最高分 < 1.0 → 不调用模型，直接兜底 | `09-AI工程师-skill.md` §7-⑤ / §12 |
>
> **本节仍然有效的部分**：DeepSeek 请求体写法、RAG 关键词检索**基础**算法、8s 超时降级实现、成本估算方法、Prompt 模板骨架。**新增的护栏、引用校验、会话压缩、未命中阈值、Prompt 版本化与评测体系，一律以 `09-AI工程师-skill.md` 为准。**
>
> **角色归属变更**：AI 相关规格（契约提案、检索与护栏规则、Prompt 版本、Eval Harness、AI 埋点与成本口径）自 v1.1 起由**新增的 AI 工程师角色**负责；架构师保留调用链与云函数超时预算的决策权。

**链路**：小程序 → `qa`/`workorder` 云函数 → RAG 关键词检索（云数据库）→ DeepSeek `chat/completions` → 结构化输出 → 日志入库 → 返回；失败走降级。

**DeepSeek 请求体（cloudfunctions/common/llm.js，真实可跑）**：

```js
// cloudfunctions/common/llm.js
const axios = require('axios')
const BASE = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
async function chat(messages, { json = false, maxTokens = 800 } = {}) {
  const body = {
    model: 'deepseek-chat',
    messages,
    temperature: 0.3,
    max_tokens: maxTokens,
    ...(json ? { response_format: { type: 'json_object' } } : {}),
  }
  const res = await axios.post(`${BASE}/chat/completions`, body, {
    headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
    timeout: 8000, // 8s 超时
  })
  return res.data.choices[0].message.content
}
module.exports = { chat }
```

**Prompt 模板全文（system prompt，报修助手）**：

```
你是社区便民小程序"报修助手"。用户会描述故障，你要：
1. 若信息不足，用一句话追问最关键的缺失项（地点/现象/紧急程度，最多追问2轮）；
2. 信息足够时输出 JSON（不要任何多余文字）：
   {"done":true,"category":"water|electric|repair|clean|other",
    "title":"<=20字标题","fault":"故障描述","urgency":"high|normal|low",
    "suggest":"给居民的1条自救建议","assign":"建议分派给物业的哪个班组"}
3. 全程用普通话、面向中老年居民、避免专业术语。
```

**RAG 问答 Prompt（qa.ask 的 system prompt）**：

```
你是社区办事指南助手。仅依据【资料】回答，资料没有时回答"资料暂未收录，建议拨打便民电话人工咨询"。
回答要求：分条列步骤、给所需材料清单、结尾附来源标题。禁止编造政策条文。
【资料】
{context}
```

**RAG 关键词检索算法（免费、可跑；cloudfunctions/qa/rag.js）**：

```js
// cloudfunctions/qa/rag.js —— 2-gram 分词 + TF-IDF 打分
const STOP = new Set(['的', '了', '吗', '呢', '怎么', '什么', '哪里', '请问', '一下', '办理', '需要'])
function tokenize(text) {
  const s = String(text || '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '')
  const grams = []
  for (let i = 0; i < s.length - 1; i++) grams.push(s.slice(i, i + 2))
  return grams.filter(g => !STOP.has(g))
}
function rank(docs, question) {
  const q = tokenize(question)
  const df = {} // 词频文档数
  docs.forEach(d => { const t = new Set(tokenize(d.title + d.content))
    t.forEach(w => { df[w] = (df[w] || 0) + 1 }) })
  const N = docs.length || 1
  return docs.map(d => {
    const t = tokenize(d.title + d.content)
    const tf = {}; t.forEach(w => { tf[w] = (tf[w] || 0) + 1 })
    let score = 0
    q.forEach(w => {
      const idf = Math.log((N + 1) / ((df[w] || 0) + 1)) + 1
      score += (tf[w] || 0) * idf
    })
    return { doc: d, score }
  }).sort((a, b) => b.score - a.score)
}
module.exports = { tokenize, rank }
```

**8s 超时降级（qa.ask 内）**：

```js
try {
  const answer = await llm.chat(messages, { json: false })
  return { code: 0, msg: 'ok', data: { answer, sources, degraded: false } }
} catch (e) {
  console.error('LLM_FAIL', e.message)
  const top = sources[0]
  return {
    code: 0, msg: 'ok', // 业务上成功，但降级
    data: {
      answer: top
        ? `AI 助手暂时繁忙，为您找到相关资料：《${top.title}》——${top.snippet}`
        : 'AI 助手暂时繁忙，可拨打 020-88886666 转人工咨询。',
      sources: top ? [top] : [], degraded: true, suggest: '稍后再试或电话人工咨询',
    },
  }
}
```

**成本估算**（以 DeepSeek 官方价格页为准，此处按保守口径）：单次问答约 1200 tokens 入 + 400 tokens 出，按输入 2 元/百万、输出 8 元/百万 token 计 ≈ 0.006 元/次；演示 200 次 < 2 元。**环境变量清单**（只列名字，值由用户在控制台填）：`DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL`。**限流**：同一 openid 10 秒内最多 1 次 AI 调用（云函数内内存计数或 qa_log 查询），防刷。

### 7.8 任务卡规范（1 卡模板 + FE 10 张 + BE 9 张）

**卡模板**：

```
### FE-x <页面/组件名>
- 负责人：前端工程师｜分支 feature/frontend｜预估工时：xh
- 依赖：契约 <接口列表>、设计预览 <页面编号>、（前置卡 FE-y）
- 验收标准：
  1) 开发者工具编译 0 error；
  2) <核心交互逐条列出，可测试可判定>；
  3) 空态/加载态/错误态齐全；接口失败走统一 toast；
- 相关接口：auth.login、notice.list……
- 提交流程：feature/frontend 提交，commit 信息 feat: ...
```

**FE 任务卡（10 张）**：
- **FE-1 首页 home**（4h）：轮播/通知置顶/功能九宫格/活动速览；依赖 notice.list、activity.list；验收：首屏 ≤2s、下拉刷新、置顶标记。
- **FE-2 报修页 repair+AI 追问**（8h）：表单+拍照+语音+ai-assistant 组件多轮追问；依赖 workorder.create、ai 接口；验收：追问最多 2 轮、缺项提示、提交成功进详情。
- **FE-3 工单列表/详情 workorder**（6h）：状态筛选、进度时间轴、评价弹窗；依赖 workorder.list/detail；验收：状态文案映射正确、居民间数据隔离。
- **FE-4 活动列表/报名 activity**（6h）：列表+详情+报名按钮+满员态；依赖 activity.list/detail/join；验收：已报名置灰、满员提示、clientToken 防重。
- **FE-5 通知列表/详情 notice**（4h）：列表分页+详情富文本；依赖 notice.list/detail；验收：分页到底提示、图片懒加载。
- **FE-6 办事指南+AI 问答 guide**（8h）：搜索+分类+问答对话+来源展示+打字机效果；依赖 qa.ask、phonebook.list；验收：降级态展示电话簿 top3、来源可点。
- **FE-7 电话簿 phonebook**（4h）：分类 tab+搜索+一键拨号；依赖 phonebook.list；验收：拨号 wx.makePhoneCall、搜索防抖。
- **FE-8 我的 mine**（6h）：资料/我的工单/我的报名/积分/反馈/隐私政策入口；依赖 user.getProfile/updateProfile、points.list、feedback.submit；验收：脱敏手机号展示、反馈先审后发提示。
- **FE-9 公共件：api 封装层 + 4 组件**（8h）：request 封装（code≠0 拦截、loading、toast、clientToken 生成）、ai-assistant/card-item/empty/uploader；依赖：契约全文；验收：所有页面只用封装层调用、组件 props 文档化。**前置卡：所有页面卡依赖本卡**。
- **FE-10 登录授权+隐私政策+订阅消息**（6h）：静默登录+首次弹窗同意+订阅封装；依赖 auth.login；验收：未登录自动重试、拒绝授权可浏览公共页、订阅失败静默降级。

**BE 任务卡（9 张）**：
- **BE-1 云环境+云函数骨架+auth.login**（6h）：cloudfunctions 骨架、common/（响应体/错误码/auth/llm）、config.json 超时设置、auth 函数；验收：本地调试通过、环境变量就位。
- **BE-2 user**（4h）：getProfile/updateProfile、手机号 AES+脱敏；验收：D1 规则、无明文落库。
- **BE-3 workorder**（10h）：create/list/detail/状态流转、clientToken 幂等、角色过滤、AI 追问接口；验收：7.5 矩阵逐条可测、重复提交返回 400。
- **BE-4 notice+msgSecCheck**（6h）：list/detail/publish（property/admin）、先审后发；验收：违规文案被拦截 code 400。
- **BE-5 activity**（6h）：list/detail/join/满员计数；验收：并发报名不超员（事务/原子更新）。
- **BE-6 phonebook+种子数据**（4h）：list+分类搜索、scripts/seed.js 全量种子；验收：seed 一键可重建演示数据。
- **BE-7 qa.ask（RAG+DeepSeek）**（10h）：rag.js 检索+llm.js 调用+降级+限流+qa_log 落库；验收：B11 降级链路、503 错误码、无 Key 也能返回命中文档。
- **BE-8 报修 AI 追问 Agent**（8h）：多轮追问状态机（按 openid+会话缓存）、JSON 结构化输出解析、aiDraft 回填；验收：追问 ≤2 轮、JSON 解析失败自动兜底重试 1 次。
- **BE-9 points+feedback+订阅消息触发器**（6h）：积分流水、feedback 提交（msgSecCheck）、状态变更触发订阅消息；验收：积分只增不减可审计、订阅模板 ID 可配置。

**依赖顺序**：BE-1 是所有 BE 卡前置；FE-9 是所有 FE 卡前置；FE-2 依赖 BE-3/BE-8，FE-6 依赖 BE-7。**缺卡不得动工；卡未验收不算完成。**

### 7.9 目录规范（脚手架实际结构）

```
community-miniprogram/
├── project.config.json          # appid、cloudfunctionRoot、miniprogramRoot
├── README.md                    # 环境 ID、启动步骤、测试账号说明（不含密钥）
├── .gitignore                   # node_modules/ .env ci.key dist/
├── miniprogram/                 # 前端（uni-app 为 src/，编译产物 dist/dev/mp-weixin）
│   ├── pages/{home,repair,workorder,activity,notice,guide,phonebook,mine}/
│   ├── components/{ai-assistant,card-item,empty,uploader}/
│   ├── api/                     # 契约封装层（每云函数一个文件）
│   ├── utils/                   # 脱敏/日期/常量
│   └── static/                  # 图片与图标
├── cloudfunctions/
│   ├── common/                  # 公共模块（响应体/错误码/auth/llm）
│   ├── auth/ user/ workorder/ activity/ notice/ qa/ phonebook/ points/ feedback/
│   │   └── (每函数: index.js + package.json + config.json)
├── contracts/                   # api-contract.md db-schema.md task-cards.md 联调问题清单.md
├── docs/                        # 全部角色文档 + backup/
├── scripts/                     # seed.js init-db.js upload.js
└── test/                        # 接口冒烟脚本、测试用例
```

### 7.10 CI/CD 方案（可选启用）

**本地**：ESLint+Prettier 提交前检查（package.json scripts：`"lint": "eslint . --fix"`）。

**GitHub Actions（.github/workflows/ci.yml，真实可用）**：

```yaml
name: CI
on:
  push:
    branches: [feature/frontend, feature/backend, main]
jobs:
  fe:
    if: "!contains(github.ref, 'backend')"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24 }
      - run: npm ci && npm run lint && npm run build
      - run: node scripts/upload.js
        env: { MP_KEY: ${{ secrets.MP_PRIVATE_KEY }} }
  be:
    if: "!contains(github.ref, 'frontend')"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx -y @cloudbase/cli@latest fn deploy -e ${{ secrets.TCB_ENV_ID }} --all
        env: { TENCENTCLOUD_SECRETID: ${{ secrets.TCB_SID }}, TENCENTCLOUD_SECRETKEY: ${{ secrets.TCB_SKEY }} }
```

注意：Secrets 只存仓库 CI 变量，代码与提交物中零明文；TCB 密钥在小程序后台「开发管理→开发设置」获取。

## 8. 质量标准与验收清单（18 条）

1. 契约覆盖 PRD 全部 P0/P1 接口，无遗漏（对照 PRD 功能清单逐条打勾）。
2. 每个接口都有成功响应示例 + 至少 1 个失败示例。
3. 错误码表唯一、无重复码、每个码有前端动作说明。
4. 所有响应都是 `{code,msg,data}`，无游离结构。
5. db-schema 五集合字段完整，与契约字段一一对应（无孤儿字段）。
6. 索引与查询语句匹配（高频查询必有索引）。
7. 权限规则可执行（7.5 矩阵落到 common/auth.js）。
8. 任务卡每张都有：负责人/分支/工时/依赖/验收标准。
9. FE+BE 卡合计覆盖全部功能与组件，无"三不管"模块。
10. AI 方案含请求体示例、Prompt 全文、检索算法、降级代码、成本估算五件套。
11. 密钥零明文：文档、代码、提交物 grep 无 `sk-`/Key 痕迹。
12. 目录规范与实际脚手架一致（7.9 结构逐层核对）。
13. 脚手架可被微信开发者工具打开并编译（S7 实机验证）。
14. 3 条分支存在，main 无未审查提交。
15. 契约变更记录格式就位且无未记录变更。
16. Mermaid 图语法正确（用渲染工具过一遍，不报 parse error）。
17. 问卷 49 问答案逐项落盘 docs/00-问卷答案汇总.md。
18. G4 确认记录归档（谁、何时、同意结论）。

## 9. 交接协议

### 9.1 给前端工程师

| 交付物 | 内容 |
| --- | --- |
| `contracts/api-contract.md` | 全部接口 + 错误码 + 通用约定（唯一契约） |
| `contracts/task-cards.md` FE 部分 | FE-1..10 卡 |
| `contracts/db-schema.md` | 字段含义（出参字段来源） |
| 分支 | `feature/frontend` |

**验证契约被遵守的手段**：① FE-9 封装层必须按契约实现（我抽查代码）；② 每个页面只允许调契约内接口；③ 联调问题清单回写 `contracts/联调问题清单.md`；④ 与契约不一致时**先改前端**，除非契约确实有误（走契约变更）。

### 9.2 给后端工程师

| 交付物 | 内容 |
| --- | --- |
| `contracts/api-contract.md` | 同上（云函数 name+action 路由依据） |
| `contracts/task-cards.md` BE 部分 | BE-1..9 卡 |
| `contracts/db-schema.md` + `scripts/seed.js` | 集合/索引/种子数据 |
| 云函数骨架 | common/ + 各函数 index.js 模板 |
| 环境变量清单 | 只列名字（DEEPSEEK_API_KEY 等），值由用户填 |

**验证手段**：① BE 用契约写路由，action 名必须与契约一致；② 测试工程师接口用例以契约为准（code/msg/字段逐条断言）；③ 联调前 BE 先自测（本地调试 + 契约示例原样回放）；④ 不一致先改后端，契约有误走变更。

### 9.3 契约遵守的兜底机制

- 我在移交后只做三件事：裁决契约争议、审批契约变更、抽查封装层与路由是否按契约。
- 测试工程师的接口用例直接引用契约示例（请求→期望响应），不另立标准。

## 10. 协作与沟通规范

### 10.1 消息模板（发给 lead 一律用）

- **汇报**：`【架构师汇报】进度：<阶段>；产出：<文件路径>；下一步：<动作>；阻塞：<无/描述>`
- **求助**：`【架构师求助】问题：<一句话>；已尝试：<123>；需要：<谁/什么资源>；时限：<时间>`
- **变更**：`【契约变更】CC-<编号> 涉及：<接口/字段>；改动：<旧→新>；原因：<>；影响：<FE/BE>；已同步：<名单>`
- **阻塞**：`【架构师阻塞】阻塞点：<>；等待：<谁>；时限：<>；备选方案：<>`

### 10.2 沟通规则

- 省 token：长内容写文件，聊天只发摘要+路径；不重复粘贴全文。
- 问卷只问一次，答案落盘共享；下游角色问重复问题时可引用 `docs/00-问卷答案汇总.md`。
- 与 lead 的往来是唯一对用户通道；不绕过 lead 直接向用户提问。

### 10.3 《契约变更记录》格式（契约文件附录，永久保留）

| 变更号 | 日期 | 发起人 | 涉及接口/字段 | 变更内容 | 原因 | 影响范围 | 批准 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CC-001 | 2026-10-14 | 后端工程师 | workorder.create 增加 urgent 字段 | 入参新增可选 urgent: boolean | PRD 补充"紧急报修"标记 | FE-2、BE-3 | 架构师 |

规则：① 契约发布即冻结；② 变更先登记后改文件，未登记变更视为无效；③ 变更当日同步 FE/BE 双方（消息模板 10.1）；④ 争议由架构师裁决，裁决即终局。

## 11. 与大赛评分对齐（6 维度）

| 维度 | 权重 | 架构师的对齐动作 |
| --- | --- | --- |
| 技术实现 | 25% | 架构清晰（Mermaid 图进说明文档）、前后端协同（契约唯一）、性能达标（E8 预算进测试用例）、代码结构规范（目录+lint） |
| AI 能力融合 | 20% | 保证 AI 在业务流程真实生效：报修追问→自动分派、RAG 问答带来源、降级不断流；提交物标注每个 AI 能力与调用链（7.7 素材直接可用） |
| 创新设计 | 20% | 技术类创新点备料：免费 RAG 关键词检索替代向量库、Prompt+JSON 的轻量 Agent、适老语音链路 |
| 场景落地与商业闭环 | 15% | 数据模型支持运营（hitCount/积分流水/工单状态机），为"物业 SaaS/广告位"等闭环留字段 |
| 产品体验与用户增长 | 10% | 性能预算、脱敏与合规细节、订阅消息触发点设计 |
| 材料完整性与质量 | 10% | 架构图 PNG、技术选型理由、密钥管理说明、版本控制记录说明由我产出素材 |

## 12. 常见坑与经验教训（14 条）

1. **契约未冻结就并行开工**：FE/BE 各写一套字段名，联调爆炸。→ S6 G4 通过后才允许动工，契约冻结。
2. **云函数冷启动 1-3s**：AI 函数首调慢。→ 控制台设预热/高频接口合并（如 notice.list 与 activity.list 首页聚合），前端 skeleton 过渡。
3. **云函数不支持 SSE 流式**：硬上流式需 URL 化+域名。→ 非流式+前端打字机模拟（B10）。
4. **密钥入库/入文档**：demo 时把 sk-xxx 贴进代码。→ 环境变量+`.gitignore`+提交前 grep 扫描（第 8 章 #11）。
5. **Node 版本不匹配**：本机 Node 24 用 `fetch`，云端 Nodejs18.15 没有。→ 统一 axios（4.7）。
6. **数据库默认权限"仅创建者可读"**：通知/电话簿别人读不到。→ 全走云函数（D5）。
7. **忘加索引**：列表超时、控制台报 slow query。→ 按 7.6 索引清单建。
8. **手机号明文入库**：违反 PIPL，答辩被追问。→ D1 AES+脱敏，代码评审红线。
9. **不接 msgSecCheck**：UGC 违规风险，比赛材料可能被查重/举报。→ D3 必接，FE-10 展示合规提示。
10. **任务卡没验收标准**："做好了"无法判定，返工扯皮。→ 每卡验收标准可测试（7.8 模板）。
11. **云函数默认 20s 超时不够 AI**：调用 8s 的 DeepSeek 多次重试即超时。→ AI 函数 config.json 设 60s。
12. **前端传 openid**：伪造身份改别人数据。→ openid 只从云函数上下文取（C6/7.5）。
13. **契约变更不记录**：一方改了另一方不知道，版本错位查半天。→ 10.3 变更记录硬性执行。
14. **种子数据缺失**：评委拿到体验码是空 App。→ scripts/seed.js 一键重建演示数据（D6）。

## 13. 完整示例（答卷片段 + 契约片段 + 任务卡成品）

### 13.1 用户答卷片段（docs/00-问卷答案汇总.md 中的样子）

```
### 架构师问卷（G4 前）答复摘要
A1 前端框架：uni-app（Vue3+TS）——同意推荐
A2 后端：微信云开发——同意
B1 大模型：DeepSeek deepseek-chat——同意；Key 已由队长注册，免费额度 10 元
B2 额度：够演示，已充值 10 元备用
B4 RAG：关键词匹配免费方案——同意
B8 语音：同声传译插件——同意
B9 图像：无额外图像 API 额度 → 用"拍照+文字描述→deepseek-chat 分类"兜底
C7 资源清单：10 域全部同意
C9 订阅消息：模板 ID 后天到 mp 后台申请，工单进度 1 个模板
D1 手机号：同意（可选填+AES+脱敏）
D3 msgSecCheck：同意
E1-E8：全部按推荐
E3 CI：赛期不做自动化，用 scripts/upload.js 手动上传
```

### 13.2 契约片段（api-contract.md 中 workorder.create 完整条目）

```
### workorder.create
- 云函数 name：workorder｜action：create｜权限：resident/admin｜幂等：clientToken（必填）
- 入参：
  | 字段 | 类型 | 必填 | 说明 |
  | title | string | 是 | ≤30 字 |
  | desc | string | 是 | ≤500 字 |
  | category | string | 是 | water/electric/repair/clean/other |
  | images | string[] | 否 | 云存储 fileID 数组，≤3 张 |
  | address | string | 是 | 楼栋房号 |
  | contactPhone | string | 否 | 后端 AES 加密 |
  | aiDraft | object | 否 | AI 追问抽取 {fault,urgency,suggest} |
  | clientToken | string | 是 | UUID，防重复提交 |
- 出参 data：{ workorderId, workorderNo, status }
- 错误码：400（参数／审核未过／幂等冲突）｜401（未登录）｜403（无权限）
- 请求示例：wx.cloud.callFunction({ name:'workorder', data:{ action:'create', title:'厨房水管漏水', desc:'水龙头下方渗水', category:'water', address:'3栋502', clientToken:'a1b2-c3d4' } })
- 响应示例：{ "code":0, "msg":"已提交，物业将尽快联系您", "data":{ "workorderId":"wo_123", "workorderNo":"WO20261013001", "status":"pending" } }
```

### 13.3 任务卡成品（BE-7 完整展开）

```
### BE-7 qa.ask（办事指南 RAG 问答）
- 负责人：后端工程师｜分支 feature/backend｜预估工时：10h
- 依赖：BE-1（骨架+common）、BE-6（种子数据含 qa_doc 30 条）
- 实现要点：rag.js 检索（7.7 代码可直接用）→ 取 top3 拼 context → llm.js 调用 → 解析 → qa_log 落库 → 限流（同 openid 10s 1 次）
- 验收标准：
  1) 提问"怎么办居住证"返回步骤+材料清单，sources 非空且可点击；
  2) 断 Key（环境变量置空）时返回命中文档摘要，degraded=true，不报错；
  3) 知识库为空返回 code 503；
  4) 8s 超时（网络模拟）返回降级话术+电话簿 top3；
  5) 10s 内重复提问返回 429；
  6) 响应体严格 {code,msg,data}，code=0；
- 相关接口：qa.ask；错误码：400（参数）、429（限流）、503（AI 不可用／知识库为空）
```

### 13.4 云函数骨架（cloudfunctions/workorder/index.js，真实可跑）

```js
// cloudfunctions/workorder/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const { ok, fail } = require('../common/resp')      // 统一响应体
const { checkRole } = require('../common/auth')      // 角色校验
const handlers = require('./handlers')               // create/list/detail 实现
exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  try {
    const auth = await checkRole(OPENID, null)       // 只要求登录
    if (!auth.ok) return fail(auth.code, auth.msg)
    const action = event.action
    if (!handlers[action]) return fail(400, '未知 action：' + action)
    return await handlers[action]({ ...event, openid: OPENID, role: auth.role })
  } catch (e) {
    console.error('[workorder]', e)
    return fail(500, '系统繁忙，请稍后再试')
  }
}
```

配套文件：`package.json`（依赖 wx-server-sdk、axios）、`config.json`（`{"timeout": 60}`）。

### 13.5 project.config.json 关键字段

```json
{
  "appid": "wx6af52092db32a671",
  "compileType": "miniprogram",
  "miniprogramRoot": "miniprogram/",
  "cloudfunctionRoot": "cloudfunctions/",
  "libVersion": "3.8.0",
  "setting": {
    "es6": true,
    "enhance": true,
    "minified": true,
    "urlCheck": true
  },
  "condition": {}
}
```

uni-app 变体：`miniprogramRoot` 改为编译产物目录（如 `dist/dev/mp-weixin`），AppID 与 cloudfunctionRoot 不变。

### 13.6 环境变量清单（写进 README 与密钥管理说明，不含值）

| 变量名 | 用途 | 填在哪 |
| --- | --- | --- |
| DEEPSEEK_API_KEY | DeepSeek 调用鉴权 | 云函数 qa/workorder 环境变量 |
| DEEPSEEK_BASE_URL | API 地址，默认 https://api.deepseek.com | 同上 |
| TCB_ENV_ID（如用 tcb CLI） | 部署目标环境 | CI Secrets |
| MP_PRIVATE_KEY（如用 miniprogram-ci） | 上传密钥 | CI Secrets / 本地 ci.key（gitignore） |

## 14. 完成前自检清单（16 条）

1. 问卷 49 问答案齐（含"按默认"），并落盘 `docs/00-问卷答案汇总.md`。
2. 已读 PRD、设计预览表、页面清单、问卷汇总四份输入。
3. `docs/04-架构设计.md` 含：选型表+理由+来源、Mermaid 图、模块划分、AI 方案五件套、风险清单。
4. `contracts/api-contract.md` ≥8 个接口，每个有入参/出参/错误码/请求响应示例。
5. 错误码表与 7.4 一致，无重复码。
6. `contracts/db-schema.md` 五集合字段/索引/权限齐全。
7. `scripts/seed.js` 可一键重建种子数据（含 3 个测试账号）。
8. `contracts/task-cards.md` 有 FE-1..10 与 BE-1..9，每卡含工时/依赖/验收。
9. 任务卡依赖链无环（FE-9 与 BE-1 前置关系正确）。
10. 密钥零明文（grep 检查 `sk-`、`api_key=`）。
11. git 仓库已 init，3 分支存在，main 有首次提交。
12. 脚手架目录与 7.9 一致，project.config.json appid 正确。
13. 微信开发者工具能打开并编译通过（S7 实机验证截图/记录）。
14. 契约变更记录表已建（空表就位）。
15. G4 用户确认记录已归档。
16. FE/BE 移交消息已发送且对方确认收卡。

全部通过 → 汇报 lead："G4 材料就绪，可放行 FE/BE 并行开工"。任一未过 → 补全后再汇报，不带病移交。


