'use strict';

const express  = require('express');
const fs       = require('fs');
const path     = require('path');
const cors     = require('cors');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');

const app        = express();
const PORT       = process.env.PORT || 3000;
const DATA_FILE  = path.join(__dirname, 'data.json');
// En production, définir la variable d'environnement JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'dg_jwt_s3cr3t_2024_xK9mPqR';

// ── UTILISATEURS (identifiants protégés côté serveur) ──
// Le mot de passe est haché avec bcrypt – jamais stocké en clair
const USERS = {
  STI2D: bcrypt.hashSync('STI2D', 10)
};

// ── DONNÉES PAR DÉFAUT ──
const DEFAULT_DATA = {
  entries: [],
  docs:    [],
  pres:    { title: 'Distrigouttes', desc: 'Décris ton projet ici : objectif, fonctionnalités, technologies utilisées…' },
  cfg:     { proj: 'Distrigouttes', author: '' }
};

// ── FONCTIONS DE PERSISTANCE ──
function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return JSON.parse(JSON.stringify(DEFAULT_DATA));
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Initialise data.json s'il n'existe pas
if (!fs.existsSync(DATA_FILE)) writeData(DEFAULT_DATA);

// ── MIDDLEWARES ──
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '2mb' }));
// Sert les fichiers statiques du frontend
app.use(express.static(path.join(__dirname, '..', 'docs')));

// ── MIDDLEWARE D'AUTHENTIFICATION ──
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Non authentifié' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session expirée, reconnectez-vous' });
  }
}

// ── ROUTES ──

// POST /api/login — authentification
app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Champs manquants' });
  }
  const hash = USERS[username];
  if (!hash || !bcrypt.compareSync(password, hash)) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, username });
});

// GET /api/data — lecture publique (tous les appareils voient les données)
app.get('/api/data', (_req, res) => {
  res.json(readData());
});

// POST /api/data — écriture protégée (compte STI2D requis)
app.post('/api/data', requireAuth, (req, res) => {
  const { entries, docs, pres, cfg } = req.body;
  if (!Array.isArray(entries) || !Array.isArray(docs) || !pres || !cfg) {
    return res.status(400).json({ error: 'Données invalides' });
  }
  writeData({ entries, docs, pres, cfg });
  res.json({ ok: true });
});

// ── DÉMARRAGE ──
app.listen(PORT, () => {
  console.log(`✓ Serveur Distrigouttes démarré → http://localhost:${PORT}`);
  console.log(`  Compte : STI2D / STI2D`);
});
