import { useEffect, useState, useMemo } from 'react';
import { invoicesAPI, stripeAPI } from '../../services/api';
import type { Invoice, AgeBucket, ARCategory } from '../../types';
import { format } from 'date-fns';
import { Copy, ExternalLink, Check } from 'lucide-react';


export default function InvoicesView() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBucket, setFilterBucket] = useState<AgeBucket | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<ARCategory | 'all'>('all');
  const [filterCustomer, setFilterCustomer] = useState<string>('all');
  const [customerSearch, setCustomerSearch] = useState('');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoicesAPI.getAll();
      setInvoices(data);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  // Build sorted, unique customer list for the dropdown
  const customerOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const inv of invoices) {
      if (!map.has(inv.customer_id)) {
        map.set(inv.customer_id, inv.customer_name || 'Unknown');
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [invoices]);

  const filteredCustomerOptions = useMemo(() => {
    if (!customerSearch) return customerOptions;
    const q = customerSearch.toLowerCase();
    return customerOptions.filter(c => c.name.toLowerCase().includes(q));
  }, [customerOptions, customerSearch]);

  const filteredInvoices = invoices.filter(inv => {
    if (filterBucket !== 'all' && inv.age_bucket !== filterBucket) return false;
    if (filterCategory !== 'all' && inv.category !== filterCategory) return false;
    if (filterCustomer !== 'all' && inv.customer_id !== filterCustomer) return false;
    return true;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const getCategoryBadge = (category: ARCategory | null) => {
    if (!category) return null;

    const styles: Record<ARCategory, string> = {
      critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      relevant: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      all90: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      standard: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    };

    const labels: Record<ARCategory, string> = {
      critical: 'Critical',
      relevant: 'Relevant',
      all90: '90+ Days',
      standard: 'Standard',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[category]}`}>
        {labels[category]}
      </span>
    );
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyPaymentLink = async (invoiceId: string) => {
    try {
      const url = await stripeAPI.getPaymentLink(invoiceId);
      await navigator.clipboard.writeText(url);
      setCopiedId(invoiceId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Toast is already shown by stripeAPI
    }
  };

  if (loading) {
    return (
      <div className="card">
        <p className="text-center text-gray-600 dark:text-gray-400">Loading invoices...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Age Bucket
            </label>
            <select
              value={filterBucket}
              onChange={(e) => setFilterBucket(e.target.value as any)}
              className="input"
            >
              <option value="all">All</option>
              <option value="current">Current</option>
              <option value="1-30">1-30 days</option>
              <option value="31-60">31-60 days</option>
              <option value="61-90">61-90 days</option>
              <option value="90+">90+ days</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as any)}
              className="input"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="relevant">Relevant</option>
              <option value="all90">90+ Days</option>
              <option value="standard">Standard</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Customer
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search customers..."
                value={filterCustomer === 'all' ? customerSearch : customerOptions.find(c => c.id === filterCustomer)?.name || ''}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  if (filterCustomer !== 'all') {
                    setFilterCustomer('all');
                  }
                }}
                onFocus={() => {
                  if (filterCustomer !== 'all') {
                    setCustomerSearch(customerOptions.find(c => c.id === filterCustomer)?.name || '');
                    setFilterCustomer('all');
                  }
                }}
                className="input w-full"
              />
              {customerSearch && filterCustomer === 'all' && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  <button
                    onClick={() => { setFilterCustomer('all'); setCustomerSearch(''); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    All Customers
                  </button>
                  {filteredCustomerOptions.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setFilterCustomer(c.id); setCustomerSearch(''); }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {c.name}
                    </button>
                  ))}
                  {filteredCustomerOptions.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-400">No matches</div>
                  )}
                </div>
              )}
              {filterCustomer !== 'all' && (
                <button
                  onClick={() => { setFilterCustomer('all'); setCustomerSearch(''); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Invoices ({filteredInvoices.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Days Overdue
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white" title={`Invoice: ${invoice.invoice_number}`}>
                    {invoice.customer_name || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(invoice.due_date)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`font-medium ${invoice.days_overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {invoice.days_overdue} days
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {getCategoryBadge(invoice.category)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyPaymentLink(invoice.id)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Copy payment link"
                      >
                        {copiedId === invoice.id
                          ? <Check size={16} className="text-green-600" />
                          : <Copy size={16} className="text-gray-600 dark:text-gray-400" />}
                      </button>
                      <a
                        href={`https://dashboard.stripe.com/invoices/${invoice.invoice_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="View in Stripe"
                      >
                        <ExternalLink size={16} className="text-gray-600 dark:text-gray-400" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredInvoices.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No invoices found matching the current filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
