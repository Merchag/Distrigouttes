(() => {
  const app = window.DistrigouttesApp;
  const { state, constants } = app;
  const { toast } = app.utils;

  const SEARCH_CACHE_KEY = 'distrigouttes_search_history';
  const MAX_HISTORY = 10;

  function initAdvancedSearch() {
    loadSearchHistory();
  }

  function saveSearchQuery(query) {
    if (!query.trim()) return;
    let history = JSON.parse(localStorage.getItem(SEARCH_CACHE_KEY) || '[]');
    history = history.filter(q => q !== query);
    history.unshift(query);
    if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
    localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(history));
  }

  function loadSearchHistory() {
    return JSON.parse(localStorage.getItem(SEARCH_CACHE_KEY) || '[]');
  }

  function clearSearchHistory() {
    localStorage.removeItem(SEARCH_CACHE_KEY);
    toast('✓ Historique de recherche effacé');
  }

  function searchEntries(query, filters = {}) {
    let results = [...state.entries];

    if (query) {
      const q = query.toLowerCase();
      results = results.filter(entry =>
        entry.title.toLowerCase().includes(q) ||
        entry.body.toLowerCase().includes(q) ||
        (filters.tag && entry.tag === filters.tag)
      );
    }

    if (filters.tag && filters.tag !== 'all') {
      results = results.filter(e => e.tag === filters.tag);
    }

    if (filters.minProgress) {
      results = results.filter(e => e.progress >= filters.minProgress);
    }

    if (filters.startDate) {
      results = results.filter(e => new Date(e.date) >= new Date(filters.startDate));
    }

    if (filters.endDate) {
      results = results.filter(e => new Date(e.date) <= new Date(filters.endDate));
    }

    return results.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function searchDocuments(query, filters = {}) {
    let results = [...state.docs];

    if (query) {
      const q = query.toLowerCase();
      results = results.filter(doc =>
        doc.name.toLowerCase().includes(q) ||
        (doc.note && doc.note.toLowerCase().includes(q))
      );
    }

    if (filters.type && filters.type !== 'all') {
      results = results.filter(d => d.type === filters.type);
    }

    if (filters.linkedOnly) {
      const linkedIds = state.entries.flatMap(e => e.linkedDocs || []);
      results = results.filter(d => linkedIds.includes(d.id));
    }

    return results;
  }

  function getSearchStats() {
    return {
      totalEntries: state.entries.length,
      totalDocs: state.docs.length,
      categoryCounts: state.entries.reduce((acc, e) => {
        acc[e.tag] = (acc[e.tag] || 0) + 1;
        return acc;
      }, {}),
      avgProgress: state.entries.length > 0
        ? Math.round(state.entries.reduce((sum, e) => sum + e.progress, 0) / state.entries.length)
        : 0
    };
  }

  function highlightSearchTerm(text, term) {
    if (!term) return text;
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark style="background:rgba(232,197,71,.3);padding:2px 4px;border-radius:3px;">$1</mark>');
  }

  app.search = {
    initAdvancedSearch,
    saveSearchQuery,
    loadSearchHistory,
    clearSearchHistory,
    searchEntries,
    searchDocuments,
    getSearchStats,
    highlightSearchTerm
  };
})();
