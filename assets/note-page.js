/* A real document page for the same Markdown shown in the note modal. */
(() => {
  const byId = id => document.getElementById(id);
  document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    const target = byId('note-page-content').hidden ? byId('note-error') : byId('note-content');
    target.focus({preventScroll: true});
    target.scrollIntoView({block: 'start', behavior: 'instant'});
  });
  const params = new URLSearchParams(location.search);
  const key = params.get('id');
  if (params.has('return')) {
    try {
      const expected = new URL('index.html', location.href);
      const target = new URL(params.get('return'), location.href);
      if (target.origin === expected.origin && target.pathname === expected.pathname && !target.username && !target.password) {
        document.querySelectorAll('a[href="index.html"]').forEach(link => { link.href = target.href; });
      }
    } catch (_) { /* Keep the regular catalog link for malformed return URLs. */ }
  }
  function showNote(noteId = null, section = '') {
    const note = key && LiteratureNoteRenderer.select(key, noteId);
    if (!note) { byId('note-error').hidden = false; return; }
    const title = LiteratureNoteRenderer.title(note.paper.name, note.title);
    document.title = title + ' · Multi-agent × AI 材料';
    byId('note-title').textContent = title;
    byId('note-paper-title').textContent = note.paper.title;
    byId('note-updated').textContent = '更新于 ' + note.updated;
    byId('note-paper-link').href = note.paper.url;
    byId('note-source-link').href = note.file;
    const labels = {unread: '未读', reading: '阅读中', read: '已读'};
    const saved = literatureReadingStatuses[key];
    const status = Object.hasOwn(labels, saved) ? saved : 'unread';
    byId('note-reading').textContent = '论文：' + labels[status];
    byId('note-reading').dataset.status = status;
    LiteratureNoteRenderer.switcher(key, note.id, id => {
      showNote(id);
      document.querySelector('.note-page-header').scrollIntoView({behavior: 'smooth', block: 'start'});
    });
    LiteratureNoteRenderer.render(note, key);
    byId('note-page-content').hidden = false;
    const url = new URL(location.href);
    url.searchParams.set('note', note.id); url.hash = '';
    history.replaceState(history.state, '', url);
    if (section) {
      const jump = () => requestAnimationFrame(() => LiteratureNoteRenderer.goToSection(section, false));
      if (document.readyState === 'complete') jump();
      else window.addEventListener('pageshow', jump, {once: true});
    }
  }
  let section = '';
  try { section = decodeURIComponent(location.hash.slice(1)); } catch (_) { /* Ignore malformed anchors. */ }
  showNote(params.get('note'), section);
})();
