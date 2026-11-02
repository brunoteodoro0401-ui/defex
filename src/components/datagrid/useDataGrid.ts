// ============================================================
// SAQM — DataGrid: hook de estado (busca, filtros, ordenação,
// paginação, colunas visíveis) com persistência por sessão.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ColumnDef, ColumnFilter, FilterOption, SortState } from './types';
import {
  cellText, collator, compileFilter, dateKey, normalizeText, optionLabel,
  EMPTY_LABEL, type Predicate,
} from './utils';

export interface DataGridApi<T> {
  columns:          ColumnDef<T>[];
  visibleColumns:   ColumnDef<T>[];
  hiddenKeys:       string[];
  toggleColumn:     (key: string) => void;
  showAllColumns:   () => void;

  search:           string;
  setSearch:        (v: string) => void;

  filters:          Record<string, ColumnFilter>;
  setColumnFilter:  (key: string, f: ColumnFilter | null) => void;
  clearAll:         () => void;
  hasActiveState:   boolean;

  sort:             SortState;
  setSort:          (s: SortState) => void;
  cycleSort:        (key: string) => void;

  page:             number;
  setPage:          (p: number) => void;
  pageSize:         number;
  setPageSize:      (n: number) => void;
  totalPages:       number;

  totalCount:       number;
  filteredRows:     T[];
  pageRows:         T[];

  /** Valores únicos da coluna considerando os OUTROS filtros (cascata, igual ao Excel). */
  getOptions:       (key: string) => FilterOption[];
}

interface Persisted {
  search:   string;
  filters:  Record<string, ColumnFilter>;
  sort:     SortState;
  pageSize: number;
  hidden:   string[];
}

interface Prepared<T> {
  row:      T;
  texts:    Record<string, string>;
  norms:    Record<string, string>;
  haystack: string;
}

const STORAGE_PREFIX = 'saqm-grid:';
const NO_SORT: SortState = { key: null, dir: null };

function loadState<T>(storageKey: string, columns: ColumnDef<T>[]): Persisted {
  const defaults: Persisted = {
    search: '',
    filters: {},
    sort: NO_SORT,
    pageSize: 25,
    hidden: columns.filter((c) => c.defaultHidden).map((c) => c.key),
  };
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + storageKey);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    const valid = new Set<string>(columns.map((c) => c.key));

    const filters: Record<string, ColumnFilter> = {};
    for (const [k, f] of Object.entries(parsed.filters ?? {})) {
      if (valid.has(k)) filters[k] = f;
    }
    const sort = parsed.sort && (parsed.sort.key === null || valid.has(parsed.sort.key))
      ? parsed.sort
      : NO_SORT;

    return {
      search:   typeof parsed.search === 'string' ? parsed.search : '',
      filters,
      sort,
      pageSize: typeof parsed.pageSize === 'number' ? parsed.pageSize : defaults.pageSize,
      hidden:   (parsed.hidden ?? defaults.hidden).filter((k) => valid.has(k)),
    };
  } catch {
    return defaults;
  }
}

interface UseDataGridOptions<T> {
  rows:       T[];
  columns:    ColumnDef<T>[];
  storageKey: string;
}

