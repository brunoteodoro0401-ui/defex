// ============================================================
// SAQM — Página: Devoluções (Geral, por Canal de Venda ou por Motivo)
// Fonte: tabela devolucoes + enriquecimento inteligente (Marca,
// Canal padronizado, Categoria Macro e Submotivo NLP)
// ============================================================

import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Loader2, RotateCcw, Building2, AlertOctagon, ArrowLeft,
  ShoppingBag, Smartphone, BatteryCharging, HeartHandshake, Wrench, Sparkles, FilterX,
} from 'lucide-react';
import type { Devolucao } from '../types/index';
import { useTableData } from '../hooks/useTableData';
import { useDataGrid } from '../components/datagrid/useDataGrid';
import { DataGrid } from '../components/datagrid/DataGrid';
import { Badge, EmptyCell, StatCard } from '../components/datagrid/cells';
import type { ColumnDef } from '../components/datagrid/types';
import {
  normalizeBrand,
  normalizeOriginDev,
  categorizeReturnReason,
  categorizeReturnMacroReason,
  RETURN_MACRO_META,
  type ReturnMacroCategory,
} from '../utils/dashboardAnalytics';

interface EnrichedDevolucao extends Devolucao {
  canal:            string;
  marca:            string;
  categoria_motivo: ReturnMacroCategory;
  submotivo:        string;
}

const MACRO_TONE: Record<ReturnMacroCategory, 'rose' | 'amber' | 'indigo' | 'slate'> = {
  'Tela':            'rose',
  'Bateria':         'amber',
  'Arrependimento':  'indigo',
  'Defeitos Gerais': 'slate',
};

const COLUMNS: ColumnDef<EnrichedDevolucao>[] = [
  {
    key: 'cliente',
    label: 'Nome do Cliente',
    cellClassName: 'font-semibold text-slate-900 dark:text-slate-100 max-w-[220px] truncate',
  },
  {
    key: 'modelo',
    label: 'Modelo do Aparelho',
    cellClassName: 'font-semibold text-slate-800 dark:text-slate-200 max-w-[210px] truncate',
  },
  {
    key: 'imei',
    label: 'IMEI',
    cellClassName: 'font-mono font-medium text-slate-800 dark:text-slate-200',
  },
  {
    key: 'motivo',
    label: 'Motivo da Devolução',
    cellClassName: 'max-w-[380px] truncate text-slate-700 dark:text-slate-300',
  },
  {
    key: 'submotivo',
    label: 'Diagnóstico / Sintoma',
    render: (r) => r.submotivo ? <Badge tone="rose">{r.submotivo}</Badge> : <EmptyCell />,
  },
  {
    key: 'categoria_motivo',
    label: 'Categoria Principal',
    render: (r) => (
      <Badge tone={MACRO_TONE[r.categoria_motivo] ?? 'slate'} dot>
        {r.categoria_motivo}
      </Badge>
    ),
  },
  {
    key: 'canal',
    label: 'Canal de Venda',
    render: (r) => r.canal ? <Badge tone="sky">{r.canal}</Badge> : <EmptyCell />,
  },
  {
    key: 'marca',
    label: 'Marca',
    render: (r) => r.marca ? <Badge tone="brand">{r.marca}</Badge> : <EmptyCell />,
  },
  {
    key: 'finalidade',
    label: 'Finalidade',
  },
  {
    key: 'data_recebimento',
    label: 'Data Recebimento',
    type: 'date',
    cellClassName: 'font-mono text-[11px]',
  },
];

function DevolucoesGridSection({
  rows,
  storageKey,
  exportFileName,
  onReload,
  loading,
}: {
  rows:           EnrichedDevolucao[];
  storageKey:     string;
  exportFileName: string;
  onReload:       () => void;
  loading:        boolean;
}) {
  const grid = useDataGrid({ rows, columns: COLUMNS, storageKey });

  const { clientes, modelos } = useMemo(() => ({
    clientes: new Set(grid.filteredRows.map((r) => r.cliente).filter(Boolean)).size,
    modelos:  new Set(grid.filteredRows.map((r) => r.modelo).filter(Boolean)).size,
  }), [grid.filteredRows]);

  const filtrado = grid.filteredRows.length !== rows.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Devoluções Listadas"
          value={grid.filteredRows.length}
          icon={<RotateCcw size={18} />}
          tone="rose"
          hint={filtrado ? `de ${rows.length.toLocaleString('pt-BR')} nesta visão` : 'total nesta visão'}
        />
        <StatCard
          label="Clientes Impactados"
          value={clientes}
          icon={<Building2 size={18} />}
          tone="indigo"
          hint="clientes únicos no filtro"
        />
        <StatCard
          label="Modelos Distintos"
          value={modelos}
          icon={<AlertOctagon size={18} />}
          tone="amber"
          hint="aparelhos no resultado"
        />
      </div>

      <DataGrid
        grid={grid}
        exportFileName={exportFileName}
        onReload={onReload}
        reloading={loading}
      />
    </div>
  );
}

