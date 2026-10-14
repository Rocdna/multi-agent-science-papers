/* Static literature browsing: one set of filters, paginated rows, and Markdown notes. */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const rows = [...document.querySelectorAll('.paper-row')];
  const controls = {
    search: byId('search'), topic: byId('topic'), code: byId('code'), sort: byId('sort'),
    reading: byId('reading-filter'), notes: byId('notes-filter'), size: byId('page-size'),
  };
  const statusLabels = {unread: '未读', reading: '阅读中', read: '已读'};
  const statuses = literatureReadingStatuses;
  const defaultSize = () => innerWidth < 768 ? 10 : innerWidth < 992 ? 12 : 20;
  let selectedKind = '全部', currentPage = 1, pageSize = defaultSize(), customSize = false;
  let matchingRows = [], noteTrigger = null;
  const noteModalElement = byId('note-modal');
  const noteModal = new bootstrap.Modal(noteModalElement);
  const imageDialog = byId('note-image-dialog');
  const notesFor = paper => LiteratureNoteRenderer.list(paper.key);
  const statusFor = paper => Object.hasOwn(statusLabels, statuses[paper.key]) ? statuses[paper.key] : 'unread';
  const paperFor = row => papers[Number(row.dataset.id)];

  rows.forEach(row => {
    const paper = paperFor(row);
    const cell = document.createElement('td');
    cell.className = 'reading-cell'; cell.dataset.label = '阅读状态';
    const badge = document.createElement('span');
    badge.className = 'reading-status'; badge.dataset.status = statusFor(paper);
    badge.textContent = statusLabels[badge.dataset.status];
    badge.setAttribute('aria-label', paper.name + ' 阅读状态：' + badge.textContent);
    cell.append(badge); row.insertBefore(cell, row.querySelector('.resource'));
    const notes = notesFor(paper);
    if (notes.length) {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'note-button';
      const demoOnly = notes.every(note => note.demo);
      button.textContent = '笔记 · ' + notes.length + (demoOnly ? '（演示）' : '');
      button.setAttribute('aria-label', paper.name + ' 的 ' + notes.length + ' 份' + (demoOnly ? '演示笔记' : '笔记'));
      button.addEventListener('click', () => openNote(paper.key, button));
      row.querySelector('.resource').append(button);
    }
    row.dataset.expanded = 'false';
    row.querySelector('[data-detail]').addEventListener('click', event => {
      const button = event.currentTarget;
      const expanded = row.dataset.expanded !== 'true'; row.dataset.expanded = String(expanded);
      byId('detail-' + row.dataset.id).hidden = !expanded;
      button.setAttribute('aria-expanded', String(expanded));
      button.querySelector('.expand-symbol').textContent = expanded ? '－' : '＋';
    });
    byId('detail-' + row.dataset.id).querySelector('td').colSpan = 8;
  });

  function sortedRows() {
    const mode = controls.sort.value;
    return [...rows].sort((a, b) => {
      const x = paperFor(a), y = paperFor(b);
      const group = mode.startsWith('group') ? ['方法', '综述', '评测'].indexOf(x.kind) - ['方法', '综述', '评测'].indexOf(y.kind) : 0;
      return group || (mode.endsWith('asc') ? x.year - y.year : y.year - x.year) || x.name.localeCompare(y.name, 'zh-CN');
    });
  }

  function matches(paper) {
    const terms = controls.search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const text = [paper.name, paper.title, paper.topic, paper.summary, paper.venue, paper.year,
      paper.architecture, paper.index, paper.ccf, paper.codeState].join(' ').toLowerCase();
    return (selectedKind === '全部' || paper.kind === selectedKind)
      && (!controls.topic.value || paper.topic === controls.topic.value)
      && (!controls.code.value || (controls.code.value === 'yes' ? Boolean(paper.code) : !paper.code))
      && (!controls.reading.value || statusFor(paper) === controls.reading.value)
      && (!controls.notes.checked || notesFor(paper).length > 0)
      && terms.every(term => text.includes(term));
  }

  function updateSummary() {
    const labels = [];
    if (controls.topic.value) labels.push('方向：' + controls.topic.value);
    if (controls.code.value) labels.push('代码：' + controls.code.selectedOptions[0].text);
    if (controls.reading.value) labels.push('阅读：' + statusLabels[controls.reading.value]);
    if (controls.notes.checked) labels.push('仅看有笔记（含演示）');
    if (controls.sort.value !== 'group-asc') labels.push('排序：' + controls.sort.selectedOptions[0].text);
    byId('active-filters').textContent = labels.join(' · ');
    byId('active-filters').hidden = labels.length === 0;
    byId('filter-count').textContent = labels.length; byId('filter-count').hidden = labels.length === 0;
    byId('filter-result').textContent = '找到 ' + matchingRows.length + ' / ' + papers.length + ' 篇';
  }

  function pageButton(label, page, disabled = false, active = false) {
    const item = document.createElement('li'); item.className = 'page-item' + (active ? ' active' : '');
    const button = document.createElement('button'); button.type = 'button'; button.className = 'page-link';
    button.textContent = label; button.dataset.page = page; button.disabled = disabled;
    button.setAttribute('aria-label', /^\d+$/.test(label) ? '第 ' + label + ' 页' : label);
    if (active) button.setAttribute('aria-current', 'page');
    item.append(button); return item;
  }

  function renderPage(printing = false) {
    const totalPages = Math.max(1, Math.ceil(matchingRows.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * pageSize;
    const visible = printing ? matchingRows : matchingRows.slice(start, start + pageSize);
    const shown = new Set(visible);
    rows.forEach(row => {
      row.hidden = !shown.has(row);
      byId('detail-' + row.dataset.id).hidden = row.hidden || row.dataset.expanded !== 'true';
    });
    matchingRows.forEach((row, i) => { row.querySelector('.rownum').textContent = String(i + 1).padStart(2, '0'); });
    byId('empty').hidden = matchingRows.length > 0;
    const end = Math.min(start + pageSize, matchingRows.length);
    byId('count').textContent = matchingRows.length ? '找到 ' + matchingRows.length + ' / ' + papers.length + ' 篇 · 当前 ' + (start + 1) + '–' + end : '找到 0 / ' + papers.length + ' 篇';
    byId('page-summary').textContent = matchingRows.length ? '第 ' + currentPage + ' / ' + totalPages + ' 页' : '暂无结果';
    const navigation = byId('page-buttons'); navigation.replaceChildren();
    navigation.append(pageButton('上一页', currentPage - 1, currentPage === 1));
    const first = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    for (let page = first; page <= Math.min(totalPages, first + 4); page++) navigation.append(pageButton(String(page), page, false, page === currentPage));
    navigation.append(pageButton('下一页', currentPage + 1, currentPage === totalPages));
    byId('pagination-bar').hidden = printing;
    controls.size.value = String(pageSize); updateSummary();
  }

  function refresh(resetPage = true) {
    if (resetPage) currentPage = 1;
    const ordered = sortedRows(), tbody = document.querySelector('.catalog tbody');
    ordered.forEach(row => tbody.append(row, byId('detail-' + row.dataset.id)));
    matchingRows = ordered.filter(row => matches(paperFor(row)));
    renderPage();
  }

  document.querySelectorAll('.tab').forEach(button => button.addEventListener('click', () => {
    selectedKind = button.dataset.kind;
    document.querySelectorAll('.tab').forEach(tab => tab.setAttribute('aria-pressed', String(tab === button)));
    refresh();
  }));
  controls.search.addEventListener('input', () => refresh());
  ['topic', 'code', 'sort', 'reading', 'notes'].forEach(name => controls[name].addEventListener('change', () => refresh()));
  controls.size.addEventListener('change', () => {
    pageSize = Number(controls.size.value); customSize = true; refresh();
  });
  byId('page-buttons').addEventListener('click', event => {
    const button = event.target.closest('button[data-page]'); if (!button || button.disabled) return;
    currentPage = Number(button.dataset.page); renderPage();
    byId('page-buttons').querySelector('[aria-current="page"]').focus({preventScroll: true});
    document.querySelector('.catalog').scrollIntoView({behavior: 'smooth', block: 'start'});
  });
  byId('reset').addEventListener('click', () => {
    controls.search.value = ''; controls.topic.value = ''; controls.code.value = ''; controls.reading.value = '';
    controls.notes.checked = false; controls.sort.value = 'group-asc'; selectedKind = '全部';
    rows.forEach(row => {
      row.dataset.expanded = 'false'; const button = row.querySelector('[data-detail]');
      button.setAttribute('aria-expanded', 'false'); button.querySelector('.expand-symbol').textContent = '＋';
    });
    document.querySelectorAll('.tab').forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.kind === '全部')));
    refresh();
  });
  window.addEventListener('resize', () => {
    if (customSize || defaultSize() === pageSize) return;
    const firstItem = (currentPage - 1) * pageSize; pageSize = defaultSize();
    currentPage = Math.floor(firstItem / pageSize) + 1; renderPage();
  });
  window.addEventListener('beforeprint', () => renderPage(true));
  window.addEventListener('afterprint', () => renderPage());

  function openNote(key, trigger = null, noteId = null) {
    const paper = papers.find(item => item.key === key);
    const note = paper && LiteratureNoteRenderer.select(key, noteId); if (!note) return;
    noteTrigger = trigger;
    byId('note-title').textContent = paper.name + ' · ' + note.title;
    byId('note-updated').textContent = '更新于 ' + note.updated;
    byId('note-demo-warning').hidden = !note.demo;
    byId('note-paper-link').href = paper.paper; byId('note-source-link').href = note.file;
    LiteratureNoteRenderer.switcher(key, note.id, id => openNote(key, trigger, id));
    LiteratureNoteRenderer.render(note);
    byId('note-scroll').scrollTop = 0;
    history.replaceState(null, '', '#note=' + encodeURIComponent(key) + '&entry=' + encodeURIComponent(note.id));
    byId('note-permalink').href = 'note.html?id=' + encodeURIComponent(key) + '&note=' + encodeURIComponent(note.id);
    noteModal.show();
  }
  noteModalElement.addEventListener('hidden.bs.modal', () => {
    if (imageDialog.open) imageDialog.close();
    byId('note-content').querySelectorAll('video').forEach(video => video.pause());
    history.replaceState(null, '', location.pathname + location.search);
    if (noteTrigger && !noteTrigger.closest('.paper-row').hidden) noteTrigger.focus({preventScroll: true});
  });
  function openLinkedNote() {
    const params = new URLSearchParams(location.hash.slice(1));
    if (params.get('note')) openNote(params.get('note'), null, params.get('entry'));
  }
  window.addEventListener('hashchange', openLinkedNote);
  refresh();
  openLinkedNote();
})();
