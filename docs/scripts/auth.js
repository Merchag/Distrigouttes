(() => {
  const app = window.DistrigouttesApp;
  const { state } = app;
  const { toast } = app.utils;

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
    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;

    if (!username || !password) {
      toast('⚠ Remplis tous les champs');
      return;
    }
    if (username.toUpperCase() !== 'STI2D') {
      toast('⚠ Identifiants incorrects');
      return;
    }

    const btn = document.getElementById('btnLoginSubmit');
    btn.disabled = true;
    btn.textContent = 'Connexion…';

    try {
      await state.auth.signInWithEmailAndPassword('portrait.clement08@gmail.com', password);
      closeLoginModal();
      toast('✓ Connecté en tant que STI2D');
    } catch (error) {
      const badCodes = ['auth/wrong-password', 'auth/user-not-found', 'auth/invalid-credential', 'auth/invalid-email'];
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