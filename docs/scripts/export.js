(() => {
  const app = window.DistrigouttesApp;
  const { state, constants } = app;
  const { esc, toast } = app.utils;
  const { MONTHS, TAG_LABELS } = constants;

  function formatDate(dateStr) {
    const date = new Date(dateStr + 'T12:00:00');
    return String(date.getDate()).padStart(2, '0') + '/' + String(date.getMonth() + 1).padStart(2, '0') + '/' + date.getFullYear();
  }

  function exportAsCSV() {
    if (!state.entries.length) {
      toast('⚠ Aucune note à exporter');
      return;
    }

    const headers = ['Date', 'Titre', 'Catégorie', 'Avancement', 'Contenu'];
    const rows = state.entries.map(entry => [
      formatDate(entry.date),
      entry.title,
      TAG_LABELS[entry.tag] || entry.tag,
      entry.progress + '%',
      '"' + entry.body.replace(/"/g, '""') + '"'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, 'distrigouttes_export.csv');
    toast('✓ Export CSV réussi');
  }

  function exportAsJSON() {
    if (!state.entries.length) {
      toast('⚠ Aucune note à exporter');
      return;
    }

    const data = {
      project: state.pres.title,
      author: state.cfg.author || 'Anonyme',
      exportDate: new Date().toISOString(),
      totalEntries: state.entries.length,
      entries: state.entries.map(entry => ({
        date: entry.date,
        title: entry.title,
        category: entry.tag,
        progress: entry.progress,
        content: entry.body,
        linkedDocs: entry.linkedDocs || []
      })),
      stats: {
        totalDocs: state.docs.length,
        dateRange: state.entries.length ? `${state.entries[state.entries.length - 1].date} à ${state.entries[0].date}` : 'N/A'
      }
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    downloadFile(blob, 'distrigouttes_export.json');
    toast('✓ Export JSON réussi');
  }

  function exportAsPDF() {
    if (!state.entries.length) {
      toast('⚠ Aucune note à exporter');
      return;
    }

    // Simple HTML to PDF generation using basic styling
    const title = state.pres.title || 'Distrigouttes';
    const author = state.cfg.author || 'Anonyme';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${esc(title)} - Rapport PDF</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 20px; }
          h1 { color: #e8c547; border-bottom: 3px solid #e8c547; padding-bottom: 10px; }
          h2 { color: #4f9ef8; margin-top: 24px; }
          .meta { color: #999; font-size: 12px; margin-bottom: 20px; }
          .entry { page-break-inside: avoid; margin-bottom: 24px; border-left: 3px solid #4f9ef8; padding-left: 16px; }
          .entry-date { font-weight: bold; color: #5fd4a0; }
          .entry-title { font-size: 16px; margin: 8px 0; }
          .entry-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; background: #e8c54722; color: #e8c547; margin: 4px 4px 4px 0; }
          .entry-progress { color: #5fd4a0; font-weight: bold; }
          .entry-body { white-space: pre-wrap; margin-top: 8px; color: #666; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <h1>${esc(title)}</h1>
        <div class="meta">
          <p><strong>Auteur:</strong> ${esc(author)}</p>
          <p><strong>Généré:</strong> ${new Date().toLocaleString('fr-FR')}</p>
          <p><strong>Total de notes:</strong> ${state.entries.length}</p>
        </div>
        <h2>Journal des notes</h2>
        ${state.entries.map(entry => `
          <div class="entry">
            <div class="entry-date">${formatDate(entry.date)}</div>
            <div class="entry-title">${esc(entry.title)}</div>
            <div>
              <span class="entry-tag">${TAG_LABELS[entry.tag] || entry.tag}</span>
              <span class="entry-progress">Progression: ${entry.progress}%</span>
            </div>
            <div class="entry-body">${esc(entry.body)}</div>
          </div>
        `).join('')}
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow.document.open();
      iframe.contentWindow.document.write(html);
      iframe.contentWindow.document.close();
      setTimeout(() => {
        iframe.contentWindow.print();
        setTimeout(() => document.body.removeChild(iframe), 100);
      }, 500);
    };
    iframe.src = 'about:blank';
    toast('✓ Aperçu PDF prêt (Ctrl+P pour imprimer)');
  }

  function downloadFile(blob, filename) {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function addExportButtons() {
    const docCount = document.getElementById('docsCount');
    if (!docCount || docCount._exportAdded) return;
    docCount._exportAdded = true;

    const exportDiv = document.createElement('div');
    exportDiv.className = 'export-actions';
    exportDiv.innerHTML = `
      <button class="btn-export" onclick="app.export.exportAsCSV()" title="Exporter en CSV">📊 CSV</button>
      <button class="btn-export" onclick="app.export.exportAsJSON()" title="Exporter en JSON">{ } JSON</button>
      <button class="btn-export" onclick="app.export.exportAsPDF()" title="Exporter en PDF">📄 PDF</button>
    `;
    docCount.parentElement.appendChild(exportDiv);
  }

  app.export = { exportAsCSV, exportAsJSON, exportAsPDF, addExportButtons };
  window.app = app;
})();
