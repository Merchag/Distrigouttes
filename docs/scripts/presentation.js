(() => {
  const app = window.DistrigouttesApp;
  const { state, constants } = app;
  const { TAG_LABELS, TAG_COLORS } = constants;
  const { toast } = app.utils;

  function updateStats() {
    const totalEntries = state.entries.length;
    const days = new Set(state.entries.map(entry => entry.date)).size;
    const avg = totalEntries
      ? Math.round(state.entries.reduce((sum, entry) => sum + entry.progress, 0) / totalEntries)
      : 0;

    document.getElementById('s-entries').textContent = totalEntries;
    document.getElementById('s-days').textContent = days;

    if (totalEntries) {
      const latest = state.entries.reduce((left, right) => (new Date(left.date) > new Date(right.date) ? left : right));
      const latestDate = new Date(latest.date + 'T12:00:00');
      document.getElementById('s-last').textContent = String(latestDate.getDate()).padStart(2, '0') + '/' + String(latestDate.getMonth() + 1).padStart(2, '0');
    } else {
      document.getElementById('s-last').textContent = '—';
    }

    const circ = 2 * Math.PI * 40;
    document.getElementById('arcFg').setAttribute('stroke-dasharray', (avg / 100) * circ + ' ' + circ);
    document.getElementById('arcLabel').textContent = avg + '%';

    const counts = { avancement: 0, code: 0, probleme: 0, reflexion: 0, autre: 0 };
    state.entries.forEach(entry => {
      if (counts[entry.tag] !== undefined) counts[entry.tag] += 1;
    });

    const max = Math.max(...Object.values(counts), 1);
    document.getElementById('tagBreakdown').innerHTML = Object.entries(counts)
      .map(([tag, count]) => `
        <div class="tb-row">
          <span class="tb-label" style="color:${TAG_COLORS[tag]}">${TAG_LABELS[tag]}</span>
          <div class="tb-bar-outer"><div class="tb-bar-inner" style="width:${(count / max) * 100}%;background:${TAG_COLORS[tag]}"></div></div>
          <span class="tb-count">${count}</span>
        </div>`)
      .join('');

    document.getElementById('topEntriesCount').textContent = totalEntries + (totalEntries <= 1 ? ' note' : ' notes');
  }

  function renderPres() {
    document.getElementById('presTitle').textContent = state.pres.title || 'Distrigouttes';
    document.getElementById('presDesc').textContent = state.pres.desc || '';
    updateStats();
  }

  function openPresEdit() {
    if (!state.authToken) {
      toast('⚠ Connectez-vous pour modifier');
      return;
    }
    document.getElementById('pTitle').value = state.pres.title;
    document.getElementById('pDesc').value = state.pres.desc;
    document.getElementById('presOverlay').classList.add('open');
  }

  function closePresEdit() {
    document.getElementById('presOverlay').classList.remove('open');
  }

  async function savePresEdit() {
    if (!state.authToken) return;
    state.pres.title = document.getElementById('pTitle').value.trim() || 'Distrigouttes';
    state.pres.desc = document.getElementById('pDesc').value.trim();
    await app.data.pushData();
    renderPres();
    closePresEdit();
    toast('✓ Présentation mise à jour');
  }

  app.presentation = { renderPres, updateStats, openPresEdit, closePresEdit, savePresEdit };
  window.openPresEdit = openPresEdit;
  window.closePresEdit = closePresEdit;
  window.savePresEdit = savePresEdit;
})();