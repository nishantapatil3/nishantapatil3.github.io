(() => {
  const getPreferredTheme = () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  };

  const getInitialTheme = () => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
    const fromDom = document.documentElement.dataset.theme;
    if (fromDom === 'dark' || fromDom === 'light') return fromDom;
    return getPreferredTheme();
  };

  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      const sunIcon =
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
      const moonIcon =
        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M21 14.5A8.5 8.5 0 1 1 9.5 3a7 7 0 0 0 11.5 11.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
      const nextIsLight = theme === 'dark';
      toggle.innerHTML = nextIsLight ? sunIcon : moonIcon;
      toggle.setAttribute('aria-label', nextIsLight ? 'Switch to light theme' : 'Switch to dark theme');
    }
  };

  const setupThemeToggle = () => {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    applyTheme(getInitialTheme());

    toggle.addEventListener('click', () => {
      const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', nextTheme);
      applyTheme(nextTheme);
    });

    if (window.matchMedia) {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      media.addEventListener('change', (event) => {
        if (!localStorage.getItem('theme')) {
          applyTheme(event.matches ? 'dark' : 'light');
        }
      });
    }

    window.addEventListener('storage', (event) => {
      if (event.key === 'theme' && (event.newValue === 'dark' || event.newValue === 'light')) {
        applyTheme(event.newValue);
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupThemeToggle);
  } else {
    setupThemeToggle();
  }
})();
