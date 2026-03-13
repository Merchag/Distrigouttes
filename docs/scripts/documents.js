(() => {
  const app = window.DistrigouttesApp;
  const { state, constants } = app;
  const { DOC_ICONS, DOC_LABELS } = constants;
  const { esc, toast } = app.utils;

  function setDocFilter(filter, btn) {
    state.activeDocFilter = filter;
    document.querySelectorAll('#docTypeFilters .fchip').forEach(chip => chip.classList.remove('active'));
    btn.classList.add('active');
    renderDocs();
  }

  function renderDocs() {
    const grid = document.getElementById('docsGridFull');
    const empty = document.getElementById('docsEmptyFull');
    const query = (document.getElementById('docSearchInput')?.value || '').trim().toLowerCase();
    let filtered = [...state.docs];

    if (state.activeDocFilter !== 'all') filtered = filtered.filter(doc => doc.type === state.activeDocFilter);
    if (query) {
      filtered = filtered.filter(doc => {
        const label = (DOC_LABELS[doc.type] || '').toLowerCase();
        return [doc.name, doc.note, doc.url, label].some(value => String(value || '').toLowerCase().includes(query));
      });
    }

    const total = state.docs.length;
    document.getElementById('docsCount').textContent = total + (total <= 1 ? ' document' : ' documents');

    if (!filtered.length) {
      grid.innerHTML = '';
      grid.style.display = 'none';
      empty.style.display = 'flex';
      empty.innerHTML = total
        ? `<div class="empty-icon">🔎</div><p>Aucun document ne correspond a ta recherche.<br>Essaie un autre mot-cle ou change le filtre.</p>`
        : `<div class="empty-icon">📁</div><p>Aucun document ajoute pour l'instant.<br>${state.authToken ? 'Clique sur <strong>+ Ajouter un document</strong> pour commencer.' : 'Connecte-toi pour ajouter des documents.'}</p>`;
      return;
    }

    grid.style.display = 'grid';
    empty.style.display = 'none';
    grid.innerHTML = filtered
      .map((doc, index) => `
        <div class="doc-card" style="animation-delay:${index * 0.05}s">
          <div class="doc-card-top">
            <div class="doc-card-icon">${DOC_ICONS[doc.type] || '📁'}</div>
            <span class="doc-type-badge">${DOC_LABELS[doc.type] || 'Autre'}</span>
          </div>
          <div class="doc-card-name">${esc(doc.name)}</div>
          ${doc.note ? `<div class="doc-card-note">${esc(doc.note)}</div>` : ''}
          ${doc.url ? `<a class="doc-card-link" href="${esc(doc.url)}" target="_blank" rel="noopener noreferrer">Ouvrir ↗</a>` : ''}
          ${state.authToken ? `<button class="doc-del" onclick="deleteDoc(${doc.id})" title="Supprimer">✕</button>` : ''}
        </div>`)
      .join('');
  }

  function openDocModal() {
    if (!state.authToken) {
      toast('⚠ Connectez-vous pour ajouter');
      return;
    }
    document.getElementById('docOverlay').classList.add('open');
  }

  function closeDocModal() {
    document.getElementById('docOverlay').classList.remove('open');
  }

  async function saveDoc() {
    if (!state.authToken) return;
    const name = document.getElementById('docName').value.trim();
    if (!name) {
      toast('⚠ Donne un nom au document');
      return;
    }

    state.docs.push({
      id: Date.now(),
      name,
      type: document.getElementById('docType').value,
      url: document.getElementById('docUrl').value.trim(),
      note: document.getElementById('docNote').value.trim()
    });

    await app.data.pushData();
    renderDocs();
    closeDocModal();
    ['docName', 'docUrl', 'docNote'].forEach(id => {
      document.getElementById(id).value = '';
    });
    toast('✓ Document ajouté');
  }

  async function deleteDoc(id) {
    if (!state.authToken) return;
    if (!confirm('Supprimer ce document ?')) return;
    state.docs = state.docs.filter(doc => doc.id !== id);
    await app.data.pushData();
    renderDocs();
    toast('✓ Document supprimé');
  }

  app.documents = { setDocFilter, renderDocs, openDocModal, closeDocModal, saveDoc, deleteDoc };
  window.setDocFilter = setDocFilter;
  window.renderDocs = renderDocs;
  window.openDocModal = openDocModal;
  window.closeDocModal = closeDocModal;
  window.saveDoc = saveDoc;
  window.deleteDoc = deleteDoc;
})();