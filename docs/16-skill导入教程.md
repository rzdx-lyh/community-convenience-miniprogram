# Skill 导入教程（WorkBuddy）

> 适用版本：WorkBuddy CN 版 5.7.7｜整理时间：2026-10-13
> 本文针对本项目已生成的 10 个 skill（`csp-*`）给出可直接照做的导入步骤。

---

## 0. 先搞清楚：Skill 有两种"装法"，选对就成功一半

| 方式 | 适合场景 | 要不要打包 | 生效范围 |
|---|---|---|---|
| **方式 A：直接放目录** | 自己用、跟仓库走 | ❌ 不用 | 项目级 = 只在这个仓库；用户级 = 所有项目 |
| **方式 B：上传技能包** | 发给别人、内网/离线、上架市场 | ✅ 要 zip | 装到本机，跟你走 |

本项目 **方式 A 已经做完了**，装在**用户级**技能库（全局生效）。重启一下就能用。
**方式 B 的 zip 也已经打好了**，在 `skill-zips/` 里。

> 📌 **为什么只装一处**：项目级和用户级 WorkBuddy 都会扫，两处都放同一套会出现重复条目、
> 也分不清到底加载的是哪一份。本项目已选定 **用户级为唯一安装位置**，项目级不再重复放。
> 需要项目级随仓库同步时，跑一次 `make_skills.py` 即可重建（见第 5 节）。

---

## 1. 方式 A：直接放目录（已就位，最省事）

### 两个可选位置（二选一，不要同时放）

| 级别 | 路径 | 生效范围 | 本项目 |
|---|---|---|---|
| **用户级** | `C:\Users\Administrator\.workbuddy\skills\<skill-name>/SKILL.md` | 你所有项目都能用 | ✅ **当前使用** |
| **项目级** | `<项目根>/.workbuddy/skills/<skill-name>/SKILL.md` | 只在该项目生效，可随 git 同步给同学 | ⬜ 当前未放，可按需重建 |

> 本项目安装在**用户级**：`C:\Users\Administrator\.workbuddy\skills\`（10 个 `csp-*`）

### 步骤

1. 确认目录里是 `skills/<skill-name>/SKILL.md` 这个两层结构（不是把 `SKILL.md` 直接扔进 `skills/`）。
2. 打开（或重新打开）WorkBuddy 的这个项目。
3. 左侧菜单点【专家 · 技能 · 连接器】→ 二级菜单选【技能】，在「已安装的本地技能」区域找 `社区便民 · xxx`。
4. 如果没出现：完全退出 WorkBuddy 再启动一次（目录扫描一般在启动时做一次）。

### 从 zip 手动装到本地技能库（不用点 UI）

已经有 zip 的话，直接解压到技能库目录即可（注意路径用双反斜杠或正斜杠）：

```python
import zipfile
zipfile.ZipFile("skill-zips/csp-playbook.zip").extractall(
    r"C:\Users\Administrator\.workbuddy\skills"
)
```

解压后必须是 `C:\Users\Administrator\.workbuddy\skills\csp-playbook\SKILL.md` 这个两层结构。
**本项目实测有效**：`csp-playbook` 用此法装到用户级后，官方校验返回 `Skill is valid!`。

> ⚠️ 第 4 步是我根据常见实现推断的，不是官方文档明写的。若重启后仍不出现，改用**方式 B** 上传一次，一定能装上。

---

## 2. 方式 B：上传技能包（zip）

### 官方 UI 路径

```text
左侧菜单【专家 · 技能 · 连接器】
  └→ 二级菜单【技能】
      └→ 进入【技能市场】
          └→ 右上角【添加技能】
              ├→ 【上传技能】  ← 你走这条：拖拽或点「选择文件」，选中 zip
              ├→ 【查找技能】  （输入任务描述，AI 帮你找）
              └→ 【创建技能】  （输入任务描述，AI 帮你生成）
