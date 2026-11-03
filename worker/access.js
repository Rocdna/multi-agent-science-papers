// Single-owner login: one Worker Secret and an HttpOnly, signed session cookie.
import {SignJWT, jwtVerify} from 'jose';

export class HttpError extends Error {
  constructor(status, message, code = 'request_failed') {
    super(message); this.status = status; this.code = code;
  }
}

export const SESSION_COOKIE = '__Host-paper_admin';
const SESSION_SECONDS = 8 * 60 * 60;
const encoder = new TextEncoder();

function passwordFor(env) {
  const password = env.ADMIN_PASSWORD;
  if (typeof password !== 'string' || password.trim().length < 16 || password.length > 128) {
    throw new HttpError(503, '请先在 Worker 中设置 ADMIN_PASSWORD Secret，密码需为 16～128 个字符。', 'password_not_configured');
  }
  return password;
}

async function sessionKey(env) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode('paper-admin-session:v1\0' + passwordFor(env))));
}

export function requireSameOrigin(request) {
  if (request.headers.get('Origin') !== new URL(request.url).origin) {
    throw new HttpError(403, '请在本站管理页面操作。', 'origin_required');
  }
}

export async function readJson(request, maxBytes = 16384) {
  if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') {
    throw new HttpError(415, '请求必须使用 JSON。');
  }
  if (Number(request.headers.get('Content-Length')) > maxBytes) throw new HttpError(413, '请求内容过多。');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, '缺少请求内容。');
  const chunks = []; let length = 0;
  while (true) {
    const {done, value} = await reader.read(); if (done) break;
    length += value.byteLength;
    if (length > maxBytes) { await reader.cancel(); throw new HttpError(413, '请求内容过多。'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(bytes)); }
  catch (_) { throw new HttpError(400, '无法读取请求内容。'); }
}

export async function login(request, env) {
  requireSameOrigin(request);
  const password = passwordFor(env);
  if (!env.LOGIN_LIMITER) throw new HttpError(503, '登录服务尚未配置，请使用项目的 Worker 配置部署。', 'limiter_not_configured');
  const key = 'paper-admin:' + (request.headers.get('CF-Connecting-IP') || 'unknown');
  if (!(await env.LOGIN_LIMITER.limit({key})).success) {
    throw new HttpError(429, '尝试次数较多，请一分钟后再试。', 'login_rate_limited');
  }
  const body = await readJson(request, 2048);
  if (!body || typeof body.password !== 'string' || body.password.length > 128) {
    throw new HttpError(400, '请输入管理员密码。');
  }
  const [expected, actual] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(password)),
    crypto.subtle.digest('SHA-256', encoder.encode(body.password)),
  ]);
  // Native HMAC verification compares fixed-length digests without JS string comparison.
  const comparisonKey = await crypto.subtle.importKey('raw', expected, {name: 'HMAC', hash: 'SHA-256'}, false, ['sign', 'verify']);
  const tag = await crypto.subtle.sign('HMAC', comparisonKey, expected);
  if (!await crypto.subtle.verify('HMAC', comparisonKey, tag, actual)) {
    throw new HttpError(401, '密码不正确。', 'incorrect_password');
  }
  const origin = new URL(request.url).origin;
  const token = await new SignJWT({role: 'admin'})
    .setProtectedHeader({alg: 'HS256', typ: 'JWT'})
    .setSubject('owner').setIssuer('paper-library').setAudience(origin)
    .setIssuedAt().setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_SECONDS)
    .sign(await sessionKey(env));
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`;
}

export function logout(request) {
  requireSameOrigin(request);
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function requireAdmin(request, env) {
  const key = await sessionKey(env);
  const cookies = (request.headers.get('Cookie') || '').split(';').map(item => item.trim());
  const tokens = cookies.filter(item => item.startsWith(SESSION_COOKIE + '='));
  if (tokens.length !== 1) throw new HttpError(401, '请输入管理员密码登录。', 'login_required');
  const token = tokens[0].slice(SESSION_COOKIE.length + 1);
  try {
    const {payload} = await jwtVerify(token, key, {
      issuer: 'paper-library', audience: new URL(request.url).origin,
      algorithms: ['HS256'], subject: 'owner', requiredClaims: ['exp', 'iat'],
      maxTokenAge: SESSION_SECONDS,
    });
    if (payload.role !== 'admin') throw new Error('Invalid role');
  } catch (_) {
    throw new HttpError(401, '登录已失效，请重新输入管理员密码。', 'login_required');
  }
  return {name: '管理员'};
}
