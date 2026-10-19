/* Shared Markdown rendering for the note modal and standalone reader. */
(() => {
  const byId = id => document.getElementById(id);
  const imageDialog = byId('note-image-dialog');
  const scrollRoot = byId('note-scroll');
  const mobile = matchMedia('(max-width: 991.98px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let headings = [], activeHeading = null, scrollFrame = null;
  let activeNote = null, activePaperKey = '', progressUnlocked = false, progressTimer = null, printing = false;
  let fontSize = 'default';
  try { fontSize = localStorage.getItem('literature-note-font') || 'default'; } catch (_) { /* Reading works without storage. */ }
  if (!['default', 'large', 'larger'].includes(fontSize)) fontSize = 'default';
  function title(paperName, noteTitle) {
    return noteTitle.toLowerCase().startsWith(paperName.toLowerCase()) ? noteTitle : paperName + ' · ' + noteTitle;
  }
  function list(key) {
    if (!Object.hasOwn(literatureNotes, key)) return [];
    const value = literatureNotes[key];
    return Array.isArray(value) ? value : [{...value, id: value.id || 'main'}];
  }
  function select(key, id = null) {
    const notes = list(key);
    return id === null ? notes[0] : notes.find(note => note.id === id);
  }
  function switcher(key, activeId, onSelect) {
    const notes = list(key), menu = byId('note-list'), dropdown = byId('note-select');
    menu.replaceChildren(); dropdown.replaceChildren();
    byId('note-total').textContent = notes.length + ' 份';
    document.querySelector('.note-collection').hidden = notes.length < 2;
    document.querySelector('.note-mobile-switcher').hidden = notes.length < 2;
    notes.forEach(note => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'note-choice'; button.dataset.noteId = note.id;
      button.setAttribute('aria-current', String(note.id === activeId));
      const title = document.createElement('span'); title.textContent = note.title;
      const meta = document.createElement('small'); meta.textContent = note.updated;
      button.append(title, meta); button.addEventListener('click', () => onSelect(note.id));
      menu.append(button);
      dropdown.add(new Option(note.title + ' · ' + note.updated, note.id));
    });
    dropdown.value = activeId;
    dropdown.onchange = () => onSelect(dropdown.value);
  }
  function render(note, paperKey) {
    captureProgress(); clearTimeout(progressTimer);
    activeNote = note; activePaperKey = paperKey; progressUnlocked = false;
    const article = byId('note-content');
    if (imageDialog.open) imageDialog.close();
    article.querySelectorAll('video').forEach(video => video.pause());
    article.replaceChildren(...LiteratureNoteTools.documentFor(note).childNodes);
    const base = new URL(note.file, document.baseURI);
    article.querySelectorAll('[src],[poster],a[href]').forEach(element => {
      ['src', 'poster', 'href'].forEach(attribute => {
        const value = element.getAttribute(attribute);
        if (!value || value.startsWith('#')) return;
        try {
          const url = new URL(value, base);
          if (['http:', 'https:', 'file:'].includes(url.protocol)) element.setAttribute(attribute, url.href);
          else element.removeAttribute(attribute);
        } catch (_) { element.removeAttribute(attribute); }
      });
      if (element.tagName === 'A' && element.href && new URL(element.href).origin !== location.origin) {
        element.target = '_blank'; element.rel = 'noopener noreferrer';
      }
    });
    article.querySelectorAll('img').forEach(image => {
      image.loading = 'lazy'; image.decoding = 'async'; image.tabIndex = 0;
      image.setAttribute('role', 'button'); image.setAttribute('aria-label', '放大图片：' + (image.alt || '笔记图片'));
      const enlarge = () => {
        byId('note-image').src = image.src; byId('note-image').alt = image.alt;
        byId('note-image-caption').textContent = image.alt; imageDialog.showModal();
      };
      image.addEventListener('click', enlarge);
      image.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); enlarge(); } });
    });
    article.querySelectorAll('video').forEach(video => { video.controls = true; video.preload = 'none'; video.playsInline = true; video.autoplay = false; video.removeAttribute('autoplay'); });
    article.querySelectorAll('table').forEach(table => {
      const wrap = document.createElement('div'); wrap.className = 'note-table-wrap'; table.replaceWith(wrap); wrap.append(table);
      wrap.tabIndex = 0; wrap.setAttribute('role', 'region'); wrap.setAttribute('aria-label', '表格，可横向滚动');
      const hint = document.createElement('p'); hint.className = 'note-table-hint'; hint.textContent = '左右滑动查看完整表格'; hint.hidden = true; wrap.before(hint);
      if (table.querySelectorAll('thead th').length === 2 && table.querySelector('thead th')?.textContent.trim() === '字段') {
        table.classList.add('note-facts-table');
      } else if (table.querySelectorAll('thead th').length >= 3) {
        table.classList.add('note-wide-table');
      }
    });
    // Bibliographic fields stay available without interrupting the main explanation.
    article.querySelectorAll('h2').forEach(heading => {
      if (heading.textContent.trim() !== '基本信息') return;
      const details = document.createElement('details'); details.className = 'note-info-details';
      const summary = document.createElement('summary');
      heading.before(details);
      let next = heading.nextElementSibling;
      details.append(summary); summary.append(heading);
      while (next && next.tagName !== 'H2') {
        const following = next.nextElementSibling; details.append(next); next = following;
      }
    });
    document.querySelector('.note-directory').open = true;
    const toc = byId('note-toc'); toc.replaceChildren();
    headings = [...article.querySelectorAll('h2,h3')];
    headings.forEach(heading => {
      const id = heading.id; heading.tabIndex = -1;
      const link = document.createElement('a');
      link.href = (scrollRoot ? byId('note-permalink').href.split('#')[0] : '') + '#' + encodeURIComponent(id);
      link.textContent = heading.textContent;
      link.dataset.section = id; link.dataset.level = heading.tagName === 'H3' ? '3' : '2';
      toc.append(link);
    });
    byId('note-mobile-toc').replaceChildren(...[...toc.children].map(link => link.cloneNode(true)));
    byId('note-toc-button').hidden = !headings.length;
    document.querySelector('.note-directory').hidden = !headings.length;
    activeHeading = null;
    setupSessionTools();
    queueProgress();
  }

  // The same controls and directory serve both the standalone page and the modal.
  const toolbar = document.createElement('div'); toolbar.className = 'note-reader-toolbar';
  toolbar.innerHTML = '<div class="note-font-options" role="group" aria-label="正文字号"><span>字号</span><button type="button" data-note-font="default" aria-label="标准字号">标准</button><button type="button" data-note-font="large" aria-label="大字号">大</button><button type="button" data-note-font="larger" aria-label="更大字号">更大</button></div>';
  const sessionTools = document.createElement('div'); sessionTools.className = 'note-session-tools'; sessionTools.hidden = true;
  sessionTools.innerHTML = '<section id="note-resume" class="note-resume" aria-label="继续上次阅读" hidden><div><p id="note-resume-label"></p><small>仅保存在当前浏览器</small></div><button type="button" id="note-resume-go">继续阅读</button><button type="button" id="note-resume-reset">从头开始</button></section><div id="note-find-context" class="note-find-context" hidden><p id="note-find-label"></p><button type="button" id="note-find-clear">清除高亮</button></div>';
  document.querySelector('.note-layout').before(sessionTools, toolbar);
  let savedProgress = null;
  function setupSessionTools() {
    const url = new URL(location.href), query = (url.searchParams.get('find') || '').slice(0, 160);
    const hits = LiteratureNoteTools.highlight(byId('note-content'), query) + LiteratureNoteTools.highlight(byId('note-title'), query);
    byId('note-find-context').hidden = !query;
    byId('note-find-label').textContent = query ? (hits ? '已标出 ' + hits + ' 处匹配：' : '本页未找到匹配：') + query : '';
    savedProgress = LiteratureNoteTools.progress(activePaperKey, activeNote.id);
    const section = savedProgress && headings.find(heading => heading.id === savedProgress.section);
    const explicitTarget = query || (scrollRoot ? new URLSearchParams(url.hash.slice(1)).get('section') : url.hash);
    byId('note-resume').hidden = !section || Boolean(explicitTarget);
    if (section) byId('note-resume-label').textContent = (savedProgress.revision === activeNote.revision ? '上次读到：' : '笔记已更新，上次所在章节：') + section.textContent;
    sessionTools.hidden = byId('note-resume').hidden && byId('note-find-context').hidden;
  }
  function captureProgress() {
    if (!activeNote || !activePaperKey || !progressUnlocked || printing || !byId('note-content').getClientRects().length) return;
    const position = scrollRoot ? scrollRoot.scrollTop : window.scrollY;
    if (position < 120) return;
    updateProgress(); if (!activeHeading) return;
    const top = scrollRoot ? scrollRoot.getBoundingClientRect().top : 0;
    LiteratureNoteTools.save(activePaperKey, activeNote.id, {
      section: activeHeading.id, offset: Math.max(0, top - activeHeading.getBoundingClientRect().top),
      revision: activeNote.revision, fontSize,
    });
  }
  function queueSave() {
    if (!progressUnlocked) return;
    clearTimeout(progressTimer); progressTimer = setTimeout(captureProgress, 450);
  }
  byId('note-resume-go').addEventListener('click', () => {
    const heading = savedProgress && headings.find(item => item.id === savedProgress.section); if (!heading) return;
    const saved = savedProgress;
    byId('note-resume').hidden = true; sessionTools.hidden = byId('note-find-context').hidden;
    progressUnlocked = true; goToSection(heading.id, false);
    if (saved.revision === activeNote.revision && saved.fontSize === fontSize && Number.isFinite(saved.offset) && saved.offset > 0) {
      const top = scrollRoot ? scrollRoot.getBoundingClientRect().top : 0;
      (scrollRoot || window).scrollBy({top: heading.getBoundingClientRect().top - top + Math.min(saved.offset, 100000), behavior: 'instant'});
    }
    queueSave();
  });
  byId('note-resume-reset').addEventListener('click', () => {
    clearTimeout(progressTimer); progressUnlocked = false;
    LiteratureNoteTools.save(activePaperKey, activeNote.id, null);
    byId('note-resume').hidden = true; sessionTools.hidden = byId('note-find-context').hidden;
    (scrollRoot || window).scrollTo({top: 0, behavior: 'instant'});
    const url = new URL(location.href);
    if (scrollRoot) {
      const params = new URLSearchParams(url.hash.slice(1)); params.delete('section'); url.hash = params.toString();
      const permalink = new URL(byId('note-permalink').href); permalink.hash = ''; byId('note-permalink').href = permalink.href;
    } else url.hash = '';
    history.replaceState(history.state, '', url);
  });
  byId('note-find-clear').addEventListener('click', () => {
    [byId('note-content'), byId('note-title')].forEach(root => {
      root.querySelectorAll('mark.note-search-hit').forEach(mark => mark.replaceWith(document.createTextNode(mark.textContent)));
      root.normalize();
    });
    const url = new URL(location.href); url.searchParams.delete('find'); history.replaceState(history.state, '', url);
    byId('note-find-context').hidden = true; sessionTools.hidden = byId('note-resume').hidden;
  });
  const readingRoot = scrollRoot || window;
  const unlockProgress = event => {
    if (!byId('note-content').getClientRects().length) return;
    if (event.type === 'keydown' && (!['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)
      || event.target.closest?.('input,textarea,select,button,[contenteditable]'))) return;
    progressUnlocked = true;
  };
  ['wheel', 'touchmove', 'keydown'].forEach(name => readingRoot.addEventListener(name, unlockProgress, {passive: true}));
  byId('note-content').addEventListener('pointerdown', unlockProgress, {passive: true});
  readingRoot.addEventListener('scroll', queueSave, {passive: true});
  window.addEventListener('pagehide', captureProgress);
  function applyFont() {
    byId('note-content').dataset.fontSize = fontSize;
    toolbar.querySelectorAll('[data-note-font]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.noteFont === fontSize)));
    queueProgress();
  }
  toolbar.addEventListener('click', event => {
    const button = event.target.closest('[data-note-font]'); if (!button) return;
    fontSize = button.dataset.noteFont;
    try { localStorage.setItem('literature-note-font', fontSize); } catch (_) { /* Keep the choice for this page. */ }
    applyFont();
  });
  const tocDialog = document.createElement('dialog'); tocDialog.className = 'note-toc-dialog'; tocDialog.id = 'note-toc-dialog';
  tocDialog.setAttribute('aria-labelledby', 'note-toc-dialog-title');
  tocDialog.innerHTML = '<header><h2 id="note-toc-dialog-title">笔记目录</h2><button type="button" class="note-toc-close" aria-label="关闭目录">关闭</button></header><nav id="note-mobile-toc" class="note-toc" aria-label="笔记章节"></nav>';
  const tocButton = document.createElement('button'); tocButton.id = 'note-toc-button'; tocButton.type = 'button'; tocButton.className = 'note-toc-button'; tocButton.hidden = true;
  tocButton.setAttribute('aria-haspopup', 'dialog'); tocButton.setAttribute('aria-controls', tocDialog.id);
  tocButton.innerHTML = '<span>目录</span><span id="note-current-section"></span>';
  const host = document.querySelector('.note-modal .modal-content') || document.body;
  host.append(tocDialog);
  (scrollRoot || byId('note-page-content')).append(tocButton);
  tocButton.addEventListener('click', () => {
    tocDialog.showModal();
    const active = byId('note-mobile-toc').querySelector('[aria-current="location"]');
    if (active) { active.scrollIntoView({block: 'center'}); active.focus({preventScroll: true}); }
  });
  tocDialog.querySelector('.note-toc-close').addEventListener('click', () => tocDialog.close());
  tocDialog.addEventListener('click', event => { if (event.target === tocDialog) tocDialog.close(); });
  tocDialog.addEventListener('keydown', event => { if (event.key === 'Escape') event.stopPropagation(); });
  function goToSection(id, smooth = true) {
    const heading = headings.find(item => item.id === id); if (!heading) return;
    if (tocDialog.open) tocDialog.close();
    let parent = heading.parentElement;
    while (parent && parent !== byId('note-content')) {
      if (parent.tagName === 'DETAILS') parent.open = true;
      parent = parent.parentElement;
    }
    heading.focus({preventScroll: true});
    heading.scrollIntoView({behavior: smooth && !reducedMotion.matches ? 'smooth' : 'instant', block: 'start'});
    const url = new URL(location.href);
    if (scrollRoot) {
      const params = new URLSearchParams(url.hash.slice(1)); params.set('section', id); url.hash = params.toString();
      const permalink = new URL(byId('note-permalink').href); permalink.hash = id; byId('note-permalink').href = permalink.href;
    } else url.hash = id;
    history.replaceState(history.state, '', url);
    queueProgress();
  }
  function onTocClick(event) {
    const link = event.target.closest('a[data-section]'); if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); progressUnlocked = true; goToSection(link.dataset.section); queueSave();
  }
  byId('note-toc').addEventListener('click', onTocClick);
  byId('note-mobile-toc').addEventListener('click', onTocClick);
  function updateProgress() {
    scrollFrame = null;
    if (!headings.length || !byId('note-content').getClientRects().length) return;
    const top = scrollRoot ? scrollRoot.getBoundingClientRect().top : 0;
    let current = headings[0];
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top > top + 100) break;
      current = heading;
    }
    if (activeHeading === current) return;
    activeHeading = current;
    document.querySelectorAll('.note-toc a[data-section]').forEach(link => {
      if (link.dataset.section === current.id) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
    byId('note-current-section').textContent = current.textContent;
    const link = byId('note-toc').querySelector('[aria-current="location"]');
    const aside = document.querySelector('.note-layout>aside');
    if (link && !mobile.matches && aside.scrollHeight > aside.clientHeight) {
      const rect = link.getBoundingClientRect(), panel = aside.getBoundingClientRect();
      if (rect.bottom > panel.bottom) aside.scrollTop += rect.bottom - panel.bottom + 16;
      else if (rect.top < panel.top) aside.scrollTop -= panel.top - rect.top + 16;
    }
  }
  function updateTables() {
    byId('note-content').querySelectorAll('.note-table-wrap').forEach(wrap => {
      wrap.previousElementSibling.hidden = wrap.scrollWidth <= wrap.clientWidth + 1;
    });
  }
  function queueProgress() { if (scrollFrame === null) scrollFrame = requestAnimationFrame(updateProgress); }
  (scrollRoot || window).addEventListener('scroll', queueProgress, {passive: true});
  window.addEventListener('resize', () => { if (!mobile.matches && tocDialog.open) tocDialog.close(); queueProgress(); });
  document.querySelector('.note-modal')?.addEventListener('shown.bs.modal', queueProgress);
  new ResizeObserver(updateTables).observe(byId('note-content'));
  let printDetails = [];
  window.addEventListener('beforeprint', () => {
    captureProgress(); printing = true;
    printDetails = [...byId('note-content').querySelectorAll('.note-info-details:not([open])')];
    printDetails.forEach(details => { details.open = true; });
  });
  window.addEventListener('afterprint', () => { printDetails.forEach(details => { details.open = false; }); printDetails = []; printing = false; });
  document.querySelector('.note-modal')?.addEventListener('hide.bs.modal', () => {
    captureProgress(); progressUnlocked = false; clearTimeout(progressTimer);
    if (tocDialog.open) tocDialog.close();
  });
  window.addEventListener('hashchange', () => {
    if (scrollRoot) return;
    try { goToSection(decodeURIComponent(location.hash.slice(1)), false); } catch (_) { /* Ignore malformed anchors. */ }
  });
  applyFont();
  byId('note-image-close').addEventListener('click', () => imageDialog.close());
  imageDialog.addEventListener('keydown', event => { if (event.key === 'Escape') event.stopPropagation(); });
  imageDialog.addEventListener('click', event => { if (event.target === imageDialog) imageDialog.close(); });
  window.LiteratureNoteRenderer = {render, list, select, switcher, title, goToSection};
})();
