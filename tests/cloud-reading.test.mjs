import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {SignJWT} from 'jose';
import {requireAdmin, SESSION_COOKIE} from '../worker/access.js';
import {handleRequest} from '../worker/index.js';

const seed = readFileSync(new URL('../db/initial-reading.sql', import.meta.url), 'utf8');
const seededStatuses = JSON.parse(seed.match(/'(\{.*\})'/s)[1]);
const origin = 'https://rocaler.asia';
const allowed = async () => ({email: 'owner@example.com'});
function database() {
  const sqlite = new DatabaseSync(':memory:'); sqlite.exec(seed);
  return {sqlite, prepare(sql) {
    const statement = sqlite.prepare(sql);
    const bound = values => ({
      first: async () => statement.get(...values),
      run: async () => ({meta: {changes: Number(statement.run(...values).changes)}}),
    });
    return {...bound([]), bind: (...values) => bound(values)};
  }};
}
const get = (path = '/api/reading-status') => new Request(origin + path);
const put = (body, headers = {}) => new Request(origin + '/api/admin/reading-status', {
  method: 'PUT', headers: {'Origin': origin, 'Content-Type': 'application/json', ...headers}, body: JSON.stringify(body),
});

test('public read returns current states, with no account information and no cache', async () => {
  const response = await handleRequest(get(), {DB: database()});
  assert.equal(response.status, 200); assert.equal(response.headers.get('Cache-Control'), 'no-store');
  const data = await response.json();
  for (const key of ['3EUZQ7ES', '5JRG9I4N', 'AJ2BNI5M', '2MZNLYUP', 'AGAN7FLD', 'MPCAT8WK', 'EPTEEW67', 'MWYYFXHF', '9SWXEZFL']) assert.equal(data.statuses[key], 'read');
  assert.equal(Object.keys(data.statuses).length, Object.keys(seededStatuses).length); assert.equal(data.user, undefined); assert.equal(data.catalog, undefined);
});

test('batch save persists atomically and rejects stale revisions', async () => {
  const env = {DB: database()};
  const response = await handleRequest(put({revision: 1, changes: [
    {key: 'R6WYYSJE', status: 'read'}, {key: 'W5N9QU8N', status: 'reading'},
  ]}), env, allowed);
  assert.equal(response.status, 200); assert.equal((await response.json()).revision, 2);
  const state = await (await handleRequest(get(), env)).json();
  assert.equal(state.statuses.R6WYYSJE, 'read'); assert.equal(state.statuses.W5N9QU8N, 'reading');
  const stale = await handleRequest(put({revision: 1, changes: [{key: 'R6WYYSJE', status: 'unread'}]}), env, allowed);
  assert.equal(stale.status, 409);
  assert.equal((await (await handleRequest(get(), env)).json()).statuses.R6WYYSJE, 'read');
});

test('a competing write between read and update is rejected without overwriting', async () => {
  const db = database(), original = db.prepare.bind(db);
  db.prepare = sql => {
    if (sql.startsWith('UPDATE')) db.sqlite.exec('UPDATE reading_state SET revision = revision + 1 WHERE id = 1');
    return original(sql);
  };
  const response = await handleRequest(put({revision: 1, changes: [{key: 'R6WYYSJE', status: 'read'}]}), {DB: db}, allowed);
  assert.equal(response.status, 409);
  assert.equal(JSON.parse(db.sqlite.prepare('SELECT statuses_json FROM reading_state').get().statuses_json).R6WYYSJE, 'unread');
});

test('invalid batches never partially save', async () => {
  const env = {DB: database()};
  for (const changes of [
    [{key: 'R6WYYSJE', status: 'read'}, {key: 'UNKNOWN1', status: 'read'}],
    [{key: 'R6WYYSJE', status: 'read'}, {key: 'R6WYYSJE', status: 'unread'}],
    [{key: 'R6WYYSJE', status: 'invalid'}], [],
  ]) assert.equal((await handleRequest(put({revision: 1, changes}), env, allowed)).status, 400);
  const state = await (await handleRequest(get(), env)).json();
  assert.equal(state.revision, 1); assert.equal(state.statuses.R6WYYSJE, 'unread');
});

test('cross-origin writes, non-JSON, oversized requests and public writes fail', async () => {
  const env = {DB: database()}, body = {revision: 1, changes: [{key: 'R6WYYSJE', status: 'read'}]};
  assert.equal((await handleRequest(put(body, {Origin: 'https://other.example'}), env, allowed)).status, 403);
  assert.equal((await handleRequest(put(body, {Origin: ''}), env, allowed)).status, 403);
  assert.equal((await handleRequest(put(body, {'Content-Type': 'text/plain'}), env, allowed)).status, 415);
  assert.equal((await handleRequest(put({...body, padding: 'x'.repeat(17000)}), env, allowed)).status, 413);
  assert.equal((await handleRequest(new Request(origin + '/api/reading-status', {method: 'POST'}), env)).status, 405);
});

test('bootstrap is insert-only, and unavailable databases return errors', async () => {
  const db = database(); db.sqlite.exec('UPDATE reading_state SET revision = 42'); db.sqlite.exec(seed);
  assert.equal(db.sqlite.prepare('SELECT revision FROM reading_state').get().revision, 42);
  assert.equal((await handleRequest(get(), {})).status, 503);
  db.sqlite.exec('DELETE FROM reading_state');
  assert.equal((await handleRequest(get(), {DB: db})).status, 503);
});

