(() => {
  const app = window.DistrigouttesApp;
  const { state } = app;
  const { toast } = app.utils;

  function openSettings() {
    if (!state.authToken) {
      // Load only appearance tab for non-authenticated
      document.getElementById('settingsTabProject').style.display = 'none';
      document.getElementById('settingsSaveBtn').style.display = 'none';
    } else {
      // Load both tabs for authenticated
      document.getElementById('sProjName').value = state.cfg.proj;
      document.getElementById('sAuthor').value = state.cfg.author || '';
      document.getElementById('settingsTabProject').style.display = '';
      document.getElementById('settingsSaveBtn').style.display = '';
    }
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

  app.settings = { openSettings, closeSettings, saveSettings };
  window.openSettings = openSettings;
  window.closeSettings = closeSettings;
  window.saveSettings = saveSettings;
})();