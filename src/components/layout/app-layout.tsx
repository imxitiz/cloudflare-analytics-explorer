import { useState } from 'react';
import { Sidebar } from './sidebar';
import type { Dashboard, DataSource } from '@/types/dashboard';

interface AppLayoutProps {
  children: React.ReactNode;
  dashboards: Dashboard[];
  dataSources: DataSource[];
  activeDashboardId: string | null;
  onDashboardSelect: (id: string) => void;
  onDashboardCreate: () => void;
  onDashboardDelete: (id: string) => void;
  onDataSourceSelect: (id: string) => void;
  onDataSourceCreate: () => void;
  onDataSourceDelete: (id: string) => void;
  onDocsOpen: () => void;
}

export function AppLayout({
  children,
  dashboards,
  dataSources,
  activeDashboardId,
  onDashboardSelect,
  onDashboardCreate,
  onDashboardDelete,
  onDataSourceSelect,
  onDataSourceCreate,
  onDataSourceDelete,
  onDocsOpen,
}: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        dashboards={dashboards}
        dataSources={dataSources}
        activeDashboardId={activeDashboardId}
        onDashboardSelect={onDashboardSelect}
        onDashboardCreate={onDashboardCreate}
        onDashboardDelete={onDashboardDelete}
        onDataSourceSelect={onDataSourceSelect}
        onDataSourceCreate={onDataSourceCreate}
        onDataSourceDelete={onDataSourceDelete}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        onDocsOpen={onDocsOpen}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
