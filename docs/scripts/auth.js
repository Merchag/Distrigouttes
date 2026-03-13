(() => {
  const app = window.DistrigouttesApp;
  const { state } = app;
  const { toast, reportError } = app.utils;
  const FIXED_PASSWORD = 'STI2DD';
  const LOGIN_ALIASES = {
    STI2DD: 'merchagpingouin@gmail.com',
    STI2D: 'portrait.clement08@gmail.com'
  };

  function resolveLoginEmail(rawLogin) {
    const value = (rawLogin || '').trim();
    const upper = value.toUpperCase();
    if (LOGIN_ALIASES[upper]) return LOGIN_ALIASES[upper];
    return value;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function updateAuthUI() {
    const loggedIn = !!state.authToken;
    document.getElementById('btnLogin').style.display = loggedIn ? 'none' : 'flex';
    document.getElementById('btnLogout').style.display = loggedIn ? 'flex' : 'none';

    const userLabel = document.getElementById('authUser');
    userLabel.textContent = state.authUser || '';
    userLabel.style.display = loggedIn ? 'inline' : 'none';

    document.getElementById('fab').style.display = loggedIn && state.currentTab === 'journal' ? 'flex' : 'none';

    const presBtn = document.getElementById('presEditBtn');
    if (presBtn) presBtn.style.display = loggedIn ? '' : 'none';

    const addDocBtn = document.getElementById('addDocBtn');
    if (addDocBtn) addDocBtn.style.display = loggedIn ? '' : 'none';
  }

  function openLoginModal() {
    document.getElementById('loginOverlay').classList.add('open');
    setTimeout(() => document.getElementById('loginUser').focus(), 150);
  }

  function closeLoginModal() {
    document.getElementById('loginOverlay').classList.remove('open');
    document.getElementById('loginPass').value = '';
  }

  async function submitLogin() {
    const login = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;

    if (!login || !password) {
      toast('⚠ Remplis tous les champs');
      return;
    }

    if (password !== FIXED_PASSWORD) {
      toast('⚠ Mot de passe incorrect');
      return;
    }

    const email = resolveLoginEmail(login);
    if (!isValidEmail(email)) {
      toast('⚠ Entre un identifiant valide ou une adresse email');
      return;
    }

    const btn = document.getElementById('btnLoginSubmit');
    btn.disabled = true;
    btn.textContent = 'Connexion…';
    state.manualAuth = true;

    try {
      try {
        const { error } = await state.sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } catch (error) {
        if (String(error.message || '').toLowerCase().includes('invalid login credentials')) {
          const { error: signUpError } = await state.sb.auth.signUp({ email, password: FIXED_PASSWORD });
          if (signUpError) throw signUpError;
          const { error: signInError } = await state.sb.auth.signInWithPassword({ email, password: FIXED_PASSWORD });
          if (signInError) throw signInError;
        } else {
          throw error;
        }
      }

      closeLoginModal();
      toast('✓ Connecté : ' + email);
    } catch (error) {
      state.manualAuth = false;
      const msg = String(error.message || '').toLowerCase();
      const isBadCreds = msg.includes('invalid login credentials') || msg.includes('email not confirmed') || msg.includes('invalid email');
      toast('⚠ ' + (isBadCreds ? 'Identifiants incorrects' : 'Erreur : ' + (error.code || error.message || 'unknown')));
      const authHint = msg.includes('email not confirmed')
        ? 'Dans Supabase > Authentication > Providers > Email, désactive Confirm email ou confirme le compte manuellement.'
        : 'Vérifie l\'email, le mot de passe STI2DD et l\'activation du provider Email dans Supabase.';
      reportError('Erreur de connexion', error, authHint);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Se connecter';
    }
  }

  async function ensureReadSession() {
    return true;
  }

  async function ensureReadSessionWithSwitch(forceSwitch = false) {
    return true;
  }

  async function logout() {
    state.manualAuth = false;
    await state.sb.auth.signOut();
    toast('✓ Déconnecté');
  }

  app.authModule = { updateAuthUI, openLoginModal, closeLoginModal, submitLogin, ensureReadSession, ensureReadSessionWithSwitch, logout };
  window.openLoginModal = openLoginModal;
  window.closeLoginModal = closeLoginModal;
  window.submitLogin = submitLogin;
  window.logout = logout;
})();