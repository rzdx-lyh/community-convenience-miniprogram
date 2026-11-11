# 7 天省赛冲刺计划

> 截止：2026-11-18

## 角色

- **Codex**：架构、实际编码、测试、部署、Git 与最终验收
- **DeepSeek Harness**：需求拆解、Prompt、技术文档初稿、代码审查
- **WorkBuddy**：批量脚本、素材整理、测试执行、文档格式转换
- **人工**：团队信息、账号密钥、演示讲解、最终确认

## Day 1 · Web 底座

- 新建 `web/` Web 应用（React + Vite 或 Next.js）
- 建立设计系统、路由、三端入口
- 复用现有社区服务数据与业务概念
- 输出 README 技术架构与环境变量模板

## Day 2 · RAG

- 建立社区知识库：服务目录、通知、电话簿、地图点位、办事指南
- 实现文档切分、索引、检索、引用
- AI 回答必须带来源
- 增加无命中兜底与转人工

## Day 3 · Agent + 工具

- 实现意图识别与任务规划
- Function Calling 工具：
  - `searchCommunity`
  - `findNearbyPlaces`
  - `createRepairOrder`
  - `queryWorkOrder`
  - `callHuman`
- 前端展示 Agent 思考/工具调用状态

## Day 4 · 多模态与安全

- 报修照片上传与故障分析
- 医疗/法律/紧急问题安全护栏
- 输出过滤、引用校验、失败降级
- 增加多模态演示数据

## Day 5 · Web 体验与工程质量

- 流式输出、加载态、错误边界
- 响应式布局、关怀模式、键盘操作
- 单元测试与 E2E 冒烟
- 性能优化：代码分割、缓存、资源压缩、懒加载

## Day 6 · 部署与材料

- 部署公网演示地址
- 生成 30 页以内技术文档 PDF
- 完善 README、团队信息、环境变量模板
- 整理演示账号与演示数据

## Day 7 · 视频与提交

- 录制 5–8 分钟 1080p 演示视频
- 核对评分矩阵与证据矩阵
- 提交 GitHub 仓库、PDF、视频、在线地址
- 完成报名和作品提交

## 赛事必需材料

- [ ] GitHub/Gitee 公开仓库或评审访问
- [ ] README：项目、架构、运行、团队
- [ ] 环境变量模板与依赖清单
- [ ] PDF 技术文档 ≤30 页
- [ ] 5–8 分钟 MP4 演示视频
- [ ] 公网在线演示地址
- [ ] 评审专用体验账号
- [ ] 团队 1–3 人与指导教师信息

## 自动化协作接口建议

```text
competition/requirements.json     要求矩阵
competition/tasks/*.json          DeepSeek/WorkBuddy 任务
competition/outputs/              双方产物
competition/review/               Codex 与人工复核
competition/final/                最终提交材料
```

所有 AI 生成材料必须经过 Codex 与人工复核，不能直接提交。
