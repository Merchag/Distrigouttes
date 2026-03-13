(() => {
  const app = window.DistrigouttesApp;
  const { state, constants } = app;
  const { DOC_ICONS, DOC_LABELS } = constants;
  const { esc, toast } = app.utils;

  // ── TYPE DETECTION BY FILE EXTENSION ──
  const EXT_TO_TYPE = {
    pdf: 'pdf',
    js: 'code', ts: 'code', py: 'code', c: 'code', cpp: 'code', h: 'code',
    html: 'code', css: 'code', json: 'code', java: 'code', php: 'code', rb: 'code',
    pptx: 'pptx', ppt: 'pptx',
    png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', svg: 'image', webp: 'image', bmp: 'image',
    doc: 'doc', docx: 'doc', odt: 'doc',
    sch: 'schema', brd: 'schema',
    step: 'cao', stp: 'cao', stl: 'cao', f3d: 'cao', sldprt: 'cao', iges: 'cao', igs: 'cao', obj: 'cao'
  };

  function detectDocType(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    return EXT_TO_TYPE[ext] || 'autre';
  }

  // ── FILE UPLOAD TO FIREBASE STORAGE ──
  function uploadFile(file) {
    return new Promise((resolve, reject) => {
      const fileRef = firebase.storage().ref().child('documents/' + Date.now() + '_' + file.name);
      const task = fileRef.put(file);
      const progressEl = document.getElementById('docUploadProgress');
      const barEl = document.getElementById('docUploadBar');
      const pctEl = document.getElementById('docUploadPct');
      const zone = document.getElementById('docDropZone');

      progressEl.style.display = 'flex';
      zone.classList.add('uploading');

      task.on(
        'state_changed',
        snap => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          barEl.style.width = pct + '%';
          pctEl.textContent = pct + '%';
        },
        err => {
          progressEl.style.display = 'none';
          zone.classList.remove('uploading');
          reject(err);
        },
        async () => {
          const url = await task.snapshot.ref.getDownloadURL();
          progressEl.style.display = 'none';
          zone.classList.remove('uploading');
          resolve(url);
        }
      );
    });
  }

  function handleFileDrop(file) {
    if (!state.authToken) { toast('⚠ Connectez-vous pour uploader'); return; }

    const zone = document.getElementById('docDropZone');
    const textEl = document.getElementById('docDropText');
    zone.classList.remove('drag-over', 'uploaded');

    const nameInput = document.getElementById('docName');
    if (!nameInput.value.trim()) {
      nameInput.value = file.name.replace(/\.[^.]+$/, '');
    }
    document.getElementById('docType').value = detectDocType(file.name);
    textEl.textContent = 'Upload en cours…';

    uploadFile(file)
      .then(url => {
        document.getElementById('docUrl').value = url;
        textEl.textContent = '✓ ' + file.name + ' uploadé !';
        zone.classList.add('uploaded');
        toast('✓ Fichier uploadé');
      })
      .catch(() => {
        textEl.textContent = 'Glisse un fichier ici';
        toast('⚠ Erreur lors de l\'upload');
      });
  }

  // ── DROP ZONE BINDING ──
  function bindDropZone() {
    const zone = document.getElementById('docDropZone');
    if (!zone) return;

    zone.addEventListener('dragover', event => {
      event.preventDefault();
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', event => {
      if (!zone.contains(event.relatedTarget)) {
        zone.classList.remove('drag-over');
      }
    });

    zone.addEventListener('drop', event => {
      event.preventDefault();
      zone.classList.remove('drag-over');
      const file = event.dataTransfer.files[0];
      if (file) handleFileDrop(file);
    });

    zone.addEventListener('click', () => {
      if (!state.authToken) return;
      const input = document.createElement('input');
      input.type = 'file';
      input.onchange = () => { if (input.files[0]) handleFileDrop(input.files[0]); };
      input.click();
    });
  }

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
    const zone = document.getElementById('docDropZone');
    if (zone) {
      zone.classList.remove('drag-over', 'uploaded', 'uploading');
      document.getElementById('docDropText').textContent = 'Glisse un fichier ici';
      document.getElementById('docUploadProgress').style.display = 'none';
      document.getElementById('docUploadBar').style.width = '0';
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

  bindDropZone();

  app.documents = { setDocFilter, renderDocs, openDocModal, closeDocModal, saveDoc, deleteDoc };
  window.setDocFilter = setDocFilter;
  window.renderDocs = renderDocs;
  window.openDocModal = openDocModal;
  window.closeDocModal = closeDocModal;
  window.saveDoc = saveDoc;
  window.deleteDoc = deleteDoc;
})();