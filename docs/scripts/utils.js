(() => {
  const app = window.DistrigouttesApp;

  function esc(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toast(message) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(app.state.toastTimer);
    app.state.toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  app.utils = { esc, toast };
  window.toast = toast;
})();