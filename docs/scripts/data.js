(() => {
  const app = window.DistrigouttesApp;
  const { state } = app;
  const { toast, reportError } = app.utils;
  const LOCAL_CACHE_KEY = 'distrigouttes_snapshot_v1';
  const SESSION_KEY = 'distrigouttes_sessionid';
  const TABLE_NAME = 'app_data';
  const SYNC_DEBOUNCE_MS = 2000; // Wait 2s before syncing to avoid rapid calls

  let syncDebounceTimer = null;
  let isOnline = navigator.onLine;
  let sessionId = null;

  // Generate unique session ID for anonymous users
  function getOrCreateSessionId() {
    if (!sessionId) {
      let stored = localStorage.getItem(SESSION_KEY);
      if (!stored) {
        stored = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem(SESSION_KEY, stored);
      }
      sessionId = stored;
    }
    return sessionId;
  }

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
    
    // Get or create session ID
    getOrCreateSessionId();
    
    // Monitor online/offline state
    window.addEventListener('online', () => { isOnline = true; toast('✓ Connecté'); });
    window.addEventListener('offline', () => { isOnline = false; toast('⚠ Hors-ligne'); });
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
      return { id: 'main', entries: [], docs: [], pres: state.pres, cfg: state.cfg };
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

        reportError('Connexion Supabase échouée', error, 'Vérifie les policies RLS dans SUPABASE_SETUP.md, l\'URL, la clé anon et la connexion internet. Les lectures doivent être publiques, les écritures requièrent l\'authentification.');
        const msg = String((error && (error.code || error.message)) || '').toLowerCase();
        if (msg.includes('permission') || msg.includes('forbidden') || msg.includes('row-level security') || msg.includes('rls')) {
          reportError('Policy Supabase bloquante', error, 'Vérifiez que la policy "public read app_data" existe pour les lectures publiques.');
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
    // Only sync if user is authenticated (required by RLS policy)
    if (!state.authToken) {
      // Still save to local cache for offline usage
      saveLocalSnapshot();
      return;
    }
    
    // Debounce rapid successive calls - saves bandwidth and prevents conflicts
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(async () => {
      try {
        // Show syncing indicator
        const topbar = document.querySelector('.topbar-stat');
        if (topbar) topbar.style.opacity = '0.6';
        
        const { error } = await state.sb.from(TABLE_NAME).upsert({
          id: 'main',
          entries: state.entries,
          docs: state.docs,
          pres: state.pres,
          cfg: state.cfg,
          updated_at: new Date().toISOString()
        });
        if (error) throw error;
        saveLocalSnapshot();
        
        // Show sync success
        if (topbar) {
          topbar.style.opacity = '1';
          const dot = topbar.querySelector('.dot');
          if (dot) {
            dot.style.background = 'var(--green)';
            dot.style.boxShadow = '0 0 0 5px rgba(95,212,160,.4)';
          }
        }
        toast('✓ Synchronisé avec Supabase');
      } catch (error) {
        toast('⚠ Erreur lors de la sauvegarde');
        if (topbar) topbar.style.opacity = '1';
        reportError('Échec de sauvegarde', 'Impossible d\'écrire vers Supabase', 'Vous devez être authentifié pour modifier les notes. Connectez-vous d\'abord.');
      }
    }, SYNC_DEBOUNCE_MS);
  }

  app.data = { initSupabase, applyConfig, startListening, pushData };
})();