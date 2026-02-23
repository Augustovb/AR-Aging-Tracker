import { useEffect, useState } from 'react';
import { invoicesAPI } from '../../services/api';
import type { ARSummary } from '../../types';
import { DollarSign, AlertCircle, Clock, FileText } from 'lucide-react';

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

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
        {/* Critical AR */}
        <div className="card border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Critical AR
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {summary ? formatCurrency(summary.critical.total) : '$0'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                {summary?.critical.count || 0} invoices • {summary?.critical.customer_count || 0} customers
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertCircle className="text-red-600 dark:text-red-300" size={24} />
            </div>
          </div>
        </div>

        {/* Relevant AR */}
        <div className="card border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Relevant AR
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {summary ? formatCurrency(summary.relevant.total) : '$0'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                {summary?.relevant.count || 0} invoices • {summary?.relevant.customer_count || 0} customers
              </p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Clock className="text-orange-600 dark:text-orange-300" size={24} />
            </div>
          </div>
        </div>

        {/* 90+ Days */}
        <div className="card border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                All 90+ Days
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {summary ? formatCurrency(summary.all90.total) : '$0'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                {summary?.all90.count || 0} invoices • {summary?.all90.customer_count || 0} customers
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <DollarSign className="text-yellow-600 dark:text-yellow-300" size={24} />
            </div>
          </div>
        </div>

        {/* Standard AR */}
        <div className="card border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Standard AR
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {summary ? formatCurrency(summary.standard.total) : '$0'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                {summary?.standard.count || 0} invoices • {summary?.standard.customer_count || 0} customers
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FileText className="text-blue-600 dark:text-blue-300" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Aging Buckets */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Aging Buckets
        </h3>
        <div className="space-y-3">
          {summary && Object.entries(summary.by_bucket).map(([bucket, data]) => (
            <div key={bucket} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {bucket === 'current' ? 'Current' : `${bucket} days`}
              </span>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(data.total)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {data.count} invoices
                </div>
              </div>
            </div>
          ))}
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
