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
  customer_name?: string;
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
export type ARCategory = 'critical' | 'relevant' | 'all90' | 'standard';

export interface ARSummary {
  critical: { total: number; count: number; customer_count: number };
  relevant: { total: number; count: number; customer_count: number };
  all90: { total: number; count: number; customer_count: number };
  standard: { total: number; count: number; customer_count: number };
  by_bucket: {
    [key in AgeBucket]: { total: number; count: number };
  };
  total_overdue: number;
  total_invoices: number;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: 'reminder' | 'urgent' | 'escalation' | 'custom';
}
