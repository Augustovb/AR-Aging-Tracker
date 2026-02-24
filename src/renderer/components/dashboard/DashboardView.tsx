import { useEffect, useState } from 'react';
import { invoicesAPI } from '../../services/api';
import type { ARSummary } from '../../types';
import { DollarSign, AlertCircle, Clock, FileText } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';

const BUCKET_COLORS: Record<string, string> = {
  current: '#10b981',
  '1-30': '#3b82f6',
  '31-60': '#f59e0b',
  '61-90': '#f97316',
  '90+': '#ef4444',
};

const CATEGORY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  relevant: '#f97316',
  all90: '#eab308',
  standard: '#3b82f6',
};

const CATEGORY_LABELS: Record<string, string> = {
  critical: 'Critical',
  relevant: 'Relevant',
  all90: '90+ Days',
  standard: 'Standard',
};

const formatCompact = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value}`;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export default function DashboardView() {
  const [summary, setSummary] = useState<ARSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    try {
      const data = await invoicesAPI.getSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to load summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  // Prepare chart data
  const bucketData = summary
    ? Object.entries(summary.by_bucket).map(([bucket, data]) => ({
        name: bucket === 'current' ? 'Current' : `${bucket}d`,
        total: data.total,
        count: data.count,
        bucket,
      }))
    : [];

  const categoryData = summary
    ? (['critical', 'relevant', 'all90', 'standard'] as const)
        .map(cat => ({
          name: CATEGORY_LABELS[cat],
          value: summary[cat].total,
          count: summary[cat].count,
          key: cat,
        }))
        .filter(d => d.value > 0)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          AR Dashboard
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Overview of your accounts receivable
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical AR</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {summary ? formatCurrency(summary.critical.total) : '$0'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {summary?.critical.count || 0} invoices • {summary?.critical.customer_count || 0} customers
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertCircle className="text-red-600 dark:text-red-300" size={24} />
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Relevant AR</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {summary ? formatCurrency(summary.relevant.total) : '$0'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {summary?.relevant.count || 0} invoices • {summary?.relevant.customer_count || 0} customers
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Clock className="text-orange-600 dark:text-orange-300" size={24} />
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">All 90+ Days</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {summary ? formatCurrency(summary.all90.total) : '$0'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {summary?.all90.count || 0} invoices • {summary?.all90.customer_count || 0} customers
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <DollarSign className="text-yellow-600 dark:text-yellow-300" size={24} />
            </div>
          </div>
        </div>

        <div className="card border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Standard AR</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {summary ? formatCurrency(summary.standard.total) : '$0'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {summary?.standard.count || 0} invoices • {summary?.standard.customer_count || 0} customers
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FileText className="text-blue-600 dark:text-blue-300" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aging Buckets Bar Chart */}
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Aging Buckets
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bucketData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Amount']}
                  labelFormatter={(label) => `Bucket: ${label}`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {bucketData.map((entry) => (
                    <Cell key={entry.bucket} fill={BUCKET_COLORS[entry.bucket]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Donut Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            By Category
          </h3>
          <div className="h-72 flex flex-col items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={90}
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry) => (
                    <Cell key={entry.key} fill={CATEGORY_COLORS[entry.key]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Amount']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 -mt-4">
              {categoryData.map((entry) => (
                <div key={entry.key} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[entry.key] }} />
                  {entry.name} ({entry.count})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Total Overview */}
      <div className="card bg-primary-50 dark:bg-primary-900 border-2 border-primary-200 dark:border-primary-800">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
              Total Outstanding
            </p>
            <p className="text-4xl font-bold text-primary-900 dark:text-primary-100 mt-2">
              {summary ? formatCurrency(summary.total_overdue) : '$0'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary-900 dark:text-primary-100">
              {summary?.total_invoices || 0}
            </p>
            <p className="text-sm text-primary-700 dark:text-primary-300">
              Total Invoices
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
