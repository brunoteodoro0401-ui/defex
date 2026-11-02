// ============================================================
// SAQM — DataGrid: elementos visuais compartilhados
// ============================================================

import type { ReactNode } from 'react';

const TONES = {
  brand:   'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border-brand-200/60 dark:border-brand-800/60',
  indigo:  'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-800/60',
  sky:     'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-800/60',
  rose:    'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/60',
  amber:   'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/60',
  emerald: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/60',
  slate:   'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60',
} as const;

const DOTS: Record<keyof typeof TONES, string> = {
  brand: 'bg-brand-500', indigo: 'bg-indigo-500', sky: 'bg-sky-500', rose: 'bg-rose-500', amber: 'bg-amber-500', emerald: 'bg-emerald-500', slate: 'bg-slate-400',
};

export type Tone = keyof typeof TONES;

export function Badge({ children, tone = 'slate', dot = false }: { children: ReactNode; tone?: Tone; dot?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 max-w-[240px] px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${TONES[tone]}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOTS[tone]}`} />}
      <span className="truncate">{children}</span>
    </span>
  );
}

export function EmptyCell() {
  return <span className="text-slate-300 dark:text-slate-600">—</span>;
}

interface StatCardProps {
  label: string;
  value: number;
  hint?: string;
  icon:  ReactNode;
  tone:  'brand' | 'indigo' | 'emerald' | 'sky' | 'rose' | 'amber';
}

const STAT_TONES: Record<StatCardProps['tone'], string> = {
  brand:   'bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400',
  indigo:  'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400',
  emerald: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
  sky:     'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400',
  rose:    'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400',
  amber:   'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
};

export function StatCard({ label, value, hint, icon, tone }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-[#111827] rounded-xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center gap-3.5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${STAT_TONES[tone]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-400 uppercase truncate">{label}</p>
        <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5 tabular-nums">{value.toLocaleString('pt-BR')}</p>
        {hint && <p className="text-[10px] text-slate-400 truncate">{hint}</p>}
      </div>
    </div>
  );
}
