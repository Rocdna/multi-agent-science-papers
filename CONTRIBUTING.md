# 文献维护说明

## 新增论文

1. 在 Zotero 的主要汇总分类中保存论文及可用附件；本地来源见 `PROJECT_CONTEXT.md`。
2. 根据 DOI、arXiv ID 或完整标题检查是否已收录。预印本、正式版和译本通常归并为同一研究，版本差异写在备注中。
3. 确定主要类型与方向，在 Markdown 对应分类表中加入条目。组内按年份从新到旧、同年按名称排序。
4. 同步更新 HTML 中的 `papers` 数据和对应表格、展开详情。页面同时包含数据和静态行，修改其中一处不会自动更新另一处。
5. 更新汇总日期、分类数量和 README 中的统计，记录本次变化。

新增条目至少记录论文名称、年份、核心工作、发表渠道和论文链接。作者代码及评级信息有依据时补充，尚未确认时明确写出状态。

## 修订信息

- 正式发表年份按期刊或会议页面确定，不能直接从 DOI 字符串推断。
- 等级与分区记录所用版本和来源；Workshop、Findings 的口径单独说明。
- 代码链接优先引用作者实现。仅找到链接、仓库可访问、实现完整和复现成功是不同状态。
- 实验结果保留任务、样本规模和条件；个人评价放在阅读笔记中。
- 涉及事实修订时记录核对日期和支持该修订的来源。

## 阅读笔记

复制 `notes/TEMPLATE.md`，按 `年份-论文简称.md` 命名，例如 `notes/2025-SciAgents.md`，再从汇总文件链接到笔记。

模板是可选的整理工具。未填写的字段可以保留“待补充”，不要据收藏状态推断论文已读。网站已提供阅读状态筛选，正式状态保存在 `data/reading-status.json`，由仓库维护，部署后所有设备展示一致。

## 更新正式阅读状态

在 `data/reading-status.json` 中根据 `name` 找到论文，修改对应 `status`。论文 `key` 用于稳定关联，`name` 仅方便人工查找。

| status | 网站标签 |
|---|---|
| `unread` | 未读（默认） |
| `reading` | 阅读中 |
| `read` | 已读 |

例如 AutoDFT 阅读中时，将它的 `status` 改为 `reading`。运行 `python scripts/build_notes.py`，同时提交源 JSON 和生成的 `assets/reading-data.js`，推送并部署后生效。网站不再读取旧版 localStorage 标记，也不自动迁移它们；笔记模板里的阅读状态不会覆盖正式记录。

未提供正式记录的论文默认显示未读。某份笔记的独立阅读链接为 `note.html?id=论文key&note=笔记id`；只提供论文 key 的旧链接仍有效，默认打开最近更新的笔记。该页与弹窗共用 `assets/note-renderer.js`，正文与图片路径保持一致。

## Markdown 上传与显示

网站支持标准 Markdown 的标题、列表、引用、链接、表格、任务列表和代码块。正文按电脑、平板和手机适配；图片可放大，视频使用浏览器原生播放器。公式、Mermaid 图和 Obsidian 双链等扩展语法尚未接入。

上传 `.md` 文件到仓库并不会自动知道它属于哪篇论文。需要将文件保存在 `notes/`、在 `notes/index.json` 中建立关联，并运行下述生成命令。图片与视频附件需一并上传，不能使用自己电脑上的绝对路径。

要在网站显示笔记，在 `notes/index.json` 中用论文 `key` 关联 Markdown 文件。`key` 可在 `index.html` 的 `papers` 数据中找到，它不依赖列表顺序或当前页码。每篇论文可以对应一个笔记数组，例如：

```json
{
  "R6WYYSJE": [
    {
      "id": "methods",
      "file": "notes/2026-AutoDFT-methods.md",
      "title": "方法总结",
      "updated": "2026-10-13",
      "demo": false
    },
    {
      "id": "ideas",
      "file": "notes/2026-AutoDFT-ideas.md",
      "title": "个人想法与疑问",
      "updated": "2026-10-14",
      "demo": false
    }
  ]
}
```

