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
