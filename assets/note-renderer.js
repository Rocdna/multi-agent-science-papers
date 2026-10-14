/* Shared Markdown rendering for the note modal and standalone reader. */
(() => {
  const byId = id => document.getElementById(id);
  const imageDialog = byId('note-image-dialog');
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
  function render(note) {
    const article = byId('note-content');
    if (imageDialog.open) imageDialog.close();
    article.querySelectorAll('video').forEach(video => video.pause());
    article.innerHTML = DOMPurify.sanitize(marked.parse(note.markdown), {USE_PROFILES: {html: true}});
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
    });
    document.querySelector('.note-directory').open = innerWidth >= 992;
    const toc = byId('note-toc'); toc.replaceChildren();
    article.querySelectorAll('h2,h3').forEach((heading, index) => {
      heading.id = 'note-section-' + index;
      const link = document.createElement('a'); link.href = '#' + heading.id; link.textContent = heading.textContent;
      link.addEventListener('click', event => { event.preventDefault(); heading.scrollIntoView({behavior: 'smooth', block: 'start'}); });
      toc.append(link);
    });
  }
  byId('note-image-close').addEventListener('click', () => imageDialog.close());
  imageDialog.addEventListener('keydown', event => { if (event.key === 'Escape') event.stopPropagation(); });
  imageDialog.addEventListener('click', event => { if (event.target === imageDialog) imageDialog.close(); });
  window.LiteratureNoteRenderer = {render, list, select, switcher};
})();
