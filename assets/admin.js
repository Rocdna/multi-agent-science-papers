(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const labels = {unread: '未读', reading: '阅读中', read: '已读'};
  const preview = location.protocol === 'file:';
  let state = null, catalog = [], saving = false, conflicted = false, ready = false;
  const draft = new Map(), selected = new Set();
  const message = (text, error = false) => {
    byId('admin-message').textContent = text; byId('admin-message').dataset.error = String(error);
  };
  function showLogin() {
    ready = false;
    byId('admin-login').hidden = false; byId('admin-editor').hidden = true;
    byId('admin-logout').hidden = true; byId('admin-account').textContent = '';
    actions();
  }
  const valueFor = key => draft.get(key) || state?.statuses[key] || 'unread';
  const visible = () => {
    const query = byId('admin-search').value.trim().toLowerCase(), status = byId('admin-filter').value;
    return catalog.filter(paper => (!query || (paper.name + ' ' + paper.title).toLowerCase().includes(query))
      && (!status || valueFor(paper.key) === status));
  };
  async function request(url, options = {}) {
    let response;
    try {
      response = await fetch(url, {cache: 'no-store', redirect: 'error', credentials: 'same-origin',
        signal: AbortSignal.timeout(15000), ...options});
    } catch (_) {
      const error = new Error('无法连接云端，请重试；若登录已失效，可重新登录。'); error.relogin = true; throw error;
    }
    if (!response.headers.get('Content-Type')?.includes('application/json')) {
      throw new Error('阅读管理服务尚未接通，请完成网站部署后再试。');
    }
    const data = await response.json();
    if (!response.ok) { const error = new Error(data.error || '请求失败'); error.status = response.status; throw error; }
    return data;
  }
  function actions() {
    byId('admin-save').disabled = preview || saving || !draft.size || conflicted || !ready;
    byId('admin-save').textContent = saving ? '正在保存…' : draft.size ? '保存 ' + draft.size + ' 项修改' : '保存修改';
    byId('admin-pending').textContent = draft.size ? draft.size + ' 项修改尚未保存' : '没有待保存修改';
    if (preview) {
      byId('admin-save').textContent = '保存到云端';
      byId('admin-save').title = '请通过网站阅读管理保存正式状态';
      byId('admin-pending').textContent = draft.size ? '本地试改 ' + draft.size + ' 项，刷新后还原' : '本地预览，修改不会同步';
    }
    byId('admin-selected').textContent = '已选 ' + selected.size + ' 篇';
    byId('admin-apply').disabled = saving || !selected.size || !ready;
    byId('admin-export').disabled = saving || !ready;
    byId('admin-all').disabled = !ready;
    const list = visible(), count = list.filter(paper => selected.has(paper.key)).length;
    byId('admin-all').checked = Boolean(list.length && count === list.length);
    byId('admin-all').indeterminate = count > 0 && count < list.length;
  }
  function setDraft(key, value) {
    if (value === (state.statuses[key] || 'unread')) draft.delete(key); else draft.set(key, value);
  }
  function render() {
    const list = visible(), fragment = document.createDocumentFragment();
    for (const paper of list) {
      const row = document.createElement('div'); row.className = 'admin-paper'; row.dataset.key = paper.key;
      row.dataset.pending = String(draft.has(paper.key));
      const checkLabel = document.createElement('label'); checkLabel.className = 'admin-select-label';
      const check = document.createElement('input'); check.type = 'checkbox'; check.checked = selected.has(paper.key);
      check.disabled = !ready;
      check.setAttribute('aria-label', '选择 ' + paper.name);
      check.addEventListener('change', () => { if (check.checked) selected.add(paper.key); else selected.delete(paper.key); actions(); });
      checkLabel.append(check);
      const info = document.createElement('div'), name = document.createElement('span'), detail = document.createElement('span');
      name.className = 'admin-paper-title'; name.textContent = paper.name + ' · ' + paper.year;
      detail.className = 'admin-paper-detail'; detail.textContent = paper.title;
      info.append(name, detail);
      const select = document.createElement('select'); select.className = 'form-select';
      select.disabled = !ready;
      select.setAttribute('aria-label', paper.name + ' 阅读状态');
      for (const [value, label] of Object.entries(labels)) select.add(new Option(label, value));
      select.value = valueFor(paper.key);
      select.addEventListener('change', () => { setDraft(paper.key, select.value); row.dataset.pending = String(draft.has(paper.key)); actions(); });
      row.append(checkLabel, info, select); fragment.append(row);
    }
    byId('admin-papers').replaceChildren(fragment); byId('admin-empty').hidden = Boolean(list.length); actions();
  }
  function showPreview() {
    if (typeof literaturePaperCatalog === 'undefined' || typeof literatureReadingStatuses === 'undefined') {
      message('本地预览数据尚未生成，请运行 npm run build。', true); return;
    }
    catalog = literaturePaperCatalog;
    state = {statuses: {...literatureReadingStatuses}, revision: 0, source: 'preview'};
    ready = true; conflicted = false; draft.clear(); selected.clear();
    byId('admin-editor').hidden = false; byId('admin-editor').disabled = false;
    byId('admin-account').textContent = '本地预览';
    byId('admin-open-site').hidden = false;
    byId('admin-export').hidden = true; byId('admin-reload').textContent = '恢复预览';
    message('本地预览：可以查看和试改，刷新后恢复。正式状态在网站保存后全站同步。');
    render();
  }
  async function load({preserveDraft = false} = {}) {
    if (draft.size && !preserveDraft && !confirm(preview ? '恢复预览会清除本次试改，继续吗？' : '重新加载会放弃尚未保存的修改，继续吗？')) return;
    if (preview) { showPreview(); return; }
    ready = false; byId('admin-editor').disabled = true; message('正在读取云端记录…');
    byId('admin-retry').hidden = true;
    try {
      const data = await request('/api/admin/state');
      if (data.source !== 'cloud' || !Array.isArray(data.catalog) || !data.statuses || !Number.isSafeInteger(data.revision)) {
        throw new Error('云端返回的记录格式异常。');
      }
      const changedWhileAway = preserveDraft && draft.size && state?.revision !== data.revision;
      state = data; catalog = data.catalog;
      if (!preserveDraft) { draft.clear(); selected.clear(); }
      else for (const [key, value] of draft) {
        if (!catalog.some(paper => paper.key === key) || value === (state.statuses[key] || 'unread')) draft.delete(key);
      }
      conflicted = Boolean(draft.size && preserveDraft && (conflicted || changedWhileAway));
      ready = true;
      byId('admin-account').textContent = data.user.name || data.user.email; byId('admin-login').hidden = true;
      byId('admin-logout').hidden = false; byId('admin-editor').hidden = false;
      byId('admin-editor').disabled = false; render();
      message(conflicted ? '其他页面已更新状态，待保存修改已保留。请重新加载云端记录后再操作。' : '已读取云端记录，可修改后保存。', conflicted);
    } catch (error) {
      message(error.message || '无法连接云端，请稍后重试。', true);
      if (error.status === 401) {
        showLogin();
        if (!state) message('请输入管理员密码登录。');
      } else if (error.relogin) byId('admin-login').hidden = false;
      byId('admin-retry').hidden = error.status === 401;
      // The reload button remains usable after a transient failure.
      byId('admin-editor').disabled = false;
      render();
    }
  }
  byId('admin-login').addEventListener('submit', async event => {
    event.preventDefault();
    const password = byId('admin-password');
    byId('admin-signin').disabled = true; message('正在登录…');
    try {
      await request('/api/admin/login', {method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({password: password.value})});
      password.value = '';
      await load({preserveDraft: true});
    } catch (error) {
      message(error.message || '登录失败，请重试。', true); password.value = ''; password.focus();
    } finally { byId('admin-signin').disabled = false; }
  });
  byId('admin-logout').addEventListener('click', async () => {
    if (saving || (draft.size && !confirm('退出会放弃尚未保存的修改，继续吗？'))) return;
    byId('admin-logout').disabled = true;
    try {
      await request('/api/admin/logout', {method: 'POST'});
      draft.clear(); selected.clear(); state = null; catalog = []; conflicted = false;
      showLogin(); render(); message('已退出登录。');
    } catch (error) { message(error.message || '退出失败，请重试。', true); }
    finally { byId('admin-logout').disabled = false; }
  });
  byId('admin-search').addEventListener('input', () => { if (state) render(); });
  byId('admin-filter').addEventListener('change', () => { if (state) render(); });
  byId('admin-reload').addEventListener('click', load);
  byId('admin-retry').addEventListener('click', load);
  byId('admin-all').addEventListener('change', event => {
    for (const paper of visible()) { if (event.target.checked) selected.add(paper.key); else selected.delete(paper.key); }
    render();
  });
  byId('admin-apply').addEventListener('click', () => {
    for (const key of selected) setDraft(key, byId('admin-bulk-status').value);
    render();
  });
  byId('admin-save').addEventListener('click', async () => {
    if (preview || !ready || saving || conflicted || !draft.size) return;
    saving = true; byId('admin-editor').disabled = true; actions();
    byId('admin-logout').disabled = true;
    try {
      const data = await request('/api/admin/reading-status', {
        method: 'PUT', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({revision: state.revision, changes: [...draft].map(([key, status]) => ({key, status}))}),
      });
      state = {...state, ...data}; draft.clear(); selected.clear(); render();
      message('已保存到云端。文献库重新打开或返回前台后会同步。');
    } catch (error) {
      if (error.status === 409) conflicted = true;
      if (error.status === 401) showLogin();
      else if (error.relogin) byId('admin-login').hidden = false;
      message((error.message || '保存失败，请重试。') + ' 待保存修改已保留。', true);
    } finally { saving = false; byId('admin-editor').disabled = false; byId('admin-logout').disabled = false; actions(); }
  });
  byId('admin-export').addEventListener('click', () => {
    if (!state) return;
    const names = new Map(catalog.map(paper => [paper.key, paper.name]));
    const entries = Object.fromEntries(Object.entries(state.statuses).map(([key, status]) => [key, {name: names.get(key) || key, status}]));
    const url = URL.createObjectURL(new Blob([JSON.stringify(entries, null, 2) + '\n'], {type: 'application/json'}));
    const link = document.createElement('a'); link.href = url; link.download = 'reading-status-' + new Date().toISOString().slice(0, 10) + '.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    message('已导出最近读取或保存成功的云端记录；不包含尚未保存的修改。');
  });
  window.addEventListener('beforeunload', event => { if (!preview && draft.size) { event.preventDefault(); event.returnValue = ''; } });
  if (preview) showPreview(); else load();
})();
