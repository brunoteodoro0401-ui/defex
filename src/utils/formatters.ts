// ============================================================
// SAQM — Utilitário de Formatação de Dados (Datas, Textos, etc.)
// ============================================================

export function formatDateDisplay(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';

  const s = String(value).trim();
  if (!s || s === 'null' || s === 'undefined') return '—';

  // Se já for DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    return s;
  }

  // Se for YYYY-MM-DD
  const ymdMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    return `${ymdMatch[3]}/${ymdMatch[2]}/${ymdMatch[1]}`;
  }

  // Se for número serial do Excel (ex: 45620)
  const num = Number(s);
  if (!isNaN(num) && num > 10000 && num < 80000) {
    const d = new Date(Math.round((num - 25569) * 86400 * 1000));
    const dia = String(d.getUTCDate()).padStart(2, '0');
    const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
    const ano = d.getUTCFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  // Tenta parse via Date
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    const dia = String(parsed.getDate()).padStart(2, '0');
    const mes = String(parsed.getMonth() + 1).padStart(2, '0');
    const ano = parsed.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  return s;
}