export function useDataGrid<T>({ rows, columns, storageKey }: UseDataGridOptions<T>): DataGridApi<T> {
  const [initial] = useState(() => loadState(storageKey, columns));

  const [search, setSearchState]          = useState(initial.search);
  const [debouncedSearch, setDebounced]   = useState(initial.search);
  const [filters, setFilters]             = useState(initial.filters);
  const [sort, setSortState]              = useState<SortState>(initial.sort);
  const [pageSize, setPageSizeState]      = useState(initial.pageSize);
  const [hiddenKeys, setHiddenKeys]       = useState<string[]>(initial.hidden);
  const [page, setPage]                   = useState(1);

  // Debounce da busca global (evita recalcular a cada tecla)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  // Persistência na sessão — filtros sobrevivem à troca de página
  useEffect(() => {
    const data: Persisted = { search, filters, sort, pageSize, hidden: hiddenKeys };
    try { sessionStorage.setItem(STORAGE_PREFIX + storageKey, JSON.stringify(data)); } catch { /* cota cheia */ }
  }, [search, filters, sort, pageSize, hiddenKeys, storageKey]);

  // Pré-processa textos (exibição + normalizado) uma única vez por carga
  const prepared = useMemo<Prepared<T>[]>(() => rows.map((row) => {
    const texts: Record<string, string> = {};
    const norms: Record<string, string> = {};
    for (const col of columns) {
      const t = cellText(row, col);
      texts[col.key] = t;
      norms[col.key] = normalizeText(t);
    }
    return { row, texts, norms, haystack: Object.values(norms).join(' | ') };
  }), [rows, columns]);

  const compiled = useMemo(
    () => Object.entries(filters).map(([key, f]) => [key, compileFilter(f)] as [string, Predicate]),
    [filters],
  );

  // Busca com múltiplos termos (AND): "samsung a52 joao"
  const terms = useMemo(
    () => normalizeText(debouncedSearch).split(/\s+/).filter(Boolean),
    [debouncedSearch],
  );

  const passes = useCallback((p: Prepared<T>, excludeKey?: string) => {
    for (const term of terms) {
      if (!p.haystack.includes(term)) return false;
    }
    for (const [key, pred] of compiled) {
      if (key === excludeKey) continue;
      if (!pred(p.texts[key] ?? '', p.norms[key] ?? '')) return false;
    }
    return true;
  }, [terms, compiled]);

  const sortedPrepared = useMemo(() => {
    const list = prepared.filter((p) => passes(p));
    if (sort.key && sort.dir) {
      const key = sort.key;
      const isDate = columns.find((c) => c.key === key)?.type === 'date';
      const mul = sort.dir === 'asc' ? 1 : -1;
      list.sort((a, b) => {
        const ta = a.texts[key] ?? '';
        const tb = b.texts[key] ?? '';
        if (ta === tb) return 0;
        if (ta === '') return 1;  // vazios sempre no fim
        if (tb === '') return -1;
        if (isDate) {
          const ka = dateKey(ta) ?? ta;
          const kb = dateKey(tb) ?? tb;
          return ka < kb ? -mul : ka > kb ? mul : 0;
        }
        return collator.compare(ta, tb) * mul;
      });
    }
    return list;
  }, [prepared, passes, sort, columns]);

  const filteredRows = useMemo(() => sortedPrepared.map((p) => p.row), [sortedPrepared]);
  const totalPages   = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage     = Math.min(page, totalPages);
  const pageRows     = useMemo(
    () => filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredRows, safePage, pageSize],
  );

  const getOptions = useCallback((key: string): FilterOption[] => {
    const isDate = columns.find((c) => c.key === key)?.type === 'date';
    const counts = new Map<string, number>();
    for (const p of prepared) {
      if (!passes(p, key)) continue;
      const label = optionLabel(p.texts[key] ?? '');
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    const list = Array.from(counts, ([label, count]) => ({ label, count }));
    list.sort((a, b) => {
      if (a.label === EMPTY_LABEL) return 1;
      if (b.label === EMPTY_LABEL) return -1;
      if (isDate) { // datas: mais recentes primeiro
        const ka = dateKey(a.label) ?? a.label;
        const kb = dateKey(b.label) ?? b.label;
        return ka < kb ? 1 : ka > kb ? -1 : 0;
      }
      return collator.compare(a.label, b.label);
    });
    return list;
  }, [prepared, passes, columns]);

  // ── Ações ──────────────────────────────────────────────────
  const setSearch = useCallback((v: string) => { setSearchState(v); setPage(1); }, []);

  const setColumnFilter = useCallback((key: string, f: ColumnFilter | null) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (f) next[key] = f; else delete next[key];
      return next;
    });
    setPage(1);
  }, []);

  const clearAll = useCallback(() => {
    setSearchState('');
    setDebounced('');
    setFilters({});
    setSortState(NO_SORT);
    setPage(1);
  }, []);

  const setSort = useCallback((s: SortState) => setSortState(s), []);

  const cycleSort = useCallback((key: string) => {
    setSortState((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return NO_SORT;
    });
  }, []);

  const setPageSize = useCallback((n: number) => { setPageSizeState(n); setPage(1); }, []);

  const toggleColumn = useCallback((key: string) => {
    setHiddenKeys((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= columns.length - 1) return prev; // mantém ao menos 1 coluna
      return [...prev, key];
    });
  }, [columns.length]);

  const showAllColumns = useCallback(() => setHiddenKeys([]), []);

  const visibleColumns = useMemo(
    () => columns.filter((c) => !hiddenKeys.includes(c.key)),
    [columns, hiddenKeys],
  );

  const hasActiveState = search.trim() !== '' || Object.keys(filters).length > 0 || sort.key !== null;

  return {
    columns, visibleColumns, hiddenKeys, toggleColumn, showAllColumns,
    search, setSearch,
    filters, setColumnFilter, clearAll, hasActiveState,
    sort, setSort, cycleSort,
    page: safePage, setPage, pageSize, setPageSize, totalPages,
    totalCount: rows.length, filteredRows, pageRows,
    getOptions,
  };
}
