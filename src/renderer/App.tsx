import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import AppLayout from './components/layout/AppLayout';
import DashboardView from './components/dashboard/DashboardView';
import InvoicesView from './components/ar-views/InvoicesView';
import CustomersView from './components/customer/CustomersView';

type View = 'dashboard' | 'invoices' | 'customers';

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
      default:
        return <DashboardView />;
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <AppLayout currentView={currentView} onNavigate={setCurrentView}>
        {renderView()}
      </AppLayout>
    </>
  );
}

export default App;
