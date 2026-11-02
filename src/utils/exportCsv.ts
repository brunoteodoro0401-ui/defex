// ============================================================
// SAQM — Utilitário de Exportação CSV com UTF-8 BOM
// ============================================================

export function exportToCsv<T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
  columnHeaders: { key: keyof T; label: string }[]
) {
  if (!rows || rows.length === 0) return;

  const headerRow = columnHeaders.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(';');
  const dataRows = rows.map((row) =>
    columnHeaders
      .map((col) => {
        const val = row[col.key];
        const strVal = val === null || val === undefined ? '' : String(val);
        return `"${strVal.replace(/"/g, '""')}"`;
      })
      .join(';')
  );

  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
