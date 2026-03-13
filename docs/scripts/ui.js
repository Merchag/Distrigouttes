(() => {
  const app = window.DistrigouttesApp;
  const { state } = app;

  function positionIndicator(btn) {
    const indicator = document.getElementById('tabIndicator');
    const tabsRect = document.getElementById('tabsBar').getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    indicator.style.left = btnRect.left - tabsRect.left + 'px';
    indicator.style.width = btnRect.width + 'px';
  }

  function switchTab(id, btn) {
    if (id === state.currentTab) return;

    const outgoing = document.getElementById('panel-' + state.currentTab);
    outgoing.classList.remove('active');
    outgoing.classList.add('exit-left');
    setTimeout(() => outgoing.classList.remove('exit-left'), 400);

    state.currentTab = id;
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    btn.classList.add('active');
    positionIndicator(btn);

    document.getElementById('fab').style.display = id === 'journal' && state.authToken ? 'flex' : 'none';

    if (id === 'pres') {
      document.querySelectorAll('.pres-card').forEach((card, index) => {
        card.style.animation = 'none';
        card.style.opacity = '0';
        requestAnimationFrame(() => {
          card.style.animation = '';
          card.style.animationDelay = index * 0.07 + 's';
        });
      });
      app.presentation.renderPres();
    }

    if (id === 'docs') app.documents.renderDocs();

    if (id === 'settings') app.settings.loadSettingsPanel();

    requestAnimationFrame(() => document.getElementById('panel-' + id).classList.add('active'));
  }

  function updateSettingsTabVisibility() {
    const settingsTab = document.getElementById('tab-settings');
    if (settingsTab) {
      settingsTab.style.display = state.authToken ? '' : 'none';
    }
  }

  function bindGlobalUi() {
    document.querySelectorAll('.overlay').forEach(overlay => {
      overlay.addEventListener('click', event => {
        if (event.target === overlay) {
          overlay.classList.remove('open');
          state.editingId = null;
        }
      });
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        document.querySelectorAll('.overlay').forEach(overlay => overlay.classList.remove('open'));
        state.editingId = null;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
        event.preventDefault();
        app.journal.openEntryModal();
      }
      if (event.key === 'Enter' && document.getElementById('loginOverlay').classList.contains('open')) {
        event.preventDefault();
        app.authModule.submitLogin();
      }
    });

    window.addEventListener('resize', () => {
      const activeTab = document.querySelector('.tab.active');
      if (activeTab) positionIndicator(activeTab);
    });
  }

  app.ui = { positionIndicator, switchTab, bindGlobalUi, updateSettingsTabVisibility };
  window.positionIndicator = positionIndicator;
  window.switchTab = switchTab;
  window.updateSettingsTabVisibility = updateSettingsTabVisibility;
})();