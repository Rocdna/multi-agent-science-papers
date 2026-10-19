/* Enhance the topic select while preserving the catalog's single source of state. */
(() => {
  'use strict';
  const select = document.getElementById('topic');
  if (!select) return;
  const descriptions = {
    '': '按论文主要解决的科研任务分类；同一研究可能涉及多个方向。',
    '知识工程': '从论文、数据库等来源整理和提取知识，为问答、推理和研究提供依据。',
    '假设生成': '根据已有知识提出新的材料设计思路、研究问题或实验方案。',
    '计算执行': '调用模拟软件、计算工具等，自动完成具体科研任务。侧重把任务做完。',
    '闭环发现': '根据计算或实验结果调整下一步方案，反复迭代寻找更好的材料。侧重根据结果决定下一步做什么。',
    '通用科研': '覆盖多种科研任务，或面向多个学科的通用智能体系统。',
  };
  const items = [...select.options];
  const desktop = matchMedia('(min-width: 992px)');
  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  const field = select.closest('.filter-field');
  const label = field.querySelector('label');
  const picker = document.createElement('div'); picker.className = 'topic-picker';
  const trigger = document.createElement('button');
  trigger.type = 'button'; trigger.id = 'topic-trigger'; trigger.className = 'topic-trigger';
  trigger.setAttribute('role', 'combobox'); trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false'); trigger.setAttribute('aria-controls', 'topic-options');
  label.id = 'topic-label'; label.htmlFor = trigger.id;
  trigger.setAttribute('aria-labelledby', 'topic-label topic-value');
  const dot = document.createElement('span'); dot.className = 'topic-dot'; dot.setAttribute('aria-hidden', 'true');
  const value = document.createElement('span'); value.id = 'topic-value'; value.className = 'topic-value';
  const chevron = document.createElement('span'); chevron.className = 'topic-chevron'; chevron.setAttribute('aria-hidden', 'true');
  trigger.append(dot, value, chevron);
  const menu = document.createElement('div'); menu.id = 'topic-options'; menu.className = 'topic-options';
  menu.setAttribute('role', 'listbox'); menu.setAttribute('aria-labelledby', label.id); menu.hidden = true;
  const tooltip = document.createElement('div'); tooltip.id = 'topic-tooltip'; tooltip.className = 'topic-tooltip';
  tooltip.setAttribute('role', 'tooltip'); tooltip.hidden = true;
  const tooltipTitle = document.createElement('strong'), tooltipText = document.createElement('p');
  tooltip.append(tooltipTitle, tooltipText);
  const options = items.map((item, index) => {
    const option = document.createElement('div'); option.className = 'topic-option';
    option.id = 'topic-option-' + index; option.dataset.topic = item.value; option.setAttribute('role', 'option');
    const heading = document.createElement('span'); heading.className = 'topic-option-heading';
    const swatch = dot.cloneNode();
    const name = document.createElement('span'); name.textContent = item.textContent;
    name.id = option.id + '-name'; option.setAttribute('aria-labelledby', name.id);
    const check = document.createElement('span'); check.className = 'topic-check'; check.textContent = '✓'; check.setAttribute('aria-hidden', 'true');
    heading.append(swatch, name, check);
    const description = document.createElement('span'); description.className = 'topic-option-description';
    description.id = option.id + '-description'; description.textContent = descriptions[item.value] || '';
    option.setAttribute('aria-describedby', description.id);
    option.append(heading, description); menu.append(option);
    return option;
  });
  picker.append(trigger, menu, tooltip); select.after(picker); select.hidden = true;
  let active = 0, hideTimer;
  const isOpen = () => !menu.hidden;

  function hideTooltip() { clearTimeout(hideTimer); tooltip.hidden = true; }
  function positionTooltip() {
    if (tooltip.hidden) return;
    const rect = options[active].getBoundingClientRect(), box = tooltip.getBoundingClientRect();
    const right = rect.right + 10;
    const left = right + box.width <= innerWidth - 12 ? right : Math.max(12, rect.left - box.width - 10);
    tooltip.style.left = left + 'px';
    tooltip.style.top = Math.max(12, Math.min(rect.top, innerHeight - box.height - 12)) + 'px';
  }
  function showTooltip() {
    clearTimeout(hideTimer);
    if (!desktop.matches) { hideTooltip(); return; }
    tooltipTitle.textContent = items[active].textContent;
    tooltipText.textContent = descriptions[items[active].value] || '';
    tooltip.dataset.topic = items[active].value; tooltip.hidden = false; positionTooltip();
  }
  function positionMenu() {
    if (!isOpen()) return;
    if (!desktop.matches) {
      ['left', 'top', 'width', 'max-height'].forEach(name => menu.style.removeProperty(name));
      hideTooltip(); return;
    }
    const rect = trigger.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= innerHeight) { close(); return; }
    const width = Math.min(Math.max(rect.width, 224), innerWidth - 24);
    const below = innerHeight - rect.bottom - 20, above = rect.top - 20;
    const upward = below < Math.min(280, menu.scrollHeight) && above > below;
    menu.style.width = width + 'px';
    menu.style.maxHeight = Math.max(80, Math.min(360, upward ? above : below)) + 'px';
    menu.style.left = Math.max(12, Math.min(rect.left, innerWidth - width - 12)) + 'px';
    menu.style.top = (upward ? rect.top - menu.getBoundingClientRect().height - 6 : rect.bottom + 6) + 'px';
    positionTooltip();
  }
  function activate(index, explain = false) {
    active = Math.max(0, Math.min(options.length - 1, index));
    options.forEach((option, i) => option.dataset.active = String(i === active));
    trigger.setAttribute('aria-activedescendant', options[active].id);
    if (explain) {
      const option = options[active];
      if (option.offsetTop < menu.scrollTop) menu.scrollTop = option.offsetTop;
      else if (option.offsetTop + option.offsetHeight > menu.scrollTop + menu.clientHeight) menu.scrollTop = option.offsetTop + option.offsetHeight - menu.clientHeight;
      showTooltip();
    }
  }
  function sync() {
    const index = Math.max(0, select.selectedIndex);
    value.textContent = items[index].textContent; trigger.dataset.topic = select.value;
    options.forEach((option, i) => option.setAttribute('aria-selected', String(i === index)));
    if (isOpen()) activate(index);
  }
  function open(explain = false) {
    sync(); menu.hidden = false; trigger.setAttribute('aria-expanded', 'true');
    positionMenu(); activate(select.selectedIndex, explain);
  }
  function close() {
    menu.hidden = true; trigger.setAttribute('aria-expanded', 'false');
    trigger.removeAttribute('aria-activedescendant'); hideTooltip();
  }
  function choose(index) {
    const changed = select.value !== items[index].value;
    select.value = items[index].value; close(); sync();
    trigger.focus({preventScroll: true});
    if (changed) select.dispatchEvent(new Event('change', {bubbles: true}));
  }
  trigger.addEventListener('click', () => isOpen() ? close() : open());
  trigger.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (!isOpen()) return;
      event.preventDefault(); event.stopPropagation(); close(); return;
    }
    if (event.key === 'Tab') { close(); return; }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      if (!isOpen()) { open(true); if (event.key !== 'Home' && event.key !== 'End') return; }
      else if (event.key === 'Enter' || event.key === ' ') { choose(active); return; }
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : active + (event.key === 'ArrowUp' ? -1 : 1);
      activate(index, true);
    }
  });
  options.forEach((option, index) => {
    option.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch' && hover.matches) { activate(index); showTooltip(); }
    });
    // Keep keyboard focus on the combobox during mouse selection.
    option.addEventListener('mousedown', event => event.preventDefault());
    option.addEventListener('click', () => choose(index));
  });
  menu.addEventListener('pointerleave', event => {
    if (!tooltip.contains(event.relatedTarget)) hideTimer = setTimeout(hideTooltip, 160);
  });
  tooltip.addEventListener('pointerenter', () => clearTimeout(hideTimer));
  tooltip.addEventListener('pointerleave', () => { hideTimer = setTimeout(hideTooltip, 160); });
  menu.addEventListener('scroll', () => {
    const option = options[active].getBoundingClientRect(), bounds = menu.getBoundingClientRect();
    if (option.bottom <= bounds.top || option.top >= bounds.bottom) hideTooltip();
    else positionTooltip();
  });
  document.addEventListener('pointerdown', event => { if (!picker.contains(event.target)) close(); });
  document.addEventListener('focusin', event => { if (!picker.contains(event.target)) close(); });
  select.addEventListener('change', sync);
  window.addEventListener('popstate', close);
  window.addEventListener('resize', () => { close(); });
  window.addEventListener('scroll', event => { if (event.target !== menu) positionMenu(); }, true);
  document.getElementById('filter-panel').addEventListener('hide.bs.offcanvas', close);
  window.addEventListener('beforeprint', close);
  window.LiteratureTopicPicker = {sync, trigger}; sync();
})();