test('login shell is public but administrative data requires authentication', async () => {
  let assetCalls = 0;
  const env = {ASSETS: {fetch() { assetCalls++; return new Response('admin'); }}};
  for (const route of ['/api/admin/state', '/api/admin/reading-status']) {
    assert.equal((await handleRequest(get(route), env)).status, 503);
  }
  assert.equal(assetCalls, 0);
  const response = await handleRequest(get('/admin/'), env, allowed);
  assert.equal(response.status, 200); assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal(response.headers.get('X-Frame-Options'), 'DENY');
});

const testPassword = 'test-only-admin-password-2026';
const postLogin = (password = testPassword, headers = {}) => new Request(origin + '/api/admin/login', {
  method: 'POST', headers: {Origin: origin, 'Content-Type': 'application/json', ...headers}, body: JSON.stringify({password}),
});
const authEnv = () => ({ADMIN_PASSWORD: testPassword, LOGIN_LIMITER: {limit: async () => ({success: true})}, DB: database()});

test('password login, authenticated read/write, logout and anonymous rejection', async () => {
  const env = authEnv();
  assert.equal((await handleRequest(get('/api/admin/state'), env)).status, 401);
  const signedIn = await handleRequest(postLogin(), env);
  assert.equal(signedIn.status, 200);
  const cookie = signedIn.headers.get('Set-Cookie');
  for (const flag of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/', 'Max-Age=28800']) assert.ok(cookie.includes(flag));
  assert.ok(!cookie.includes(testPassword));
  const session = cookie.split(';')[0];
  const response = await handleRequest(new Request(origin + '/api/admin/state', {headers: {Cookie: session}}), env);
  assert.equal(response.status, 200); assert.equal((await response.json()).user.name, '管理员');
  const write = put({revision: 1, changes: [{key: 'R6WYYSJE', status: 'read'}]}, {Cookie: session});
  assert.equal((await handleRequest(write, env)).status, 200);
  const loggedOut = await handleRequest(new Request(origin + '/api/admin/logout', {method: 'POST', headers: {Origin: origin}}), env);
  assert.equal(loggedOut.status, 200); assert.ok(loggedOut.headers.get('Set-Cookie').includes('Max-Age=0'));
  assert.equal((await handleRequest(get('/api/admin/state'), env)).status, 401);
});

test('incorrect password, unconfigured secrets, missing limiter and cross-origin login fail', async () => {
  const env = authEnv();
  assert.equal((await handleRequest(postLogin('incorrect'), env)).status, 401);
  assert.equal((await handleRequest(postLogin(), {})).status, 503);
  assert.equal((await handleRequest(postLogin(), {...env, ADMIN_PASSWORD: 'short'})).status, 503);
  assert.equal((await handleRequest(postLogin(), {...env, LOGIN_LIMITER: undefined})).status, 503);
  assert.equal((await handleRequest(postLogin(testPassword, {Origin: 'https://other.example'}), env)).status, 403);
  assert.equal((await handleRequest(postLogin(testPassword, {Origin: ''}), env)).status, 403);
  assert.equal((await handleRequest(postLogin(testPassword, {'Content-Type': 'text/plain'}), env)).status, 415);
  assert.equal((await handleRequest(get('/api/admin/logout'), env)).status, 405);
  assert.equal((await handleRequest(new Request(origin + '/api/admin/logout', {method: 'POST'}), env)).status, 403);
});

test('login rate limiter blocks further attempts and provides retry information', async () => {
  const env = authEnv(); let attempts = 0;
  env.LOGIN_LIMITER.limit = async ({key}) => { assert.ok(key.startsWith('paper-admin:')); return {success: ++attempts <= 5}; };
  for (let i = 0; i < 5; i++) assert.equal((await handleRequest(postLogin('wrong'), env)).status, 401);
  const response = await handleRequest(postLogin(), env);
  assert.equal(response.status, 429); assert.equal(response.headers.get('Retry-After'), '60');
});

test('tampered, expired, duplicate and cross-site sessions fail; changing password revokes sessions', async () => {
  const env = authEnv();
  const response = await handleRequest(postLogin(), env);
  const cookie = response.headers.get('Set-Cookie').split(';')[0];
  const requestFor = value => new Request(origin + '/api/admin/state', {headers: {Cookie: value}});
  assert.equal((await requireAdmin(requestFor(cookie), env)).name, '管理员');
  await assert.rejects(() => requireAdmin(requestFor(cookie.slice(0, -12) + 'xxxxxxxxxxxx'), env), {status: 401});
  await assert.rejects(() => requireAdmin(requestFor(cookie + '; ' + cookie), env), {status: 401});
  await assert.rejects(() => requireAdmin(requestFor(cookie), {...env, ADMIN_PASSWORD: 'different-admin-password-2026'}), {status: 401});
  await assert.rejects(() => requireAdmin(new Request('https://other.example/api/admin/state', {headers: {Cookie: cookie}}), env), {status: 401});
  const key = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('paper-admin-session:v1\0' + testPassword)));
  const expired = await new SignJWT({role: 'admin'}).setProtectedHeader({alg: 'HS256'})
    .setSubject('owner').setIssuer('paper-library').setAudience(origin).setIssuedAt(1).setExpirationTime(2).sign(key);
  await assert.rejects(() => requireAdmin(requestFor(SESSION_COOKIE + '=' + expired), env), {status: 401});
});
