(() => {
  const app = window.DistrigouttesApp || {};

  app.state = {
    db: null,
    auth: null,
    docRef: null,
    unsubSnapshot: null,
    entries: [],
    docs: [],
    pres: {
      title: 'Distrigouttes',
      desc: 'Décris ton projet ici : objectif, fonctionnalités, technologies utilisées…'
    },
    cfg: {
      proj: 'Distrigouttes',
      author: ''
    },
    authToken: false,
    authUser: null,
    activeFilter: 'all',
    activeDocFilter: 'all',
    editingId: null,
    currentTab: 'pres',
    toastTimer: null
  };

  app.constants = {
    MONTHS: ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'],
    TAG_LABELS: {
      avancement: 'Avancement',
      code: 'Code',
      probleme: 'Problème',
      reflexion: 'Réflexion',
      autre: 'Autre'
    },
    TAG_COLORS: {
      avancement: '#5fd4a0',
      code: '#4f9ef8',
      probleme: '#f07070',
      reflexion: '#c084f5',
      autre: '#7a7885'
    },
    DOC_ICONS: {
      pdf: '📄',
      code: '💻',
      pptx: '📊',
      image: '🖼',
      doc: '📝',
      link: '🔗',
      schema: '🧩',
      cao: '📐',
      autre: '📁'
    },
    DOC_LABELS: {
      pdf: 'PDF',
      code: 'Code',
      pptx: 'Présentation',
      image: 'Image',
      doc: 'Word',
      link: 'Lien',
      schema: 'Schéma structurel',
      cao: 'CAO',
      autre: 'Autre'
    }
  };

  window.DistrigouttesApp = app;
})();