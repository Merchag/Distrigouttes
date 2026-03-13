(() => {
  const app = window.DistrigouttesApp;
  const { state } = app;
  const { toast } = app.utils;

  function initFirebase() {
    firebase.initializeApp(FIREBASE_CONFIG);
    state.db = firebase.firestore();
    state.auth = firebase.auth();
    state.docRef = state.db.collection('distrigouttes').doc('main');
  }

  function applyConfig() {
    document.getElementById('topProjName').textContent = state.cfg.proj || 'Distrigouttes';
  }

  function startListening() {
    if (state.unsubSnapshot) state.unsubSnapshot();
    state.unsubSnapshot = state.docRef.onSnapshot(
      snap => {
        if (snap.exists) {
          const data = snap.data();
          state.entries = data.entries || [];
          state.docs = data.docs || [];
          state.pres = data.pres || state.pres;
          state.cfg = data.cfg || state.cfg;
        }
        applyConfig();
        app.presentation.renderPres();
        app.journal.renderJournal();
        app.documents.renderDocs();
      },
      () => toast('⚠ Erreur de connexion Firebase')
    );
  }

  async function pushData() {
    if (!state.authToken) return;
    try {
      await state.docRef.set({
        entries: state.entries,
        docs: state.docs,
        pres: state.pres,
        cfg: state.cfg
      });
    } catch {
      toast('⚠ Erreur lors de la sauvegarde');
    }
  }

  app.data = { initFirebase, applyConfig, startListening, pushData };
})();