笔记保存后运行 `python scripts/build_notes.py`，同时提交 Markdown、索引、附件和生成的 `assets/notes-data.js`。不需要部署构建工具；生成的脚本让双击本地 HTML 也能阅读笔记。没有索引记录的论文不显示笔记入口。

同一论文内，每份笔记的 `id` 必须唯一，使用小写英文字母、数字、连字符或下划线，以字母或数字开头，最多 64 个字符。后续改标题或更新正文时保留 `id`，避免独立链接变化。`updated` 使用 `YYYY-MM-DD`；默认按更新时间从新到旧，同日按索引中的顺序展示。标题只用于显示，不影响阅读状态。

新增一份笔记只需在该论文的数组里追加记录，原有记录保留。生成脚本也兼容此前的单个对象格式，其笔记默认 ID 为 `main`；多个对象都省略 ID 会导致冲突，应为每份笔记明确设置不同 ID。空数组不会产生笔记入口。

卡片只显示一个“笔记 · 数量”入口。弹窗和独立页都支持切换：电脑侧栏展示标题与更新时间，手机和平板顶部提供选择框。切换时会更新当前笔记链接，关闭弹窗不改变列表分页或筛选。演示笔记明确标注为演示，不能据笔记数量推断论文已读。

图片和视频建议保存在 `notes/assets/` 中，笔记里的附件路径相对于 Markdown 文件，例如 `![流程图](assets/流程图.png)`。短视频可使用 `<video controls preload="none" playsinline src="assets/演示.mp4"></video>`。网站解析 Markdown 后清理 HTML，保留正常图文与视频，排除脚本和事件属性。公开仓库中的笔记和附件会公开发布。

## 整理公开展示页

展示页中的本地 PDF 链接只能在特定电脑上使用。重新从本地工具导出后，运行：

```powershell
python scripts/prepare_display.py
```

脚本会在 `.local/` 保存清理前的页面，再移除 `file://` 附件链接并清空数据中的本地 `pdf` 路径。不会修改 Zotero 数据库或论文附件。

也可以直接从本地展示文件生成仓库中的公开版本：

```powershell
python scripts/prepare_display.py --source "D:/zotero_doc/Multi-agent_AI材料文献展示.html"
```

备份文件采用时间戳命名，`.local/` 不提交到 Git。脚本只负责清理本地路径，不会更新文献内容或保证 Markdown 与 HTML 同步。

## 提交前检查

1. 在 GitHub 风格的 Markdown 预览中检查表格和链接。
2. 用浏览器打开 HTML，检查搜索、分类筛选、排序和详情展开。
3. 核对 Markdown 条目数、HTML 论文数与 README 统计一致。
4. 查看 `git diff` 和 `git status`，确认本地附件、数据库及备份没有被加入提交。
5. 在 `CHANGELOG.md` 中记录有意义的新增、修订或功能变化。

## 响应式页面维护

页面依赖 `vendor/bootstrap/bootstrap.min.css`、`vendor/bootstrap/bootstrap.min.js` 和 `assets/responsive.css`，部署或本地打开时保留这些文件的相对目录。Bootstrap 的版本与来源说明见 `vendor/bootstrap/README.md`。

分页、阅读状态和笔记交互由 `assets/literature.js` 维护，样式位于 `assets/reading.css`；Markdown 渲染和 HTML 清理依赖 `vendor/marked/` 与 `vendor/dompurify/`。这些文件同样需要随站点部署。

新增筛选条件优先复用当前 `filter-panel`，确保手机抽屉与电脑工具栏共享同一控件。重新从外部工具生成 HTML 时，还需保留图标、上述依赖、筛选抽屉结构和已选条件显示逻辑；现有路径清理脚本不会自动恢复这些界面改动。

界面修改后，至少检查 320px、390px、820px、1024px 和 1440px 的布局，以及筛选、排序、重置、详情展开和抽屉关闭。实际手机浏览器的触摸、软键盘和缩放行为可进一步在设备上检查。
