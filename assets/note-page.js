/* A real document page for the same Markdown shown in the note modal. */
(() => {
  const byId = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const key = params.get('id');
  function showNote(noteId = null) {
    const note = key && LiteratureNoteRenderer.select(key, noteId);
    if (!note) { byId('note-error').hidden = false; return; }
    const title = note.paper.name + ' · ' + note.title;
    document.title = title + ' · Multi-agent × AI 材料';
    byId('note-title').textContent = title;
    byId('note-paper-title').textContent = note.paper.title;
    byId('note-updated').textContent = '更新于 ' + note.updated;
    byId('note-paper-link').href = note.paper.url;
    byId('note-source-link').href = note.file;
    byId('note-demo-warning').hidden = !note.demo;
    const labels = {unread: '未读', reading: '阅读中', read: '已读'};
    const saved = literatureReadingStatuses[key];
    const status = Object.hasOwn(labels, saved) ? saved : 'unread';
    byId('note-reading').textContent = labels[status];
    byId('note-reading').dataset.status = status;
    LiteratureNoteRenderer.switcher(key, note.id, id => {
      showNote(id);
      document.querySelector('.note-page-header').scrollIntoView({behavior: 'smooth', block: 'start'});
    });
    LiteratureNoteRenderer.render(note);
    byId('note-page-content').hidden = false;
    const url = new URL(location.href);
    url.searchParams.set('note', note.id); url.hash = '';
    history.replaceState(null, '', url);
  }
  showNote(params.get('note'));
})();
