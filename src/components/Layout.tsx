// ============================================================
// TeodoroTech SAQM — Componente: Layout
// Wrapper com Sidebar + Header + conteúdo das rotas.
// ============================================================

import { useState, useEffect, useRef, ReactNode } from 'react';
import { useLocation }  from 'react-router-dom';
import { Sidebar }      from './Sidebar';
import { Header }       from './Header';

interface LayoutProps {
  children:      ReactNode;
  lastUpdate:    string | null;
  isDemo:        boolean;
  fileName:      string | null;
  loading:       boolean;
  onUpload:      (file: File) => Promise<void>;
  onResetDemo:   () => void;
  uploadSuccess: boolean;
  error:         string | null;
}

const PAGE_TITLES: Record<string, string> = {
  '/':             'Dashboard de Qualidade — TeodoroTech',
  '/tecnicos':     'Reparo dos Técnicos',
  '/recebimentos': 'Triagem Recebimentos',
  '/devolucoes':   'Devoluções de Clientes',
};

export function Layout({
  children,
  lastUpdate,
  isDemo,
  fileName,
  loading,
  onUpload,
  onResetDemo,
  uploadSuccess,
  error,
}: LayoutProps) {
  const location = useLocation();
  const mainRef  = useRef<HTMLElement>(null);

  const searchParams   = new URLSearchParams(location.search);
  const canalParam     = searchParams.get('canal');
  const categoriaParam = searchParams.get('categoria');

  let title = PAGE_TITLES[location.pathname] ?? 'TeodoroTech SAQM';
  if (location.pathname === '/devolucoes') {
    if (canalParam) {
      title = `Devoluções — Canal: ${canalParam}`;
    } else if (categoriaParam) {
      title = `Devoluções — Motivo: ${categoriaParam}`;
    }
  }

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname, location.search]);

  // ── Dark Mode ─────────────────────────────────────────────
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('saqm-theme') === 'dark' ||
      (!localStorage.getItem('saqm-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
      localStorage.setItem('saqm-theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('saqm-theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((d) => !d);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100">
      <Sidebar
        onUpload={onUpload}
        onResetDemo={onResetDemo}
        isDemo={isDemo}
        fileName={fileName}
        loading={loading}
        uploadSuccess={uploadSuccess}
        error={error}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={title}
          lastUpdate={lastUpdate}
          isDemo={isDemo}
          fileName={fileName}
          loading={loading}
          isDark={isDark}
          toggleTheme={toggleTheme}
        />
        <main ref={mainRef} className="flex-1 overflow-y-auto px-7 py-7 flex flex-col justify-between">
          <div className="flex-1">{children}</div>
          <footer className="mt-10 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 dark:text-slate-500 select-none">
            <span>SAQM Pro — Plataforma de Inteligência e Qualidade em Assistência Técnica</span>
            <span>
              Produto Oficial <strong className="font-semibold text-brand-600 dark:text-brand-400">TeodoroTech</strong>
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
