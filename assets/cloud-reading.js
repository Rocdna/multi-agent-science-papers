/* Cloud status overlays the published snapshot; reading remains usable offline. */
(() => {
  'use strict';
  const labels = {unread: '未读', reading: '阅读中', read: '已读'};
  let synced = false, busy = false;
  const hint = document.createElement('span');
  hint.id = 'reading-sync'; hint.className = 'reading-sync'; hint.setAttribute('role', 'status');
  (document.querySelector('.catalog-top') || document.querySelector('.note-page-header .note-meta'))?.append(hint);

  function fallback() {
    hint.textContent = synced ? '阅读状态：最近同步记录' : '阅读状态：离线副本';
    hint.title = synced ? '暂时无法连接云端，当前显示本次打开页面后最近成功同步的状态。'
      : '当前显示随网站发布的状态，可能落后于云端；连接恢复后会重新同步。';
  }
  async function refresh() {
    if (location.protocol === 'file:') { fallback(); return; }
    if (busy) return;
    busy = true;
    if (!synced) hint.textContent = '正在同步阅读状态…';
    try {
      const response = await fetch('/api/reading-status', {cache: 'no-store', signal: AbortSignal.timeout(6000)});
      if (!response.ok || !response.headers.get('Content-Type')?.includes('application/json')) throw new Error('Not available');
      const data = await response.json();
      if (data.source !== 'cloud' || !data.statuses || typeof data.statuses !== 'object'
          || Array.isArray(data.statuses) || Object.values(data.statuses).some(value => !Object.hasOwn(labels, value))) {
        throw new Error('Invalid state');
      }
      for (const key of new Set([...Object.keys(literatureReadingStatuses), ...Object.keys(data.statuses)])) {
        if (!/^[A-Z0-9]{8}$/.test(key)) continue;
        literatureReadingStatuses[key] = Object.hasOwn(data.statuses, key) ? data.statuses[key] : 'unread';
      }
      synced = true; hint.textContent = '阅读状态已同步'; hint.title = '显示云端记录，返回页面时会再次检查。';
      window.dispatchEvent(new CustomEvent('literature:reading-status'));
    } catch (_) { fallback(); }
    finally { busy = false; }
  }
  window.addEventListener('online', refresh);
  window.addEventListener('pageshow', event => { if (event.persisted) refresh(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  // Let the catalog and note reader install their listeners before the first response.
  setTimeout(refresh, 0);
})();
