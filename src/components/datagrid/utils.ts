// ============================================================
// SAQM — DataGrid: utilitários de filtro, data e ordenação
// ============================================================

import { formatDateDisplay } from '../../utils/formatters';
import type { ColumnDef, ColumnFilter, TextOperator } from './types';

export const EMPTY_LABEL = '(Vazio)';

export const collator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });

/** Minúsculas + sem acentos: "Técnico" casa com "tecnico". */
export function normalizeText(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/** Texto exibido de uma célula ('' quando vazio). Datas saem em DD/MM/AAAA. */
export function cellText<T>(row: T, col: ColumnDef<T>): string {
  const raw = row[col.key] as unknown;
  if (col.type === 'date') {
    const d = formatDateDisplay(raw);
    return d === '—' ? '' : d;
  }
  if (raw === null || raw === undefined) return '';
  return String(raw).trim();
}

export function optionLabel(text: string): string {
  return text === '' ? EMPTY_LABEL : text;
}

/** DD/MM/AAAA → AAAA-MM-DD (comparável como string). */
export function dateKey(display: string): string | null {
  const m = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

export function isoToBR(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

function toIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ── Períodos rápidos ─────────────────────────────────────────
export const DATE_PRESETS: { id: string; label: string }[] = [
  { id: 'today',     label: 'Hoje' },
  { id: 'yesterday', label: 'Ontem' },
  { id: 'last7',     label: 'Últimos 7 dias' },
  { id: 'last30',    label: 'Últimos 30 dias' },
  { id: 'thisMonth', label: 'Este mês' },
  { id: 'lastMonth', label: 'Mês passado' },
];

export function presetRange(id: string): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const addDays = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return d; };
  const y = today.getFullYear();
  const m = today.getMonth();

  switch (id) {
    case 'today':     return { from: toIso(today), to: toIso(today) };
    case 'yesterday': { const d = addDays(-1); return { from: toIso(d), to: toIso(d) }; }
    case 'last7':     return { from: toIso(addDays(-6)), to: toIso(today) };
    case 'last30':    return { from: toIso(addDays(-29)), to: toIso(today) };
    case 'thisMonth': return { from: toIso(new Date(y, m, 1)), to: toIso(new Date(y, m + 1, 0)) };
    case 'lastMonth': return { from: toIso(new Date(y, m - 1, 1)), to: toIso(new Date(y, m, 0)) };
    default:          return { from: `${y}-01-01`, to: `${y}-12-31` };
  }
}

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** "2026-09" → intervalo do mês inteiro. */
export function monthRange(ym: string): { from: string; to: string } {
  const [y, m] = ym.split('-').map(Number);
  return { from: toIso(new Date(y, m - 1, 1)), to: toIso(new Date(y, m, 0)) };
}

export function monthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  return `${MONTHS[Number(m) - 1]}/${y}`;
}

// ── Condições de texto ───────────────────────────────────────
export const TEXT_OPERATORS: { id: TextOperator; label: string; needsValue: boolean }[] = [
  { id: 'contains',    label: 'Contém',         needsValue: true },
  { id: 'notContains', label: 'Não contém',     needsValue: true },
  { id: 'equals',      label: 'É igual a',      needsValue: true },
  { id: 'startsWith',  label: 'Começa com',     needsValue: true },
  { id: 'endsWith',    label: 'Termina com',    needsValue: true },
  { id: 'empty',       label: 'Está vazio',     needsValue: false },
  { id: 'notEmpty',    label: 'Não está vazio', needsValue: false },
];

export type Predicate = (text: string, norm: string) => boolean;

/** Converte um filtro em função de teste (pré-compilada uma vez por mudança de filtro). */
export function compileFilter(f: ColumnFilter): Predicate {
  if (f.kind === 'values') {
    const set = new Set(f.values);
    return (text) => set.has(optionLabel(text));
  }

  if (f.kind === 'text') {
    const v = normalizeText(f.value);
    switch (f.op) {
      case 'empty':       return (text) => text === '';
      case 'notEmpty':    return (text) => text !== '';
      case 'notContains': return (_t, norm) => !norm.includes(v);
      case 'equals':      return (_t, norm) => norm === v;
      case 'startsWith':  return (_t, norm) => norm.startsWith(v);
      case 'endsWith':    return (_t, norm) => norm.endsWith(v);
      default:            return (_t, norm) => norm.includes(v);
    }
  }

  const { from, to } = f;
  return (text) => {
    const k = dateKey(text);
    if (!k) return false;
    if (from && k < from) return false;
    if (to && k > to) return false;
    return true;
  };
}

/** Descrição curta para os chips de "filtros ativos". */
export function describeFilter(f: ColumnFilter): string {
  if (f.kind === 'values') {
    const shown = f.values.slice(0, 2).join(', ');
    return f.values.length > 2 ? `${shown} +${f.values.length - 2}` : shown;
  }
  if (f.kind === 'text') {
    const op = TEXT_OPERATORS.find((o) => o.id === f.op);
    if (!op) return f.value;
    return op.needsValue ? `${op.label.toLowerCase()} "${f.value}"` : op.label.toLowerCase();
  }
  if (f.from && f.to) return f.from === f.to ? isoToBR(f.from) : `${isoToBR(f.from)} → ${isoToBR(f.to)}`;
  if (f.from) return `a partir de ${isoToBR(f.from)}`;
  if (f.to) return `até ${isoToBR(f.to)}`;
  return '';
}
