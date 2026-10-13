# 网站图标来源

本项目的 `favicon.svg`、`favicon.ico`、`favicon-32x32.png` 和 `apple-touch-icon.png` 改编自 Arcticons Team 的 **miria.svg** 猫耳少女线稿。

- 来源：[Arcticons — miria.svg](https://github.com/Arcticons-Team/Arcticons/blob/main/icons/white/miria.svg)
- 作者署名：Arcticons Team 及该图标贡献者。
- 原始图标与本项目衍生图标采用 [Creative Commons Attribution-ShareAlike 4.0 International（CC BY-SA 4.0）](https://creativecommons.org/licenses/by-sa/4.0/)。
- 本项目的修改：增加蓝色圆角背景，加粗白色描边，导出适用于浏览器和移动设备的格式与尺寸。
- 此授权说明仅适用于上述图标资产，不改变其他项目文件的授权。

图标存放在静态站点根目录，由 `index.html` 使用相对路径引用。SVG 不包含脚本、外部字体或外部图片资源。ICO 包含 16、32、48 像素版本；PNG 分别为 32 和 180 像素。

重新部署时，将这四个文件与 `index.html` 一起放入 Cloudflare 的静态资源输出目录。重新从 Zotero 工具生成展示页时，请保留页面 `<head>` 中的图标声明和页脚署名。
