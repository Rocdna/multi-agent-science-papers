/* Recent repository updates and full-text search over the bundled public notes. */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const types = {'note-updated': '笔记更新', 'paper-added': '新增文献', 'paper-updated': '文献信息', 'rating-updated': '评级修订'};
  function returnFor(paperKey, searchResult = false) {
    const params = new URLSearchParams(location.search), query = byId('search').value.trim();
    if (query) params.set('q', query); else params.delete('q');
    const noteQuery = byId('notes-search').value.trim();
    if (noteQuery) params.set('noteq', noteQuery); else params.delete('noteq');
    return 'index.html' + (params.size ? '?' + params : '') + '#' + (searchResult ? 'note-search-panel' : new URLSearchParams({paper: paperKey}));
  }
  function noteUrl(paperKey, noteId, section = '', query = '') {
    const url = new URL('note.html', location.href);
    url.searchParams.set('id', paperKey); url.searchParams.set('note', noteId);
    url.searchParams.set('return', returnFor(paperKey, Boolean(query)));
    if (query) url.searchParams.set('find', query.slice(0, 160));
    if (section) url.hash = section;
    return url.href;
  }
  const updates = [...literatureUpdates].sort((a, b) => b.date.localeCompare(a.date));
  byId('recent-updates-date').textContent = updates[0]?.date || '暂无记录';
  updates.slice(0, 8).forEach(update => {
    const item = document.createElement('li'), meta = document.createElement('div');
    meta.className = 'update-meta';
    const time = document.createElement('time'); time.dateTime = update.date; time.textContent = update.date;
    const type = document.createElement('span'); type.textContent = types[update.type]; meta.append(time, type);
    const title = document.createElement(update.paperKey ? 'a' : 'span'); title.textContent = update.title;
    if (update.paperKey) {
      title.href = update.noteId ? noteUrl(update.paperKey, update.noteId)
        : 'index.html#' + new URLSearchParams({paper: update.paperKey});
    }
    item.append(meta, title);
    if (update.detail) { const detail = document.createElement('p'); detail.textContent = update.detail; item.append(detail); }
    byId('recent-updates-list').append(item);
  });
  if (!updates.length) byId('recent-updates-empty').hidden = false;
  const noteCount = Object.values(literatureNotes).reduce((total, notes) => total + (Array.isArray(notes) ? notes.length : 1), 0);
  byId('note-search-count').textContent = noteCount + ' 份';
  const input = byId('notes-search'), results = byId('note-search-results'), status = byId('note-search-status');
  let timer = null;
  function runSearch(updateUrl = true) {
    clearTimeout(timer); results.replaceChildren();
    const query = input.value.trim();
    if (updateUrl) {
      const url = new URL(location.href);
      if (query) url.searchParams.set('noteq', query); else url.searchParams.delete('noteq');
      history.replaceState(history.state, '', url);
    }
    if (!query) { status.textContent = '输入关键词查找笔记正文，多个词用空格分隔。'; return; }
    const matches = LiteratureNoteTools.search(query);
    if (!matches.length) { status.textContent = '没有找到匹配段落。试试更短的词，或减少关键词。'; return; }
    const count = new Set(matches.map(match => JSON.stringify([match.paperKey, match.noteId]))).size;
    status.textContent = '在 ' + count + ' 份笔记中找到 ' + matches.length + ' 个匹配章节' + (matches.length > 20 ? '，展示前 20 项。' : '。');
    matches.slice(0, 20).forEach(match => {
      const item = document.createElement('li'), link = document.createElement('a');
      link.textContent = match.title + ' · ' + match.sectionTitle;
      link.href = noteUrl(match.paperKey, match.noteId, match.section, query);
      const excerpt = document.createElement('p'); excerpt.textContent = match.excerpt;
      LiteratureNoteTools.highlight(excerpt, query);
      item.append(link, excerpt); results.append(item);
    });
  }
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(runSearch, 150); });
  input.addEventListener('search', () => runSearch());
  input.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); runSearch(); } });
  function refreshReturn(event) {
    const link = event.target.closest('a'); if (!link) return;
    const url = new URL(link.href);
    if (url.searchParams.has('return')) {
      url.searchParams.set('return', returnFor(url.searchParams.get('id'), url.searchParams.has('find'))); link.href = url.href;
    }
  }
  ['click', 'auxclick'].forEach(name => document.querySelector('.reading-discovery').addEventListener(name, refreshReturn));
  function restoreSearch() {
    input.value = (new URLSearchParams(location.search).get('noteq') || '').slice(0, 160);
    if (input.value) byId('note-search-panel').open = true;
    runSearch(false);
  }
  window.addEventListener('popstate', restoreSearch);
  restoreSearch();
})();
