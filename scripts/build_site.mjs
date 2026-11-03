// Stage only public files; never upload the workspace, credentials or dependencies.
import {mkdir, cp, readdir, rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.resolve(root, 'dist');
if (path.dirname(output) !== path.resolve(root) || path.basename(output) !== 'dist') {
  throw new Error('Unexpected output directory');
}
await rm(output, {recursive: true, force: true});
await mkdir(output, {recursive: true});
for (const directory of ['assets', 'vendor', 'notes']) {
  await cp(path.join(root, directory), path.join(output, directory), {
    recursive: true,
    filter: source => !['.DS_Store', 'Thumbs.db', '__pycache__'].includes(path.basename(source)),
  });
}
for (const entry of await readdir(root)) {
  if (/\.(html|ico|png)$/.test(entry) || ['ICON_CREDITS.md', 'Multi-agent_AI材料文献总结.md'].includes(entry)) {
    await cp(path.join(root, entry), path.join(output, entry));
  }
}
console.log('Built public site in dist/.');
