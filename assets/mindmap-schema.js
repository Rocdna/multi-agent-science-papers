/* Portable document boundary: keep imported files as data, never executable markup. */
(() => {
  'use strict';
  const MAX_FILE = 32 * 1024 * 1024;
  const color = value => typeof value === 'string' && /^#[\da-f]{6}$/i.test(value);
  function validate(raw) {
    if (!raw || raw.format !== 'paper-mindmap' || ![1, 2].includes(raw.version) || !raw.data?.nodeData) {
      throw new Error('请选择本页导出的思维导图 JSON 文件；此版本暂不导入 XMind 文件。');
    }
    const ids = new Set(); let count = 0;
    function node(value, depth = 0) {
      if (!value || typeof value !== 'object' || ++count > 500 || depth > 40) throw new Error('导图最多支持 500 个节点和 40 层。');
      if (typeof value.id !== 'string' || !/^[\w-]{1,80}$/.test(value.id) || ids.has(value.id)) throw new Error('节点标识无效或重复。');
      ids.add(value.id);
      if (typeof value.topic !== 'string' || value.topic.length > 4000) throw new Error('节点文字最多 4000 字符。');
      const result = {id: value.id, topic: value.topic, expanded: value.expanded !== false};
      if (value.hyperLink) {
        let url; try { url = new URL(value.hyperLink); } catch (_) { throw new Error('节点链接需为完整的 http 或 https 网址。'); }
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('节点链接仅支持 http 或 https 网址。');
        result.hyperLink = url.href;
      }
      if (color(value.branchColor)) result.branchColor = value.branchColor;
      if ([0, 1].includes(value.direction)) result.direction = value.direction;
      if (value.image) {
        const image = value.image;
        if (typeof image.url !== 'string' || !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(image.url)) {
          throw new Error('图片需随文件内嵌，格式支持 PNG、JPG 或 WebP。');
        }
        if (!Number.isFinite(image.width) || !Number.isFinite(image.height) || image.width < 20 || image.width > 720 || image.height < 10 || image.height > 1800) {
          throw new Error('图片显示尺寸无效。');
        }
        result.image = {url: image.url, width: image.width, height: image.height, fit: 'contain'};
      }
      if (value.style && typeof value.style === 'object') {
        const style = {};
        for (const name of ['color', 'background']) if (color(value.style[name])) style[name] = value.style[name];
        for (const [name, min, max] of [['fontSize', 12, 40], ['width', 120, 720]]) {
          const text = value.style[name];
          if (typeof text === 'string' && /^\d{2,3}px$/.test(text) && parseInt(text) >= min && parseInt(text) <= max) style[name] = text;
        }
        if (['400', '500', '600', '700'].includes(value.style.fontWeight)) style.fontWeight = value.style.fontWeight;
        if (Object.keys(style).length) result.style = style;
      }
      if (value.children !== undefined) {
        if (!Array.isArray(value.children)) throw new Error('子节点数据无效。');
        result.children = value.children.map(child => node(child, depth + 1));
      }
      return result;
    }
    if (raw.data.arrows?.length || raw.data.summaries?.length) throw new Error('此版本暂不支持导入关联线和概要。');
    const data = {nodeData: node(raw.data.nodeData), direction: [0, 1, 2, 3].includes(raw.data.direction) ? raw.data.direction : 1};
    if (raw.data.canvasItems !== undefined && !Array.isArray(raw.data.canvasItems)) throw new Error('自由元素数据无效。');
    data.canvasItems = (raw.data.canvasItems || []).map(item => {
      if (!item || !Number.isFinite(item.x) || !Number.isFinite(item.y) || Math.abs(item.x) > 100000 || Math.abs(item.y) > 100000) throw new Error('自由元素位置无效。');
      const content = node(item.node);
      if (content.children?.length) throw new Error('自由元素只支持独立文字或图片，请将分支保留在导图中。');
      return {x: item.x, y: item.y, node: content};
    });
    const title = typeof raw.title === 'string' ? raw.title.trim().slice(0, 120) : '文献导图';
    const result = {format: 'paper-mindmap', version: 2, title: title || '文献导图', updated: /^\d{4}-\d{2}-\d{2}$/.test(raw.updated) ? raw.updated : '', data};
    if (new Blob([JSON.stringify(result)]).size > MAX_FILE) throw new Error('导图文件超过 32 MB，请减少图片或使用较小的图片。');
    return result;
  }
  window.PaperMindmapDocument = {validate, MAX_FILE};
})();
