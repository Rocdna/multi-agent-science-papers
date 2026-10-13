# 网站图标来源

## 当前图标

当前采用用户确认的橙色猫耳少女头像，参考用户提供的图片风格，使用 imagegen 生成头像并移除背景，保留真实透明通道。

- `favicon.png`：512 × 512，透明背景。
- `favicon-32x32.png`：32 × 32，透明背景。
- `favicon.ico`：包含 16、32、48 像素版本。
- `apple-touch-icon.png`：180 × 180，透明背景。

图标存放在静态站点根目录，由 `index.html` 使用相对路径引用。页面图标版本参数为 `v=2`，用于区分旧版缓存。

重新部署时，将上述文件与 `index.html` 一起放入 Cloudflare 的静态资源输出目录。重新从 Zotero 工具生成展示页时，请保留页面 `<head>` 中的图标声明和页脚来源说明链接。

## 历史图标

此前的蓝底白色线稿改编自 [Arcticons Team — miria.svg](https://github.com/Arcticons-Team/Arcticons/blob/main/icons/white/miria.svg)，采用 [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)，修改包括蓝色圆角背景、加粗描边和格式转换。旧版可在 Git 历史中查看；其授权说明不适用于当前生成的头像。
