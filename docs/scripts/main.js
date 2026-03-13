(() => {
  const app = window.DistrigouttesApp;
  const { state } = app;

  async function init() {
    // Initialize theme
    if (app.theme) app.theme.initTheme();
    
    // Initialize search
    if (app.search) app.search.initAdvancedSearch();
    
    app.data.initSupabase();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {
        // keep app functional if SW registration fails
      });
    }

    state.sb.auth.onAuthStateChange((_event, session) => {
      const user = session ? session.user : null;
      state.readSession = !!user;
      state.authToken = !!user;
      state.authUser = state.authToken ? (user.email || 'STI2D') : null;
      app.authModule.updateAuthUI();
      app.journal.renderJournal();
      app.documents.renderDocs();
      
      // Add export buttons if authenticated
      if (state.authToken && app.export) {
        app.export.addExportButtons();
      }
    });

    app.data.startListening();
    
    // Sync storage documents (files from Supabase bucket)
    setTimeout(() => {
      if (app.documents && app.documents.syncStorageDocuments) {
        app.documents.syncStorageDocuments();
      }
    }, 1000);
    
    app.ui.bindGlobalUi();
    requestAnimationFrame(() => app.ui.positionIndicator(document.getElementById('tab-pres')));
  }

  init();
})();