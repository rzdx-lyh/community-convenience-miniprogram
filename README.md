# 邻里百事通小助手

> 社区便民微信小程序 · 当前版本 **v1.2.4**

一个面向社区居民与社区工作人员的微信小程序，包含居民服务、零 Key 社区地图、报修工单，以及居民 / 管理端 / 维修端三端账号底座。

## 当前功能

- 居民端：首页、办事大厅、社区圈子、报修、通知、电话簿、AI 助手
- AI Agent：意图规划、RAG 来源引用、地图/工单/电话簿工具调用、下一步操作
- 多模态：报修照片识别与自动填单（支持 OpenAI 兼容视觉接口，未配置时降级人工填写）
- 地图：首页最近 3 个服务点、地图/列表双视图、四类点位、手选楼栋、主动定位与失败兜底
- 报修：问题位置选择、工单提交、详情展示与地图导航
- 关怀模式：首页快捷入口、全站字号与点击区域放大、布局防错位
- 三端登录：居民 / 管理端 / 维修端；工作人员账号使用独立会话
- 云函数：`auth` `circle` `notice` `phonebook` `qa` `service` `user` `workorder`

## 技术栈

- 微信原生小程序 + TypeScript
- 微信云开发
- Vitest + ESLint + TypeScript

## 本地运行

```bash
npm ci
npm run verify
```

微信开发者工具导入仓库根目录，AppID 与云环境见 `project.config.json`、`miniprogram/config/env.ts`。

## 云函数

```bash
npm run build:cf
npm run preflight
```

云函数部署前先执行 `build:cf`，确保共享模块平铺到各函数根目录。

## 演示账号

工作人员演示账号由云端初始化，账号密码不写入仓库。首次登录后必须修改密码。需要重新生成初始账号时执行：

```bash
npm run seed:staff
```

按脚本提示在云开发控制台导入 `scripts/seed/import/staff_accounts.json`。

## 目录

```text
miniprogram/     小程序前端
cloudfunctions/  云函数与共享模块
contracts/       接口与数据库契约
tests/           自动化测试
scripts/         构建、种子与自检脚本
docs/            当前实施与后续方案
project.config.json
package.json
```

## 文档

- `docs/41-三端权限与工单流程方案.md`
- `docs/42-居民端实时地图与体验升级方案.md`
- `docs/43-下一阶段实施总体方案.md`
- `docs/44-下一阶段实施进度.md`

## 安全约定

- 不在源码或数据库中保存工作人员明文密码
- 工作人员会话令牌只保存哈希
- 测试数据与构造器脚本不包含真实凭据
- `node_modules`、二维码、上传信息、交付 PDF/Word 等生成物不入库

