(() => {
  const app = window.DistrigouttesApp;
  const { state } = app;
  const { toast, reportError } = app.utils;
  const LOCAL_CACHE_KEY = 'distrigouttes_snapshot_v1';
  const TABLE_NAME = 'app_data';
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

  function initSupabase() {
    if (!window.supabase || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      reportError('Supabase non configuré', 'Variables manquantes', 'Renseigne SUPABASE_URL et SUPABASE_ANON_KEY dans supabase-config.js');
      throw new Error('Supabase config missing');
    }
    state.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  function applyConfig() {
    document.getElementById('topProjName').textContent = state.cfg.proj || 'Distrigouttes';
  }

  function applyRemoteRow(row) {
    state.entries = row.entries || [];
    state.docs = row.docs || [];
    state.pres = row.pres || state.pres;
    state.cfg = row.cfg || state.cfg;
  }

  async function fetchRemoteData() {
    const { data, error } = await state.sb
      .from(TABLE_NAME)
      .select('id, entries, docs, pres, cfg')
      .eq('id', 'main')
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      const seed = { id: 'main', entries: [], docs: [], pres: state.pres, cfg: state.cfg };
      const { error: insertError } = await state.sb.from(TABLE_NAME).insert(seed);
      if (insertError) throw insertError;
      return seed;
    }
    return data;
  }

  function startListening() {
    if (loadLocalSnapshot()) {
      applyConfig();
      app.presentation.renderPres();
      app.journal.renderJournal();
      app.documents.renderDocs();
    }

    const hydrate = async () => {
      try {
        const row = await fetchRemoteData();
        applyRemoteRow(row);
        saveLocalSnapshot();
        applyConfig();
        app.presentation.renderPres();
        app.journal.renderJournal();
        app.documents.renderDocs();
      } catch (error) {
        const loaded = loadLocalSnapshot();
        if (loaded) {
          applyConfig();
          app.presentation.renderPres();
          app.journal.renderJournal();
          app.documents.renderDocs();
          toast('⚠ Hors-ligne: affichage des données en cache');
        } else {
          toast('⚠ Erreur de connexion Supabase');
        }

        reportError('Connexion Supabase échouée', error, 'Vérifie les policies RLS, URL, clé anon et la connexion internet.');
        const msg = String((error && (error.code || error.message)) || '').toLowerCase();
        if (!retryingReadSession && (msg.includes('permission') || msg.includes('forbidden') || msg.includes('network') || msg.includes('jwt'))) {
          retryingReadSession = true;
          const ok = await app.authModule.ensureReadSessionWithSwitch(true);
          if (ok) await hydrate();
          retryingReadSession = false;
        }
      }
    };

    hydrate();

    if (state.unsubSnapshot) state.unsubSnapshot();
    const channel = state.sb
      .channel('distrigouttes-main-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE_NAME, filter: 'id=eq.main' }, payload => {
        if (payload.new) {
          applyRemoteRow(payload.new);
          saveLocalSnapshot();
          applyConfig();
          app.presentation.renderPres();
          app.journal.renderJournal();
          app.documents.renderDocs();
        }
      })
      .subscribe();

    state.unsubSnapshot = () => state.sb.removeChannel(channel);
  }

  async function pushData() {
    if (!state.authToken) return;
    try {
      const { error } = await state.sb.from(TABLE_NAME).upsert({
        id: 'main',
        entries: state.entries,
        docs: state.docs,
        pres: state.pres,
        cfg: state.cfg
      });
      if (error) throw error;
      saveLocalSnapshot();
    } catch {
      toast('⚠ Erreur lors de la sauvegarde');
      reportError('Échec de sauvegarde', 'Impossible d\'écrire vers Supabase', 'Vérifie la policy UPDATE/INSERT sur app_data puis réessaie.');
    }
  }

  app.data = { initSupabase, applyConfig, startListening, pushData };
})();