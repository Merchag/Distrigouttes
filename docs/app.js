// ── FIREBASE ──
let db, auth, docRef;
let unsubSnapshot = null;

// ── STATE ──
let entries = [];
let docs    = [];
let pres    = { title: 'Distrigouttes', desc: 'Décris ton projet ici : objectif, fonctionnalités, technologies utilisées…' };
let cfg     = { proj: 'Distrigouttes', author: '' };

// ── AUTH ──
let authToken = false;
let authUser  = null;

let activeFilter    = 'all';
let activeDocFilter = 'all';
let editingId       = null;
let currentTab      = 'pres';

const MONTHS     = ['jan','fév','mar','avr','mai','jun','jul','aoû','sep','oct','nov','déc'];
const TAG_LABELS = {avancement:'Avancement',code:'Code',probleme:'Problème',reflexion:'Réflexion',autre:'Autre'};
const TAG_COLORS = {avancement:'#5fd4a0',code:'#4f9ef8',probleme:'#f07070',reflexion:'#c084f5',autre:'#7a7885'};
const DOC_ICONS  = {pdf:'📄',code:'💻',pptx:'📊',image:'🖼',doc:'📝',link:'🔗',autre:'📁'};
const DOC_LABELS = {pdf:'PDF',code:'Code',pptx:'Présentation',image:'Image',doc:'Word',link:'Lien',autre:'Autre'};

// ── FIREBASE INIT & TEMPS RÉEL ──
function initFirebase() {
  firebase.initializeApp(FIREBASE_CONFIG);
  db     = firebase.firestore();
  auth   = firebase.auth();
  docRef = db.collection('distrigouttes').doc('main');
}

function startListening() {
  if (unsubSnapshot) unsubSnapshot();
  unsubSnapshot = docRef.onSnapshot(snap => {
    if (snap.exists) {
      const data = snap.data();
      entries = data.entries || [];
      docs    = data.docs    || [];
      pres    = data.pres    || pres;
      cfg     = data.cfg     || cfg;
    }
    applyConfig();
    renderPres(); renderJournal(); renderDocs();
  }, () => toast('⚠ Erreur de connexion Firebase'));
}

async function pushData() {
  if (!authToken) return;
  try {
    await docRef.set({ entries, docs, pres, cfg });
  } catch { toast('⚠ Erreur lors de la sauvegarde'); }
}

// ── AUTH FUNCTIONS ──
function updateAuthUI() {
  const loggedIn = !!authToken;
  document.getElementById('btnLogin').style.display  = loggedIn ? 'none' : 'flex';
  document.getElementById('btnLogout').style.display = loggedIn ? 'flex'  : 'none';
  const ul = document.getElementById('authUser');
  ul.textContent   = authUser || '';
  ul.style.display = loggedIn ? 'inline' : 'none';
  // FAB visible seulement sur l'onglet journal si connecté
  document.getElementById('fab').style.display = (loggedIn && currentTab === 'journal') ? 'flex' : 'none';
  // Bouton modifier présentation
  const presBtn = document.getElementById('presEditBtn');
  if (presBtn) presBtn.style.display = loggedIn ? '' : 'none';
  // Bouton ajouter document
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
  if (!username || !password) { toast('⚠ Remplis tous les champs'); return; }
  if (username.toUpperCase() !== 'STI2D') { toast('⚠ Identifiants incorrects'); return; }
  const btn = document.getElementById('btnLoginSubmit');
  btn.disabled = true; btn.textContent = 'Connexion…';
  try {
    await auth.signInWithEmailAndPassword('portrait.clement08@gmail.com', password);
    closeLoginModal();
    toast('✓ Connecté en tant que STI2D');
  } catch (e) {
    const bad = ['auth/wrong-password','auth/user-not-found','auth/invalid-credential','auth/invalid-email'];
    toast('⚠ ' + (bad.includes(e.code) ? 'Identifiants incorrects' : 'Erreur : ' + e.code));
  } finally { btn.disabled = false; btn.textContent = 'Se connecter'; }
}

async function logout() {
  await auth.signOut();
  toast('✓ Déconnecté');
}

// ── INIT ──
async function init() {
  initFirebase();
  // Écoute l'état de connexion Firebase Auth
  auth.onAuthStateChanged(user => {
    authToken = !!user;
    authUser  = user ? 'STI2D' : null;
    updateAuthUI();
    renderJournal(); renderDocs();
  });
  // Démarre l'écoute temps réel Firestore
  startListening();
  requestAnimationFrame(() => positionIndicator(document.getElementById('tab-pres')));
}

function applyConfig() {
  document.getElementById('topProjName').textContent = cfg.proj||'Distrigouttes';
}

