import { HugeiconsIcon } from '@hugeicons/react';
import {
  Home01Icon,
  Settings02Icon,
  Database01Icon,
  GridIcon,
  ChartLineData02Icon,
  FilterIcon,
  CodeIcon,
  Rocket01Icon,
  AlertCircleIcon,
  BookOpen01Icon,
} from '@hugeicons/core-free-icons';
import { cn } from '@/lib/utils';

export interface WikiSection {
  id: string;
  title: string;
  icon: typeof Home01Icon;
  children?: { id: string; title: string }[];
}

export const WIKI_SECTIONS: WikiSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Rocket01Icon,
    children: [
      { id: 'quick-start', title: 'Quick Start' },
      { id: 'prerequisites', title: 'Prerequisites' },
      { id: 'credentials', title: 'Cloudflare Credentials' },
      { id: 'configuration', title: 'Configuration' },
    ],
  },
  {
    id: 'concepts',
    title: 'Core Concepts',
    icon: BookOpen01Icon,
    children: [
      { id: 'dummy-data', title: 'Dummy Data' },
      { id: 'analytics-engine', title: 'Analytics Engine Columns' },
    ],
  },
  {
    id: 'data-sources',
    title: 'Data Sources',
    icon: Database01Icon,
    children: [
      { id: 'creating-data-source', title: 'Creating a Data Source' },
      { id: 'column-mapping', title: 'Column Mapping' },
    ],
  },
  {
    id: 'dashboards',
    title: 'Dashboards',
    icon: GridIcon,
    children: [
      { id: 'creating-dashboard', title: 'Creating a Dashboard' },
      { id: 'dashboard-layout', title: 'Layout & Grid' },
    ],
  },
  {
    id: 'tiles',
    title: 'Tiles & Visuals',
    icon: ChartLineData02Icon,
    children: [
      { id: 'creating-tiles', title: 'Creating Tiles' },
      { id: 'visual-types', title: 'Visual Types' },
      { id: 'configuring-visuals', title: 'Configuring Visuals' },
    ],
  },
  {
    id: 'filters',
    title: 'Filters',
    icon: FilterIcon,
    children: [
      { id: 'filter-types', title: 'Filter Types' },
      { id: 'using-filters', title: 'Using Filters in Queries' },
    ],
  },
  {
    id: 'sql',
    title: 'SQL Reference',
    icon: CodeIcon,
    children: [
      { id: 'basic-queries', title: 'Basic Queries' },
      { id: 'time-queries', title: 'Time-Based Queries' },
      { id: 'aggregations', title: 'Aggregations' },
      { id: 'multi-series', title: 'Multi-Series Charts' },
      { id: 'datetime-functions', title: 'Date & Time Functions' },
      { id: 'string-functions', title: 'String Functions' },
      { id: 'math-functions', title: 'Math Functions' },
      { id: 'conditional-functions', title: 'Conditional Functions' },
    ],
  },
  {
    id: 'deployment',
    title: 'Deployment',
    icon: Settings02Icon,
    children: [
      { id: 'cloudflare-workers', title: 'Cloudflare Workers' },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: AlertCircleIcon,
    children: [
      { id: 'common-issues', title: 'Common Issues' },
    ],
  },
];

interface WikiSidebarProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

export function WikiSidebar({ activeSection, onSectionChange }: WikiSidebarProps) {
  return (
    <aside className="w-64 shrink-0 border-r bg-muted/20">
      <div className="sticky top-0 h-screen overflow-y-auto p-4">
        <div className="mb-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <HugeiconsIcon icon={Home01Icon} size={16} strokeWidth={2} />
            Documentation
          </h2>
        </div>

        <nav className="space-y-1">
          {WIKI_SECTIONS.map((section) => (
            <div key={section.id} className="mb-4">
              <button
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors',
                  activeSection === section.id || section.children?.some(c => c.id === activeSection)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <HugeiconsIcon icon={section.icon} size={14} strokeWidth={2} />
                {section.title}
              </button>

              {section.children && (
                <div className="ml-4 mt-1 space-y-0.5 border-l pl-3">
                  {section.children.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => onSectionChange(child.id)}
                      className={cn(
                        'block w-full rounded-md px-2 py-1 text-left text-xs transition-colors',
                        activeSection === child.id
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {child.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
