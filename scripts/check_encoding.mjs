import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const suspicious = /(\uFFFD|\?{2,}|锟斤拷|Ã.|â€)/;
const failures = [];

function inspect(value, source, location = '') {
  if (typeof value === 'string') {
    if (suspicious.test(value)) failures.push({source, location, value});
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => inspect(item, source, `${location}[${index}]`));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      inspect(item, source, location ? `${location}.${key}` : key);
    }
  }
}

for (const file of ['data/updates.json', 'data/reading-status.json', 'notes/index.json', 'mindmaps/library.json']) {
  const text = await readFile(path.join(root, file), 'utf8');
  inspect(JSON.parse(text), file);
}

const html = await readFile(path.join(root, 'index.html'), 'utf8');
const papers = html.match(/const papers=(\[.*?\]);/s);
if (!papers) throw new Error('papers array not found in index.html');
inspect(JSON.parse(papers[1]), 'index.html', 'papers');

if (failures.length) {
  console.error('Suspicious encoding detected:');
  for (const failure of failures) {
    console.error(`- ${failure.source} ${failure.location}: ${JSON.stringify(failure.value)}`);
  }
  process.exit(1);
}

console.log('Encoding check passed.');