function switchTab(id, btn) {
  if (id===currentTab) return;
  const out = document.getElementById('panel-'+currentTab);
  out.classList.remove('active'); out.classList.add('exit-left');
  setTimeout(()=>out.classList.remove('exit-left'), 400);
  currentTab = id;
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  positionIndicator(btn);
  // FAB only on journal
  document.getElementById('fab').style.display = (id === 'journal' && authToken) ? 'flex' : 'none';
  if (id==='pres') {
    document.querySelectorAll('.pres-card').forEach((c,i)=>{
      c.style.animation='none'; c.style.opacity='0';
      requestAnimationFrame(()=>{ c.style.animation=''; c.style.animationDelay=(i*.07)+'s'; });
    });
    renderPres();
  }
  if (id==='docs') renderDocs();
  requestAnimationFrame(()=>document.getElementById('panel-'+id).classList.add('active'));
}

function positionIndicator(btn) {
  const ind=document.getElementById('tabIndicator');
  const tr=document.getElementById('tabsBar').getBoundingClientRect();
  const br=btn.getBoundingClientRect();
  ind.style.left=(br.left-tr.left)+'px'; ind.style.width=br.width+'px';
}

// ── PRÉSENTATION ──
function renderPres() {
  document.getElementById('presTitle').textContent = pres.title||'Distrigouttes';
  document.getElementById('presDesc').textContent  = pres.desc||'';
  updateStats();
}
function openPresEdit() {
  if (!authToken) { toast('⚠ Connectez-vous pour modifier'); return; }
  document.getElementById('pTitle').value = pres.title;
  document.getElementById('pDesc').value  = pres.desc;
  document.getElementById('presOverlay').classList.add('open');
}
function closePresEdit() { document.getElementById('presOverlay').classList.remove('open'); }
async function savePresEdit() {
  if (!authToken) return;
  pres.title = document.getElementById('pTitle').value.trim() || 'Distrigouttes';
  pres.desc  = document.getElementById('pDesc').value.trim();
  await pushData();
  renderPres(); closePresEdit(); toast('✓ Présentation mise à jour');
}

// ── STATS ──
function updateStats() {
  const n=entries.length;
  const days=new Set(entries.map(e=>e.date)).size;
  const avg=n?Math.round(entries.reduce((s,e)=>s+e.progress,0)/n):0;
  document.getElementById('s-entries').textContent=n;
  document.getElementById('s-days').textContent=days;
  if (n) {
    const latest=entries.reduce((a,b)=>new Date(a.date)>new Date(b.date)?a:b);
    const d=new Date(latest.date+'T12:00:00');
    document.getElementById('s-last').textContent=String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0');
  } else document.getElementById('s-last').textContent='—';
  const circ=2*Math.PI*40;
  document.getElementById('arcFg').setAttribute('stroke-dasharray',(avg/100)*circ+' '+circ);
  document.getElementById('arcLabel').textContent=avg+'%';
  const counts={avancement:0,code:0,probleme:0,reflexion:0,autre:0};
  entries.forEach(e=>{ if(counts[e.tag]!==undefined) counts[e.tag]++; });
  const max=Math.max(...Object.values(counts),1);
  document.getElementById('tagBreakdown').innerHTML=Object.entries(counts).map(([t,c])=>`
    <div class="tb-row">
      <span class="tb-label" style="color:${TAG_COLORS[t]}">${TAG_LABELS[t]}</span>
      <div class="tb-bar-outer"><div class="tb-bar-inner" style="width:${(c/max)*100}%;background:${TAG_COLORS[t]}"></div></div>
      <span class="tb-count">${c}</span>
    </div>`).join('');
  document.getElementById('topEntriesCount').textContent=n+(n<=1?' note':' notes');
}

