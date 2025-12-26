'use client';

import React, { useMemo } from 'react';
import { useTheme } from 'next-themes';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  BarChart3,
  Activity,
  Layers,
  Settings,
  Moon,
  Sun,
  Bell,
  Map,
  Upload,
  Database,
  Zap,
  Cuboid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore } from '@/store/useAppStore';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'projects', label: 'Projets', icon: <FolderOpen className="w-4 h-4" /> },
  { id: 'datasets', label: 'Données', icon: <Database className="w-4 h-4" /> },
  { id: 'import', label: 'Import', icon: <Upload className="w-4 h-4" /> },
  { id: 'preprocessing', label: 'Pré-traitement', icon: <Activity className="w-4 h-4" /> },
  { id: 'inversion', label: 'Inversion', icon: <Zap className="w-4 h-4" /> },
  { id: 'visualization-2d', label: 'Visualisation 2D', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'visualization-3d', label: 'Visualisation 3D', icon: <Cuboid className="w-4 h-4" /> },
  { id: 'gis', label: 'SIG', icon: <Map className="w-4 h-4" /> },
  { id: 'statistics', label: 'Statistiques', icon: <FileText className="w-4 h-4" /> },
  { id: 'reports', label: 'Rapports', icon: <FileText className="w-4 h-4" /> },
  { id: 'settings', label: 'Paramètres', icon: <Settings className="w-4 h-4" /> },
];

// Mapping des IDs de navigation vers les routes Next.js
const getRouteForNavItem = (navItemId: string): string => {
  const routeMap: Record<string, string> = {
    'dashboard': '/',
    'projects': '/',
    'datasets': '/datasets',
    'import': '/import',
    'preprocessing': '/preprocessing',
    'inversion': '/inversion',
    'visualization-2d': '/visualization-2d',
    'visualization-3d': '/visualization-3d',
    'gis': '/gis',
    'statistics': '/statistics',
    'reports': '/reports',
    'settings': '/settings',
  };
  return routeMap[navItemId] || '/';
};

// Mapping inverse : route vers ID de navigation
const getNavItemIdForRoute = (pathname: string): string => {
  if (pathname === '/') return 'projects';
  const routeToIdMap: Record<string, string> = {
    '/datasets': 'datasets',
    '/import': 'import',
    '/preprocessing': 'preprocessing',
    '/inversion': 'inversion',
    '/visualization-2d': 'visualization-2d',
    '/visualization-3d': 'visualization-3d',
    '/gis': 'gis',
    '/statistics': 'statistics',
    '/reports': 'reports',
    '/settings': 'settings',
  };
  return routeToIdMap[pathname] || 'projects';
};

export function Sidebar() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  // Déterminer l'item actif basé sur la route actuelle
  const activeTab = useMemo(() => getNavItemIdForRoute(pathname), [pathname]);

  // Fonction pour gérer la navigation
  const handleNavClick = (navItemId: string) => {
    const route = getRouteForNavItem(navItemId);
    router.push(route);
  };

  return (
    <aside
      className={`${
        sidebarOpen ? 'w-64' : 'w-16'
      } border-r border-border bg-card flex flex-col transition-all duration-300 ease-in-out`}
    >
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          {sidebarOpen && (
            <div className="flex-1">
              <h1 className="font-semibold text-sm">GeoMine</h1>
              <p className="text-xs text-muted-foreground">RC-Insight</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === item.id
                  ? 'bg-primary/15 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {item.icon}
              {sidebarOpen && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>
      </ScrollArea>

      {/* User Actions */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="h-9 w-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Bell className="h-4 w-4" />
          </Button>
          {sidebarOpen && (
            <div className="flex-1 flex items-center gap-2 px-2">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">DR</span>
              </div>
              <span className="text-xs font-medium">Dr. Dupont</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

