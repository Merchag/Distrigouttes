(() => {
  const app = window.DistrigouttesApp;
  const { state } = app;
  const { toast } = app.utils;
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
      toast('⚠ Mot de passe incorrect (attendu : STI2DD)');
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
      const badCodes = ['auth/wrong-password', 'auth/user-not-found', 'auth/invalid-credential', 'auth/invalid-email', 'auth/email-already-in-use'];
      toast('⚠ ' + (badCodes.includes(error.code) ? 'Identifiants incorrects' : 'Erreur : ' + error.code));
    } finally {
      btn.disabled = false;
      btn.textContent = 'Se connecter';
    }
  }

  async function logout() {
    await state.auth.signOut();
    toast('✓ Déconnecté');
  }

  app.authModule = { updateAuthUI, openLoginModal, closeLoginModal, submitLogin, logout };
  window.openLoginModal = openLoginModal;
  window.closeLoginModal = closeLoginModal;
  window.submitLogin = submitLogin;
  window.logout = logout;
})();