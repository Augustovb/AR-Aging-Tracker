import { useState } from 'react';
import AppLayout from './components/layout/AppLayout';
import DashboardView from './components/dashboard/DashboardView';
import InvoicesView from './components/ar-views/InvoicesView';
import CustomersView from './components/customer/CustomersView';
import EmailView from './components/email/EmailView';
import SettingsView from './components/settings/SettingsView';

type View = 'dashboard' | 'invoices' | 'customers' | 'email' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  if (!window.electronAPI) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">AR Aging Tracker</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            This app requires the Electron desktop window to access the database and APIs.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Please use the Electron window that opened automatically, or run <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">npm run dev</code> to launch it.
          </p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'invoices':
        return <InvoicesView />;
      case 'customers':
        return <CustomersView />;
      case 'email':
        return <EmailView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <AppLayout currentView={currentView} onNavigate={setCurrentView}>
      {renderView()}
    </AppLayout>
  );
}

export default App;