// ── JOURNAL ──
function setFilter(f,btn) {
  activeFilter=f;
  document.querySelectorAll('#panel-journal .fchip').forEach(c=>c.classList.remove('active'));
  btn.classList.add('active'); renderJournal();
}
function renderJournal() {
  const q=document.getElementById('searchInput').value.toLowerCase();
  let fil=[...entries];
  if (activeFilter!=='all') fil=fil.filter(e=>e.tag===activeFilter);
  if (q) fil=fil.filter(e=>e.title.toLowerCase().includes(q)||e.body.toLowerCase().includes(q));
  fil.sort((a,b)=>new Date(b.date)-new Date(a.date));
  const el=document.getElementById('entriesScroll');
  if (!fil.length) {
    el.innerHTML=`<div class="empty"><div class="empty-icon">📓</div><p>Aucune note ici.<br>${authToken ? 'Clique sur <strong>+</strong> pour commencer ton journal !' : 'Connecte-toi pour ajouter des notes.'}</p></div>`;
    return;
  }
  el.innerHTML=fil.map((e,i)=>{
    const d=new Date(e.date+'T12:00:00');
    return `<div class="entry-card" id="ec-${e.id}" style="animation-delay:${i*.05}s">
      <div class="ec-header">
        <div class="ec-left">
          <div class="ec-date"><span class="dd">${String(d.getDate()).padStart(2,'0')}</span><span class="mm">${MONTHS[d.getMonth()]}</span></div>
          <div class="ec-info">
            <div class="ec-title">${esc(e.title)}</div>
            <div class="ec-meta">
              <span class="ec-tag tag-${e.tag}">${TAG_LABELS[e.tag]||'Autre'}</span>
              <div class="ec-prog"><div class="ec-prog-bar"><div class="ec-prog-fill" style="width:${e.progress}%"></div></div>${e.progress}%</div>
            </div>
          </div>
        </div>
        ${authToken ? `<div class="ec-actions">
          <button class="ec-btn edit" onclick="openEntryModal(${e.id})" title="Modifier">✎</button>
          <button class="ec-btn del"  onclick="deleteEntry(${e.id})"    title="Supprimer">✕</button>
        </div>` : ''}
      </div>
      <div class="ec-body collapsed" id="body-${e.id}">${esc(e.body)}</div>
      <button class="ec-expand" id="exp-${e.id}" onclick="toggleBody(${e.id})"><span class="ec-expand-arrow">▼</span> Lire la suite</button>
    </div>`;
  }).join('');
  fil.forEach(e=>{
    const b=document.getElementById('body-'+e.id), x=document.getElementById('exp-'+e.id);
    if (b&&x&&b.scrollHeight<=b.clientHeight+4) { x.style.display='none'; b.classList.remove('collapsed'); }
  });
}
function toggleBody(id) {
  const b=document.getElementById('body-'+id), e=document.getElementById('exp-'+id);
  b.classList.toggle('collapsed');
  const col=b.classList.contains('collapsed');
  e.classList.toggle('open',!col);
  e.querySelector('.ec-expand-arrow').style.transform=col?'':'rotate(180deg)';
  e.childNodes[1].textContent=col?' Lire la suite':' Réduire';
}
function openEntryModal(id=null) {
  if (!authToken) { toast('⚠ Connectez-vous pour modifier'); return; }
  editingId=id;
  const today=new Date().toISOString().split('T')[0];
  if (id!==null) {
    const e=entries.find(x=>x.id===id); if(!e) return;
    document.getElementById('entryModalTitle').textContent='Modifier la note';
    document.getElementById('mTitle').value=e.title; document.getElementById('mDate').value=e.date;
    document.getElementById('mBody').value=e.body;   document.getElementById('mProg').value=e.progress;
    document.getElementById('mProgVal').textContent=e.progress;
    document.querySelectorAll('.tchip').forEach(c=>c.classList.toggle('sel',c.dataset.t===e.tag));
  } else {
    document.getElementById('entryModalTitle').textContent='Nouvelle note';
    document.getElementById('mTitle').value=''; document.getElementById('mDate').value=today;
    document.getElementById('mBody').value='';  document.getElementById('mProg').value=50;
    document.getElementById('mProgVal').textContent='50';
    document.querySelectorAll('.tchip').forEach((c,i)=>c.classList.toggle('sel',i===0));
  }
  document.getElementById('entryOverlay').classList.add('open');
  setTimeout(()=>document.getElementById('mTitle').focus(),150);
}
function closeEntryModal() { document.getElementById('entryOverlay').classList.remove('open'); editingId=null; }
function pickTag(el) { document.querySelectorAll('.tchip').forEach(c=>c.classList.remove('sel')); el.classList.add('sel'); }
async function saveEntry() {
  if (!authToken) { toast('⚠ Connectez-vous pour sauvegarder'); return; }
  const title    = document.getElementById('mTitle').value.trim();
  const date     = document.getElementById('mDate').value;
  const body     = document.getElementById('mBody').value.trim();
  const progress = parseInt(document.getElementById('mProg').value);
  const tagEl    = document.querySelector('.tchip.sel');
  const tag      = tagEl ? tagEl.dataset.t : 'autre';
  if (!title) { toast('⚠ Ajoute un titre'); return; }
  if (!date)  { toast('⚠ Choisis une date'); return; }
  if (!body)  { toast('⚠ Écris quelque chose dans le contenu'); return; }
  if (editingId !== null) {
    const i = entries.findIndex(x => x.id === editingId);
    if (i !== -1) entries[i] = { ...entries[i], title, date, body, progress, tag };
    toast('✓ Note modifiée');
  } else {
    entries.push({ id: Date.now(), title, date, body, progress, tag });
    toast('✓ Note ajoutée');
  }
  await pushData();
  closeEntryModal(); renderJournal(); updateStats();
}
function deleteEntry(id) {
  if (!authToken) return;
  const card = document.getElementById('ec-' + id);
  if (card) {
    card.classList.add('deleting');
    setTimeout(async () => {
      entries = entries.filter(e => e.id !== id);
      await pushData();
      renderJournal(); updateStats(); toast('✓ Note supprimée');
    }, 280);
  }
}

