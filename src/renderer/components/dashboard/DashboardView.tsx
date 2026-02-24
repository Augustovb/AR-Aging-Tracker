import { useEffect, useState } from 'react';
import { invoicesAPI } from '../../services/api';
import type { ARSummary } from '../../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts';

const BUCKET_COLORS: Record<string, string> = {
  current: '#d4d4d4',
  '1-30': '#a3a3a3',
  '31-60': '#737373',
  '61-90': '#525252',
  '90+': '#262626',
};

const CATEGORY_COLORS: Record<string, string> = {
  critical: '#525252',
  relevant: '#737373',
  all90: '#a3a3a3',
  standard: '#d4d4d4',
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
    return <div className="text-center py-12 text-notion-text-secondary">Loading...</div>;
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
        <h2 className="text-lg font-semibold text-notion-text dark:text-white">
          AR Dashboard
        </h2>
        <p className="text-sm text-notion-text-secondary dark:text-gray-400 mt-0.5">
          Overview of your accounts receivable
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-xs font-medium uppercase tracking-wider text-notion-text-secondary dark:text-gray-400">Critical AR</p>
          <p className="text-2xl font-semibold text-notion-text dark:text-white mt-2">
            {summary ? formatCurrency(summary.critical.total) : '$0'}
          </p>
          <p className="text-xs text-notion-text-tertiary mt-1">
            {summary?.critical.count || 0} invoices · {summary?.critical.customer_count || 0} customers
          </p>
        </div>

        <div className="card">
          <p className="text-xs font-medium uppercase tracking-wider text-notion-text-secondary dark:text-gray-400">Relevant AR</p>
          <p className="text-2xl font-semibold text-notion-text dark:text-white mt-2">
            {summary ? formatCurrency(summary.relevant.total) : '$0'}
          </p>
          <p className="text-xs text-notion-text-tertiary mt-1">
            {summary?.relevant.count || 0} invoices · {summary?.relevant.customer_count || 0} customers
          </p>
        </div>

        <div className="card">
          <p className="text-xs font-medium uppercase tracking-wider text-notion-text-secondary dark:text-gray-400">All 90+ Days</p>
          <p className="text-2xl font-semibold text-notion-text dark:text-white mt-2">
            {summary ? formatCurrency(summary.all90.total) : '$0'}
          </p>
          <p className="text-xs text-notion-text-tertiary mt-1">
            {summary?.all90.count || 0} invoices · {summary?.all90.customer_count || 0} customers
          </p>
        </div>

        <div className="card">
          <p className="text-xs font-medium uppercase tracking-wider text-notion-text-secondary dark:text-gray-400">Standard AR</p>
          <p className="text-2xl font-semibold text-notion-text dark:text-white mt-2">
            {summary ? formatCurrency(summary.standard.total) : '$0'}
          </p>
          <p className="text-xs text-notion-text-tertiary mt-1">
            {summary?.standard.count || 0} invoices · {summary?.standard.customer_count || 0} customers
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Aging Buckets Bar Chart */}
        <div className="card lg:col-span-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-notion-text-secondary dark:text-gray-400 mb-4">
            Aging Buckets
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bucketData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9e9e7" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#787774' }} />
                <YAxis tickFormatter={formatCompact} tick={{ fontSize: 12, fill: '#787774' }} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Amount']}
                  labelFormatter={(label) => `Bucket: ${label}`}
                  contentStyle={{ borderRadius: '2px', border: '1px solid #e9e9e7', boxShadow: 'none' }}
                />
                <Bar dataKey="total" radius={[2, 2, 0, 0]}>
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
          <h3 className="text-xs font-medium uppercase tracking-wider text-notion-text-secondary dark:text-gray-400 mb-4">
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
                  contentStyle={{ borderRadius: '2px', border: '1px solid #e9e9e7', boxShadow: 'none' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 -mt-4">
              {categoryData.map((entry) => (
                <div key={entry.key} className="flex items-center gap-1.5 text-xs text-notion-text-secondary dark:text-gray-400">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CATEGORY_COLORS[entry.key] }} />
                  {entry.name} ({entry.count})
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Total Overview */}
      <div className="card border-t-2 border-t-notion-text">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-notion-text-secondary dark:text-gray-400">
              Total Outstanding
            </p>
            <p className="text-3xl font-semibold text-notion-text dark:text-white mt-2">
              {summary ? formatCurrency(summary.total_overdue) : '$0'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-notion-text dark:text-white">
              {summary?.total_invoices || 0}
            </p>
            <p className="text-xs text-notion-text-secondary dark:text-gray-400">
              Total Invoices
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