```

**上传技能** 是我们要用的：拖拽 zip 进去，或点「选择文件」，选中后系统自动完成配置，无需额外操作。

### 本项目的 zip 在哪

```text
C:\Users\Administrator\WorkBuddy\Worktrees\Community Convenience Services\main-c47d81ed\skill-zips\
├── csp-playbook.zip            ← 建议先装这个（总控，含 9 角色索引）
├── csp-project-manager.zip
├── csp-product-manager.zip
├── csp-ui-designer.zip
├── csp-architect.zip
├── csp-frontend-engineer.zip
├── csp-backend-engineer.zip
├── csp-test-engineer.zip
├── csp-devops-engineer.zip
└── csp-ai-engineer.zip
```

**逐个上传**——官方包结构是「一个 zip 一个 skill」（`{skill-name}/SKILL.md`），不是把 10 个塞一个包里。

### 上传后

- 已安装技能可以随时**关闭/重新启用**，不用卸载。关闭后不会在对话中被自动调用。
- 开关状态存在你的账号配置里，**多端同步**，且**不会改动技能包的原始文件**。
- 安装时系统会自动做一次**安全扫描**（检测潜在恶意脚本），本项目这 10 个已提前做过完整审计（见 `docs/15-skill安全审计报告.md`，结论 P2 安全）。

---

## 3. 一个 skill 包必须长什么样（不符合就导入失败）

### 目录结构

```text
{skill-name}/
├── SKILL.md              # ★ 必须，文件名精确为 SKILL.md
├── references/           # 可选：给 AI 读的补充知识
├── scripts/              # 可选：可执行脚本
└── templates/            # 可选：模板文件
```

### SKILL.md 必须这样开头

```yaml
---
name: your-skill-name          # 可选：技能标识
display_name: 展示名称          # 中文显示名
display_name_en: Display Name
description: 一句话描述技能能力    # ★ 必填，写清用途和触发词
description_zh: 简短中文介绍      # ★ 必填
description_en: A Brief Intro   # ★ 必填
version: 1.0.0                  # ★ 必填
author: 合作方名称               # ★ 必填
---
```

可选字段：`allowed-tools`（工具白名单，逗号分隔）、`disable-model-invocation`（`true` 则 AI 不自动触发，只能手动调）、`user-invocable`（`false` 则隐藏菜单）。

### 三条最容易踩的规则

1. **`name` 只能是 ASCII 小写字母、数字、连字符**（`^[a-z0-9-]+$`）。写成 `AI工程师` 会直接挂 —— 中文放 `display_name` / `description_zh`。
2. **`description` 里不能出现尖括号 `<` `>`**。
3. **五字段一个都不能少**：`description`、`description_zh`、`description_en`、`version`、`author`。
   > 本地校验器 `quick_validate.py` 只查 `name` + `description`，**比上传通道宽松**。本地校验通过 ≠ 能上传成功。这是本教程最容易踩的坑。

---

## 4. 导入失败排查表

按报错/症状从上往下试：

| 症状 | 原因 | 修法 |
|---|---|---|
| 列表里根本找不到 / 上传无反应 | 文件夹结构不对（`SKILL.md` 没在 `<skill-name>/` 里） | 改成两层结构 |
| `SKILL.md not found` | 文件名不是 `SKILL.md`（如 `09-AI工程师-skill.md`） | 重命名，大小写都要对 |
| `No YAML frontmatter found` | 文件开头没有 `---` 包起来的字段块 | 补 frontmatter |
| `Name 'xxx' should be hyphen-case` | `name` 里有中文或大写 | 改成 `ai-engineer` 这种形式 |
| 上传后"解析失败" | 缺 `version` / `author` / `description_en` 等必填字段 | 补齐五字段 |
| 上传后"解析失败" | zip 里有反斜杠路径（Windows 打包常见） | 用 Python `zipfile` 重打，别用 PowerShell `Compress-Archive` |
| `description` 报错 | 描述里有 `<` 或 `>` | 换成全角或改写措辞 |
| 装上了但对话里不触发 | 技能被关闭了 | 到技能列表把它重新启用 |
| 装上了但换项目就没了 | 装成了项目级 | 改放用户级目录 `~/.workbuddy/skills/` |

---

## 5. 本项目的地址总清单

| 内容 | 绝对路径 | 状态 |
|---|---|---|
| **用户级 skill（唯一安装位置）** | `C:\Users\Administrator\.workbuddy\skills\` | ✅ 已装 10 个 `csp-*` + 原有 4 个 |
| **可上传 zip（10 个）** | `…\main-c47d81ed\skill-zips\` | ✅ 就位 |
| 项目级 skill | `…\main-c47d81ed\.workbuddy\skills\` | ⬜ 2026-10-13 已移除以避免重复；跑 `make_skills.py` 可重建 |
| 源规范文档（9 份角色规范 + 总提示词） | `…\main-c47d81ed\skill\` | ✅ 就位 |
| 技能生成脚本（幂等，可重跑） | `…\main-c47d81ed\.workbuddy\tools\make_skills.py` | ✅ 就位 |
| 安全审计报告 | `…\main-c47d81ed\docs\15-skill安全审计报告.md` | ✅ 就位 |
| 给同学的分发包（含角色规范） | `…\main-c47d81ed\deliver\` 与 `C:\Users\Administrator\Desktop\社区便民小程序-分发包\` | ✅ 就位 |

> 🗑️ 被移除的项目级 skill 已备份到系统暂存区
> `C:\Users\Administrator\AppData\Local\Temp\wb-removed-skills-20261013-222833\`
> （10 个子目录 / 20 个文件 / 538 KB，内容完整）。要恢复就拷回 `.workbuddy\skills\`。

### 想重新生成 / 重新打包 / 重新安装

```bash
cd "C:/Users/Administrator/WorkBuddy/Worktrees/Community Convenience Services/main-c47d81ed"

