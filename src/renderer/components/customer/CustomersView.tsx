import { useEffect, useState, useMemo } from 'react';
import { customersAPI, invoicesAPI, stripeAPI } from '../../services/api';
import type { Invoice, ARCategory } from '../../types';
import { format } from 'date-fns';
import { Search, ArrowLeft, Copy, ExternalLink, ChevronRight, Check, ChevronUp, ChevronDown, Download } from 'lucide-react';

interface CustomerWithAR {
  id: string;
  name: string;
  email: string | null;
  arr: number | null;
  stripe_customer_id: string | null;
  total_ar: number;
  invoice_count: number;
  max_days_overdue: number;
  worst_category: ARCategory | null;
}

type CustSortKey = 'name' | 'total_ar' | 'invoice_count' | 'max_days_overdue' | 'arr';
type SortDir = 'asc' | 'desc';

export default function CustomersView() {
  const [customers, setCustomers] = useState<CustomerWithAR[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<CustSortKey>('total_ar');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await customersAPI.getAllWithAR();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = customers.filter(c => {
      if (!search) return true;
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || (c.email && c.email.toLowerCase().includes(q));
    });

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'total_ar':
          cmp = a.total_ar - b.total_ar;
          break;
        case 'invoice_count':
          cmp = a.invoice_count - b.invoice_count;
          break;
        case 'max_days_overdue':
          cmp = a.max_days_overdue - b.max_days_overdue;
          break;
        case 'arr':
          cmp = (a.arr || 0) - (b.arr || 0);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [customers, search, sortKey, sortDir]);

  const toggleSort = (key: CustSortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ column }: { column: CustSortKey }) => {
    if (sortKey !== column) return <ChevronDown size={14} className="text-gray-300 ml-1 inline" />;
    return sortDir === 'asc'
      ? <ChevronUp size={14} className="text-primary-600 ml-1 inline" />
      : <ChevronDown size={14} className="text-primary-600 ml-1 inline" />;
  };

  if (loading) {
    return <div className="card text-center py-12 text-gray-600 dark:text-gray-400">Loading customers...</div>;
  }

  if (selectedCustomerId) {
    return (
      <CustomerDetail
        customerId={selectedCustomerId}
        onBack={() => setSelectedCustomerId(null)}
      />
    );
  }

  const thSortable = "px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200";

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Customers ({filteredAndSorted.length})
          </h2>
          <div className="relative w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className={`${thSortable} text-left`} onClick={() => toggleSort('name')}>
                  Customer <SortIcon column="name" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                <th className={`${thSortable} text-right`} onClick={() => toggleSort('arr')}>
                  ARR <SortIcon column="arr" />
                </th>
                <th className={`${thSortable} text-right`} onClick={() => toggleSort('total_ar')}>
                  Total AR <SortIcon column="total_ar" />
                </th>
                <th className={`${thSortable} text-center`} onClick={() => toggleSort('invoice_count')}>
                  Invoices <SortIcon column="invoice_count" />
                </th>
                <th className={`${thSortable} text-center`} onClick={() => toggleSort('max_days_overdue')}>
                  Max Overdue <SortIcon column="max_days_overdue" />
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSorted.map((customer) => (
                <tr
                  key={customer.id}
                  onClick={() => setSelectedCustomerId(customer.id)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {customer.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {customer.email || '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-400">
                    {customer.arr ? formatCurrency(customer.arr) : '—'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(customer.total_ar)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-400">
                    {customer.invoice_count}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    <span className={`font-medium ${customer.max_days_overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {customer.max_days_overdue > 0 ? `${customer.max_days_overdue}d` : 'Current'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    {getCategoryBadge(customer.worst_category)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    <ChevronRight size={16} className="text-gray-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredAndSorted.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No customers found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CustomerDetail({ customerId, onBack }: { customerId: string; onBack: () => void }) {
  const [customer, setCustomer] = useState<any>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [customerId]);

  const loadData = async () => {
    try {
      const [cust, invs] = await Promise.all([
        customersAPI.getById(customerId),
        invoicesAPI.getByCustomer(customerId),
      ]);
      setCustomer(cust);
      setInvoices(invs);
    } catch (error) {
      console.error('Failed to load customer detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportAgingCSV = () => {
    if (!customer) return;
    const header = ['Invoice #', 'Amount', 'Currency', 'Due Date', 'Days Overdue', 'Age Bucket', 'Category'];
    const rows = invoices.map(inv => [
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
    a.download = `${customer.name.replace(/[^a-zA-Z0-9]/g, '_')}-aging-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="card text-center py-12 text-gray-600 dark:text-gray-400">Loading...</div>;
  }

  if (!customer) {
    return <div className="card text-center py-12 text-gray-500">Customer not found.</div>;
  }

  const totalAR = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const overdueInvoices = invoices.filter(inv => inv.days_overdue > 0);
  const criticalInvoices = invoices.filter(inv => inv.category === 'critical');

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{customer.name}</h2>
            <p className="text-gray-500 dark:text-gray-400">{customer.email || 'No email'}</p>
          </div>
        </div>
        <button
          onClick={exportAgingCSV}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
        >
          <Download size={16} />
          Export Aging CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total AR</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalAR)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Open Invoices</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{invoices.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Overdue</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{overdueInvoices.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">ARR</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{customer.arr ? formatCurrency(customer.arr) : '—'}</p>
        </div>
      </div>

      {/* Critical alert */}
      {criticalInvoices.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="font-semibold text-red-800 dark:text-red-300">
            {criticalInvoices.length} critical invoice{criticalInvoices.length > 1 ? 's' : ''} — {formatCurrency(criticalInvoices.reduce((s, i) => s + i.amount, 0))} overdue 30+ days
          </p>
        </div>
      )}

      {/* Aging Statement */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Aging Statement
        </h3>
        <AgingStatement invoices={invoices} />
      </div>

      {/* Invoice table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Invoices ({invoices.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due Date</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Days Overdue</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bucket</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800" title={`Invoice: ${inv.invoice_number}`}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(inv.amount)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(inv.due_date)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    <span className={`font-medium ${inv.days_overdue > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {inv.days_overdue}d
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center text-gray-600 dark:text-gray-400">
                    {inv.age_bucket}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    {getCategoryBadge(inv.category)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={async () => {
                          try {
                            const url = await stripeAPI.getPaymentLink(inv.id);
                            await navigator.clipboard.writeText(url);
                            setCopiedId(inv.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          } catch {
                            // Toast is already shown by stripeAPI
                          }
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        title="Copy payment link"
                      >
                        {copiedId === inv.id
                          ? <Check size={16} className="text-green-600" />
                          : <Copy size={16} className="text-gray-600 dark:text-gray-400" />}
                      </button>
                      <a
                        href={`https://dashboard.stripe.com/invoices/${inv.invoice_number}`}
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

          {invoices.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No invoices for this customer.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AgingStatement({ invoices }: { invoices: Invoice[] }) {
  const buckets = ['current', '1-30', '31-60', '61-90', '90+'] as const;
  const bucketLabels: Record<string, string> = {
    current: 'Current',
    '1-30': '1-30 days',
    '31-60': '31-60 days',
    '61-90': '61-90 days',
    '90+': '90+ days',
  };

  const breakdown = buckets.map(bucket => {
    const bucketInvoices = invoices.filter(inv => inv.age_bucket === bucket);
    return {
      bucket,
      label: bucketLabels[bucket],
      count: bucketInvoices.length,
      total: bucketInvoices.reduce((sum, inv) => sum + inv.amount, 0),
    };
  });

  const grandTotal = invoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-1">
      {breakdown.map(row => (
        <div
          key={row.bucket}
          className={`flex items-center justify-between py-2 px-3 rounded ${row.total > 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}`}
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24">{row.label}</span>
            <span className="text-xs text-gray-400">{row.count} invoice{row.count !== 1 ? 's' : ''}</span>
          </div>
          <span className={`text-sm font-semibold ${row.total > 0 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
            {formatCurrency(row.total)}
          </span>
        </div>
      ))}
      <div className="flex items-center justify-between py-3 px-3 border-t-2 border-gray-300 dark:border-gray-600 mt-2">
        <span className="text-sm font-bold text-gray-900 dark:text-white">Total Outstanding</span>
        <span className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(grandTotal)}</span>
      </div>
    </div>
  );
}

// --- Shared helpers ---

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(dateString: string) {
  try {
    return format(new Date(dateString), 'MMM d, yyyy');
  } catch {
    return dateString;
  }
}

function getCategoryBadge(category: ARCategory | null) {
  if (!category) return <span className="text-gray-400 text-xs">—</span>;
  const styles: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    relevant: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    all90: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    standard: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  };
  const labels: Record<string, string> = {
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
}
