(() => {
  const app = window.DistrigouttesApp;
  const { state } = app;

  async function init() {
    app.data.initFirebase();

    state.auth.onAuthStateChanged(user => {
      state.authToken = !!user;
      state.authUser = user ? 'STI2D' : null;
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