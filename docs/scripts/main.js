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
      state.authToken = !!user;
      state.authUser = user ? (user.email || 'STI2D') : null;
      app.authModule.updateAuthUI();
      app.journal.renderJournal();
      app.documents.renderDocs();
    });

    app.data.startListening();
    app.ui.bindGlobalUi();
    requestAnimationFrame(() => app.ui.positionIndicator(document.getElementById('tab-pres')));
  }

  init();
})();