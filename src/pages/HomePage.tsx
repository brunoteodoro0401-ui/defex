// ============================================================
// SAQM — Página: Home (Dashboard Executivo Completo)
// Cruza Triagem de Recebimentos, Reparos Técnicos e Devoluções
// com filtros dinâmicos por Período/Mês e Marca.
// ============================================================

import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Smartphone, RotateCcw, Loader2, Wrench,
  Calendar, FilterX, ArrowUpRight, Layers, ShieldAlert,
  CheckCircle2, ShoppingBag, BatteryCharging, HeartHandshake, Cpu,
} from 'lucide-react';
import { DashboardData } from '../types/index';
import {
  BrandFilter, PeriodFilter, computeDashboardAnalytics, formatYearMonth,
  type ReturnMacroCategory,
} from '../utils/dashboardAnalytics';

interface HomePageProps {
  data:    DashboardData | null;
  loading: boolean;
}

const CHART_COLORS = [
  '#6366f1', '#3b82f6', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6',
];

const BRAND_COLORS: Record<string, string> = {
  Apple:    '#6366f1',
  Samsung:  '#3b82f6',
  Motorola: '#10b981',
  Outras:   '#f59e0b',
};

const PERIOD_PRESETS: { id: PeriodFilter; label: string }[] = [
  { id: 'all',    label: 'Todo o período' },
  { id: 'last30', label: 'Últimos 30d' },
  { id: 'last90', label: 'Últimos 90d' },
  { id: '2026',   label: '2026' },
  { id: '2025',   label: '2025' },
  { id: '2024',   label: '2024' },
];

const BRAND_OPTIONS: { id: BrandFilter; label: string }[] = [
  { id: 'ALL',      label: 'Todas as Marcas' },
  { id: 'Apple',    label: 'Apple' },
  { id: 'Samsung',  label: 'Samsung' },
  { id: 'Motorola', label: 'Motorola' },
  { id: 'Outras',   label: 'Outras' },
];

const MACRO_CARD_STYLE: Record<ReturnMacroCategory, {
  icon: typeof Smartphone;
  iconBg: string;
  barColor: string;
  badgeBg: string;
}> = {
  'Tela': {
    icon: Smartphone,
    iconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
    barColor: 'bg-rose-500',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/60',
  },
  'Bateria': {
    icon: BatteryCharging,
    iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
    barColor: 'bg-amber-500',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60',
  },
  'Arrependimento': {
    icon: HeartHandshake,
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400',
    barColor: 'bg-indigo-500',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/60',
  },
  'Defeitos Gerais': {
    icon: Cpu,
    iconBg: 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400',
    barColor: 'bg-sky-500',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-800/60',
  },
};

