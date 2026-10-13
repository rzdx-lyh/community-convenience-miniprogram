# 社区便民微信小程序 · Design Token 规范

版本 v1.1（清新绿版）｜2026-10-13｜UI 设计师｜状态：**待用户确认（G3 闸门）**
> 基准：750×1334（2 倍图），iPhone 6/7/8 逻辑 375×667；全文档单位 **rpx**（切图尺寸除外，标 px）。
> 上游：docs/02-产品方案PRD.md（权威范围）、docs/01-项目拆解方案.md（变更 C1）
> 风格默认值：温暖适老风 + 岭南文化点缀 + 大字号（⚠ 风格默认值待用户确认）

## CHANGELOG（Token 变更登记，改一个值记一条）

| # | 日期 | 变量 | 旧值 | 新值 | 原因 | 通知对象 |
|---|---|---|---|---|---|---|
| 1 | 2026-10-13 | 全量 Token 首次落盘 | — | v1.0 全套 | G3 设计预览产出 | 架构师、前端 |
| 2 | 2026-10-13 | `--color-primary`(前端占位) | #3A7AFE（占位蓝） | #C0522F（岭南砖红） | 正式品牌色替代占位值 | 前端 |
| 3 | 2026-10-13 | **`--brand` 系全量换色** | #C0522F 砖红系 | **#1E8252 清新绿系**（含 gradient/light/warm） | 用户提供参考图并确认「清新绿」风格；首页改版填满式头部 | 架构师、前端（TabBar selectedColor 同步换） |

---

## ① 色板（HEX 全套）

### 品牌色（清新绿系 · v1.1 用户参考图确认，替代砖红）
| Token | HEX | 用途 | 对比度（vs #FFFFFF） |
| --- | --- | --- | --- |
| `--brand` | `#1E8252` | **主绿（深）**：承载白字的表面 / 主按钮 / TabBar 选中 / 强调文字 | **4.8:1** ✅ 正文可用 |
| `--brand-mid` | `#2FA36B` | 渐变亮端 / 装饰图形 / 图标（白字仅限 ≥34rpx 加粗大字 3.2:1） | 3.2:1 ⚠ 仅大字 |
| `--brand-press` | `#166A42` | 按压态（主绿加深） | 5.9:1 ✅ |
| `--brand-light` | `#E6F5EE` | 主色浅底（图标底 / 选中背景 / pill 底） | — |
| `--brand-gradient` | `linear-gradient(170deg,#3BB27E 0%,#2FA36B 45%,#1E8252 100%)` | **首页填满式头部** / 启动页 | 头部文字一律白色加粗 |
| `--accent-warm` | `#E0862F` | 暖橙点缀：宫格第 3/4 格图标 / 次强调 | — |
| `--accent-warm-light` | `#FDF3E7` | 暖橙浅底 | — |

> **换色说明（CHANGELOG #3）**：用户 2026-10-13 提供参考图并确认清新绿风格。头部白字一律用 `--brand` 深绿端或加粗大字，禁用 `--brand-mid` 作小号白字底（对比度不足）。岭南文化叙事改由「青砖绿纹理 + 空状态线条插画」承载，不再依赖砖红主色。

### 辅助色（青砖绿系·岭南点缀）
| Token | HEX | 用途 |
| --- | --- | --- |
| `--green` | `#3E6E5F` | 来源引用条 / 成功辅助 / 岭南纹理点缀 |
| `--green-light` | `#E7F0ED` | 青砖绿浅底 |

### 中性色
| Token | HEX | 用途 | 对比度（vs #FAF6F1） |
| --- | --- | --- | --- |
| `--bg` | `#FAF6F1` | 页面背景（米白） | — |
| `--card` | `#FFFFFF` | 卡片 / 弹层 / 输入框底 | — |
| `--text-1` | `#2B2B2B` | 主文字 | **12.5:1** ✅ |
| `--text-2` | `#6B6B6B` | 次级文字 | **4.9:1** ✅ |
| `--text-3` | `#9B9B9B` | 辅助/时间戳（≥24rpx 可用；关怀模式禁用为正文） | 2.6:1 ⚠ |
| `--line` | `#EEEAE3` | 分割线 / 边框 | — |
| `--mask` | `rgba(0,0,0,0.6)` | 弹层遮罩 | — |

