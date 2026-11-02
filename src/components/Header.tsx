// ============================================================
// TeodoroTech SAQM — Componente: Header (Estilo Executivo)
// ============================================================

import { Sun, Moon, Loader2, Clock, Sparkles, FileSpreadsheet } from 'lucide-react';

interface HeaderProps {
  title:       string;
  lastUpdate:  string | null;
  isDemo:      boolean;
  fileName:    string | null;
  loading:     boolean;
  isDark:      boolean;
  toggleTheme: () => void;
}

export function Header({ title, lastUpdate, isDemo, fileName, loading, isDark, toggleTheme }: HeaderProps) {
  const formattedDate = lastUpdate
    ? new Date(lastUpdate).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null;

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-7 py-3.5 bg-white/90 dark:bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
      {/* Esquerda — Título da tela e status */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
        </div>

        {formattedDate && (
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
            <Clock size={12} className="text-slate-400" />
            <span>Atualizado: {formattedDate}</span>
          </div>
        )}
      </div>

      {/* Direita — Indicador de Origem dos Dados (Demo vs Planilha) + Tema */}
      <div className="flex items-center gap-3">
        {loading ? (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 text-xs font-medium border border-brand-200/50 dark:border-brand-800/50">
            <Loader2 size={13} className="animate-spin" />
            Processando planilha...
          </span>
        ) : isDemo ? (
          <span
            title="Os dados exibidos são fictícios para fins de demonstração e portfólio TeodoroTech. Faça upload de uma planilha .xlsx na barra lateral para analisar seus próprios dados."
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[11px] font-semibold border border-indigo-200/60 dark:border-indigo-800/60"
          >
            <Sparkles size={12} className="text-indigo-500" />
            Modo Demonstração (Dados Fictícios)
          </span>
        ) : (
          <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200/50 dark:border-emerald-800/50">
            <FileSpreadsheet size={12} className="text-emerald-500" />
            Planilha: {fileName ?? 'Personalizada'}
          </span>
        )}

        <button
          onClick={toggleTheme}
          title={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-300 transition-all shadow-sm"
        >
          {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
}
