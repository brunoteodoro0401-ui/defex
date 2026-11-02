// ============================================================
// SAQM — DataGrid: Popover de filtro por coluna (estilo Excel+)
// Abas: Valores (checkbox) | Condição (texto) ou Período (data)
// Renderizado em portal com posição fixa → nunca é cortado.
// ============================================================

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowUpAZ, ArrowDownZA, ArrowUp, ArrowDown, CalendarDays, Check,
  ListChecks, Search, SlidersHorizontal, X,
} from 'lucide-react';
import type { ColumnDef, ColumnFilter, FilterOption, SortState, TextOperator } from './types';
import {
  DATE_PRESETS, EMPTY_LABEL, TEXT_OPERATORS, dateKey, monthLabel, monthRange,
  normalizeText, presetRange,
} from './utils';

interface Props<T> {
  column:   ColumnDef<T>;
  anchorEl: HTMLElement;
  filter:   ColumnFilter | undefined;
  options:  FilterOption[];
  sort:     SortState;
  onSort:   (s: SortState) => void;
  onApply:  (f: ColumnFilter | null) => void;
  onClose:  () => void;
}

type Tab = 'values' | 'condition' | 'date';

const WIDTH      = 320;
const MAX_RENDER = 300;

const tabBtn = (active: boolean) =>
  `flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
    active
      ? 'bg-white dark:bg-slate-700 text-brand-700 dark:text-brand-300 shadow-sm'
      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
  }`;

const inputCls =
  'w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 dark:[color-scheme:dark]';

