import {requireAdmin, login, logout, HttpError} from './access.js';
import {readState, updateState, catalog} from './reading.js';

export function json(value, status = 200) {
  return Response.json(value, {status, headers: {
    'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
  }});
}

export async function handleRequest(request, env, authenticate = requireAdmin) {
  try {
    const url = new URL(request.url);
    const adminPage = url.pathname === '/admin' || url.pathname.startsWith('/admin/');
    const adminApi = url.pathname.startsWith('/api/admin/');
    if (['/api/admin/login', '/api/admin/logout'].includes(url.pathname)) {
      if (request.method !== 'POST') throw new HttpError(405, '不支持此操作。');
      const cookie = url.pathname.endsWith('/login') ? await login(request, env) : logout(request);
      const response = json({ok: true}); response.headers.set('Set-Cookie', cookie); return response;
    }
    if (adminPage || adminApi) {
      if (adminPage) {
        if (!['GET', 'HEAD'].includes(request.method)) throw new HttpError(405, '不支持此操作。');
        const response = await env.ASSETS.fetch(request);
        const secured = new Response(response.body, response);
        secured.headers.set('Cache-Control', 'no-store');
        secured.headers.set('X-Frame-Options', 'DENY');
        secured.headers.set('Referrer-Policy', 'same-origin');
        return secured;
      }
      const user = await authenticate(request, env);
      if (url.pathname === '/api/admin/state' && request.method === 'GET') {
        return json({...await readState(env), user, catalog});
      }
      if (url.pathname === '/api/admin/reading-status' && request.method === 'PUT') {
        return json(await updateState(request, env));
      }
      throw new HttpError(405, '不支持此操作。');
    }
    if (url.pathname === '/api/reading-status') {
      if (!['GET', 'HEAD'].includes(request.method)) throw new HttpError(405, '阅读接口仅支持读取。');
      const state = await readState(env);
      return request.method === 'HEAD' ? new Response(null, {headers: {'Cache-Control': 'no-store'}}) : json(state);
    }
    if (url.pathname.startsWith('/api/')) throw new HttpError(404, '没有找到接口。');
    return env.ASSETS.fetch(request);
  } catch (error) {
    if (error instanceof HttpError) {
      const response = json({error: error.message, code: error.code}, error.status);
      if (error.status === 429) response.headers.set('Retry-After', '60');
      return response;
    }
    // Do not expose SQL, JWTs or account configuration to the browser.
    return json({error: '云端服务暂不可用，请稍后重试。', code: 'service_unavailable'}, 503);
  }
}

export default {fetch: (request, env) => handleRequest(request, env)};