// ── DOCUMENTS ──
function setDocFilter(f,btn) {
  activeDocFilter=f;
  document.querySelectorAll('#docTypeFilters .fchip').forEach(c=>c.classList.remove('active'));
  btn.classList.add('active'); renderDocs();
}
function renderDocs() {
  const grid=document.getElementById('docsGridFull'), empty=document.getElementById('docsEmptyFull');
  let fil=[...docs];
  if (activeDocFilter!=='all') fil=fil.filter(d=>d.type===activeDocFilter);
  const total=docs.length;
  document.getElementById('docsCount').textContent=total+(total<=1?' document':' documents');
  if (!fil.length) { grid.innerHTML=''; grid.style.display='none'; empty.style.display='flex'; return; }
  grid.style.display='grid'; empty.style.display='none';
  grid.innerHTML=fil.map((d,i)=>`
    <div class="doc-card" style="animation-delay:${i*.05}s">
      <div class="doc-card-top">
        <div class="doc-card-icon">${DOC_ICONS[d.type]||'📁'}</div>
        <span class="doc-type-badge">${DOC_LABELS[d.type]||'Autre'}</span>
      </div>
      <div class="doc-card-name">${esc(d.name)}</div>
      ${d.note?`<div class="doc-card-note">${esc(d.note)}</div>`:''}
      ${d.url?`<a class="doc-card-link" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">Ouvrir ↗</a>`:''}
      ${authToken ? `<button class="doc-del" onclick="deleteDoc(${d.id})" title="Supprimer">✕</button>` : ''}
    </div>`).join('');
}
function openDocModal()  {
  if (!authToken) { toast('⚠ Connectez-vous pour ajouter'); return; }
  document.getElementById('docOverlay').classList.add('open');
}
function closeDocModal() { document.getElementById('docOverlay').classList.remove('open'); }
async function saveDoc() {
  if (!authToken) return;
  const name = document.getElementById('docName').value.trim();
  if (!name) { toast('⚠ Donne un nom au document'); return; }
  docs.push({ id: Date.now(), name, type: document.getElementById('docType').value, url: document.getElementById('docUrl').value.trim(), note: document.getElementById('docNote').value.trim() });
  await pushData();
  renderDocs(); closeDocModal();
  ['docName','docUrl','docNote'].forEach(id => document.getElementById(id).value = '');
  toast('✓ Document ajouté');
}
async function deleteDoc(id) {
  if (!authToken) return;
  if (!confirm('Supprimer ce document ?')) return;
  docs = docs.filter(d => d.id !== id);
  await pushData();
  renderDocs(); toast('✓ Document supprimé');
}

// ── SETTINGS ──
function openSettings() {
  if (!authToken) { toast('⚠ Connectez-vous pour accéder aux paramètres'); return; }
  document.getElementById('sProjName').value = cfg.proj;
  document.getElementById('sAuthor').value   = cfg.author || '';
  document.getElementById('settingsOverlay').classList.add('open');
}
function closeSettings() { document.getElementById('settingsOverlay').classList.remove('open'); }
async function saveSettings() {
  if (!authToken) return;
  cfg.proj   = document.getElementById('sProjName').value.trim() || 'Distrigouttes';
  cfg.author = document.getElementById('sAuthor').value.trim();
  await pushData();
  applyConfig(); closeSettings(); toast('✓ Paramètres sauvegardés');
}

// ── UTILS ──
function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
let toastTimer;
function toast(msg) { const el=document.getElementById('toast'); el.textContent=msg; el.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>el.classList.remove('show'),2200); }

document.querySelectorAll('.overlay').forEach(ov=>ov.addEventListener('click',e=>{ if(e.target===ov){ov.classList.remove('open');editingId=null;} }));
document.addEventListener('keydown',e=>{ if(e.key==='Escape'){document.querySelectorAll('.overlay').forEach(o=>o.classList.remove('open'));editingId=null;} if((e.ctrlKey||e.metaKey)&&e.key==='n'){e.preventDefault();openEntryModal();} if(e.key==='Enter'&&document.getElementById('loginOverlay').classList.contains('open')){e.preventDefault();submitLogin();} });
window.addEventListener('resize',()=>{ const a=document.querySelector('.tab.active'); if(a) positionIndicator(a); });

init();