export function ColumnFilterPopover<T>({
  column, anchorEl, filter, options, sort, onSort, onApply, onClose,
}: Props<T>) {
  const isDate = column.type === 'date';
  const popRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, maxHeight: 520 });

  const [tab, setTab] = useState<Tab>(
    filter?.kind === 'text' ? 'condition' : filter?.kind === 'date' ? 'date' : 'values',
  );

  // ── Aba Valores ─────────────────────────────────────────────
  const allLabels = useMemo(() => options.map((o) => o.label), [options]);
  const [listSearch, setListSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(() =>
    filter?.kind === 'values' ? new Set(filter.values) : new Set(options.map((o) => o.label)),
  );

  const visibleOptions = useMemo(() => {
    const q = normalizeText(listSearch);
    return q ? options.filter((o) => normalizeText(o.label).includes(q)) : options;
  }, [options, listSearch]);

  const visibleCheckedCount = visibleOptions.reduce((n, o) => n + (selected.has(o.label) ? 1 : 0), 0);
  const allVisibleChecked   = visibleOptions.length > 0 && visibleCheckedCount === visibleOptions.length;
  const someVisibleChecked  = visibleCheckedCount > 0 && !allVisibleChecked;

  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someVisibleChecked;
  }, [someVisibleChecked]);

  // Com busca ativa, aplicar = somente os itens visíveis marcados (comportamento do Excel)
  const effectiveSelection = useMemo(() => {
    if (!listSearch.trim()) return selected;
    return new Set(visibleOptions.filter((o) => selected.has(o.label)).map((o) => o.label));
  }, [listSearch, selected, visibleOptions]);

  const toggleValue = (label: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const o of visibleOptions) {
        if (allVisibleChecked) next.delete(o.label); else next.add(o.label);
      }
      return next;
    });
  };

  // ── Aba Condição ────────────────────────────────────────────
  const [op, setOp]           = useState<TextOperator>(filter?.kind === 'text' ? filter.op : 'contains');
  const [opValue, setOpValue] = useState(filter?.kind === 'text' ? filter.value : '');
  const opDef = TEXT_OPERATORS.find((o) => o.id === op) ?? TEXT_OPERATORS[0];

  // ── Aba Período ─────────────────────────────────────────────
  const [from, setFrom] = useState(filter?.kind === 'date' ? filter.from ?? '' : '');
  const [to, setTo]     = useState(filter?.kind === 'date' ? filter.to ?? '' : '');

  const months = useMemo(() => {
    if (!isDate) return [];
    const set = new Set<string>();
    for (const o of options) {
      const k = dateKey(o.label);
      if (k) set.add(k.slice(0, 7));
    }
    return Array.from(set).sort().reverse().slice(0, 12);
  }, [options, isDate]);

  // ── Aplicar ─────────────────────────────────────────────────
  const canApply =
    tab === 'values'    ? effectiveSelection.size > 0 :
    tab === 'condition' ? (!opDef.needsValue || opValue.trim() !== '') :
                          (from !== '' || to !== '');

  const apply = () => {
    if (!canApply) return;
    if (tab === 'values') {
      const isAll = allLabels.every((l) => effectiveSelection.has(l));
      onApply(isAll ? null : { kind: 'values', values: Array.from(effectiveSelection) });
    } else if (tab === 'condition') {
      onApply({ kind: 'text', op, value: opDef.needsValue ? opValue.trim() : '' });
    } else {
      let f: string | null = from || null;
      let t: string | null = to || null;
      if (f && t && f > t) [f, t] = [t, f];
      onApply({ kind: 'date', from: f, to: t });
    }
    onClose();
  };

  // ── Posicionamento (fixo, acompanha scroll/resize) ──────────
  useLayoutEffect(() => {
    const update = () => {
      const r  = anchorEl.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let left = r.right - WIDTH;
      if (left < 8) left = r.left;
      left = Math.max(8, Math.min(left, vw - WIDTH - 8));
      const top = r.bottom + 6;
      setPos({ top, left, maxHeight: Math.max(280, vh - top - 12) });
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [anchorEl]);

  // ── Fechar ao clicar fora / Esc ─────────────────────────────
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || anchorEl.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [anchorEl, onClose]);

  const sortAsc  = sort.key === column.key && sort.dir === 'asc';
  const sortDesc = sort.key === column.key && sort.dir === 'desc';

  const sortBtn = (active: boolean) =>
    `flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
      active
        ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800'
        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
    }`;

  return createPortal(
    <div
      ref={popRef}
      role="dialog"
      aria-label={`Filtro da coluna ${column.label}`}
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: WIDTH, maxHeight: pos.maxHeight }}
      className="z-[100] flex flex-col rounded-2xl bg-white dark:bg-[#131929] border border-slate-200 dark:border-slate-700/80 shadow-2xl shadow-slate-900/20 text-slate-800 dark:text-slate-200 animate-fade-in"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'BUTTON') { e.preventDefault(); apply(); }
      }}
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">{column.label}</span>
        <button type="button" onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Fechar">
          <X size={14} />
        </button>
      </div>

      {/* Ordenação */}
      <div className="flex gap-2 px-4 pb-3">
        <button type="button" className={sortBtn(sortAsc)}
          onClick={() => onSort(sortAsc ? { key: null, dir: null } : { key: column.key, dir: 'asc' })}>
          {isDate ? <ArrowUp size={13} /> : <ArrowUpAZ size={13} />}
          {isDate ? 'Mais antigo' : 'A → Z'}
        </button>
        <button type="button" className={sortBtn(sortDesc)}
          onClick={() => onSort(sortDesc ? { key: null, dir: null } : { key: column.key, dir: 'desc' })}>
          {isDate ? <ArrowDown size={13} /> : <ArrowDownZA size={13} />}
          {isDate ? 'Mais recente' : 'Z → A'}
        </button>
      </div>

      {/* Abas */}
      <div className="mx-4 mb-3 flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80">
        <button type="button" className={tabBtn(tab === 'values')} onClick={() => setTab('values')}>
          <ListChecks size={13} /> Valores
        </button>
        {isDate ? (
          <button type="button" className={tabBtn(tab === 'date')} onClick={() => setTab('date')}>
            <CalendarDays size={13} /> Período
          </button>
        ) : (
          <button type="button" className={tabBtn(tab === 'condition')} onClick={() => setTab('condition')}>
            <SlidersHorizontal size={13} /> Condição
          </button>
        )}
      </div>

      {/* Corpo */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4">
        {tab === 'values' && (
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Pesquisar valores..."
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                className={`${inputCls} pl-7 pr-7`}
              />
              {listSearch && (
                <button type="button" onClick={() => setListSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Limpar busca">
                  <X size={12} />
                </button>
              )}
            </div>

            <label className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 cursor-pointer select-none">
              <span className="flex items-center gap-2">
                <input ref={selectAllRef} type="checkbox" checked={allVisibleChecked} onChange={toggleAllVisible} className="accent-brand-600" />
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {listSearch ? 'Selecionar resultados da busca' : 'Selecionar tudo'}
                </span>
              </span>
              <span className="text-[10px] text-slate-400 tabular-nums">
                {effectiveSelection.size}/{options.length}
              </span>
            </label>

            <div className="max-h-56 overflow-y-auto -mx-1 px-1 pb-1">
              {visibleOptions.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">Nenhum valor encontrado.</p>
              ) : (
                visibleOptions.slice(0, MAX_RENDER).map((o) => {
                  const checked = selected.has(o.label);
                  return (
                    <div
                      key={o.label}
                      onClick={() => toggleValue(o.label)}
                      className="group flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/70"
                    >
                      <input type="checkbox" checked={checked} readOnly tabIndex={-1} className="accent-brand-600 pointer-events-none" />
                      <span
                        className={`flex-1 truncate ${o.label === EMPTY_LABEL ? 'italic text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}
                        title={o.label}
                      >
                        {o.label}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelected(new Set([o.label])); }}
                        className="hidden group-hover:inline text-[10px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                        title="Selecionar somente este valor"
                      >
                        só este
                      </button>
                      <span className="text-[10px] font-mono text-slate-400 tabular-nums">{o.count}</span>
                    </div>
                  );
                })
              )}
              {visibleOptions.length > MAX_RENDER && (
                <p className="text-center py-2 text-[10px] text-slate-400">
                  Exibindo {MAX_RENDER} de {visibleOptions.length} — refine a pesquisa.
                </p>
              )}
            </div>
          </div>
        )}

        {tab === 'condition' && (
          <div className="flex flex-col gap-2.5 pb-2">
            <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Mostrar linhas em que o valor</label>
            <select value={op} onChange={(e) => setOp(e.target.value as TextOperator)} className={inputCls}>
              {TEXT_OPERATORS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            {opDef.needsValue && (
              <input
                autoFocus
                type="text"
                placeholder="Digite o texto..."
                value={opValue}
                onChange={(e) => setOpValue(e.target.value)}
                className={inputCls}
              />
            )}
            <p className="text-[10px] text-slate-400 leading-relaxed">
              A comparação ignora maiúsculas e acentos.
            </p>
          </div>
        )}

        {tab === 'date' && (
          <div className="flex flex-col gap-3 pb-2">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Períodos rápidos</p>
              <div className="grid grid-cols-2 gap-1.5">
                {DATE_PRESETS.map((p) => {
                  const r = presetRange(p.id);
                  const active = from === r.from && to === r.to;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setFrom(r.from); setTo(r.to); }}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                        active
                          ? 'bg-brand-600 text-white border-brand-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-400'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {months.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Meses com registros</p>
                <div className="flex flex-wrap gap-1.5">
                  {months.map((ym) => {
                    const r = monthRange(ym);
                    const active = from === r.from && to === r.to;
                    return (
                      <button
                        key={ym}
                        type="button"
                        onClick={() => { setFrom(r.from); setTo(r.to); }}
                        className={`px-2 py-1 rounded-full text-[11px] font-medium border transition-colors ${
                          active
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-400'
                        }`}
                      >
                        {monthLabel(ym)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">De</span>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Até</span>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Rodapé */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 mt-2 border-t border-slate-100 dark:border-slate-800">
        {filter ? (
          <button
            type="button"
            onClick={() => { onApply(null); onClose(); }}
            className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 px-2 py-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            Limpar filtro
          </button>
        ) : <span />}
        <div className="flex items-center gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
            Cancelar
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={!canApply}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-600 text-white hover:bg-brand-700 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check size={12} /> Aplicar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
