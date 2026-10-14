/* Apply the saved theme before styles load; keep both document pages in sync. */
(() => {
  const storageKey = 'literature-color-mode';
  const modes = ['light', 'dark'];
  const preference = window.matchMedia('(prefers-color-scheme: dark)');
  let mode = null;
  try {
    const saved = localStorage.getItem(storageKey);
    if (modes.includes(saved)) mode = saved;
  } catch (_) { /* Theme switching still works if storage is unavailable. */ }

  function apply() {
    const effective = mode || (preference.matches ? 'dark' : 'light');
    document.documentElement.dataset.bsTheme = effective;
    document.documentElement.dataset.themePreference = mode || 'system';
    document.documentElement.style.colorScheme = effective;
    document.querySelectorAll('[data-theme-mode]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.themeMode === effective));
    });
    const color = document.querySelector('meta[name="theme-color"]');
    if (color) color.content = effective === 'dark' ? '#101722' : '#245ed8';
  }

  apply();
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-theme-mode]').forEach(button => {
      button.addEventListener('click', () => {
        if (!modes.includes(button.dataset.themeMode)) return;
        mode = button.dataset.themeMode;
        try { localStorage.setItem(storageKey, mode); } catch (_) { /* Keep session choice. */ }
        apply();
      });
    });
    apply();
  });
  preference.addEventListener('change', () => { if (mode === null) apply(); });
  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    mode = modes.includes(event.newValue) ? event.newValue : null;
    apply();
  });
})();
