(() => {
  const app = window.DistrigouttesApp;
  const { state, constants } = app;
  const { MONTHS, TAG_LABELS } = constants;
  const { esc, toast } = app.utils;
  const { DOC_ICONS } = constants;

  function setFilter(filter, btn) {
    state.activeFilter = filter;
    document.querySelectorAll('#panel-journal .fchip').forEach(chip => chip.classList.remove('active'));
    btn.classList.add('active');
    renderJournal();
  }

  function renderJournal() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    let filtered = [...state.entries];

    if (state.activeFilter !== 'all') filtered = filtered.filter(entry => entry.tag === state.activeFilter);
    if (query) filtered = filtered.filter(entry => entry.title.toLowerCase().includes(query) || entry.body.toLowerCase().includes(query));

    filtered.sort((left, right) => new Date(right.date) - new Date(left.date));

    const container = document.getElementById('entriesScroll');
    if (!filtered.length) {
      container.innerHTML = `<div class="empty"><div class="empty-icon">📓</div><p>Aucune note ici.<br>${state.authToken ? 'Clique sur <strong>+</strong> pour commencer ton journal !' : 'Connecte-toi pour ajouter des notes.'}</p></div>`;
      return;
    }

    container.innerHTML = filtered
      .map((entry, index) => {
        const date = new Date(entry.date + 'T12:00:00');
        return `<div class="entry-card" id="ec-${entry.id}" style="animation-delay:${index * 0.05}s">
          <div class="ec-header">
            <div class="ec-left">
              <div class="ec-date"><span class="dd">${String(date.getDate()).padStart(2, '0')}</span><span class="mm">${MONTHS[date.getMonth()]}</span></div>
              <div class="ec-info">
                <div class="ec-title">${esc(entry.title)}</div>
                <div class="ec-meta">
                  <span class="ec-tag tag-${entry.tag}">${TAG_LABELS[entry.tag] || 'Autre'}</span>
                  <div class="ec-prog"><div class="ec-prog-bar"><div class="ec-prog-fill" style="width:${entry.progress}%"></div></div>${entry.progress}%</div>
                </div>
              </div>
            </div>
            ${state.authToken ? `<div class="ec-actions">
              <button class="ec-btn edit" onclick="openEntryModal(${entry.id})" title="Modifier">✎</button>
              <button class="ec-btn del" onclick="deleteEntry(${entry.id})" title="Supprimer">✕</button>
            </div>` : ''}
          </div>
          <div class="ec-body collapsed" id="body-${entry.id}">${esc(entry.body)}</div>
          ${(() => {
            const linked = (entry.linkedDocs || []).map(id => state.docs.find(d => d.id === id)).filter(Boolean);
            return linked.length
              ? `<div class="ec-linked-docs">${linked.map(doc =>
                  `<a class="ec-doc-chip" href="${esc(doc.url)}" target="_blank" rel="noopener noreferrer">${DOC_ICONS[doc.type] || '📁'} ${esc(doc.name)}</a>`
                ).join('')}</div>`
              : '';
          })()}
          <button class="ec-expand" id="exp-${entry.id}" onclick="toggleBody(${entry.id})"><span class="ec-expand-arrow">▼</span> Lire la suite</button>
        </div>`;
      })
      .join('');

    filtered.forEach(entry => {
      const body = document.getElementById('body-' + entry.id);
      const expand = document.getElementById('exp-' + entry.id);
      if (body && expand && body.scrollHeight <= body.clientHeight + 4) {
        expand.style.display = 'none';
        body.classList.remove('collapsed');
      }
    });
  }

  function toggleBody(id) {
    const body = document.getElementById('body-' + id);
    const expand = document.getElementById('exp-' + id);
    body.classList.toggle('collapsed');
    const collapsed = body.classList.contains('collapsed');
    expand.classList.toggle('open', !collapsed);
    expand.querySelector('.ec-expand-arrow').style.transform = collapsed ? '' : 'rotate(180deg)';
    expand.childNodes[1].textContent = collapsed ? ' Lire la suite' : ' Réduire';
  }

  function openEntryModal(id = null) {
    if (!state.authToken) {
      toast('⚠ Connectez-vous pour modifier');
      return;
    }

    state.editingId = id;
    const today = new Date().toISOString().split('T')[0];

    if (id !== null) {
      const entry = state.entries.find(item => item.id === id);
      if (!entry) return;
      document.getElementById('entryModalTitle').textContent = 'Modifier la note';
      document.getElementById('mTitle').value = entry.title;
      document.getElementById('mDate').value = entry.date;
      document.getElementById('mBody').value = entry.body;
      document.getElementById('mProg').value = entry.progress;
      document.getElementById('mProgVal').textContent = entry.progress;
      document.querySelectorAll('.tchip').forEach(chip => chip.classList.toggle('sel', chip.dataset.t === entry.tag));
    } else {
      document.getElementById('entryModalTitle').textContent = 'Nouvelle note';
      document.getElementById('mTitle').value = '';
      document.getElementById('mDate').value = today;
      document.getElementById('mBody').value = '';
      document.getElementById('mProg').value = 50;
      document.getElementById('mProgVal').textContent = '50';
      document.querySelectorAll('.tchip').forEach((chip, index) => chip.classList.toggle('sel', index === 0));
    }

    document.getElementById('entryOverlay').classList.add('open');
    // Populate linked doc chips
    const list = document.getElementById('entryDocList');
    if (list) {
      const linkedIds = (id !== null ? (state.entries.find(x => x.id === id)?.linkedDocs || []) : []);
      list.innerHTML = state.docs.length
        ? state.docs.map(doc =>
            `<button class="doc-link-chip${linkedIds.includes(doc.id) ? ' selected' : ''}" data-doc-id="${doc.id}" onclick="this.classList.toggle('selected')">${DOC_ICONS[doc.type] || '📁'} ${esc(doc.name)}</button>`
          ).join('')
        : `<span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--muted)">Aucun document disponible</span>`;
    }

    // Bind mini drop zone for uploading a new file and linking it
    const dropZone = document.getElementById('entryDocDrop');
    if (dropZone && !dropZone._bound) {
      dropZone._bound = true;
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'file';
      hiddenInput.style.display = 'none';
      document.body.appendChild(hiddenInput);

      const handleEntryFile = async file => {
        const textEl = document.getElementById('entryDocDropText');
        const docs = app.documents;
        if (!docs) return;
        const type = docs.detectDocType(file.name);
        const name = file.name.replace(/\.[^.]+$/, '');
        dropZone.classList.add('uploading');
        textEl.textContent = 'Téléversement…';
        try {
          const url = await docs.uploadFile(file);
          const newDoc = { id: Date.now(), name, type, note: '', url };
          state.docs.push(newDoc);
          await app.data.pushData();
          // add chip and select it
          const list2 = document.getElementById('entryDocList');
          const chip = document.createElement('button');
          chip.className = 'doc-link-chip selected';
          chip.dataset.docId = newDoc.id;
          chip.onclick = () => chip.classList.toggle('selected');
          chip.textContent = (DOC_ICONS[type] || '📁') + ' ' + name;
          if (list2) list2.appendChild(chip);
          textEl.textContent = '✓ Lié !';
          setTimeout(() => { textEl.textContent = 'Glisser un fichier pour l\'uploader et le lier'; }, 2000);
          toast('✓ Document ajouté et lié');
        } catch {
          textEl.textContent = 'Erreur – réessayez';
          setTimeout(() => { textEl.textContent = 'Glisser un fichier pour l\'uploader et le lier'; }, 2000);
          toast('⚠ Erreur upload');
        } finally {
          dropZone.classList.remove('uploading');
        }
      };

      dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
      dropZone.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) handleEntryFile(file);
      });
      dropZone.addEventListener('click', () => hiddenInput.click());
      hiddenInput.addEventListener('change', () => {
        if (hiddenInput.files[0]) handleEntryFile(hiddenInput.files[0]);
        hiddenInput.value = '';
      });
    }

    setTimeout(() => document.getElementById('mTitle').focus(), 150);
  }

  function closeEntryModal() {
    document.getElementById('entryOverlay').classList.remove('open');
    state.editingId = null;
  }

  function pickTag(el) {
    document.querySelectorAll('.tchip').forEach(chip => chip.classList.remove('sel'));
    el.classList.add('sel');
  }

  async function saveEntry() {
    if (!state.authToken) {
      toast('⚠ Connectez-vous pour sauvegarder');
      return;
    }

    const title = document.getElementById('mTitle').value.trim();
    const date = document.getElementById('mDate').value;
    const body = document.getElementById('mBody').value.trim();
    const progress = parseInt(document.getElementById('mProg').value, 10);
    const tagEl = document.querySelector('.tchip.sel');
    const tag = tagEl ? tagEl.dataset.t : 'autre';

    if (!title) {
      toast('⚠ Ajoute un titre');
      return;
    }
    if (!date) {
      toast('⚠ Choisis une date');
      return;
    }
    if (!body) {
      toast('⚠ Écris quelque chose dans le contenu');
      return;
    }

    if (state.editingId !== null) {
      const linkedDocs = [...document.querySelectorAll('.doc-link-chip.selected')].map(c => parseInt(c.dataset.docId, 10));
      const index = state.entries.findIndex(item => item.id === state.editingId);
      if (index !== -1) state.entries[index] = { ...state.entries[index], title, date, body, progress, tag, linkedDocs };
      toast('✓ Note modifiée');
    } else {
      const linkedDocs = [...document.querySelectorAll('.doc-link-chip.selected')].map(c => parseInt(c.dataset.docId, 10));
      state.entries.push({ id: Date.now(), title, date, body, progress, tag, linkedDocs });
      toast('✓ Note ajoutée');
    }

    await app.data.pushData();
    closeEntryModal();
    renderJournal();
    app.presentation.updateStats();
  }

  function deleteEntry(id) {
    if (!state.authToken) return;
    const card = document.getElementById('ec-' + id);
    if (!card) return;

    card.classList.add('deleting');
    setTimeout(async () => {
      state.entries = state.entries.filter(entry => entry.id !== id);
      await app.data.pushData();
      renderJournal();
      app.presentation.updateStats();
      toast('✓ Note supprimée');
    }, 280);
  }

  app.journal = {
    setFilter,
    renderJournal,
    toggleBody,
    openEntryModal,
    closeEntryModal,
    pickTag,
    saveEntry,
    deleteEntry
  };
  window.setFilter = setFilter;
  window.renderJournal = renderJournal;
  window.toggleBody = toggleBody;
  window.openEntryModal = openEntryModal;
  window.closeEntryModal = closeEntryModal;
  window.pickTag = pickTag;
  window.saveEntry = saveEntry;
  window.deleteEntry = deleteEntry;
})();