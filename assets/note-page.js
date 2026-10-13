/* A real document page for the same Markdown shown in the note modal. */
(() => {
  const byId = id => document.getElementById(id);
  const key = new URLSearchParams(location.search).get('id');
  const note = key && Object.hasOwn(literatureNotes, key) ? literatureNotes[key] : null;
  if (!note) { byId('note-error').hidden = false; return; }
  const title = note.paper.name + ' · ' + (note.demo ? '演示笔记' : '阅读笔记');
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
  LiteratureNoteRenderer.render(note);
  byId('note-page-content').hidden = false;
})();