export function DevolucoesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const canalParam     = searchParams.get('canal');
  const categoriaParam = searchParams.get('categoria') as ReturnMacroCategory | null;

  const [quickBrand, setQuickBrand]       = useState<string>('ALL');
  const [quickSubmotivo, setQuickSubmotivo] = useState<string>('ALL');

  const { rows: rawRows, loading, error, reload } = useTableData<Devolucao>('devolucoes');

  // Enriquecimento automático das linhas com Canal, Marca, Categoria Macro e Submotivo
  const allRows = useMemo<EnrichedDevolucao[]>(() => {
    return rawRows.map((r) => ({
      ...r,
      canal:            normalizeOriginDev(r.origem),
      marca:            normalizeBrand(null, r.modelo),
      categoria_motivo: categorizeReturnMacroReason(r.motivo),
      submotivo:        categorizeReturnReason(r.motivo),
    }));
  }, [rawRows]);

  // Contagens por canal e por categoria macro para os botões rápidos
  const canaisStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of allRows) {
      map.set(r.canal, (map.get(r.canal) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [allRows]);

  const categoriasStats = useMemo(() => {
    const map = new Map<ReturnMacroCategory, number>([
      ['Tela', 0],
      ['Bateria', 0],
      ['Arrependimento', 0],
      ['Defeitos Gerais', 0],
    ]);
    for (const r of allRows) {
      map.set(r.categoria_motivo, (map.get(r.categoria_motivo) ?? 0) + 1);
    }
    return RETURN_MACRO_META.map((m) => ({
      ...m,
      count: map.get(m.id) ?? 0,
    }));
  }, [allRows]);

  // Filtra pelo Canal ou Categoria selecionados no card da Home
  const scopedByUrlRows = useMemo(() => {
    return allRows.filter((r) => {
      if (canalParam && r.canal.toLowerCase() !== canalParam.toLowerCase()) return false;
      if (categoriaParam && r.categoria_motivo !== categoriaParam) return false;
      return true;
    });
  }, [allRows, canalParam, categoriaParam]);

  // Submotivos disponíveis dentro do escopo atual
  const submotivosStats = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of scopedByUrlRows) {
      map.set(r.submotivo, (map.get(r.submotivo) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [scopedByUrlRows]);

  // Aplica filtros rápidos inteligentes (Marca e Submotivo)
  const finalRows = useMemo(() => {
    return scopedByUrlRows.filter((r) => {
      if (quickBrand !== 'ALL' && r.marca !== quickBrand) return false;
      if (quickSubmotivo !== 'ALL' && r.submotivo !== quickSubmotivo) return false;
      return true;
    });
  }, [scopedByUrlRows, quickBrand, quickSubmotivo]);

  const selectCanal = (canal: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (canal) next.set('canal', canal);
    else next.delete('canal');
    setQuickSubmotivo('ALL');
    setSearchParams(next);
  };

  const selectCategoria = (cat: ReturnMacroCategory | null) => {
    const next = new URLSearchParams(searchParams);
    if (cat) next.set('categoria', cat);
    else next.delete('categoria');
    setQuickSubmotivo('ALL');
    setSearchParams(next);
  };

  const clearAllQuickFilters = () => {
    setQuickBrand('ALL');
    setQuickSubmotivo('ALL');
    setSearchParams({});
  };

  if (loading && rawRows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-3">
        <Loader2 size={32} className="animate-spin text-brand-600 dark:text-brand-400" />
        <span className="text-xs font-medium text-slate-500">Buscando devoluções...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-center">
        <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">Falha ao carregar dados: {error}</p>
        <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-1">Verifique as permissões de acesso ao banco (RLS).</p>
      </div>
    );
  }

  const activeCategoryMeta = categoriaParam
    ? RETURN_MACRO_META.find((m) => m.id === categoriaParam)
    : null;

  const hasAnyQuickFilter = !!canalParam || !!categoriaParam || quickBrand !== 'ALL' || quickSubmotivo !== 'ALL';
  const gridKey = `devolucoes:${canalParam ?? 'all'}:${categoriaParam ?? 'all'}`;

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* ── Cabeçalho Contextual + Botão Voltar ─────────────────── */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-start sm:items-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-700 transition-colors shrink-0"
            >
              <ArrowLeft size={14} />
              Voltar ao Início
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {canalParam && categoriaParam
                    ? `Devoluções: ${canalParam} — ${categoriaParam}`
                    : canalParam
                      ? `Devoluções do Canal: ${canalParam}`
                      : categoriaParam
                        ? `Devoluções por Motivo: ${categoriaParam}`
                        : 'Detalhamento Geral de Devoluções'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60">
                  {finalRows.length} registros
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {activeCategoryMeta
                  ? activeCategoryMeta.description
                  : canalParam
                    ? `Listando todas as devoluções registradas no canal ${canalParam} com nome do cliente, aparelho, IMEI e motivo.`
                    : 'Consulte cliente, modelo do aparelho, IMEI e motivo detalhado com filtros inteligentes em cascata.'}
              </p>
            </div>
          </div>

          {hasAnyQuickFilter && (
            <button
              type="button"
              onClick={clearAllQuickFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/60 hover:bg-rose-100 transition-colors self-start sm:self-auto"
            >
              <FilterX size={13} /> Ver todas as devoluções ({allRows.length})
            </button>
          )}
        </div>

        {/* ── Filtros Inteligentes Rápidos (Canais, Motivos, Sintomas e Marca) ── */}
        <div className="space-y-3">
          {/* Linha 1: Canais de Venda */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
              <ShoppingBag size={12} className="text-rose-500" />
              Canal:
            </span>
            <button
              type="button"
              onClick={() => selectCanal(null)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                !canalParam
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
              }`}
            >
              Todos ({allRows.length})
            </button>
            {canaisStats.map((c) => {
              const active = canalParam?.toLowerCase() === c.name.toLowerCase();
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => selectCanal(active ? null : c.name)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                  }`}
                >
                  {c.name} ({c.count})
                </button>
              );
            })}
          </div>

          {/* Linha 2: Principais Motivos (4 categorias) */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
              <Sparkles size={12} className="text-brand-500" />
              Motivo Principal:
            </span>
            <button
              type="button"
              onClick={() => selectCategoria(null)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                !categoriaParam
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
              }`}
            >
              Todos
            </button>
            {categoriasStats.map((cat) => {
              const active = categoriaParam === cat.id;
              const Icon =
                cat.id === 'Tela' ? Smartphone :
                cat.id === 'Bateria' ? BatteryCharging :
                cat.id === 'Arrependimento' ? HeartHandshake : Wrench;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => selectCategoria(active ? null : cat.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon size={12} />
                  {cat.title} ({cat.count})
                </button>
              );
            })}
          </div>

          {/* Linha 3: Submotivos / Sintomas detalhados + Marca */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
                Sintoma:
              </span>
              <button
                type="button"
                onClick={() => setQuickSubmotivo('ALL')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                  quickSubmotivo === 'ALL'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
                }`}
              >
                Todos
              </button>
              {submotivosStats.map((s) => {
                const active = quickSubmotivo === s.name;
                return (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => setQuickSubmotivo(active ? 'ALL' : s.name)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                      active
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
                    }`}
                  >
                    {s.name} ({s.count})
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">
                Marca:
              </span>
              {['ALL', 'Apple', 'Samsung', 'Motorola', 'Outras'].map((b) => {
                const active = quickBrand === b;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setQuickBrand(b)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                      active
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
                    }`}
                  >
                    {b === 'ALL' ? 'Todas' : b}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabela com Filtros Avançados por Coluna ───────────── */}
      <DevolucoesGridSection
        key={gridKey}
        rows={finalRows}
        storageKey={gridKey}
        exportFileName={
          canalParam
            ? `devolucoes_${canalParam.toLowerCase().replace(/\s+/g, '_')}`
            : categoriaParam
              ? `devolucoes_${categoriaParam.toLowerCase().replace(/\s+/g, '_')}`
              : 'devolucoes'
        }
        onReload={reload}
        loading={loading}
      />
    </div>
  );
}
