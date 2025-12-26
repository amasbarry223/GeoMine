'use client';

import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Layers, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar } from './Sidebar';
import { useAppStore } from '@/store/useAppStore';

interface AppLayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
  headerActions?: React.ReactNode;
}

// Mapping inverse : route vers ID de navigation pour obtenir le label
const getNavItemLabelForRoute = (pathname: string): string => {
  const routeToLabelMap: Record<string, string> = {
    '/': 'Projets',
    '/datasets': 'Données',
    '/import': 'Import',
    '/preprocessing': 'Pré-traitement',
    '/inversion': 'Inversion',
    '/visualization-2d': 'Visualisation 2D',
    '/visualization-3d': 'Visualisation 3D',
    '/gis': 'SIG',
    '/statistics': 'Statistiques',
    '/reports': 'Rapports',
    '/settings': 'Paramètres',
  };
  return routeToLabelMap[pathname] || 'GeoMine RC-Insight';
};

export default function AppLayout({ children, headerTitle, headerActions }: AppLayoutProps) {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  const pageTitle = useMemo(() => {
    return headerTitle || getNavItemLabelForRoute(pathname);
  }, [pathname, headerTitle]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-4">
          <Button variant="ghost" size="icon" onClick={toggleSidebar} className="h-9 w-9">
            <Layers className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Projets</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{pageTitle}</span>
          </div>

          <div className="flex-1" />

          {headerActions && (
            <div className="flex items-center gap-2">
              {headerActions}
            </div>
          )}
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

