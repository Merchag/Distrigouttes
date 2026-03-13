(() => {
  const app = window.DistrigouttesApp;
  const { state } = app;

  async function init() {
    app.data.initFirebase();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        // keep app functional if SW registration fails
      });
    }

    state.auth.onAuthStateChanged(user => {
      state.readSession = !!user;
      state.authToken = !!user && !!state.manualAuth;
      state.authUser = state.authToken ? (user.email || 'STI2D') : null;
      app.authModule.updateAuthUI();
      app.journal.renderJournal();
      app.documents.renderDocs();
    });

    await app.authModule.ensureReadSession();
    app.data.startListening();
    app.ui.bindGlobalUi();
    requestAnimationFrame(() => app.ui.positionIndicator(document.getElementById('tab-pres')));
  }

  init();
})();