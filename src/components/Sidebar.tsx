// ============================================================
// TeodoroTech SAQM — Componente: Sidebar (Portfólio & SaaS)
// ============================================================

import { useRef, useState, DragEvent, ChangeEvent } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Wrench, ClipboardList, RotateCcw,
  Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Sparkles, Download, RefreshCcw,
} from 'lucide-react';
import { downloadSampleSpreadsheet } from '../lib/localDataStore';

interface SidebarProps {
  onUpload:      (file: File) => Promise<void>;
  onResetDemo:   () => void;
  isDemo:        boolean;
  fileName:      string | null;
  loading:       boolean;
  uploadSuccess: boolean;
  error:         string | null;
}

const NAV_ITEMS = [
  { to: '/',             label: 'Visão Geral',           icon: LayoutDashboard, badge: 'KPIs' },
  { to: '/tecnicos',     label: 'Reparo Técnicos',       icon: Wrench,          badge: null },
  { to: '/recebimentos', label: 'Triagem Recebimentos',  icon: ClipboardList,   badge: null },
  { to: '/devolucoes',   label: 'Devoluções',            icon: RotateCcw,       badge: null },
];

export function Sidebar({
  onUpload,
  onResetDemo,
  isDemo,
  fileName,
  loading,
  uploadSuccess,
  error,
}: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver  = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop      = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onUpload(file);
  };
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  };

  const renderStatusBadge = () => {
    if (loading) return (
      <span className="flex items-center gap-1.5 text-brand-400 text-xs font-medium">
        <Loader2 size={12} className="animate-spin" /> Processando no navegador...
      </span>
    );
    if (error) return (
      <span className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400 text-xs font-medium">
        <AlertCircle size={12} /> Falha na leitura
      </span>
    );
    if (uploadSuccess || !isDemo) return (
      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
        <CheckCircle2 size={12} /> Planilha ativa no navegador
      </span>
    );
    return <span className="text-slate-400 text-[11px]">Base Demo Ativa (585 reg.)</span>;
  };

  return (
    <aside className="w-64 min-h-screen flex flex-col bg-white dark:bg-[#0d121f] text-slate-700 dark:text-slate-300 border-r border-slate-200/80 dark:border-slate-800/80 shrink-0 transition-colors duration-200">
      {/* Topo / Logo Defex */}
      <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-md shadow-brand-500/20 text-white">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">Defex</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/60">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Qualidade & Devoluções</p>
          </div>
        </div>
      </div>

      {/* Navegação Principal */}
      <div className="px-3 pt-5 pb-2">
        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Navegação
        </p>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-600/15 dark:text-brand-300 font-semibold shadow-sm shadow-brand-500/5'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <Icon
                      size={18}
                      className={isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors'}
                    />
                    <span>{label}</span>
                  </div>
                  {badge && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex-1" />

      {/* Box de Upload 100% Local + Planilha Modelo */}
      <div className="p-3 m-3 rounded-2xl bg-slate-50 dark:bg-[#131929] border border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 tracking-wide">
            Testar com sua Planilha
          </span>
          <span className="text-[10px] font-mono text-slate-400">.xlsx / .xls</span>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 border border-dashed rounded-xl p-3.5 cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30'
              : 'border-slate-300 dark:border-slate-700/80 bg-white dark:bg-[#0d121f] hover:border-brand-400 hover:shadow-sm'
          }`}
        >
          {loading ? (
            <Loader2 size={20} className="text-brand-500 animate-spin" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Upload size={16} />
            </div>
          )}
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
              {isDragging ? 'Solte a planilha aqui' : 'Carregar planilha (.xlsx)'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">100% processado no navegador</p>
          </div>
        </div>

        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />

        {/* Botões de apoio: Baixar Modelo e Restaurar Demo */}
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={downloadSampleSpreadsheet}
            className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/70 hover:border-brand-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
          >
            <Download size={12} />
            Baixar Planilha Modelo
          </button>

          {!isDemo && (
            <button
              type="button"
              onClick={onResetDemo}
              className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 hover:bg-indigo-100 transition-colors"
            >
              <RefreshCcw size={12} />
              Voltar aos Dados Demo
            </button>
          )}
        </div>

        <div className="space-y-1.5 px-0.5 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
          {fileName && (
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800/80 rounded-lg px-2 py-1 border border-slate-200 dark:border-slate-700/60">
              <FileSpreadsheet size={13} className="text-brand-500 shrink-0" />
              <span className="text-[11px] text-slate-700 dark:text-slate-300 truncate font-medium">{fileName}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-xs px-0.5">
            {renderStatusBadge()}
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-2">
            <p className="text-[10px] text-rose-700 dark:text-rose-300 leading-relaxed font-medium">{error}</p>
          </div>
        )}
      </div>

      {/* Assinatura Discreta */}
      <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 select-none">
        <span>Defex Pro v2.0</span>
        <span className="tracking-wide">
          por <span className="font-semibold text-slate-500 dark:text-slate-400">TeodoroTech</span>
        </span>
      </div>
    </aside>
  );
}
