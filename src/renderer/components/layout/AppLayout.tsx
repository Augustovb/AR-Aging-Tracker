import { Home, FileText, Users } from 'lucide-react';

interface AppLayoutProps {
  currentView: string;
  onNavigate: (view: any) => void;
  children: React.ReactNode;
}

export default function AppLayout({ currentView, onNavigate, children }: AppLayoutProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'customers', label: 'Customers', icon: Users },
  ];

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-60 bg-notion-bg-secondary dark:bg-gray-800 border-r border-notion-border dark:border-gray-700">
        <div className="px-4 py-5">
          <h1 className="text-base font-semibold text-notion-text dark:text-white">
            AR Tracker
          </h1>
          <p className="text-xs text-notion-text-secondary dark:text-gray-400 mt-0.5">
            Invoice Management
          </p>
        </div>

        <nav className="px-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-sm transition-colors text-sm ${
                  isActive
                    ? 'bg-notion-bg-hover font-semibold text-notion-text dark:bg-gray-700 dark:text-white'
                    : 'text-notion-text-secondary hover:bg-notion-bg-hover dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-notion-border dark:border-gray-700 px-6 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-notion-text dark:text-white capitalize">
              {currentView}
            </h2>
            <span className="text-xs text-notion-text-tertiary">Data loaded from JSON</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
