import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import {deflateRawSync} from 'node:zlib';

const ROOT = new URL('../', import.meta.url);
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jNSkAAAAASUVORK5CYII=', 'base64');

globalThis.window = {};
for (const file of ['assets/mindmap-schema.js', 'assets/xmind-import.js']) {
  vm.runInThisContext(await readFile(new URL(file, ROOT), 'utf8'), {filename: file});
}

function crc32(buffer) {
  let value, crc = 0xffffffff;
  for (const byte of buffer) {
    value = (crc ^ byte) & 0xff;
    for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    crc = (crc >>> 8) ^ value;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function archive(files) {
  const local = [], central = [];
  let offset = 0;
  for (const [name, data] of files) {
    const nameBytes = Buffer.from(name), packed = deflateRawSync(data), crc = crc32(data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(20, 4); header.writeUInt16LE(8, 8);
    header.writeUInt32LE(crc, 14); header.writeUInt32LE(packed.length, 18); header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(nameBytes.length, 26);
    const entry = Buffer.concat([header, nameBytes, packed]);
    local.push(entry);
    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50, 0); directory.writeUInt16LE(20, 4); directory.writeUInt16LE(20, 6); directory.writeUInt16LE(8, 10);
    directory.writeUInt32LE(crc, 16); directory.writeUInt32LE(packed.length, 20); directory.writeUInt32LE(data.length, 24);
    directory.writeUInt16LE(nameBytes.length, 28); directory.writeUInt32LE(offset, 42);
    central.push(Buffer.concat([directory, nameBytes]));
    offset += entry.length;
  }
  const filesPart = Buffer.concat(local), directoryPart = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(directoryPart.length, 12); end.writeUInt32LE(filesPart.length, 16);
  return Buffer.concat([filesPart, directoryPart, end]);
}

function xmind(sheet) {
  const value = archive([['content.json', Buffer.from(JSON.stringify([sheet]))], ['resources/pic.png', PNG]]);
  return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
}

test('XMind content.json keeps hierarchy, links, images and duplicate-safe IDs', async () => {
  const doc = await window.XMindImport.parse(xmind({
    title: '测试导图',
    rootTopic: {
      title: '根主题',
      children: {attached: [
        {id: 'a', title: '分支 A', href: 'https://example.com', image: {src: 'xap:resources/pic.png', width: 200, height: 100},
          children: {attached: [{id: 'a1', title: '子主题'}]}},
        {id: 'b', title: '分支 B', collapsed: true},
        {id: 'b', title: '重复 ID'},
      ], detached: [{id: 'd', title: '自由主题'}]},
    },
  }), 'demo.xmind');

  assert.equal(doc.format, 'paper-mindmap');
  assert.equal(doc.version, 2);
  assert.equal(doc.title, '测试导图');
  assert.equal(doc.data.nodeData.id, 'root');
  assert.equal(doc.data.nodeData.children.length, 4);
  assert.equal(doc.data.nodeData.children[0].children[0].topic, '子主题');
  assert.match(doc.data.nodeData.children[0].hyperLink, /^https:\/\/example\.com\//);
  assert.match(doc.data.nodeData.children[0].image.url, /^data:image\/png;base64,/);
  assert.equal(doc.data.nodeData.children[1].expanded, false);
  assert.equal(doc.data.nodeData.children[2].id, 'b-2');
  assert.equal(doc.data.nodeData.children[3].topic, '自由主题');
  assert.ok(doc.data.nodeData.children.every(node => node.branchColor));
});

test('XMind content.json can be imported directly without the archive', async () => {
  const doc = await window.XMindImport.parseJson([{
    title: '直接导入',
    rootTopic: {title: '根', children: {attached: [{id: 'a', title: '分支', image: {src: 'xap:resources/missing.png', width: 200, height: 100}}]}},
  }], 'content.json');
  assert.equal(doc.title, '直接导入');
  assert.equal(doc.data.nodeData.children[0].topic, '分支');
  assert.equal(doc.data.nodeData.children[0].image, undefined);
});

test('XMind parser rejects missing content and oversized trees', async () => {
  const unrelated = archive([['other.txt', Buffer.from('x')]]);
  await assert.rejects(() => window.XMindImport.parse(unrelated.buffer.slice(unrelated.byteOffset, unrelated.byteOffset + unrelated.byteLength), 'bad.xmind'), /未找到 XMind 内容文件/);
  const children = Array.from({length: 500}, (_, index) => ({id: `n-${index}`, title: `主题 ${index}`}));
  await assert.rejects(() => window.XMindImport.parse(xmind({title: '大图', rootTopic: {title: '根', children: {attached: children}}}), 'big.xmind'), /500 个节点/);
});
