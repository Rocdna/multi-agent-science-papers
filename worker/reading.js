import {HttpError, requireSameOrigin, readJson} from './access.js';
import catalog from './catalog.json' with {type: 'json'};

export {catalog};
const allowedKeys = new Set(catalog.map(paper => paper.key));
const allowedStatuses = new Set(['unread', 'reading', 'read']);

export async function readState(env) {
  if (!env.DB) throw new HttpError(503, '云端数据库尚未绑定。', 'database_not_configured');
  const row = await env.DB.prepare('SELECT statuses_json, revision, updated_at FROM reading_state WHERE id = 1').first();
  if (!row) throw new HttpError(503, '请先导入初始阅读状态。', 'database_not_initialized');
  const values = JSON.parse(row.statuses_json);
  if (!values || typeof values !== 'object' || Array.isArray(values)
      || !Number.isSafeInteger(row.revision) || row.revision < 1
      || Object.values(values).some(value => !allowedStatuses.has(value))) {
    throw new HttpError(503, '云端阅读状态格式异常。', 'database_invalid');
  }
  return {statuses: values, revision: row.revision, updatedAt: row.updated_at, source: 'cloud'};
}

export async function updateState(request, env) {
  requireSameOrigin(request);
  const body = await readJson(request);
  if (!body || !Number.isSafeInteger(body.revision) || body.revision < 1
      || !Array.isArray(body.changes) || !body.changes.length || body.changes.length > 100) {
    throw new HttpError(400, '修改内容或版本无效。');
  }
  const seen = new Set();
  for (const change of body.changes) {
    if (!change || !allowedKeys.has(change.key) || !allowedStatuses.has(change.status) || seen.has(change.key)) {
      throw new HttpError(400, '存在未知论文、重复论文或无效阅读状态。');
    }
    seen.add(change.key);
  }
  const current = await readState(env);
  if (current.revision !== body.revision) throw new HttpError(409, '其他页面已更新状态，请重新加载云端记录后再保存。', 'revision_conflict');
  const statuses = {...current.statuses};
  body.changes.forEach(({key, status}) => { statuses[key] = status; });
  const updatedAt = new Date().toISOString();
  const result = await env.DB.prepare(
    'UPDATE reading_state SET statuses_json = ?, revision = revision + 1, updated_at = ? WHERE id = 1 AND revision = ?'
  ).bind(JSON.stringify(statuses), updatedAt, body.revision).run();
  if (result.meta.changes !== 1) throw new HttpError(409, '其他页面已更新状态，请重新加载云端记录后再保存。', 'revision_conflict');
  return {statuses, revision: body.revision + 1, updatedAt, source: 'cloud'};
}
