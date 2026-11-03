/* Static literature browsing: one set of filters, paginated rows, and Markdown notes. */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    byId('literature-catalog').focus({preventScroll: true});
    byId('literature-catalog').scrollIntoView({block: 'start', behavior: 'instant'});
  });
  const rows = [...document.querySelectorAll('.paper-row')];
  const controls = {
    search: byId('search'), topic: byId('topic'), code: byId('code'), sort: byId('sort'),
    reading: byId('reading-filter'), notes: byId('notes-filter'), size: byId('page-size'),
    ccf: byId('ccf-filter'), jcr: byId('jcr-filter'), cas: byId('cas-filter'),
  };
  const statusLabels = {unread: '未读', reading: '阅读中', read: '已读'};
  const statuses = literatureReadingStatuses;
  const defaultSize = () => innerWidth < 768 ? 10 : innerWidth < 992 ? 12 : 20;
  let selectedKind = '全部', currentPage = 1, pageSize = defaultSize(), customSize = false;
  let matchingRows = [], noteTrigger = null;
  let searchTimer = null, positionTimer = null, navigationFrame = null, closingViaHistory = false;
  const queryFields = {search: 'q', topic: 'topic', code: 'code', sort: 'sort', reading: 'reading', ccf: 'ccf', jcr: 'jcr', cas: 'cas'};
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
      button.textContent = '阅读笔记 · ' + notes.length;
      button.setAttribute('aria-label', paper.name + ' 的 ' + notes.length + ' 份笔记');
      button.addEventListener('click', () => openNote(paper.key, button));
      row.querySelector('.resource').append(button);
    }
    row.dataset.expanded = 'false';
    row.querySelector('[data-detail]').addEventListener('click', event => {
      const button = event.currentTarget;
      const expanded = row.dataset.expanded !== 'true'; row.dataset.expanded = String(expanded);
      const detail = byId('detail-' + row.dataset.id);
      detail.hidden = !expanded;
      button.setAttribute('aria-expanded', String(expanded));
      button.querySelector('.expand-symbol').textContent = expanded ? '－' : '＋';
      savePosition();
    });
    byId('detail-' + row.dataset.id).querySelector('td').colSpan = 6;
  });

  function sortedRows() {
    const mode = controls.sort.value;
    return [...rows].sort((a, b) => {
      const x = paperFor(a), y = paperFor(b);
      const group = mode.startsWith('group') ? ['方法', '综述', '评测'].indexOf(x.kind) - ['方法', '综述', '评测'].indexOf(y.kind) : 0;
      return group || (mode.endsWith('asc') ? x.year - y.year : y.year - x.year) || x.name.localeCompare(y.name, 'zh-CN');
    });
  }

  function matches(paper, skipRating = '') {
    const terms = skipRating === 'search' ? [] : controls.search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const text = [paper.name, paper.title, paper.topic, paper.summary, paper.venue, paper.year,
      paper.architecture, paper.index, 'CCF ' + paper.ccf, 'JCR ' + paper.jcr, '中科院 ' + paper.cas, paper.codeState].join(' ').toLowerCase();
    return (selectedKind === '全部' || paper.kind === selectedKind)
      && (!controls.topic.value || paper.topic === controls.topic.value)
      && (!controls.code.value || (controls.code.value === 'yes' ? Boolean(paper.code) : !paper.code))
      && (!controls.reading.value || statusFor(paper) === controls.reading.value)
      && (!controls.notes.checked || notesFor(paper).length > 0)
      && ratingNames.every(name => skipRating === 'ratings' || name === skipRating || ratingMatch(paper, name, controls[name].value))
      && terms.every(term => text.includes(term));
  }

  const ratingNames = ['ccf', 'jcr', 'cas'];
  ratingNames.forEach(name => [...controls[name].options].forEach(option => { option.dataset.label = option.textContent; }));
  function ratingMatch(paper, name, value) {
    if (!value) return true;
    if (name === 'ccf') return (paper.ccf || '待核验') === value;
    const rating = paper[name] || '—';
    if (value === 'none') return rating === '—';
    if (name === 'jcr') return rating.split(/\s*\/\s*/).includes(value);
    return value === 'top' ? rating.includes('Top') : rating.startsWith(value + '区');
  }
  function updateRatingCounts() {
    ratingNames.forEach(name => {
      const available = papers.filter(paper => matches(paper, name));
      [...controls[name].options].forEach(option => {
        const count = available.filter(paper => ratingMatch(paper, name, option.value)).length;
        option.textContent = option.dataset.label + '（' + count + '）';
      });
    });
    const count = ratingNames.filter(name => controls[name].value).length;
    byId('rating-filter-summary').textContent = count ? '已选 ' + count + ' 项' : '';
  }

  function updateSummary() {
    controls.topic.dataset.topic = controls.topic.value;
    window.LiteratureTopicPicker?.sync();
    const labels = [];
    if (selectedKind !== '全部') labels.push(['kind', '类型：' + selectedKind]);
    if (controls.search.value.trim()) labels.push(['search', '搜索：' + controls.search.value.trim()]);
    if (controls.topic.value) labels.push(['topic', '方向：' + controls.topic.value]);
    if (controls.code.value) labels.push(['code', '代码：' + controls.code.selectedOptions[0].text]);
    if (controls.reading.value) labels.push(['reading', '阅读：' + statusLabels[controls.reading.value]]);
    if (controls.notes.checked) labels.push(['notes', '仅看有笔记']);
    ratingNames.forEach(name => {
      if (controls[name].value) labels.push([name, controls[name].selectedOptions[0].dataset.label]);
    });
    if (controls.sort.value !== 'group-asc') labels.push(['sort', '排序：' + controls.sort.selectedOptions[0].text]);
    const chips = byId('active-filters');
    const existing = new Map([...chips.children].map(button => [button.dataset.filter, button]));
    chips.replaceChildren(...labels.map(([name, label]) => {
      const button = existing.get(name) || document.createElement('button');
      if (!existing.has(name)) {
        button.type = 'button'; button.className = 'filter-chip'; button.dataset.filter = name;
        button.innerHTML = '<span></span><span aria-hidden="true">×</span>';
      }
      button.firstElementChild.textContent = label;
      button.setAttribute('aria-label', '移除筛选：' + label);
      return button;
    }));
    chips.hidden = labels.length === 0;
    byId('filter-count').textContent = labels.length; byId('filter-count').hidden = labels.length === 0;
    byId('filter-result').textContent = '找到 ' + matchingRows.length + ' / ' + papers.length + ' 篇';
    document.querySelector('.filter-actions button').textContent = '查看 ' + matchingRows.length + ' 篇结果';
    updateEmpty(labels);
    updateRatingCounts();
  }

  function updateEmpty(labels) {
    const empty = byId('empty');
    if (matchingRows.length) return;
    if (!byId('empty-actions')) {
      empty.innerHTML = '<p class="empty-title">没有符合条件的文献</p><p id="empty-explanation"></p><div id="empty-actions" class="empty-actions"></div>';
    }
    byId('empty-explanation').textContent = labels.length ? '当前条件：' + labels.map(item => item[1]).join('；') + '。可以移除部分条件后再查看。' : '当前没有可展示的文献。';
    const actions = byId('empty-actions'); actions.replaceChildren();
    function action(name, label) {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.emptyAction = name; button.textContent = label; actions.append(button);
    }
    if (ratingNames.some(name => controls[name].value)) {
      const count = papers.filter(paper => matches(paper, 'ratings')).length;
      if (count) action('ratings', '清除评级，查看 ' + count + ' 篇');
    }
    if (controls.search.value.trim()) {
      const count = papers.filter(paper => matches(paper, 'search')).length;
      if (count) action('search', '清除搜索词，查看 ' + count + ' 篇');
    }
    action('reset', '重置全部');
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

  function snapshot() {
    return {scroll: window.scrollY, expanded: rows.filter(row => row.dataset.expanded === 'true').map(row => paperFor(row).key)};
  }
  function savePosition() {
    history.replaceState({...history.state, catalog: snapshot()}, '', location.href);
  }
  function catalogUrl() {
    const url = new URL(location.href); url.hash = '';
    Object.entries(queryFields).forEach(([name, parameter]) => {
      const value = name === 'search' ? controls[name].value.trim() : controls[name].value;
      if (value && !(name === 'sort' && value === 'group-asc')) url.searchParams.set(parameter, value);
      else url.searchParams.delete(parameter);
    });
    if (selectedKind !== '全部') url.searchParams.set('kind', selectedKind); else url.searchParams.delete('kind');
    if (controls.notes.checked) url.searchParams.set('notes', '1'); else url.searchParams.delete('notes');
    if (currentPage > 1) url.searchParams.set('page', currentPage); else url.searchParams.delete('page');
    if (customSize || currentPage > 1) url.searchParams.set('size', pageSize); else url.searchParams.delete('size');
    return url;
  }
  function commitList(mode = 'push') {
    const url = catalogUrl();
    if (history.state?.noteOverlay) url.hash = location.hash;
    const state = {...history.state, catalog: snapshot()};
    if (mode === 'replace' || url.href === location.href) history.replaceState(state, '', url);
    else history.pushState({...state, noteOverlay: false}, '', url);
  }
  function readCatalogUrl() {
    const params = new URLSearchParams(location.search);
    Object.entries(queryFields).forEach(([name, parameter]) => {
      const value = params.get(parameter) || '';
      if (name === 'search') controls[name].value = value;
      else controls[name].value = [...controls[name].options].some(option => option.value === value) ? value : name === 'sort' ? 'group-asc' : '';
    });
    const kind = params.get('kind'); selectedKind = ['方法', '综述', '评测'].includes(kind) ? kind : '全部';
    controls.notes.checked = params.get('notes') === '1';
    const size = params.get('size'); customSize = [...controls.size.options].some(option => option.value === size);
    pageSize = customSize ? Number(size) : defaultSize();
    const page = Number(params.get('page')); currentPage = Number.isSafeInteger(page) && page > 0 ? page : 1;
    syncKindButtons();
    if (ratingNames.some(name => controls[name].value)) document.querySelector('.rating-filters').open = true;
  }
  function syncKindButtons() {
    document.querySelectorAll('.tab').forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.kind === selectedKind)));
  }
  function restoreExpanded() {
    const expanded = new Set(history.state?.catalog?.expanded || []);
    rows.forEach(row => {
      const open = expanded.has(paperFor(row).key); row.dataset.expanded = String(open);
      const button = row.querySelector('[data-detail]'); button.setAttribute('aria-expanded', String(open));
      button.querySelector('.expand-symbol').textContent = open ? '－' : '＋';
    });
  }
  function restorePosition() {
    requestAnimationFrame(() => {
      if (location.hash === '#note-search-panel') {
        const panel = byId('note-search-panel'); panel.open = true;
        panel.scrollIntoView({block: 'start', behavior: 'instant'});
        panel.querySelector('summary').focus({preventScroll: true});
        return;
      }
      const key = new URLSearchParams(location.hash.slice(1)).get('paper');
      const row = key && matchingRows.find(item => paperFor(item).key === key);
      if (row) {
        if (row.hidden) {
          currentPage = Math.floor(matchingRows.indexOf(row) / pageSize) + 1; renderPage();
          const url = catalogUrl(); url.hash = new URLSearchParams({paper: key}).toString();
          history.replaceState({...history.state, catalog: snapshot()}, '', url);
        }
        row.scrollIntoView({block: 'center', behavior: 'instant'});
        row.classList.add('paper-returned');
        row.querySelector('[data-detail]').focus({preventScroll: true});
        setTimeout(() => row.classList.remove('paper-returned'), 2000);
      } else if (Number.isFinite(history.state?.catalog?.scroll)) window.scrollTo({top: history.state.catalog.scroll, behavior: 'instant'});
    });
  }
  function flushSearch() {
    if (searchTimer !== null) { clearTimeout(searchTimer); searchTimer = null; commitList(); }
  }
  function changeList(action) {
    flushSearch(); savePosition(); action(); refresh(); commitList();
  }
  function clearFilter(name) {
    if (name === 'kind') { selectedKind = '全部'; syncKindButtons(); }
    else if (name === 'notes') controls.notes.checked = false;
    else controls[name].value = name === 'sort' ? 'group-asc' : '';
  }
  function resetFilters() {
    Object.keys(queryFields).forEach(clearFilter); controls.notes.checked = false; clearFilter('kind');
    rows.forEach(row => {
      row.dataset.expanded = 'false'; const button = row.querySelector('[data-detail]');
      button.setAttribute('aria-expanded', 'false'); button.querySelector('.expand-symbol').textContent = '＋';
    });
  }

  document.querySelectorAll('.tab').forEach(button => button.addEventListener('click', () => {
    changeList(() => { selectedKind = button.dataset.kind; syncKindButtons(); });
  }));
  controls.search.addEventListener('input', () => {
    if (searchTimer === null) savePosition(); else clearTimeout(searchTimer);
    refresh();
    searchTimer = setTimeout(() => { searchTimer = null; commitList(); }, 300);
  });
  controls.search.addEventListener('search', flushSearch);
  ['topic', 'code', 'sort', 'reading', 'notes', ...ratingNames].forEach(name => controls[name].addEventListener('change', () => changeList(() => {})));
  controls.size.addEventListener('change', () => {
    changeList(() => { pageSize = Number(controls.size.value); customSize = true; });
  });
  byId('page-buttons').addEventListener('click', event => {
    const button = event.target.closest('button[data-page]'); if (!button || button.disabled) return;
    flushSearch(); savePosition(); currentPage = Number(button.dataset.page); renderPage(); commitList();
    byId('page-buttons').querySelector('[aria-current="page"]').focus({preventScroll: true});
    document.querySelector('.catalog').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start'});
  });
  byId('reset').addEventListener('click', () => changeList(resetFilters));
  byId('active-filters').addEventListener('click', event => {
    const button = event.target.closest('[data-filter]'); if (!button) return;
    const name = button.dataset.filter;
    const index = [...button.parentElement.children].indexOf(button);
    changeList(() => clearFilter(name));
    // Pointer removal needs no focus transfer; keyboard users need a next stop.
    if (event.detail !== 0) return;
    const chips = byId('active-filters').children;
    const control = name === 'kind' ? document.querySelector('.tab[aria-pressed="true"]')
      : name === 'topic' ? (window.LiteratureTopicPicker?.trigger || controls.topic) : controls[name];
    const fallback = [control, document.querySelector('.filter-toggle'), byId('reset')]
      .find(element => element?.getClientRects().length
        && !element.closest('details:not([open]),[hidden],[inert]')
        && getComputedStyle(element).visibility === 'visible');
    (chips[Math.min(index, chips.length - 1)] || fallback)?.focus({preventScroll: true});
  });
  byId('empty').addEventListener('click', event => {
    const button = event.target.closest('[data-empty-action]'); if (!button) return;
    changeList(() => {
      if (button.dataset.emptyAction === 'ratings') ratingNames.forEach(clearFilter);
      else if (button.dataset.emptyAction === 'search') clearFilter('search');
      else resetFilters();
    });
    controls.search.focus({preventScroll: true});
  });
  window.addEventListener('resize', () => {
    if (customSize || defaultSize() === pageSize) return;
    const firstItem = (currentPage - 1) * pageSize; pageSize = defaultSize();
    currentPage = Math.floor(firstItem / pageSize) + 1; renderPage(); commitList('replace');
  });
  window.addEventListener('beforeprint', () => renderPage(true));
  window.addEventListener('afterprint', () => renderPage());

  function openNote(key, trigger = null, noteId = null, section = '', fromHistory = false) {
    const paper = papers.find(item => item.key === key);
    const note = paper && LiteratureNoteRenderer.select(key, noteId); if (!note) return;
    if (!fromHistory) {
      flushSearch(); savePosition();
      const url = catalogUrl(); url.hash = new URLSearchParams({note: key, entry: note.id}).toString();
      const method = history.state?.noteOverlay ? 'replaceState' : 'pushState';
      history[method]({...history.state, noteOverlay: true, catalog: snapshot()}, '', url);
    }
    noteTrigger = trigger || rows.find(row => paperFor(row).key === key)?.querySelector('.note-button');
    byId('note-title').textContent = LiteratureNoteRenderer.title(paper.name, note.title);
    byId('note-updated').textContent = '更新于 ' + note.updated;
    byId('note-paper-link').href = paper.paper; byId('note-source-link').href = note.file;
    const returnUrl = catalogUrl(); returnUrl.hash = new URLSearchParams({paper: key}).toString();
    const permalink = new URL('note.html', location.href);
    permalink.searchParams.set('id', key); permalink.searchParams.set('note', note.id);
    permalink.searchParams.set('return', 'index.html' + returnUrl.search + returnUrl.hash);
    byId('note-permalink').href = permalink.href;
    LiteratureNoteRenderer.switcher(key, note.id, id => openNote(key, trigger, id));
    LiteratureNoteRenderer.render(note, key);
    byId('note-scroll').scrollTop = 0;
    noteModal.show();
    if (section) {
      if (noteModalElement.classList.contains('show')) requestAnimationFrame(() => LiteratureNoteRenderer.goToSection(section, false));
      else noteModalElement.addEventListener('shown.bs.modal', () => LiteratureNoteRenderer.goToSection(section, false), {once: true});
    }
  }
  noteModalElement.addEventListener('hide.bs.modal', () => {
    if (!closingViaHistory && history.state?.noteOverlay) {
      closingViaHistory = true;
      history.back();
    }
  });
  noteModalElement.addEventListener('hidden.bs.modal', () => {
    if (imageDialog.open) imageDialog.close();
    byId('note-content').querySelectorAll('video').forEach(video => video.pause());
    closingViaHistory = false;
    if (noteTrigger && !noteTrigger.closest('.paper-row').hidden) noteTrigger.focus({preventScroll: true});
    if (new URLSearchParams(location.hash.slice(1)).get('note')) scheduleNavigation();
  });
  function openLinkedNote() {
    const params = new URLSearchParams(location.hash.slice(1));
    const note = LiteratureNoteRenderer.select(params.get('note'), params.get('entry'));
    if (note) {
      history.replaceState({...history.state, noteOverlay: true}, '', location.href);
      openNote(params.get('note'), null, params.get('entry'), params.get('section'), true);
      return true;
    }
    return false;
  }
  function scheduleNavigation() {
    if (navigationFrame !== null) return;
    navigationFrame = requestAnimationFrame(() => {
      navigationFrame = null;
      if (searchTimer !== null) { clearTimeout(searchTimer); searchTimer = null; }
      if (byId('rating-dialog')?.open) byId('rating-dialog').close();
      readCatalogUrl(); restoreExpanded(); refresh(false);
      if (!openLinkedNote()) {
        if (noteModalElement.classList.contains('show')) {
          closingViaHistory = true; noteModal.hide();
        }
        restorePosition();
      }
    });
  }
  window.addEventListener('popstate', scheduleNavigation);
  window.addEventListener('hashchange', scheduleNavigation);
  window.addEventListener('scroll', () => {
    clearTimeout(positionTimer);
    positionTimer = setTimeout(() => { if (!history.state?.noteOverlay) savePosition(); }, 180);
  }, {passive: true});
  window.addEventListener('pagehide', () => { flushSearch(); savePosition(); });
  window.addEventListener('pageshow', () => {
    if (!new URLSearchParams(location.hash.slice(1)).get('note')) restorePosition();
  });
  const initialHash = location.hash;
  window.addEventListener('literature:reading-status', () => {
    rows.forEach(row => {
      const paper = paperFor(row), badge = row.querySelector('.reading-status');
      badge.dataset.status = statusFor(paper);
      badge.textContent = statusLabels[badge.dataset.status];
      badge.setAttribute('aria-label', paper.name + ' 阅读状态：' + badge.textContent);
    });
    refresh(false);
  });
  const initialNote = new URLSearchParams(initialHash.slice(1));
  const hadOverlayEntry = Boolean(history.state?.noteOverlay);
  readCatalogUrl(); restoreExpanded(); refresh(false);
  const initialState = {...history.state, noteOverlay: false, catalog: history.state?.catalog || snapshot()};
  const initialUrl = catalogUrl();
  if (!initialNote.get('note')) initialUrl.hash = initialHash;
  history.replaceState(initialState, '', initialUrl);
  if (initialNote.get('note') && LiteratureNoteRenderer.select(initialNote.get('note'), initialNote.get('entry'))) {
    initialUrl.hash = initialHash;
    history[hadOverlayEntry ? 'replaceState' : 'pushState']({...initialState, noteOverlay: true}, '', initialUrl);
    openLinkedNote();
  }
})();
