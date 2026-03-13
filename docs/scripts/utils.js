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

  function openErrorPanel() {
    const overlay = document.getElementById('errorOverlay');
    if (overlay) overlay.classList.add('open');
  }

  function closeErrorPanel() {
    const overlay = document.getElementById('errorOverlay');
    if (overlay) overlay.classList.remove('open');
  }

  function reportError(title, error, hint = '') {
    const banner = document.getElementById('errorBanner');
    const titleEl = document.getElementById('errorTitle');
    const detailsEl = document.getElementById('errorDetails');
    if (!banner || !titleEl || !detailsEl) return;

    const code = error && error.code ? error.code : 'unknown';
    const message = error && error.message ? error.message : String(error || 'Unknown error');
    const details = [
      `Titre: ${title}`,
      `Code: ${code}`,
      `Message: ${message}`,
      hint ? `Conseil: ${hint}` : '',
      `Date: ${new Date().toLocaleString()}`
    ].filter(Boolean).join('\n');

    banner.textContent = '⚠ ' + title + ' — Cliquer pour détails';
    banner.style.display = 'block';
    titleEl.textContent = title;
    detailsEl.textContent = details;
  }

  app.utils = { esc, toast, reportError, openErrorPanel, closeErrorPanel };
  window.toast = toast;
  window.openErrorPanel = openErrorPanel;
  window.closeErrorPanel = closeErrorPanel;
})();