**对比度验算过程（可复现）**：`对比度 = (L亮 + 0.05) / (L暗 + 0.05)`；`L = 0.2126R + 0.7152G + 0.0722B`（各通道先 sRGB→线性：`c/255` 后 ≤0.03928 除 12.92，否则 `((c+0.055)/1.055)^2.4`）。
- #1E8252 → L=0.1687；#FFFFFF → L=1.0 ⇒ (1.05)/(0.2187) = **4.80:1** ✅（主绿白字）
- #2FA36B → L=0.2784 ⇒ vs #FFFFFF = **3.20:1** ⚠（仅 ≥34rpx 加粗大字/图形）
- #C0392B → L=0.1284 ⇒ **4.90:1** ✅（紧急红白字）
- #6B6B6B → L=0.1441；#FAF6F1 → L=0.9068 ⇒ (0.9568)/(0.1941) = **4.93:1** ✅
- #9B9B9B → L=0.3185 ⇒ vs #FAF6F1 = **2.6:1** ⚠ 仅限非正文

### 功能色
| Token | HEX | 用途 |
| --- | --- | --- |
| `--success` | `#3E8E5A` | 成功 / 已完成 |
| `--warning` | `#D98E32` | 待受理 / 警告 |
| `--info` | `#3A7CA5` | 已派单 / 链接 |
| `--processing` | `#7A5BB8` | 处理中 |
| `--error` | `#C0392B` | 错误 / 失败（白字 4.9:1 ✅） |
| `--disabled` | `#9B9B9B` | 已取消 / 禁用（文字 40% 透明度） |

### 紧急模块色（变更 C1 新增）
| Token | HEX | 用途 | 说明 |
| --- | --- | --- | --- |
| `--urgent` | `#C0392B` | 紧急求助按钮文字/图标（白 pill 内）/ 紧急图标 | 与主绿区分：红色承担"紧急"语义，绿色承担"品牌"语义 |
| `--urgent-press` | `#A32E22` | 紧急按钮按压态 | 白字 5.9:1 ✅ |
| `--urgent-bg` | `#FDF0EC` | 紧急公告区底色（异色底，与页面米白区分） | 与同区白卡形成层次 |
| `--urgent-line` | `#E0532F` | 紧急区左侧竖条 8rpx | 视觉锚点 |

### 工单状态色（status-tag 专用，浅底深字）
| 状态 | 文字色 | 底色 | 边框 |
| --- | --- | --- | --- |
| 待受理 | `#D98E32` | `#FBF0E0` | `#F0D9B8` |
| 已派单 | `#3A7CA5` | `#E8F1F7` | `#C9DDEA` |
| 处理中 | `#7A5BB8` | `#F0EBF8` | `#D9CCEF` |
| 已完成 | `#3E8E5A` | `#E7F2EA` | `#C4E0CD` |
| 已取消 | `#9B9B9B` | `#F0F0F0` | `#E0E0E0` |

---

## ② 字号阶梯（常规 / 关怀模式）

| 级别 | Token | 常规 rpx | 关怀模式 rpx | 用途 |
| --- | --- | --- | --- | --- |
| 超大标题 | `--font-hero` | 48（24px） | 60（30px） | 首页品牌标语 |
| 页面标题 | `--font-title` | 40（20px） | 52（26px） | 二级页标题 / 导航栏 |
| 卡片标题 | `--font-card` | 34（17px）加粗 | 44（22px）加粗 | 卡片 / 列表项 / 功能名 |
| 正文 | `--font-body` | 32（16px） | 40（20px） | 正文 / 列表内容 / 输入 |
| 辅助文字 | `--font-sub` | 28（14px） | 36（18px） | 说明 / 标签 |
| 时间戳/免责 | `--font-cap` | 24（12px） | 32（16px） | 时间 / AI 免责声明 |
| 按钮文字 | `--font-btn` | 34（17px） | 42（21px） | 按钮（大档） |
| 行高 | — | 1.4 倍 | 1.5 倍 | 全部正文 |