export function HomePage({ data, loading }: HomePageProps) {
  const navigate = useNavigate();
  const [period, setPeriod]           = useState<PeriodFilter>('all');
  const [brandFilter, setBrandFilter] = useState<BrandFilter>('ALL');

  const analytics = useMemo(
    () => (data ? computeDashboardAnalytics(data, period, brandFilter) : null),
    [data, period, brandFilter],
  );

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <Loader2 size={36} className="animate-spin text-brand-600 dark:text-brand-400" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Processando indicadores e cruzando tabelas...
        </p>
      </div>
    );
  }

  if (!data || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center bg-white dark:bg-[#111827] rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 p-8 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/50 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-4">
          <Smartphone size={32} />
        </div>
        <h3 className="text-slate-900 dark:text-white font-bold text-lg">Nenhuma base carregada</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mt-1.5 leading-relaxed">
          Importe uma planilha .xlsx na barra lateral para gerar os KPIs executivos e diagnósticos em tempo real.
        </p>
      </div>
    );
  }

  const { kpis } = analytics;
  const hasFilter = period !== 'all' || brandFilter !== 'ALL';
  const isMonthSelected = /^\d{4}-\d{2}$/.test(period);

  // Redireciona para a página de técnicos já filtrada pelo IMEI clicado
  const inspectImeiInTecnicos = (imei: string) => {
    try {
      sessionStorage.setItem(
        'saqm-grid:tecnicos',
        JSON.stringify({ search: imei, filters: {}, sort: { key: null, dir: null }, pageSize: 25, hidden: [] }),
      );
    } catch { /* ignore */ }
    navigate('/tecnicos');
  };

  return (
    <div className="space-y-7 animate-fade-in pb-8">
      {/* ── Barra de Filtros Globais do Dashboard ──────────────── */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Período */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">
            <Calendar size={14} className="text-brand-500" />
            Período:
          </span>
          {PERIOD_PRESETS.map((p) => {
            const active = period === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                    : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            );
          })}

          {analytics.availableMonths.length > 0 && (
            <select
              value={isMonthSelected ? period : ''}
              onChange={(e) => setPeriod(e.target.value || 'all')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all focus:outline-none ${
                isMonthSelected
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              <option value="">Mês específico...</option>
              {analytics.availableMonths.map((ym) => (
                <option key={ym} value={ym} className="bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                  {formatYearMonth(ym)} ({ym})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Marca + Limpar */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1">
            Marca:
          </span>
          {BRAND_OPTIONS.map((b) => {
            const active = brandFilter === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setBrandFilter(b.id)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
                }`}
              >
                {b.label}
              </button>
            );
          })}

          {hasFilter && (
            <button
              type="button"
              onClick={() => { setPeriod('all'); setBrandFilter('ALL'); }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/60 hover:bg-rose-100"
            >
              <FilterX size={13} /> Resetar
            </button>
          )}
        </div>
      </div>

      {/* ── 1. Devoluções em cada canal de venda (Topo) ────────── */}
      <section className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm space-y-6">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Devoluções em cada canal de venda
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Clique em um canal de venda para abrir a página com os detalhes de cada devolução
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ShoppingBag size={18} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.devolucoesCanais.map((canal) => (
              <Link
                key={canal.name}
                to={`/devolucoes?canal=${encodeURIComponent(canal.name)}`}
                className="group p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 hover:border-rose-400 dark:hover:border-rose-600 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    {canal.name}
                  </span>
                  <ArrowUpRight
                    size={15}
                    className="text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                  />
                </div>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                    {canal.value.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100/80 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
                    {canal.pct}%
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 mt-2 pt-2 border-t border-rose-200/40 dark:border-rose-900/30 inline-flex items-center gap-1">
                  Ver devoluções de {canal.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── 2. Principais motivos das devoluções (4 Cards Clicáveis) ── */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <div className="mb-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Principais motivos das devoluções
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Clique em qualquer card abaixo para abrir a lista detalhada de clientes, modelos, IMEIs e motivos
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {analytics.devolucoesPrincipaisMotivos.map((item) => {
              const style = MACRO_CARD_STYLE[item.id];
              const Icon = style.icon;
              return (
                <Link
                  key={item.id}
                  to={`/devolucoes?categoria=${encodeURIComponent(item.id)}`}
                  className="group bg-slate-50/70 dark:bg-[#151e30] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {item.title}
                      </span>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
                        <Icon size={18} />
                      </div>
                    </div>

                    <div className="my-3 flex items-baseline justify-between">
                      <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                        {item.value.toLocaleString('pt-BR')}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${style.badgeBg}`}>
                        {item.pct}% das devoluções
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-slate-200/70 dark:bg-slate-800 overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full ${style.barColor} transition-all duration-500`}
                        style={{ width: `${Math.min(100, Math.max(4, item.pct))}%` }}
                      />
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-brand-600 dark:text-brand-400 pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-800/80">
                    <span>Ver detalhes ({item.value})</span>
                    <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 3. Cards Operacionais Mantidos (Triagem, Bancada, Devoluções) ── */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1: Triagem de Entrada */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Triagem de Entrada
              </span>
              <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400">
                <Smartphone size={18} />
              </div>
            </div>
            <div className="my-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                {kpis.totalRecebimentos.toLocaleString('pt-BR')}
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/60">
                {analytics.origens[0] ? `${analytics.origens[0].name}: ${analytics.origens[0].pct}%` : 'Base Ativa'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/70">
              <span>Aparelhos triados no período</span>
              <Link to="/recebimentos" className="inline-flex items-center gap-0.5 font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                Ver tabela <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>

          {/* Card 2: Reparos da Bancada */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Reparos da Bancada
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Wrench size={18} />
              </div>
            </div>
            <div className="my-3 flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                {kpis.totalReparos.toLocaleString('pt-BR')}
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                {kpis.pctAvancado}% Avançado
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/70">
              <span>
                <strong>{kpis.reparoAvancado}</strong> avançados · <strong>{kpis.reparoSimples}</strong> simples
              </span>
              <Link to="/tecnicos" className="inline-flex items-center gap-0.5 font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                Ver bancada <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>

          {/* Card 3: Devoluções Clientes */}
          <div className="bg-white dark:bg-[#111827] rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Devoluções Clientes
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <RotateCcw size={18} />
              </div>
            </div>
            <div className="my-3 flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {kpis.totalDevolucoes.toLocaleString('pt-BR')}
                </span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  ({kpis.taxaDevolucao}%)
                </span>
              </div>
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                kpis.taxaDevolucao > 18
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60'
              }`}>
                {kpis.taxaDevolucao > 18 ? 'Atenção' : 'Controlada'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/70">
              <span>Proporção sobre entradas totais</span>
              <Link to="/devolucoes" className="inline-flex items-center gap-0.5 font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                Ver devoluções <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Defeitos da Triagem & Principais Manutenções dos Técnicos ── */}
      <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Defeitos dos Aparelhos recebidos pela Triagem de Recebimento */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Defeitos dos Aparelhos recebidos pela Triagem de Recebimento
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Incidência de problemas detectados nas observações de recebimento
              </p>
            </div>
            <Layers size={18} className="text-brand-500" />
          </div>

          <div className="space-y-3 mt-4">
            {analytics.categorias.map((c, i) => (
              <div key={c.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{c.name}</span>
                  <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                    <strong className="text-slate-800 dark:text-slate-200">{c.value}</strong> ({c.pct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(4, c.pct))}%`,
                      backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Principais Manutenções dos Técnicos */}
        <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Principais Manutenções dos Técnicos
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Agrupamento das intervenções registradas pelos técnicos
              </p>
            </div>
            <Wrench size={18} className="text-emerald-500" />
          </div>

          <div className="space-y-3 mt-4">
            {analytics.servicosBancada.map((s, idx) => (
              <div key={s.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{s.name}</span>
                  <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                    <strong className="text-slate-800 dark:text-slate-200">{s.value}</strong> ({s.pct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(5, s.pct))}%`,
                      backgroundColor: CHART_COLORS[(idx + 2) % CHART_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Indices dos modelos mais reparados ──────────────── */}
      <section className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Indices dos modelos mais reparados
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Cruzamento padronizado entre Triagem, Bancada Técnica e Devoluções
            </p>
          </div>
          {/* Mini pílulas de participação por marca */}
          <div className="flex flex-wrap gap-1.5">
            {analytics.marcasBreakdown.map((m) => (
              <span
                key={m.name}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: BRAND_COLORS[m.name] ?? '#64748b' }} />
                {m.name}: {m.total}
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <th className="py-2.5 text-left">#</th>
                <th className="py-2.5 text-left">Modelo Padronizado</th>
                <th className="py-2.5 text-left">Marca</th>
                <th className="py-2.5 text-right">Triagem M.I.</th>
                <th className="py-2.5 text-right">Reparos</th>
                <th className="py-2.5 text-right">Devoluções</th>
                <th className="py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {analytics.topModelos.map((m, idx) => (
                <tr key={m.model} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 font-mono text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 font-bold text-slate-900 dark:text-white">{m.model}</td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BRAND_COLORS[m.brand] ?? '#64748b' }} />
                      {m.brand}
                    </span>
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-slate-600 dark:text-slate-300">{m.triagem}</td>
                  <td className="py-2.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400 font-medium">{m.reparos}</td>
                  <td className="py-2.5 text-right tabular-nums">
                    {m.devolucoes > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                        {m.devolucoes}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-2.5 text-right font-extrabold text-slate-900 dark:text-white tabular-nums">{m.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── 6. Indice de reprovas dos aparelhos ────────────────── */}
      {analytics.alertasReincidencia.length > 0 && (
        <section className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Indice de reprovas dos aparelhos
                </h4>
                <p className="text-xs text-slate-400">
                  Aparelhos que retornaram múltiplas vezes à bancada ou que sofreram devolução após reparo técnico
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
              Clique em um IMEI para inspecionar o histórico completo
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2.5 text-left">IMEI</th>
                  <th className="py-2.5 text-left">Modelo</th>
                  <th className="py-2.5 text-center">Passagens na Bancada</th>
                  <th className="py-2.5 text-center">Devolução Cliente</th>
                  <th className="py-2.5 text-left">Técnico(s)</th>
                  <th className="py-2.5 text-left">Última Manutenção Registrada</th>
                  <th className="py-2.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {analytics.alertasReincidencia.map((item) => (
                  <tr key={item.imei} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 font-mono font-bold text-slate-900 dark:text-white">{item.imei}</td>
                    <td className="py-2.5 font-semibold text-slate-700 dark:text-slate-300">{item.model}</td>
                    <td className="py-2.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                        {item.reparosCount}x
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      {item.devolucoesCount > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60">
                          Sim ({item.devolucoesCount})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          <CheckCircle2 size={12} className="text-emerald-500" /> Não
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-300">{item.tecnicos.join(', ') || '—'}</td>
                    <td className="py-2.5 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={item.ultimoDefeito}>
                      {item.ultimoDefeito}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => inspectImeiInTecnicos(item.imei)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 hover:bg-brand-100 transition-colors"
                      >
                        Inspecionar <ArrowUpRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
