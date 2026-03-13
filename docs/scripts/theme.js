(() => {
  const app = window.DistrigouttesApp;
  const THEME_STORAGE_KEY = 'distrigouttes_theme';

  // Light theme colors
  const lightTheme = {
    bg: '#f5f3f0',
    surface: '#faf9f7',
    surface2: '#f0eeeb',
    surface3: '#e8e5e0',
    border: '#d8d5d0',
    border2: '#ccc9c2',
    text: '#1a1816',
    muted: '#8a8680',
    accent: '#d4a00f',
    accent2: '#1e7bbf',
    green: '#3b9b6c',
    red: '#d64545',
    purple: '#a85fd4'
  };

  // Dark theme colors (current)
  const darkTheme = {
    bg: '#0d0d0f',
    surface: '#141417',
    surface2: '#1c1c21',
    surface3: '#242429',
    border: '#2a2a32',
    border2: '#383842',
    text: '#f0eee8',
    muted: '#7a7885',
    accent: '#e8c547',
    accent2: '#4f9ef8',
    green: '#5fd4a0',
    red: '#f07070',
    purple: '#c084f5'
  };

  function getCurrentTheme() {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function setTheme(theme) {
    const colors = theme === 'light' ? lightTheme : darkTheme;
    Object.entries(colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}`, value);
    });
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    updateThemeButton(theme);
  }

  function toggleTheme() {
    const current = getCurrentTheme();
    const newTheme = current === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    app.utils.toast(`✓ Mode ${newTheme === 'dark' ? 'sombre' : 'clair'} activé`);
  }

  function updateThemeButton(theme) {
    const btn = document.getElementById('btnThemeToggle');
    if (btn) {
      btn.classList.toggle('light', theme === 'light');
      btn.classList.toggle('dark', theme === 'dark');
    }
  }

  function initTheme() {
    const theme = getCurrentTheme();
    setTheme(theme);
  }

  app.theme = { initTheme, toggleTheme, setTheme, getCurrentTheme };
  window.toggleTheme = toggleTheme;
})();
