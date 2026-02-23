import type { Invoice, Customer, ARSummary, AgeBucket, ARCategory } from '../types';
import customersData from '../../data/customers.json';
import invoicesData from '../../data/invoices.json';
import toast from 'react-hot-toast';

// Cast the imported JSON to typed arrays
const allInvoices: Invoice[] = invoicesData as Invoice[];
const allCustomers: Customer[] = customersData as Customer[];

// --- Invoice API ---

interface InvoiceFilters {
  age_bucket?: AgeBucket[];
  category?: ARCategory[];
  customer_id?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
}

export const invoicesAPI = {
  getAll(filters?: InvoiceFilters): Promise<Invoice[]> {
    let result = [...allInvoices];

    if (filters) {
      if (filters.age_bucket?.length) {
        result = result.filter(inv => filters.age_bucket!.includes(inv.age_bucket));
      }
      if (filters.category?.length) {
        result = result.filter(inv => inv.category !== null && filters.category!.includes(inv.category));
      }
      if (filters.customer_id) {
        result = result.filter(inv => inv.customer_id === filters.customer_id);
      }
      if (filters.min_amount !== undefined) {
        result = result.filter(inv => inv.amount >= filters.min_amount!);
      }
      if (filters.max_amount !== undefined) {
        result = result.filter(inv => inv.amount <= filters.max_amount!);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(inv =>
          inv.customer_name?.toLowerCase().includes(q) ||
          inv.invoice_number.toLowerCase().includes(q)
        );
      }
    }

    return Promise.resolve(result);
  },

  getById(id: string): Promise<Invoice> {
    const invoice = allInvoices.find(inv => inv.id === id);
    if (!invoice) return Promise.reject(new Error(`Invoice ${id} not found`));
    return Promise.resolve(invoice);
  },

  getByCustomer(customerId: string): Promise<Invoice[]> {
    return Promise.resolve(allInvoices.filter(inv => inv.customer_id === customerId));
  },

  getSummary(): Promise<ARSummary> {
    const buckets: AgeBucket[] = ['current', '1-30', '31-60', '61-90', '90+'];
    const by_bucket = {} as ARSummary['by_bucket'];

    for (const bucket of buckets) {
      const bucketInvoices = allInvoices.filter(inv => inv.age_bucket === bucket);
      by_bucket[bucket] = {
        total: bucketInvoices.reduce((sum, inv) => sum + inv.amount, 0),
        count: bucketInvoices.length,
      };
    }

    const categorySummary = (cat: ARCategory) => {
      const catInvoices = allInvoices.filter(inv => inv.category === cat);
      const customerIds = new Set(catInvoices.map(inv => inv.customer_id));
      return {
        total: catInvoices.reduce((sum, inv) => sum + inv.amount, 0),
        count: catInvoices.length,
        customer_count: customerIds.size,
      };
    };

    const summary: ARSummary = {
      critical: categorySummary('critical'),
      relevant: categorySummary('relevant'),
      all90: categorySummary('all90'),
      standard: categorySummary('standard'),
      by_bucket,
      total_overdue: allInvoices.reduce((sum, inv) => sum + inv.amount, 0),
      total_invoices: allInvoices.length,
    };

    return Promise.resolve(summary);
  },
};

// --- Customer API ---

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

const CATEGORY_SEVERITY: Record<string, number> = { all90: 4, critical: 3, relevant: 2, standard: 1 };

function worstCategory(categories: (ARCategory | null)[]): ARCategory | null {
  let worst: ARCategory | null = null;
  let worstSev = 0;
  for (const cat of categories) {
    if (cat && (CATEGORY_SEVERITY[cat] || 0) > worstSev) {
      worst = cat;
      worstSev = CATEGORY_SEVERITY[cat];
    }
  }
  return worst;
}

export const customersAPI = {
  getAll(): Promise<Customer[]> {
    return Promise.resolve(allCustomers);
  },

  getAllWithAR(): Promise<CustomerWithAR[]> {
    const result: CustomerWithAR[] = allCustomers.map(cust => {
      const custInvoices = allInvoices.filter(inv => inv.customer_id === cust.id);
      return {
        id: cust.id,
        name: cust.name,
        email: cust.email,
        arr: cust.arr,
        stripe_customer_id: cust.stripe_customer_id,
        total_ar: custInvoices.reduce((sum, inv) => sum + inv.amount, 0),
        invoice_count: custInvoices.length,
        max_days_overdue: custInvoices.length > 0
          ? Math.max(...custInvoices.map(inv => inv.days_overdue))
          : 0,
        worst_category: worstCategory(custInvoices.map(inv => inv.category)),
      };
    });
    return Promise.resolve(result);
  },

  getById(id: string): Promise<Customer> {
    const customer = allCustomers.find(c => c.id === id);
    if (!customer) return Promise.reject(new Error(`Customer ${id} not found`));
    return Promise.resolve(customer);
  },

  getWithOverdue(): Promise<Customer[]> {
    const overdueCustomerIds = new Set(
      allInvoices.filter(inv => inv.days_overdue > 0).map(inv => inv.customer_id)
    );
    return Promise.resolve(allCustomers.filter(c => overdueCustomerIds.has(c.id)));
  },
};

// --- Stripe API (placeholder) ---

export const stripeAPI = {
  getPaymentLink(_invoiceId: string): Promise<string> {
    toast('Stripe not connected yet', { icon: '🔗' });
    return Promise.reject(new Error('Stripe not connected'));
  },

  getCustomerStatement(_customerId: string): Promise<any> {
    toast('Stripe not connected yet', { icon: '🔗' });
    return Promise.reject(new Error('Stripe not connected'));
  },
};
