/* Apply the saved theme before styles load; keep both document pages in sync. */
(() => {
  const storageKey = 'literature-color-mode';
  const modes = ['system', 'light', 'dark'];
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  let mode = 'system';
  try {
    const saved = localStorage.getItem(storageKey);
    if (modes.includes(saved)) mode = saved;
  } catch (_) { /* Theme switching still works if storage is unavailable. */ }

  function apply() {
    const effective = mode === 'system' ? (preference.matches ? 'dark' : 'light') : mode;
    document.documentElement.dataset.bsTheme = effective;
    document.documentElement.dataset.themePreference = mode;
    document.documentElement.style.colorScheme = effective;
    document.querySelectorAll('[data-theme-select]').forEach(select => { select.value = mode; });
    const color = document.querySelector('meta[name="theme-color"]');
    if (color) color.content = effective === 'dark' ? '#101722' : '#245ed8';
  }

  apply();
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-theme-select]').forEach(select => {
      select.addEventListener('change', () => {
        if (!modes.includes(select.value)) return;
        mode = select.value;
        try { localStorage.setItem(storageKey, mode); } catch (_) { /* Keep session choice. */ }
        apply();
      });
    });
    apply();
  });
  preference.addEventListener('change', () => { if (mode === 'system') apply(); });
  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    mode = modes.includes(event.newValue) ? event.newValue : 'system';
    apply();
  });
})();