# 只预演，看会生成什么
python .workbuddy/tools/make_skills.py --check

# 重新生成 10 个 skill 目录（项目级）
python .workbuddy/tools/make_skills.py

# 重新生成 + 打包为可上传 zip
python .workbuddy/tools/make_skills.py --pack

# 重新生成 + 安装到用户级技能库（全局生效）
python .workbuddy/tools/make_skills.py --install

# 覆盖已存在的同名技能（默认跳过，不覆盖）
python .workbuddy/tools/make_skills.py --install --force
```

| 开关 | 作用 | 产出位置 |
|---|---|---|
| `--check` | 只预演，不写盘 | — |
| （无） | 生成**项目级** skill | `<repo>/.workbuddy/skills/` |
| `--pack` | 额外打包可上传 zip | `<repo>/skill-zips/` |
| `--install` | 额外装到**用户级**技能库 | `~/.workbuddy/skills/` |
| `--force` | 配合 `--install`，覆盖同名 | — |

改了 `skill/` 里的源规范后，想更新已装的那份，用：

```bash
python .workbuddy/tools/make_skills.py --install --force
```

> ⚠️ **注意别把两处同时放上**。本项目已经选定用户级为唯一安装位置，
> 所以**不要**再单独跑无参数的 `make_skills.py` —— 那会在项目里也生成一份，又变回重复状态。
> 只有确实需要"随仓库同步给同学"时，才重建项目级那份。
>
> ⚠️ `--install` 默认**跳过**已存在的同名技能，不会覆盖。要覆盖必须显式加 `--force`。
> 这是为了防止误删你手工改过的技能。

---

## 6. 自检：这个包到底合不合格

```bash
# ① 官方结构校验（每个目录都该输出 Skill is valid!）
python "C:/Users/Administrator/.workbuddy/skills/skill-creator/scripts/quick_validate.py" \
  ".workbuddy/skills/csp-ai-engineer"

# ② 上传必填字段校验
python -c "
import re
fm = re.match(r'^---\n(.*?)\n---', open('.workbuddy/skills/csp-ai-engineer/SKILL.md', encoding='utf-8').read(), re.S).group(1)
keys = set(re.findall(r'^([A-Za-z_-]+):', fm, re.M))
req = ['description','description_zh','description_en','version','author']
print('缺失字段:', [k for k in req if k not in keys] or '无 ✅')
"

# ③ zip 结构与完整性校验
python -c "
import zipfile
z = zipfile.ZipFile('skill-zips/csp-ai-engineer.zip')
print('CRC:', 'OK' if z.testzip() is None else '损坏')
print('文件:', z.namelist())
"
```

---

## 7. 一条捷径

不想手动点菜单，可以直接在对话框里说：

> 帮我把 `skill-zips/csp-playbook.zip` 安装成技能

或者干脆什么都不做 —— 方式 A 已经装好了，重启 WorkBuddy 直接用。
