// ============================================================
// SAQM — DataGrid: tabela genérica com filtros avançados
// Toolbar (busca, colunas, exportar) · chips de filtros ativos ·
// cabeçalho fixo com ordenação e filtro por coluna · paginação.
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Download, Eye, Filter, FilterX, RefreshCw, Search, Smartphone, X,
} from 'lucide-react';
import type { DataGridApi } from './useDataGrid';
import { ColumnFilterPopover } from './ColumnFilterPopover';
import { cellText, describeFilter } from './utils';
import { exportToCsv } from '../../utils/exportCsv';

interface DataGridProps<T extends { id: string }> {
  grid:           DataGridApi<T>;
  exportFileName: string;
  onReload?:      () => void;
  reloading?:     boolean;
}

function pageList(current: number, total: number): (number | 'gap')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | 'gap')[] = [1];
  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);
  if (start > 2) pages.push('gap');
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push('gap');
  pages.push(total);
  return pages;
}

const iconBtn =
  'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:border-brand-300 hover:text-brand-700 dark:hover:text-brand-300 transition-colors disabled:opacity-50';

const pagerBtn =
  'min-w-[30px] h-[30px] inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors';

export function DataGrid<T extends { id: string }>({ grid, exportFileName, onReload, reloading }: DataGridProps<T>) {
  const [openKey, setOpenKey]         = useState<string | null>(null);
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const btnRefs    = useRef<Record<string, HTMLButtonElement | null>>({});
  const colMenuRef = useRef<HTMLDivElement>(null);
  const searchRef  = useRef<HTMLInputElement>(null);

  // Atalho "/" foca a busca global
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Fecha menu de colunas ao clicar fora
  useEffect(() => {
    if (!colMenuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!colMenuRef.current?.contains(e.target as Node)) setColMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [colMenuOpen]);

  const closePopover = useCallback(() => setOpenKey(null), []);
  const openColumn   = openKey ? grid.visibleColumns.find((c) => c.key === openKey) : undefined;
  const anchorEl     = openKey ? btnRefs.current[openKey] ?? null : null;
  const { getOptions } = grid;
  const options      = useMemo(() => (openKey ? getOptions(openKey) : []), [openKey, getOptions]);

  const filterEntries = Object.entries(grid.filters);
  const sortColumn    = grid.sort.key ? grid.columns.find((c) => c.key === grid.sort.key) : undefined;

  const handleExport = () => {
    const cols = grid.visibleColumns;
    const data = grid.filteredRows.map((row) => {
      const o: Record<string, string> = {};
      for (const c of cols) o[c.key] = cellText(row, c);
      return o;
    });
    exportToCsv(exportFileName, data, cols.map((c) => ({ key: c.key, label: c.label })));
  };

  const from = grid.filteredRows.length === 0 ? 0 : (grid.page - 1) * grid.pageSize + 1;
  const to   = Math.min(grid.page * grid.pageSize, grid.filteredRows.length);

  return (
    <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Pesquisar em todas as colunas..."
              value={grid.search}
              onChange={(e) => grid.setSearch(e.target.value)}
              className="w-full pl-8 pr-14 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
            />
            {grid.search ? (
              <button type="button" onClick={() => grid.setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-700" aria-label="Limpar pesquisa">
                <X size={13} />
              </button>
            ) : (
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-400">/</kbd>
            )}
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            <strong className="text-slate-800 dark:text-slate-200">{grid.filteredRows.length.toLocaleString('pt-BR')}</strong>
            {' '}de {grid.totalCount.toLocaleString('pt-BR')} registros
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end">
          {grid.hasActiveState && (
            <button type="button" onClick={grid.clearAll} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/60 hover:bg-rose-100/80 transition-colors">
              <FilterX size={13} /> Limpar tudo
            </button>
          )}

          {onReload && (
            <button type="button" onClick={onReload} disabled={reloading} className={iconBtn} title="Recarregar dados do banco">
              <RefreshCw size={13} className={reloading ? 'animate-spin' : ''} />
            </button>
          )}

          <div ref={colMenuRef} className="relative">
            <button type="button" onClick={() => setColMenuOpen((v) => !v)} className={iconBtn}>
              <Eye size={13} /> Colunas
              {grid.hiddenKeys.length > 0 && (
                <span className="px-1.5 rounded-full bg-brand-600 text-white text-[10px]">{grid.visibleColumns.length}/{grid.columns.length}</span>
              )}
            </button>
            {colMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 z-30 p-2 rounded-2xl bg-white dark:bg-[#131929] border border-slate-200 dark:border-slate-700/80 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between px-2 py-1 mb-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Colunas visíveis</span>
                  {grid.hiddenKeys.length > 0 && (
                    <button type="button" onClick={grid.showAllColumns} className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                      Mostrar todas
                    </button>
                  )}
                </div>
                {grid.columns.map((c) => (
                  <label key={c.key} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                    <input type="checkbox" checked={!grid.hiddenKeys.includes(c.key)} onChange={() => grid.toggleColumn(c.key)} className="accent-brand-600" />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleExport}
            disabled={grid.filteredRows.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Exporta as linhas filtradas e as colunas visíveis"
          >
            <Download size={13} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* ── Chips de filtros ativos ─────────────────────────── */}
      {(filterEntries.length > 0 || sortColumn) && (
        <div className="flex flex-wrap items-center gap-2 px-4 pb-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ativos:</span>
          {filterEntries.map(([key, f]) => {
            const col = grid.columns.find((c) => c.key === key);
            return (
              <span key={key} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full text-[11px] bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 border border-brand-200/70 dark:border-brand-800/60">
                <button type="button" onClick={() => setOpenKey(key)} className="flex items-center gap-1 max-w-[300px]" title="Editar filtro">
                  <Filter size={10} className="shrink-0" />
                  <span className="font-semibold shrink-0">{col?.label ?? key}:</span>
                  <span className="truncate">{describeFilter(f)}</span>
                </button>
                <button type="button" onClick={() => grid.setColumnFilter(key, null)} className="p-0.5 rounded-full hover:bg-brand-100 dark:hover:bg-brand-900/60" aria-label="Remover filtro">
                  <X size={11} />
                </button>
              </span>
            );
          })}
          {sortColumn && (
            <span className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {grid.sort.dir === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
              <span>Ordenado por <strong>{sortColumn.label}</strong></span>
              <button type="button" onClick={() => grid.setSort({ key: null, dir: null })} className="p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700" aria-label="Remover ordenação">
                <X size={11} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* ── Tabela ──────────────────────────────────────────── */}
      <div className="overflow-auto max-h-[68vh] border-t border-slate-200/80 dark:border-slate-800/80">
        <table className="min-w-full text-left border-separate border-spacing-0">
          <thead>
            <tr>
              {grid.visibleColumns.map((col) => {
                const f          = grid.filters[col.key];
                const isFiltered = !!f;
                const isSorted   = grid.sort.key === col.key && grid.sort.dir !== null;
                const isOpen     = openKey === col.key;
                return (
                  <th
                    key={col.key}
                    className={`sticky top-0 z-10 px-3 py-2.5 whitespace-nowrap border-b border-slate-200/80 dark:border-slate-700/80 ${
                      isFiltered ? 'bg-brand-50 dark:bg-[#1a1d3a]' : 'bg-slate-50 dark:bg-[#172033]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => grid.cycleSort(col.key)}
                        className={`group inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                          isFiltered || isSorted ? 'text-brand-700 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                        title="Clique para ordenar"
                      >
                        {col.label}
                        {isSorted
                          ? (grid.sort.dir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)
                          : <ArrowUpDown size={11} className="opacity-0 group-hover:opacity-60 transition-opacity" />}
                      </button>
                      <button
                        ref={(el) => { btnRefs.current[col.key] = el; }}
                        type="button"
                        onClick={() => setOpenKey((k) => (k === col.key ? null : col.key))}
                        title={`Filtrar ${col.label}`}
                        className={`relative p-1 rounded-md transition-all ${
                          isFiltered
                            ? 'bg-brand-600 text-white shadow-sm'
                            : isOpen
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700/70'
                        }`}
                      >
                        <Filter size={12} className={isFiltered ? 'fill-current' : ''} />
                        {f?.kind === 'values' && (
                          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-indigo-500 text-white text-[9px] font-bold leading-4 text-center">
                            {f.values.length}
                          </span>
                        )}
                      </button>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {grid.pageRows.length === 0 ? (
              <tr>
                <td colSpan={grid.visibleColumns.length} className="py-20 text-center">
                  <Smartphone size={30} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  {grid.totalCount === 0 ? (
                    <p className="text-xs text-slate-400">Nenhum dado na base. Importe uma planilha pela barra lateral.</p>
                  ) : (
                    <>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Nenhum registro corresponde aos filtros aplicados.</p>
                      <button type="button" onClick={grid.clearAll} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700">
                        <FilterX size={12} /> Limpar filtros
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ) : (
              grid.pageRows.map((row, i) => (
                <tr
                  key={row.id}
                  className={`transition-colors hover:bg-brand-50/60 dark:hover:bg-slate-800/50 ${i % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-900/40' : ''}`}
                >
                  {grid.visibleColumns.map((col) => {
                    const text = cellText(row, col);
                    return (
                      <td
                        key={col.key}
                        title={text}
                        className={`px-3 py-2.5 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap border-b border-slate-100 dark:border-slate-800/60 ${
                          grid.filters[col.key] ? 'bg-brand-50/30 dark:bg-brand-950/10' : ''
                        } ${col.cellClassName ?? ''}`}
                      >
                        {col.render
                          ? col.render(row)
                          : (text || <span className="text-slate-300 dark:text-slate-600">—</span>)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Paginação ───────────────────────────────────────── */}
      <div className="px-5 py-3.5 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-200/80 dark:border-slate-800/80 rounded-b-2xl flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span>Linhas por página</span>
          <select
            value={grid.pageSize}
            onChange={(e) => grid.setPageSize(Number(e.target.value))}
            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs focus:outline-none"
          >
            {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span className="ml-2 tabular-nums">{from}–{to} de {grid.filteredRows.length.toLocaleString('pt-BR')}</span>
        </div>

        <div className="flex items-center gap-1">
          <button type="button" className={pagerBtn} onClick={() => grid.setPage(1)} disabled={grid.page === 1} aria-label="Primeira página">
            <ChevronsLeft size={14} />
          </button>
          <button type="button" className={pagerBtn} onClick={() => grid.setPage(grid.page - 1)} disabled={grid.page === 1} aria-label="Página anterior">
            <ChevronLeft size={14} />
          </button>
          {pageList(grid.page, grid.totalPages).map((p, idx) =>
            p === 'gap' ? (
              <span key={`gap-${idx}`} className="px-1 text-slate-400">…</span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => grid.setPage(p)}
                className={`${pagerBtn} px-2 font-semibold ${p === grid.page ? '!bg-brand-600 !text-white !border-brand-600' : ''}`}
              >
                {p}
              </button>
            ),
          )}
          <button type="button" className={pagerBtn} onClick={() => grid.setPage(grid.page + 1)} disabled={grid.page === grid.totalPages} aria-label="Próxima página">
            <ChevronRight size={14} />
          </button>
          <button type="button" className={pagerBtn} onClick={() => grid.setPage(grid.totalPages)} disabled={grid.page === grid.totalPages} aria-label="Última página">
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>

      {/* ── Popover do filtro ───────────────────────────────── */}
      {openColumn && anchorEl && (
        <ColumnFilterPopover
          key={openColumn.key}
          column={openColumn}
          anchorEl={anchorEl}
          filter={grid.filters[openColumn.key]}
          options={options}
          sort={grid.sort}
          onSort={grid.setSort}
          onApply={(f) => grid.setColumnFilter(openColumn.key, f)}
          onClose={closePopover}
        />
      )}
    </div>
  );
}