**规则**：常规正文最小 15px、关怀模式正文最小 20px；关怀模式禁用 `--text-3` 作正文（升到 `--text-2` 起）。

---

## ③ 间距（8px 栅格 → rpx）

| Token | rpx | 用途 |
| --- | --- | --- |
| `--space-1` | 8 | 图标与文字微距 |
| `--space-2` | 16 | 段落距 / 标签内距 |
| `--space-3` | 24 | 卡片间距 / 列表行距 / 宫格间距 |
| `--space-4` | 32 | 卡片内边距 / 页面左右边距 |
| `--space-5` | 48 | 区块间距 |
| `--space-6` | 64 | 大区块分隔 |

## ④ 圆角

| Token | rpx | 用途 |
| --- | --- | --- |
| `--radius-s` | 8 | 标签内图标 / 气泡单角 |
| `--radius-m` | 16 | 按钮 / 输入框 |
| `--radius-l` | 24 | 卡片 / 气泡 / 紧急公告区 |
| `--radius-full` | 999 | 胶囊标签 / 头像 / 头像区 |

## ⑤ 阴影

| Token | 值 | 用途 |
| --- | --- | --- |
| `--shadow-card` | `0 4rpx 16rpx rgba(43,43,43,0.06)` | 卡片 |
| `--shadow-urgent` | `0 4rpx 16rpx rgba(192,57,43,0.18)` | 紧急求助按钮 |
| `--shadow-float` | `0 8rpx 24rpx rgba(30,130,82,0.25)` | 悬浮按钮 |
| `--shadow-modal` | `0 16rpx 48rpx rgba(0,0,0,0.12)` | 弹层 |

## ⑥ 层级（z-index）

| Token | 值 | 用途 |
| --- | --- | --- |
| `--z-content` | 0 | 普通内容 |
| `--z-sticky` | 10 | 吸顶（导航区 / 列表头） |
| `--z-fab` | 100 | 悬浮提交按钮 |
| `--z-mask` | 900 | 遮罩 |
| `--z-modal` | 1000 | 弹层 / 半屏弹窗 |
| `--z-toast` | 2000 | Toast / 全局提示 |

---

## ⑦ 微信小程序引用示例（可直接粘贴进 `app.wxss`）

