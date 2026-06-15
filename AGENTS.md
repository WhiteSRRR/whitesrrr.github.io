# 日程管理项目 (Calendar Schedule Manager)

## 项目核心

一个**纯前端 HTML 日程月历**，数据内嵌于 `var __ED = {...}` 代码块中，无需后端数据库。支持：
- 月视图日历，任务以彩色分类条显示
- 待办事项列表（无日期的任务）
- AI 自然语言添加任务（通过 Cloudflare Worker 调用 DeepSeek API）
- GitHub Pages 部署，多设备访问
- 桌面端通过 File System Access API 自动同步本地文件

## 项目文件

```
D:\工作文档\Codex Work\日程安排\
├── calendar/
│   └── index.html          ← 唯一核心文件（日历 + __ED 数据）
├── .git/                   ← Git 仓库，推送至 WhiteSRRR/whitesrrr.github.io
└── AGENTS.md               ← 本文件
```

## 数据架构（重要！）

```
__ED (HTML 内嵌) ← 唯一数据源，不使用 localStorage
     ↑ 读取
Python 脚本 (manage_schedule.py) → 写入 __ED → git push → GitHub Pages
浏览器 loadData() → 从 __ED 读取
浏览器 saveData() → 更新内存 __ED → syncToFile() → 写入本地文件（仅桌面）
```

**关键原则**：
- **`__ED` 是唯一数据源**。已于 2026-06-15 彻底移除 localStorage 和 seenIds 合并逻辑。
- `restoreSync()` / `visibilitychange` 仅在本地文件版本 **高于** HTML `__ED` 版本时才加载本地数据（避免覆盖 GitHub 最新数据）。
- Python 脚本 `save()` 保留现有分类数组，永不覆盖用户自定义的分类名称/颜色。

## 数据结构

```json
{
  "version": 20260615016,
  "currentMonth": "2026-06",
  "categories": [
    {"id": "cat_work", "name": "工作", "color": "#5b5fc7"},
    {"id": "cat_personal", "name": "个人", "color": "#10b981"},
    {"id": "cat_study", "name": "学习", "color": "#f59e0b"},
    {"id": "cat_important", "name": "重要", "color": "#e5484d"}
  ],
  "tasks": [
    {
      "id": "t202606180001",
      "date": "2026-06-18",
      "endDate": "",
      "time": "14:00",
      "title": "项目评审",
      "category": "cat_work",
      "done": false,
      "location": "",
      "description": ""
    }
  ]
}
```

## 部署地址

- **GitHub Pages**：`https://whitesrrr.github.io/calendar/`
- **Cloudflare Worker（AI 代理）**：`https://round-haze-1bd0.sdon90909.workers.dev/`
- **Git 仓库**：`WhiteSRRR/whitesrrr.github.io`

## 配套脚本

| 文件 | 路径 |
|------|------|
| Python CLI | `C:\Users\sdon9\.codex\skills\schedule-manager\scripts\manage_schedule.py` |
| Skill 说明 | `C:\Users\sdon9\.codex\skills\schedule-manager\SKILL.md` |
| Python 路径 | `C:\Users\sdon9\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe` |

### Python 脚本常用命令

```powershell
python manage_schedule.py list            # 列出全部任务
python manage_schedule.py list 2026-06    # 列出2026年6月任务
python manage_schedule.py cats            # 列出分类
python manage_schedule.py add "<标题>" <日期> <结束日期> <时间> <分类id> <地点> <描述>
python manage_schedule.py done <task_id>  # 标记完成
python manage_schedule.py delete <task_id> # 删除任务
```
- 空字段用 `-` 占位。日期不填 → 进入待办事项。

## 项目进展（截至 2026-06-15）

### ✅ 已完成
- [x] 月历视图 + 任务彩色分类显示
- [x] 待办事项列表（无日期任务）
- [x] 日侧边栏查看当天所有任务
- [x] 跨天任务支持（多日连续显示）
- [x] "更多..." 提示（当日任务超过3个时）
- [x] 分类管理（添加/删除/改名/改色）
- [x] AI 智能添加（自然语言 → 解析任务）
- [x] GitHub Pages 部署
- [x] 移动端适配
- [x] 移除 localStorage，`__ED` 唯一数据源（2026-06-15）
- [x] 修复 `restoreSync` 版本比较，防止本地旧数据覆盖（2026-06-15）
- [x] 修复删除任务复活 bug
- [x] 修复分类被覆盖 bug
- [x] 桌面端 File System Access API 自动同步

### ⚠️ 已知限制
- 手机端编辑仅存内存，刷新后丢失（静态托管限制，无后端）
- 桌面端编辑写本地文件但不会自动 git push
- 跨设备持久修改需通过 Agent/Python 脚本完成
- Cloudflare Worker 代码需手动在 Cloudflare 后台更新

### 🔮 待考虑
- [ ] 手机端编辑持久化方案（Service Worker + Cache API？）
- [ ] 周视图
- [ ] 任务搜索/筛选
