(() => {
  const app = window.DistrigouttesApp;
  const { state } = app;
  const { toast, reportError } = app.utils;
  const FIXED_PASSWORD = 'STI2DD';
  const READ_ACCOUNT_EMAILS = ['merchagpingouin@gmail.com', 'portrait.clement08@gmail.com'];
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
        await state.auth.signInWithEmailAndPassword(email, password);
      } catch (error) {
        if (error.code === 'auth/user-not-found') {
          await state.auth.createUserWithEmailAndPassword(email, FIXED_PASSWORD);
        } else {
          throw error;
        }
      }

      closeLoginModal();
      toast('✓ Connecté : ' + email);
    } catch (error) {
      state.manualAuth = false;
      const badCodes = ['auth/wrong-password', 'auth/user-not-found', 'auth/invalid-credential', 'auth/invalid-email', 'auth/email-already-in-use'];
      toast('⚠ ' + (badCodes.includes(error.code) ? 'Identifiants incorrects' : 'Erreur : ' + error.code));
      reportError('Erreur de connexion', error, 'Vérifie l\'email, le mot de passe STI2DD et la connectivité réseau.');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Se connecter';
    }
  }

  async function ensureReadSession() {
    return ensureReadSessionWithSwitch(false);
  }

  async function ensureReadSessionWithSwitch(forceSwitch = false) {
    const current = state.auth.currentUser;
    if (!forceSwitch && current && current.email) return true;

    const candidates = [...READ_ACCOUNT_EMAILS];
    if (current && current.email) {
      const idx = candidates.indexOf(current.email);
      if (idx > -1) {
        candidates.splice(idx, 1);
        candidates.push(current.email);
      }
    }

    state.manualAuth = false;
    for (const email of candidates) {
      try {
        if (state.auth.currentUser) {
          await state.auth.signOut();
        }
        await state.auth.signInWithEmailAndPassword(email, FIXED_PASSWORD);
        return true;
      } catch (error) {
        if (error.code === 'auth/user-not-found' && email === 'merchagpingouin@gmail.com') {
          try {
            await state.auth.createUserWithEmailAndPassword(email, FIXED_PASSWORD);
            return true;
          } catch {
            // try next fallback account
          }
        }
        // try next fallback account
      }
    }

    reportError('Lecture distante impossible', 'Aucun compte de lecture Firebase utilisable', 'Vérifie les règles Firebase et le mot de passe STI2DD des comptes de lecture.');
    return false;
  }

  async function logout() {
    state.manualAuth = false;
    await state.auth.signOut();
    toast('✓ Déconnecté');
  }

  app.authModule = { updateAuthUI, openLoginModal, closeLoginModal, submitLogin, ensureReadSession, ensureReadSessionWithSwitch, logout };
  window.openLoginModal = openLoginModal;
  window.closeLoginModal = closeLoginModal;
  window.submitLogin = submitLogin;
  window.logout = logout;
})();