```css
/* ===== 正式 Design Token v1.1（2026-10-13 清新绿版，UI 设计师）===== */
page {
  /* 品牌色（清新绿 · CHANGELOG #3） */
  --brand: #1E8252; --brand-mid: #2FA36B; --brand-press: #166A42; --brand-light: #E6F5EE;
  --brand-gradient: linear-gradient(170deg, #3BB27E 0%, #2FA36B 45%, #1E8252 100%);
  --accent-warm: #E0862F; --accent-warm-light: #FDF3E7;
  /* 辅助色 */
  --green: #3E6E5F; --green-light: #E7F0ED;
  /* 中性色 */
  --bg: #FAF6F1; --card: #FFFFFF;
  --text-1: #2B2B2B; --text-2: #6B6B6B; --text-3: #9B9B9B;
  --line: #EEEAE3; --mask: rgba(0, 0, 0, 0.6);
  /* 功能色 */
  --success: #3E8E5A; --warning: #D98E32; --info: #3A7CA5;
  --processing: #7A5BB8; --error: #C0392B; --disabled: #9B9B9B;
  /* 紧急模块（变更 C1） */
  --urgent: #C0392B; --urgent-press: #A32E22;
  --urgent-bg: #FDF0EC; --urgent-line: #E0532F;
  /* 字号 */
  --font-hero: 48rpx; --font-title: 40rpx; --font-card: 34rpx;
  --font-body: 32rpx; --font-sub: 28rpx; --font-cap: 24rpx; --font-btn: 34rpx;
  /* 间距 / 圆角 / 阴影 */
  --space-1: 8rpx; --space-2: 16rpx; --space-3: 24rpx;
  --space-4: 32rpx; --space-5: 48rpx; --space-6: 64rpx;
  --radius-s: 8rpx; --radius-m: 16rpx; --radius-l: 24rpx; --radius-full: 999rpx;
  --shadow-card: 0 4rpx 16rpx rgba(43, 43, 43, 0.06);
  --shadow-urgent: 0 4rpx 16rpx rgba(192, 57, 43, 0.18);
  --shadow-float: 0 8rpx 24rpx rgba(30, 130, 82, 0.25);
  --shadow-modal: 0 16rpx 48rpx rgba(0, 0, 0, 0.12);
  /* 层级 */
  --z-content: 0; --z-sticky: 10; --z-fab: 100;
  --z-mask: 900; --z-modal: 1000; --z-toast: 2000;

  background: var(--bg);
  color: var(--text-1);
  font-size: var(--font-body);
  line-height: 1.4;
}

/* 关怀模式：根节点挂 .care-mode，字号自动放大，无需逐组件改样式 */
page.care-mode {
  --font-hero: 60rpx; --font-title: 52rpx; --font-card: 44rpx;
  --font-body: 40rpx; --font-sub: 36rpx; --font-cap: 32rpx; --font-btn: 42rpx;
  line-height: 1.5;
}
```

**硬规则**：组件样式一律 `var(--token)`，**禁止硬编码色值/字号**；Token 变更走 §CHANGELOG。

---

## ⑧ 与前端现有占位变量的迁移对照表（重要）

工程现状：`miniprogram/app.wxss` 当前用的是前端占位 Token（蓝色 `--color-primary: #3a7afe`，来源 FE-0 任务卡）。**页面结构无需返工，只需替换变量值**：

| 前端现有变量 | 占位值 | 替换为正式 Token | 正式值 |
| --- | --- | --- | --- |
| `--color-primary` | `#3a7afe` | `--brand` | `#1E8252`（v1.1 清新绿） |
| `--color-primary-light` | `#eaf1ff` | `--brand-light` | `#FBE9E2` |
| `--color-text` | `#1f2329` | `--text-1` | `#2B2B2B` |
| `--color-text-secondary` | `#86909c` | `--text-2` | `#6B6B6B` |
| `--color-bg` | `#f5f6f8` | `--bg` | `#FAF6F1` |
| `--color-card` | `#ffffff` | `--card` | `#FFFFFF` |
| `--color-success` | `#00b578` | `--success` | `#3E8E5A` |
| `--color-warning` | `#ff8f1f` | `--warning` | `#D98E32` |
| `--color-danger` | `#f53f3f` | `--error` | `#C0392B` |
| `--radius-sm/md/lg` | 8/16/24rpx | `--radius-s/m/l` | 同值，仅改名 |
| `--font-md`（页面基础） | 28rpx | `--font-body` | 32rpx（**字号整体上调，适老化基准**） |
| 关怀模式类名 | `.elder-mode` | `.care-mode` | 统一为 `.care-mode`（全局唯一） |

**迁移建议（给前端）**：保留旧变量名做别名过渡一轮（如 `--color-primary: var(--brand)`），页面按新 Token 逐个替换后删除别名。

---

## ⑨ 本期明确不做（防范围蔓延）

- 深色模式：本期不做（剩 12 天，做半套反而扣分），Token 注释留二期。
- 第三方组件库（Vant Weapp / TDesign）：不引入，自绘轻量组件（适老化定制需深度改造，且省包体积）。
- 商用字体嵌入：一律系统默认字体（iOS PingFang / Android 思源黑体），避免授权合规风险。
