import { Invoice, Customer } from '../../types/models';
import logger from '../../utils/logger';

export interface MockPaymentLink {
  url: string;
  invoiceId: string;
  amount: number;
  currency: string;
}

export interface MockCustomerStatement {
  customer: Customer;
  openInvoices: Invoice[];
  totalBalance: number;
  agingBreakdown: {
    current: number;
    '1-30': number;
    '31-60': number;
    '61-90': number;
    '90+': number;
  };
  statementDate: string;
}

/**
 * MockStripeService - Simulates Stripe API functionality
 * This will be replaced with real Stripe integration in Phase 6
 */
export class MockStripeService {
  /**
   * Generate a mock payment link for an invoice
   * In production, this would call Stripe API to create a payment link
   */
  static generatePaymentLink(invoice: Invoice): MockPaymentLink {
    logger.info(`Generating mock payment link for invoice: ${invoice.invoice_number}`);

    // Generate a fake Stripe payment link URL
    const mockLinkId = `mock_link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const url = `https://buy.stripe.com/${mockLinkId}`;

    return {
      url,
      invoiceId: invoice.id,
      amount: invoice.amount,
      currency: invoice.currency,
    };
  }

  /**
   * Generate a mock customer statement with all open invoices
   * In production, this would fetch data from Stripe API
   */
  static generateCustomerStatement(
    customer: Customer,
    openInvoices: Invoice[]
  ): MockCustomerStatement {
    logger.info(`Generating mock statement for customer: ${customer.name}`);

    // Calculate total balance
    const totalBalance = openInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    // Calculate aging breakdown
    const agingBreakdown = {
      current: 0,
      '1-30': 0,
      '31-60': 0,
      '61-90': 0,
      '90+': 0,
    };

    openInvoices.forEach((invoice) => {
      const bucket = invoice.age_bucket;
      if (bucket in agingBreakdown) {
        agingBreakdown[bucket as keyof typeof agingBreakdown] += invoice.amount;
      }
    });

    return {
      customer,
      openInvoices: openInvoices.sort((a, b) =>
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      ),
      totalBalance,
      agingBreakdown,
      statementDate: new Date().toISOString(),
    };
  }

  /**
   * Test connection to Stripe (always returns success in mock mode)
   */
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    logger.info('Testing mock Stripe connection');

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      message: 'Mock Stripe connection successful (not using real API)',
    };
  }

  /**
   * Copy payment link to clipboard (returns the URL string)
   */
  static getPaymentLinkForClipboard(invoice: Invoice): string {
    const paymentLink = this.generatePaymentLink(invoice);
    return paymentLink.url;
  }
}
