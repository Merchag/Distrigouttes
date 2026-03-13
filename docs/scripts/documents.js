(() => {
  const app = window.DistrigouttesApp;
  const { state, constants } = app;
  const { DOC_ICONS, DOC_LABELS } = constants;
  const { esc, toast, reportError } = app.utils;
  const SUPABASE_BUCKET = 'documents';

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

  function isPreviewable(doc) {
    return ['pdf', 'image', 'code', 'doc', 'link'].includes(doc.type);
  }

  function openDocPreview(id) {
    const doc = state.docs.find(item => item.id === id);
    if (!doc || !doc.url) return;

    const overlay = document.getElementById('docPreviewOverlay');
    const title = document.getElementById('docPreviewTitle');
    const frame = document.getElementById('docPreviewFrame');
    const fallback = document.getElementById('docPreviewFallback');
    const openBtn = document.getElementById('docPreviewOpenBtn');
    const dlBtn = document.getElementById('docPreviewDownloadBtn');

    title.textContent = doc.name || 'Document';
    const previewable = isPreviewable(doc);
    frame.style.display = previewable ? 'block' : 'none';
    fallback.style.display = previewable ? 'none' : 'block';
    frame.src = previewable ? doc.url : 'about:blank';

    openBtn.onclick = () => openDocFile(doc.url, doc.name, false);
    dlBtn.onclick = () => openDocFile(doc.url, doc.name, true);

    overlay.classList.add('open');
  }

  function closeDocPreview() {
    const overlay = document.getElementById('docPreviewOverlay');
    const frame = document.getElementById('docPreviewFrame');
    if (frame) frame.src = 'about:blank';
    if (overlay) overlay.classList.remove('open');
  }

  async function openDocFile(url, name = 'document', forceDownload = false) {
    if (!url) return false;

    if (navigator.onLine) {
      if (forceDownload) {
        const link = document.createElement('a');
        link.href = url;
        link.download = name;
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      return false;
    }

    try {
      if (!('caches' in window)) {
        toast('⚠ Mode hors-ligne indisponible sur ce navigateur');
        return false;
      }

      const cacheNames = await caches.keys();
      let response = null;
      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        response = await cache.match(url);
        if (response) break;
      }

      if (!response) {
        toast('⚠ Fichier non disponible hors-ligne sur ce PC');
        return false;
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = name;
      if (!forceDownload) link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      return false;
    } catch {
      toast('⚠ Impossible d\'ouvrir le document hors-ligne');
      return false;
    }
  }

  // ── FILE UPLOAD TO SUPABASE STORAGE ──
  function setFlaskLevel(pct, pctEl) {
    const ly = 76 * (1 - pct / 100);
    const liquid = document.getElementById('flaskLiquid');
    const wave   = document.getElementById('flaskWavePath');
    if (liquid) liquid.setAttribute('y', ly);
    if (wave)   wave.setAttribute('d',
      `M-40,${ly} Q-20,${ly - 4} 0,${ly} Q20,${ly + 4} 40,${ly} Q60,${ly - 4} 80,${ly} L80,152 L-40,152 Z`);
    if (pctEl)  pctEl.textContent = pct + '%';
  }

  function uploadFile(file, opts = {}) {
    // opts: { onProgress, liquidId, waveId, pctId }
    return new Promise((resolve, reject) => {
      if (opts.onProgress) opts.onProgress(20);
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = 'documents/' + Date.now() + '_' + safeName;

      state.sb.storage
        .from(SUPABASE_BUCKET)
        .upload(filePath, file, { upsert: false })
        .then(({ error }) => {
          if (error) throw error;
          if (opts.onProgress) opts.onProgress(90);
          const { data } = state.sb.storage.from(SUPABASE_BUCKET).getPublicUrl(filePath);
          if (!data || !data.publicUrl) throw new Error('Public URL introuvable');
          if (opts.onProgress) opts.onProgress(100);
          resolve(data.publicUrl);
        })
        .catch(reject);
    });
  }

  function handleFileDrop(file) {
    if (!state.authToken) { toast('⚠ Connectez-vous pour uploader'); return; }

    const zone      = document.getElementById('docDropZone');
    const textEl    = document.getElementById('docDropText');
    const progressEl = document.getElementById('docUploadProgress');
    const pctEl     = document.getElementById('docUploadPct');
    zone.classList.remove('drag-over', 'uploaded');

    const nameInput = document.getElementById('docName');
    if (!nameInput.value.trim()) nameInput.value = file.name.replace(/\.[^.]+$/, '');
    document.getElementById('docType').value = detectDocType(file.name);
    textEl.textContent = 'Téléversement en cours…';
    progressEl.style.display = 'flex';
    zone.classList.add('uploading');
    setFlaskLevel(0, pctEl);

    uploadFile(file, {
      onProgress: pct => setFlaskLevel(pct, pctEl)
    })
      .then(url => {
        document.getElementById('docUrl').value = url;
        textEl.textContent = '✓ ' + file.name + ' téléversé !';
        zone.classList.remove('uploading');
        zone.classList.add('uploaded');
        setTimeout(() => { progressEl.style.display = 'none'; }, 600);
        toast('✓ Fichier téléversé');
      })
      .catch(error => {
        textEl.textContent = 'Glisse un fichier ici';
        zone.classList.remove('uploading');
        progressEl.style.display = 'none';
        toast('⚠ Erreur lors du téléversement');
        reportError(
          'Téléversement Supabase échoué',
          error,
          'Vérifie Supabase Storage: bucket public "documents" + policy INSERT pour authenticated + clé anon correcte.'
        );
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
        <div class="doc-card ${doc.url ? 'doc-card-clickable' : ''}" ${doc.url ? `onclick="openDocPreview(${doc.id})"` : ''} style="animation-delay:${index * 0.05}s">
          <div class="doc-card-top">
            <div class="doc-card-icon">${DOC_ICONS[doc.type] || '📁'}</div>
            <span class="doc-type-badge">${DOC_LABELS[doc.type] || 'Autre'}</span>
          </div>
          <div class="doc-card-name">${esc(doc.name)}</div>
          ${doc.note ? `<div class="doc-card-note">${esc(doc.note)}</div>` : ''}
          ${doc.url ? `<div class="doc-card-actions">
            <a class="doc-card-link" href="${esc(doc.url)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation(); openDocPreview(${doc.id}); return false;">Afficher</a>
            <a class="doc-card-link doc-card-dl" href="${esc(doc.url)}" download="${esc(doc.name)}" rel="noopener noreferrer" onclick="event.stopPropagation(); return openDocFile('${esc(doc.url)}','${esc(doc.name)}',true)">⬇ Télécharger</a>
          </div>` : ''}
          ${state.authToken ? `<button class="doc-del" onclick="event.stopPropagation(); deleteDoc(${doc.id})" title="Supprimer">✕</button>` : ''}
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
      setFlaskLevel(0, document.getElementById('docUploadPct'));
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

  app.documents = { setDocFilter, renderDocs, openDocModal, closeDocModal, saveDoc, deleteDoc, uploadFile, detectDocType, openDocFile };
  window.setDocFilter    = setDocFilter;
  window.renderDocs      = renderDocs;
  window.openDocModal    = openDocModal;
  window.closeDocModal   = closeDocModal;
  window.saveDoc         = saveDoc;
  window.deleteDoc       = deleteDoc;
  window.openDocFile     = openDocFile;
  window.openDocPreview  = openDocPreview;
  window.closeDocPreview = closeDocPreview;
})();