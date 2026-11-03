// Explicit, insert-only bootstrap. Never run against D1 automatically during deployment.
import {readFile, writeFile, mkdir} from 'node:fs/promises';
const entries = JSON.parse(await readFile(new URL('../data/reading-status.json', import.meta.url), 'utf8'));
const statuses = Object.fromEntries(Object.entries(entries).map(([key, value]) => {
  if (!/^[A-Z0-9]{8}$/.test(key) || !['unread', 'reading', 'read'].includes(value.status)) {
    throw new Error('Invalid reading status: ' + key);
  }
  return [key, value.status];
}));
const schema = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
await mkdir(new URL('../db/', import.meta.url), {recursive: true});
const sql = schema + '\nINSERT OR IGNORE INTO reading_state (id, statuses_json, revision) VALUES (1, '
  + "'" + JSON.stringify(statuses).replaceAll("'", "''") + "', 1);\n";
await writeFile(new URL('../db/initial-reading.sql', import.meta.url), sql);
console.log(`Prepared insert-only bootstrap for ${Object.keys(statuses).length} reading statuses.`);
