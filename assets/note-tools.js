/* Static note indexing, safe search highlighting, and optional device-local progress. */
(() => {
  'use strict';
  const progressKey = 'literature-note-progress-v1';
  let index = null;
  const termsFor = query => query.trim().slice(0, 160).split(/\s+/u).filter(Boolean);
  function headingId(text, position, used) {
    const base = 'section-' + (text.trim().toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || position);
    let id = base, suffix = 2;
    while (used.has(id)) id = base + '-' + suffix++;
    used.add(id); return id;
  }
  function documentFor(note) {
    const article = document.createElement('article');
    article.innerHTML = DOMPurify.sanitize(marked.parse(note.markdown), {USE_PROFILES: {html: true}});
    if (article.firstElementChild?.tagName === 'H1') article.firstElementChild.remove();
    const used = new Set();
    article.querySelectorAll('h2,h3').forEach((heading, position) => {
      heading.id = headingId(heading.textContent, position, used);
    });
    return article;
  }
  function buildIndex() {
    const blocks = [];
    Object.entries(literatureNotes).forEach(([paperKey, notes]) => {
      (Array.isArray(notes) ? notes : [{...notes, id: notes.id || 'main'}]).forEach(note => {
        let section = '', sectionTitle = '笔记开头';
        blocks.push({paperKey, noteId: note.id, title: note.title, section, sectionTitle, text: note.title});
        const article = documentFor(note);
        article.querySelectorAll('h2,h3,p,li,pre,table,blockquote').forEach(element => {
          if (element.matches('h2,h3')) { section = element.id; sectionTitle = element.textContent.trim(); }
          else if (element.parentElement.closest('li,pre,table,blockquote')) return;
          const text = element.textContent.replace(/\s+/gu, ' ').trim();
          if (text) blocks.push({paperKey, noteId: note.id, title: note.title, section, sectionTitle, text});
        });
      });
    });
    return blocks;
  }
  function search(query) {
    const terms = termsFor(query).map(term => term.toLowerCase());
    if (!terms.length) return [];
    if (!index) index = buildIndex();
    const found = new Map();
    index.forEach(block => {
      const text = block.text.toLowerCase();
      if (!terms.every(term => text.includes(term))) return;
      const key = JSON.stringify([block.paperKey, block.noteId, block.section]);
      if (found.has(key)) return;
      const start = Math.max(0, Math.min(...terms.map(term => text.indexOf(term))) - 45);
      const excerpt = (start ? '…' : '') + block.text.slice(start, start + 200) + (start + 200 < block.text.length ? '…' : '');
      found.set(key, {...block, excerpt});
    });
    return [...found.values()];
  }
  function highlight(root, query) {
    const terms = termsFor(query).sort((a, b) => b.length - a.length);
    if (!terms.length) return 0;
    const expression = new RegExp(terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'giu');
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      if (!walker.currentNode.parentElement.closest('mark,script,style,textarea')) nodes.push(walker.currentNode);
    }
    let count = 0;
    nodes.forEach(node => {
      const text = node.textContent; expression.lastIndex = 0;
      const matches = [...text.matchAll(expression)]; if (!matches.length) return;
      const fragment = document.createDocumentFragment(); let last = 0;
      matches.forEach(match => {
        fragment.append(document.createTextNode(text.slice(last, match.index)));
        const mark = document.createElement('mark'); mark.className = 'note-search-hit'; mark.textContent = match[0];
        fragment.append(mark); last = match.index + match[0].length; count++;
      });
      fragment.append(document.createTextNode(text.slice(last))); node.replaceWith(fragment);
    });
    return count;
  }
  function readProgress() {
    try {
      const value = JSON.parse(localStorage.getItem(progressKey) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch (_) { return {}; }
  }
  const idFor = (paperKey, noteId) => paperKey + '/' + noteId;
  function progress(paperKey, noteId) {
    const all = readProgress(), id = idFor(paperKey, noteId);
    return Object.hasOwn(all, id) ? all[id] : null;
  }
  function save(paperKey, noteId, value) {
    const all = readProgress(), id = idFor(paperKey, noteId);
    if (value) all[id] = {...value, savedAt: Date.now()}; else delete all[id];
    const recent = Object.entries(all).filter(([,entry]) => entry && Number.isFinite(entry.savedAt))
      .sort((a, b) => b[1].savedAt - a[1].savedAt).slice(0, 100);
    try { localStorage.setItem(progressKey, JSON.stringify(Object.fromEntries(recent))); } catch (_) { /* Reading does not require storage. */ }
  }
  window.LiteratureNoteTools = {documentFor, headingId, search, highlight, progress, save};
})();
