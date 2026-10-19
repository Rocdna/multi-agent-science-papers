/* Explain repository rating records without changing their meaning or fetching data. */
(() => {
  const dialog = document.createElement('dialog');
  dialog.id = 'rating-dialog'; dialog.className = 'rating-dialog';
  dialog.setAttribute('aria-labelledby', 'rating-dialog-title');
  dialog.innerHTML = '<div class="rating-dialog-header"><h2 id="rating-dialog-title">评级说明</h2><button type="button" class="rating-dialog-close" aria-label="关闭评级说明">关闭</button></div><div class="rating-dialog-body"><p id="rating-paper" class="rating-paper"></p><p id="rating-explanation"></p><dl id="rating-fields"></dl><h3>依据与来源</h3><div id="rating-sources"></div></div>';
  document.body.append(dialog);
  const byId = id => document.getElementById(id);
  document.querySelectorAll('.paper-row').forEach(row => {
    const paper = papers[Number(row.dataset.id)];
    row.querySelectorAll('.rating-badge').forEach((badge, index) => {
      const button = document.createElement('button'); button.type = 'button';
      button.className = badge.className; button.textContent = badge.textContent;
      button.dataset.ratingSystem = ['ccf', 'jcr', 'cas'][index];
      button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-controls', dialog.id);
      button.setAttribute('aria-label', paper.name + '：' + badge.textContent + '，查看说明与来源');
      badge.replaceWith(button);
    });
  });
  function field(label, value) {
    if (!value) return;
    const term = document.createElement('dt'), detail = document.createElement('dd');
    term.textContent = label; detail.textContent = value; byId('rating-fields').append(term, detail);
  }
  document.querySelector('.catalog').addEventListener('click', event => {
    const button = event.target.closest('[data-rating-system]'); if (!button) return;
    const row = button.closest('.paper-row'), paper = papers[Number(row.dataset.id)];
    const system = button.dataset.ratingSystem, value = paper[system] || '—';
    byId('rating-dialog-title').textContent = button.textContent + ' · 评级说明';
    byId('rating-paper').textContent = paper.name + ' · ' + paper.venue;
    byId('rating-fields').replaceChildren();
    if (system === 'ccf') {
      byId('rating-explanation').textContent = paper.ccfNote || '按本条文献已有的 CCF 记录展示。';
      field('采用版本', 'CCF 2026 目录');
    } else {
      byId('rating-explanation').textContent = value === '—'
        ? '当前文献记录没有提供这项分区。“—”不代表低评级，也不自动表示已经核验为不适用。'
        : system === 'jcr' ? '保留仓库记录中的学科分区；出现多个分区时，分别展示，不合并为单一等级。'
          : '按仓库已记录的公开来源展示大类分区与 Top 标记，保留参考性质。';
      field('采用版本', system === 'jcr' ? 'JCR 2025 发布版' : '中科院 2025 大类分区');
      field('学科', system === 'jcr' ? paper.subject : paper.casSubject);
      if (system === 'cas') field('来源口径', paper.casBasis);
    }
    field('记录结果', button.textContent);
    const sources = byId('rating-sources'); sources.replaceChildren();
    const detail = document.getElementById('detail-' + row.dataset.id);
    const facts = [...detail.querySelectorAll('.fact')];
    const target = facts.find(fact => fact.querySelector('b')?.textContent.trim() === (system === 'ccf' ? 'CCF 口径' : '评级来源'));
    const anchors = target ? [...target.querySelectorAll('a[href]')] : [];
    const candidates = anchors.filter(link => system === 'ccf' || link.textContent.includes(system === 'jcr' ? 'JCR' : '中科院')).map(link => [link.textContent, link.href]);
    if (system === 'cas' && paper.casSource) candidates.push(['中科院分区记录来源', paper.casSource]);
    const seen = new Set();
    candidates.forEach(([title, href]) => {
      let url; try { url = new URL(href, location.href); } catch (_) { return; }
      if (!['https:', 'http:'].includes(url.protocol) || seen.has(url.href)) return;
      seen.add(url.href);
      const link = document.createElement('a'); link.href = url.href; link.textContent = title;
      link.target = '_blank'; link.rel = 'noopener noreferrer'; sources.append(link);
    });
    if (!sources.children.length) sources.textContent = '本条尚未记录对应来源链接，可在论文详情中查看已有说明。';
    dialog.showModal();
  });
  dialog.querySelector('.rating-dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
})();
