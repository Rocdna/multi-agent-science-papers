/* Read .xmind archives in the browser and convert them to the published document format. */
(() => {
  'use strict';
  const MAX_FILE = 32 * 1024 * 1024;
  const PALETTE = ['#8250b6', '#bc6e16', '#0969da', '#278267', '#68758c'];
  const MIME = {png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp'};
  const decoder = new TextDecoder('utf-8');
  const fail = message => { throw new Error(message); };

  function unzip(buffer) {
    if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 22) fail('文件不是有效的 .xmind 压缩包。');
    const view = new DataView(buffer), bytes = new Uint8Array(buffer);
    const u16 = offset => view.getUint16(offset, true), u32 = offset => view.getUint32(offset, true);
    let end = -1;
    for (let offset = bytes.length - 22; offset >= Math.max(0, bytes.length - 65557); offset--) {
      if (u32(offset) === 0x06054b50) { end = offset; break; }
    }
    if (end < 0) fail('文件不是有效的 .xmind 压缩包。');
    const count = u16(end + 10), offset = u32(end + 16);
    if (count === 0xffff || offset === 0xffffffff) fail('暂不支持 ZIP64 格式的 XMind 文件。');
    const entries = new Map();
    let position = offset;
    for (let index = 0; index < count; index++) {
      if (position + 46 > bytes.length || u32(position) !== 0x02014b50) fail('压缩包目录损坏。');
      const method = u16(position + 10), size = u32(position + 20);
      const nameLength = u16(position + 28), extraLength = u16(position + 30), commentLength = u16(position + 32);
      const local = u32(position + 42);
      const name = decoder.decode(bytes.subarray(position + 46, position + 46 + nameLength));
      if (size === 0xffffffff || local === 0xffffffff) fail('暂不支持 ZIP64 格式的 XMind 文件。');
      entries.set(name, {method, size, local});
      position += 46 + nameLength + extraLength + commentLength;
    }
    return {entries, bytes, view, u16, u32};
  }

  async function readEntry(zip, entry) {
    const {bytes, u16, u32} = zip;
    if (entry.local + 30 > bytes.length || u32(entry.local) !== 0x04034b50) fail('压缩包文件头损坏。');
    const start = entry.local + 30 + u16(entry.local + 26) + u16(entry.local + 28);
    const data = bytes.subarray(start, start + entry.size);
    if (entry.method === 0) return data;
    if (entry.method !== 8) fail('暂不支持此 XMind 文件的压缩方式。');
    if (typeof DecompressionStream === 'undefined') fail('当前浏览器无法解压 .xmind，请使用较新的 Chrome、Edge、Firefox 或 Safari。');
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  function findEntry(zip, name) {
    if (zip.entries.has(name)) return zip.entries.get(name);
    for (const [path, entry] of zip.entries) if (path.endsWith('/' + name)) return entry;
    return null;
  }

  function base64(bytes) {
    let text = '';
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      text += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    return btoa(text);
  }

  function safeLink(value) {
    if (typeof value !== 'string' || !value.trim()) return '';
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (_) { return ''; }
  }

  function makeIdFactory(used) {
    return raw => {
      let base = String(raw || '').replace(/[^\w-]/g, '').slice(0, 60) || 'topic';
      let id = base, index = 2;
      while (used.has(id)) id = `${base.slice(0, 70)}-${index++}`;
      used.add(id);
      return id;
    };
  }

  function clampImage(width, height) {
    let w = Number(width), h = Number(height);
    if (!(w > 0) || !(h > 0)) return null;
    const scale = Math.min(1, 720 / w, 1800 / h);
    w = Math.max(20, Math.round(w * scale));
    h = Math.max(10, Math.round(h * scale));
    return {width: w, height: h};
  }

  async function imageFromZip(image, zip) {
    if (!image || typeof image !== 'object') return null;
    let source = image.src || image.url;
    if (typeof source !== 'string') return null;
    let mime = '', bytes = null;
    const inline = source.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
    if (inline) {
      mime = `image/${inline[1]}`;
      const size = clampImage(image.width, image.height);
      if (!size) return null;
      return {url: source, ...size, fit: 'contain'};
    }
    if (!zip) return null;
    const resource = source.replace(/^xap:\/?\/?/, '').replace(/^\.?\//, '');
    const entry = findEntry(zip, decodeURIComponent(resource));
    if (!entry) return null;
    const extension = resource.split('.').pop().toLowerCase();
    mime = MIME[extension];
    if (!mime) return null;
    bytes = await readEntry(zip, entry);
    if (bytes.length > 8 * 1024 * 1024) return null;
    let size = clampImage(image.width, image.height);
    if (!size && typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(new Blob([bytes], {type: mime}));
        size = clampImage(bitmap.width, bitmap.height);
        bitmap.close?.();
      } catch (_) { size = null; }
    }
    if (!size) size = {width: 360, height: 240};
    return {url: `data:${mime};base64,${base64(bytes)}`, ...size, fit: 'contain'};
  }

  function sheetTitle(sheet, fallback) {
    return typeof sheet?.title === 'string' && sheet.title.trim() ? sheet.title.trim() : fallback;
  }

  async function fromJsonValue(value, fileName, zip) {
    const sheets = Array.isArray(value) ? value : value?.sheets;
    const sheet = Array.isArray(sheets) ? sheets[0] : value;
    if (!sheet?.rootTopic) fail('此 XMind 文件没有可显示的导图。');
    const used = new Set(), id = makeIdFactory(used);
    let count = 0;
    const map = async (topic, depth) => {
      if (!topic || typeof topic !== 'object') return null;
      if (++count > 500 || depth > 40) fail('导图超过 500 个节点或 40 层，暂不能显示。');
      const node = {
        id: depth === 0 ? 'root' : id(topic.id),
        topic: typeof topic.title === 'string' ? topic.title : '',
        expanded: topic.collapsed !== true && topic.branch !== 'folded',
      };
      if (depth === 0) used.add('root');
      const link = safeLink(topic.href || topic.link);
      if (link) node.hyperLink = link;
      const image = await imageFromZip(topic.image, zip);
      if (image) node.image = image;
      const attached = Array.isArray(topic.children?.attached) ? topic.children.attached : [];
      const detached = Array.isArray(topic.children?.detached) ? topic.children.detached : [];
      const children = [];
      for (const child of [...attached, ...detached]) {
        const mapped = await map(child, depth + 1);
        if (mapped) children.push(mapped);
      }
      if (children.length) node.children = children;
      return node;
    };
    const root = sheet.rootTopic;
    const nodeData = await map(root, 0);
    if (!nodeData) fail('此 XMind 文件没有可显示的导图。');
    const top = nodeData.children || [];
    top.forEach((child, index) => { child.branchColor = PALETTE[index % PALETTE.length]; });
    const structure = String(root.structureClass || sheet.structureClass || '');
    const direction = /logic\.left/i.test(structure) ? 0 : 1;
    return {
      format: 'paper-mindmap', version: 2,
      title: sheetTitle(sheet, fileName.replace(/\.(xmind|json)$/i, '') || '文献导图'),
      updated: '', data: {nodeData, direction, canvasItems: []},
    };
  }

  function childElement(parent, name) {
    for (const child of parent.children) if (child.tagName === name) return child;
    return null;
  }

  function fromXml(text, fileName) {
    const xml = new DOMParser().parseFromString(text, 'application/xml');
    if (xml.querySelector('parsererror')) fail('无法解析旧版 XMind 的 content.xml。');
    const sheet = xml.querySelector('sheet') || xml.documentElement;
    const root = sheet.querySelector('topic');
    if (!root) fail('此 XMind 文件没有可显示的导图。');
    const used = new Set(), id = makeIdFactory(used);
    let count = 0;
    const map = (topic, depth) => {
      if (++count > 500 || depth > 40) fail('导图超过 500 个节点或 40 层，暂不能显示。');
      const node = {
        id: depth === 0 ? 'root' : id(topic.getAttribute('id')),
        topic: childElement(topic, 'title')?.textContent || '',
        expanded: topic.getAttribute('branch') !== 'folded',
      };
      if (depth === 0) used.add('root');
      const link = safeLink(topic.getAttribute('xlink:href') || topic.getAttribute('href'));
      if (link) node.hyperLink = link;
      const children = [], group = childElement(topic, 'children');
      if (group) {
        for (const topics of group.children) {
          if (topics.tagName !== 'topics' || (topics.getAttribute('type') || 'attached') !== 'attached') continue;
          for (const child of topics.children) if (child.tagName === 'topic') children.push(map(child, depth + 1));
        }
      }
      if (children.length) node.children = children;
      return node;
    };
    const nodeData = map(root, 0);
    (nodeData.children || []).forEach((child, index) => { child.branchColor = PALETTE[index % PALETTE.length]; });
    return {
      format: 'paper-mindmap', version: 2,
      title: sheetTitle({title: childElement(sheet, 'title')?.textContent}, fileName.replace(/\.(xmind|json)$/i, '') || '文献导图'),
      updated: '', data: {nodeData, direction: 1, canvasItems: []},
    };
  }

  async function parse(buffer, fileName = '') {
    if (!(buffer instanceof ArrayBuffer)) fail('无法读取此文件。');
    if (buffer.byteLength > MAX_FILE) fail('文件不能超过 32 MB。');
    const zip = unzip(buffer);
    const json = findEntry(zip, 'content.json');
    if (json) {
      let value;
      try { value = JSON.parse(decoder.decode(await readEntry(zip, json))); } catch (_) { fail('XMind 的 content.json 不是有效的 JSON。'); }
      return window.PaperMindmapDocument.validate(await fromJsonValue(value, fileName, zip));
    }
    const xml = findEntry(zip, 'content.xml');
    if (xml) return window.PaperMindmapDocument.validate(fromXml(decoder.decode(await readEntry(zip, xml)), fileName));
    fail('未找到 XMind 内容文件；请使用 XMind 8 或更新版本导出的 .xmind 文件。');
  }

  async function parseJson(value, fileName = '') {
    return window.PaperMindmapDocument.validate(await fromJsonValue(value, fileName, null));
  }

  window.XMindImport = {parse, parseJson, MAX_FILE};
})();
