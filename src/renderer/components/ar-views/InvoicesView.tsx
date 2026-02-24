import { useEffect, useState, useMemo } from 'react';
import { invoicesAPI, stripeAPI } from '../../services/api';
import type { Invoice, AgeBucket, ARCategory } from '../../types';
import { format } from 'date-fns';
import { Copy, ExternalLink, Check, ChevronUp, ChevronDown, Download } from 'lucide-react';

type SortKey = 'customer_name' | 'amount' | 'due_date' | 'days_overdue' | 'category';
type SortDir = 'asc' | 'desc';

const CATEGORY_ORDER: Record<string, number> = { critical: 4, relevant: 3, all90: 2, standard: 1 };

export default function InvoicesView() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBucket, setFilterBucket] = useState<AgeBucket | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<ARCategory | 'all'>('all');
  const [filterCustomer, setFilterCustomer] = useState<string>('all');
  const [customerSearch, setCustomerSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('days_overdue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

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

  const filteredAndSorted = useMemo(() => {
    let result = invoices.filter(inv => {
      if (filterBucket !== 'all' && inv.age_bucket !== filterBucket) return false;
      if (filterCategory !== 'all' && inv.category !== filterCategory) return false;
      if (filterCustomer !== 'all' && inv.customer_id !== filterCustomer) return false;
      return true;
    });

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'customer_name':
          cmp = (a.customer_name || '').localeCompare(b.customer_name || '');
          break;
        case 'amount':
          cmp = a.amount - b.amount;
          break;
        case 'due_date':
          cmp = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case 'days_overdue':
          cmp = a.days_overdue - b.days_overdue;
          break;
        case 'category':
          cmp = (CATEGORY_ORDER[a.category || ''] || 0) - (CATEGORY_ORDER[b.category || ''] || 0);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [invoices, filterBucket, filterCategory, filterCustomer, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ChevronDown size={14} className="text-notion-text-tertiary ml-1 inline" />;
    return sortDir === 'asc'
      ? <ChevronUp size={14} className="text-notion-text ml-1 inline" />
      : <ChevronDown size={14} className="text-notion-text ml-1 inline" />;
  };

  const exportCSV = () => {
    const header = ['Customer', 'Invoice #', 'Amount', 'Currency', 'Due Date', 'Days Overdue', 'Age Bucket', 'Category'];
    const rows = filteredAndSorted.map(inv => [
      inv.customer_name || 'Unknown',
      inv.invoice_number,
      inv.amount.toFixed(2),
      inv.currency.toUpperCase(),
      inv.due_date.split('T')[0],
      String(inv.days_overdue),
      inv.age_bucket,
      inv.category || '',
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

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
      critical: 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200',
      relevant: 'bg-orange-50 text-orange-700 dark:bg-orange-900 dark:text-orange-200',
      all90: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
      standard: 'bg-notion-bg-secondary text-notion-text-secondary dark:bg-gray-700 dark:text-gray-300',
    };
    const labels: Record<ARCategory, string> = {
      critical: 'Critical',
      relevant: 'Relevant',
      all90: '90+ Days',
      standard: 'Standard',
    };
    return (
      <span className={`px-2 py-0.5 text-xs font-medium rounded-sm ${styles[category]}`}>
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
        <p className="text-center text-notion-text-secondary dark:text-gray-400">Loading invoices...</p>
      </div>
    );
  }

  const thClass = "px-4 py-3 text-left text-xs font-medium text-notion-text-secondary dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-notion-text dark:hover:text-gray-200";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card">
        <h3 className="text-xs font-medium uppercase tracking-wider text-notion-text-secondary dark:text-gray-400 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-notion-text-secondary dark:text-gray-300 mb-1.5">
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
            <label className="block text-xs font-medium text-notion-text-secondary dark:text-gray-300 mb-1.5">
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
            <label className="block text-xs font-medium text-notion-text-secondary dark:text-gray-300 mb-1.5">
              Customer
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search customers..."
                value={filterCustomer === 'all' ? customerSearch : customerOptions.find(c => c.id === filterCustomer)?.name || ''}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  if (filterCustomer !== 'all') setFilterCustomer('all');
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
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-notion-border dark:border-gray-700 rounded-sm max-h-48 overflow-y-auto">
                  <button
                    onClick={() => { setFilterCustomer('all'); setCustomerSearch(''); }}
                    className="w-full text-left px-3 py-2 text-sm text-notion-text dark:text-gray-300 hover:bg-notion-bg-hover dark:hover:bg-gray-700"
                  >
                    All Customers
                  </button>
                  {filteredCustomerOptions.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setFilterCustomer(c.id); setCustomerSearch(''); }}
                      className="w-full text-left px-3 py-2 text-sm text-notion-text dark:text-gray-300 hover:bg-notion-bg-hover dark:hover:bg-gray-700"
                    >
                      {c.name}
                    </button>
                  ))}
                  {filteredCustomerOptions.length === 0 && (
                    <div className="px-3 py-2 text-sm text-notion-text-tertiary">No matches</div>
                  )}
                </div>
              )}
              {filterCustomer !== 'all' && (
                <button
                  onClick={() => { setFilterCustomer('all'); setCustomerSearch(''); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-notion-text-tertiary hover:text-notion-text text-sm"
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
          <h2 className="text-sm font-semibold text-notion-text dark:text-white">
            Invoices ({filteredAndSorted.length})
          </h2>
          <button
            onClick={exportCSV}
            className="btn-secondary flex items-center gap-2 text-xs py-1.5 px-3"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-notion-border dark:divide-gray-700">
            <thead className="bg-notion-bg-secondary dark:bg-gray-800">
              <tr>
                <th className={thClass} onClick={() => toggleSort('customer_name')}>
                  Customer <SortIcon column="customer_name" />
                </th>
                <th className={thClass} onClick={() => toggleSort('amount')}>
                  Amount <SortIcon column="amount" />
                </th>
                <th className={thClass} onClick={() => toggleSort('due_date')}>
                  Due Date <SortIcon column="due_date" />
                </th>
                <th className={thClass} onClick={() => toggleSort('days_overdue')}>
                  Days Overdue <SortIcon column="days_overdue" />
                </th>
                <th className={thClass} onClick={() => toggleSort('category')}>
                  Category <SortIcon column="category" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-notion-text-secondary dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-notion-border dark:divide-gray-700">
              {filteredAndSorted.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-notion-bg-hover dark:hover:bg-gray-800">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-notion-text dark:text-white" title={`Invoice: ${invoice.invoice_number}`}>
                    {invoice.customer_name || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-notion-text dark:text-white">
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-notion-text-secondary dark:text-gray-400">
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
                        className="p-1 hover:bg-notion-bg-hover dark:hover:bg-gray-700 rounded-sm"
                        title="Copy payment link"
                      >
                        {copiedId === invoice.id
                          ? <Check size={16} className="text-green-600" />
                          : <Copy size={16} className="text-notion-text-secondary dark:text-gray-400" />}
                      </button>
                      <a
                        href={`https://dashboard.stripe.com/invoices/${invoice.invoice_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 hover:bg-notion-bg-hover dark:hover:bg-gray-700 rounded-sm"
                        title="View in Stripe"
                      >
                        <ExternalLink size={16} className="text-notion-text-secondary dark:text-gray-400" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredAndSorted.length === 0 && (
            <div className="text-center py-8 text-notion-text-secondary dark:text-gray-400">
              No invoices found matching the current filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
