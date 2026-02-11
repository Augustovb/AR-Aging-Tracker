export interface Customer {
  id: string;
  name: string;
  email: string | null;
  arr: number | null;
  tenant: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  customer_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  due_date: string;
  status: 'open' | 'paid' | 'void' | 'uncollectible';
  days_overdue: number;
  age_bucket: AgeBucket;
  category: ARCategory | null;
  stripe_invoice_id: string | null;
  created_at: string;
  updated_at: string;
}

export type AgeBucket = 'current' | '1-30' | '31-60' | '61-90' | '90+';

export type ARCategory = 'critical' | 'relevant' | 'all90';

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'reminder' | 'urgent' | 'escalation' | 'custom';
  created_at: string;
  updated_at: string;
}

export interface EmailHistory {
  id: string;
  customer_id: string;
  template_id: string | null;
  recipient: string;
  subject: string;
  body: string;
  sent_at: string;
  status: 'sent' | 'failed';
  error: string | null;
}

export interface SyncLog {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: 'running' | 'completed' | 'failed';
  records_synced: number;
  error: string | null;
}

export interface AppMetadata {
  key: string;
  value: string;
  updated_at: string;
}

export interface EmailSuggestion {
  customer: Customer;
  invoices: Invoice[];
  total_overdue: number;
  oldest_invoice_days: number;
  days_since_last_contact: number | null;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  suggested_template: string;
}

export interface ARSummary {
  critical: {
    total: number;
    count: number;
    customer_count: number;
  };
  relevant: {
    total: number;
    count: number;
    customer_count: number;
  };
  all90: {
    total: number;
    count: number;
    customer_count: number;
  };
  by_bucket: {
    [key in AgeBucket]: {
      total: number;
      count: number;
    };
  };
  total_overdue: number;
  total_invoices: number;
}

export interface InvoiceFilters {
  age_bucket?: AgeBucket[];
  category?: ARCategory[];
  customer_id?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
}
