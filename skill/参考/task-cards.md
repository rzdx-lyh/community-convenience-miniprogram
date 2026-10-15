# 任务卡（前后端并行工作依据）

> 版本：**v1.1**｜更新日期：2026-10-13（变更详见 `contracts/契约变更记录.md`）
> 粒度：1 卡 = 1 页面或 1 接口。依赖：无前置标注的卡可立即开工。
> 验收：完成=代码 + 自测通过 + 在本文档勾选。提交分支：前端→feature/frontend，后端→feature/backend。
>
> **v1.1 影响的任务卡**：FE-2（多轮 sessionId + 历史）、BE-6（会话读写 + 上下文压缩 + 双层护栏 + 未命中阈值）。其余卡不变。

## 前端任务卡（feature/frontend）

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

## 后端任务卡（feature/backend）

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
