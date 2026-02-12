import { useEffect, useState } from 'react';
import { invoicesAPI } from '../../services/api';
import type { Invoice, AgeBucket, ARCategory } from '../../types';
import { format } from 'date-fns';
import { Copy, ExternalLink } from 'lucide-react';

export default function InvoicesView() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBucket, setFilterBucket] = useState<AgeBucket | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<ARCategory | 'all'>('all');

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

  const filteredInvoices = invoices.filter(inv => {
    if (filterBucket !== 'all' && inv.age_bucket !== filterBucket) return false;
    if (filterCategory !== 'all' && inv.category !== filterCategory) return false;
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

    const styles = {
      critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      relevant: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      all90: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    };

    const labels = {
      critical: 'Critical',
      relevant: 'Relevant',
      all90: '90+ Days',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[category]}`}>
        {labels[category]}
      </span>
    );
  };

  const copyPaymentLink = (invoiceNumber: string) => {
    // Mock payment link for now
    const link = `https://invoice.stripe.com/${invoiceNumber}`;
    navigator.clipboard.writeText(link);
    alert('Payment link copied to clipboard!');
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </select>
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
                  Invoice #
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
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {invoice.customer_name || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {invoice.invoice_number}
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
                        onClick={() => copyPaymentLink(invoice.invoice_number)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Copy payment link"
                      >
                        <Copy size={16} className="text-gray-600 dark:text-gray-400" />
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
