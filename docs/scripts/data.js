(() => {
  const app = window.DistrigouttesApp;
  const { state } = app;
  const { toast, reportError } = app.utils;
  const LOCAL_CACHE_KEY = 'distrigouttes_snapshot_v1';
  const DOC_FILES_CACHE = 'distrigouttes_docs_files_v1';
  let retryingReadSession = false;

  function saveLocalSnapshot() {
    try {
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify({
        entries: state.entries,
        docs: state.docs,
        pres: state.pres,
        cfg: state.cfg,
        ts: Date.now()
      }));
    } catch {
      // ignore cache write errors
    }
  }

  function loadLocalSnapshot() {
    try {
      const raw = localStorage.getItem(LOCAL_CACHE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      state.entries = data.entries || [];
      state.docs = data.docs || [];
      state.pres = data.pres || state.pres;
      state.cfg = data.cfg || state.cfg;
      return true;
    } catch {
      return false;
    }
  }

  async function cacheDocFiles(docs) {
    if (!('caches' in window)) return;
    try {
      const cache = await caches.open(DOC_FILES_CACHE);
      await Promise.all(
        (docs || [])
          .filter(doc => doc && doc.url)
          .map(async doc => {
            const existing = await cache.match(doc.url);
            if (existing) return;
            const response = await fetch(doc.url, { mode: 'no-cors' });
            await cache.put(doc.url, response);
          })
      );
    } catch {
      // some browsers/storage URLs may not be cacheable
    }
  }

  function initFirebase() {
    firebase.initializeApp(FIREBASE_CONFIG);
    state.db = firebase.firestore();
    try {
      state.db.settings({
        experimentalAutoDetectLongPolling: true,
        useFetchStreams: false
      });
    } catch {
      // ignore unsupported settings on some environments
    }
    state.auth = firebase.auth();
    state.docRef = state.db.collection('distrigouttes').doc('main');
  }

  function applyConfig() {
    document.getElementById('topProjName').textContent = state.cfg.proj || 'Distrigouttes';
  }

  function startListening() {
    if (loadLocalSnapshot()) {
      applyConfig();
      app.presentation.renderPres();
      app.journal.renderJournal();
      app.documents.renderDocs();
    }

    if (state.unsubSnapshot) state.unsubSnapshot();
    state.unsubSnapshot = state.docRef.onSnapshot(
      snap => {
        if (snap.exists) {
          const data = snap.data();
          state.entries = data.entries || [];
          state.docs = data.docs || [];
          state.pres = data.pres || state.pres;
          state.cfg = data.cfg || state.cfg;
          saveLocalSnapshot();
          cacheDocFiles(state.docs);
        }
        applyConfig();
        app.presentation.renderPres();
        app.journal.renderJournal();
        app.documents.renderDocs();
      },
      async (error) => {
        const loaded = loadLocalSnapshot();
        if (loaded) {
          applyConfig();
          app.presentation.renderPres();
          app.journal.renderJournal();
          app.documents.renderDocs();
          toast('⚠ Hors-ligne: affichage des données en cache');
        } else {
          toast('⚠ Erreur de connexion Firebase');
        }

        reportError('Connexion Firebase échouée', error, 'Clique sur Recharger, ou reconnecte internet.');

        const code = error && error.code ? error.code : '';
        if (!retryingReadSession && (code.includes('permission') || code.includes('unavailable') || code.includes('network'))) {
          retryingReadSession = true;
          const ok = await app.authModule.ensureReadSessionWithSwitch(true);
          if (ok) startListening();
          retryingReadSession = false;
        }
      }
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
      saveLocalSnapshot();
      cacheDocFiles(state.docs);
    } catch {
      toast('⚠ Erreur lors de la sauvegarde');
      reportError('Échec de sauvegarde', 'Impossible d\'écrire vers Firestore', 'Vérifie la connexion puis réessaie.');
    }
  }

  app.data = { initFirebase, applyConfig, startListening, pushData };
})();