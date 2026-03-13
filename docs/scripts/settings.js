(() => {
  const app = window.DistrigouttesApp;
  const { state } = app;
  const { toast } = app.utils;

  // Legacy functions for modal (kept for compatibility)
  function openSettings() {
    if (!state.authToken) {
      toast('⚠ Connectez-vous pour accéder aux paramètres');
      return;
    }
    document.getElementById('sProjName').value = state.cfg.proj;
    document.getElementById('sAuthor').value = state.cfg.author || '';
    document.getElementById('settingsOverlay').classList.add('open');
  }

  function closeSettings() {
    document.getElementById('settingsOverlay').classList.remove('open');
  }

  async function saveSettings() {
    if (!state.authToken) return;
    state.cfg.proj = document.getElementById('sProjName').value.trim() || 'Distrigouttes';
    state.cfg.author = document.getElementById('sAuthor').value.trim();
    await app.data.pushData();
    app.data.applyConfig();
    closeSettings();
    toast('✓ Paramètres sauvegardés');
  }

  // New functions for settings panel (in tab)
  function loadSettingsPanel() {
    if (!state.authToken) return;
    document.getElementById('setProjName').value = state.cfg.proj || 'Distrigouttes';
    document.getElementById('setAuthor').value = state.cfg.author || '';
  }

  async function saveProjectSettings() {
    if (!state.authToken) return;
    state.cfg.proj = document.getElementById('setProjName').value.trim() || 'Distrigouttes';
    state.cfg.author = document.getElementById('setAuthor').value.trim();
    await app.data.pushData();
    app.data.applyConfig();
    toast('✓ Paramètres du projet sauvegardés');
  }

  app.settings = { openSettings, closeSettings, saveSettings, loadSettingsPanel, saveProjectSettings };
  window.openSettings = openSettings;
  window.closeSettings = closeSettings;
  window.saveSettings = saveSettings;
  window.saveProjectSettings = saveProjectSettings;
})();