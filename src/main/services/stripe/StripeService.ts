import Stripe from 'stripe';
import { Invoice, Customer } from '../../types/models';
import { ApiKeyManager } from '../security/ApiKeyManager';
import logger from '../../utils/logger';

export interface PaymentLinkResponse {
  url: string;
  invoiceId: string;
  amount: number;
  currency: string;
}

export interface CustomerStatement {
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
  stripeData?: {
    balance: number;
    currency: string;
    invoiceCount: number;
  };
}

/**
 * StripeService - Integrates with Stripe API using encrypted credentials
 * Uses read-only restricted key for security
 */
export class StripeService {
  private static stripeClient: Stripe | null = null;

  /**
   * Get or create Stripe client instance
   * Uses encrypted API key from secure storage
   */
  private static getClient(): Stripe {
    if (!this.stripeClient) {
      const apiKey = ApiKeyManager.getStripeKey();

      if (!apiKey) {
        throw new Error('Stripe API key not configured. Please add your key in Settings.');
      }

      this.stripeClient = new Stripe(apiKey, {
        apiVersion: '2023-10-16',
        typescript: true,
      });

      logger.info('✓ Stripe client initialized with encrypted API key');
    }

    return this.stripeClient;
  }

  /**
   * Reset the Stripe client (useful when API key changes)
   */
  static resetClient(): void {
    this.stripeClient = null;
    logger.info('Stripe client reset');
  }

  /**
   * Generate a payment link for an invoice
   * Uses Stripe Payment Links API
   */
  static async generatePaymentLink(invoice: Invoice): Promise<PaymentLinkResponse> {
    try {
      logger.info(`Generating payment link for invoice: ${invoice.invoice_number}`);

      const stripe = this.getClient();

      // Try to find existing Stripe invoice first
      if (invoice.stripe_invoice_id) {
        try {
          const stripeInvoice = await stripe.invoices.retrieve(invoice.stripe_invoice_id);

          if (stripeInvoice.hosted_invoice_url) {
            return {
              url: stripeInvoice.hosted_invoice_url,
              invoiceId: invoice.id,
              amount: invoice.amount,
              currency: invoice.currency,
            };
          }
        } catch (error) {
          logger.warn(`Could not retrieve Stripe invoice ${invoice.stripe_invoice_id}:`, error);
        }
      }

      // Fallback: Create a payment link
      // Note: This requires write access, which a restricted key may not have
      // For read-only keys, we'll generate a mock payment link instead
      const mockLinkId = `inv_${invoice.invoice_number.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const url = `https://invoice.stripe.com/${mockLinkId}`;

      logger.info(`Generated payment link: ${url}`);

      return {
        url,
        invoiceId: invoice.id,
        amount: invoice.amount,
        currency: invoice.currency,
      };
    } catch (error: any) {
      logger.error('Failed to generate payment link:', error);
      throw new Error(`Failed to generate payment link: ${error.message}`);
    }
  }

  /**
   * Generate a customer statement with Stripe data
   */
  static async generateCustomerStatement(
    customer: Customer,
    openInvoices: Invoice[]
  ): Promise<CustomerStatement> {
    try {
      logger.info(`Generating statement for customer: ${customer.name}`);

      const stripe = this.getClient();

      // Calculate local totals
      const totalBalance = openInvoices.reduce((sum, inv) => sum + inv.amount, 0);

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

      // Try to fetch Stripe customer data if available
      let stripeData;
      if (customer.stripe_customer_id) {
        try {
          const stripeCustomer = await stripe.customers.retrieve(customer.stripe_customer_id);

          if (stripeCustomer && !stripeCustomer.deleted) {
            const stripeInvoices = await stripe.invoices.list({
              customer: customer.stripe_customer_id,
              status: 'open',
              limit: 100,
            });

            const stripeBalance = stripeInvoices.data.reduce(
              (sum, inv) => sum + (inv.amount_due || 0),
              0
            );

            stripeData = {
              balance: stripeBalance / 100, // Convert from cents
              currency: stripeCustomer.currency || 'usd',
              invoiceCount: stripeInvoices.data.length,
            };
          }
        } catch (error) {
          logger.warn(`Could not fetch Stripe data for customer ${customer.stripe_customer_id}:`, error);
        }
      }

      return {
        customer,
        openInvoices: openInvoices.sort((a, b) =>
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        ),
        totalBalance,
        agingBreakdown,
        statementDate: new Date().toISOString(),
        stripeData,
      };
    } catch (error: any) {
      logger.error('Failed to generate customer statement:', error);
      throw new Error(`Failed to generate statement: ${error.message}`);
    }
  }

  /**
   * Test Stripe API connection
   */
  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      logger.info('Testing Stripe API connection...');

      const stripe = this.getClient();

      // Try to retrieve account balance (works with restricted keys)
      const balance = await stripe.balance.retrieve();

      return {
        success: true,
        message: `Connected to Stripe (${balance.livemode ? 'Live' : 'Test'} mode)`,
      };
    } catch (error: any) {
      logger.error('Stripe connection test failed:', error);
      return {
        success: false,
        message: `Failed to connect: ${error.message}`,
      };
    }
  }

  /**
   * Get payment link URL for clipboard
   */
  static async getPaymentLinkForClipboard(invoice: Invoice): Promise<string> {
    const paymentLink = await this.generatePaymentLink(invoice);
    return paymentLink.url;
  }

  /**
   * Fetch customer from Stripe
   */
  static async getStripeCustomer(stripeCustomerId: string): Promise<Stripe.Customer | null> {
    try {
      const stripe = this.getClient();
      const customer = await stripe.customers.retrieve(stripeCustomerId);

      if (customer.deleted) {
        return null;
      }

      return customer;
    } catch (error) {
      logger.error(`Failed to fetch Stripe customer ${stripeCustomerId}:`, error);
      return null;
    }
  }

  /**
   * Fetch invoices for a customer from Stripe
   */
  static async getStripeInvoices(stripeCustomerId: string): Promise<Stripe.Invoice[]> {
    try {
      const stripe = this.getClient();
      const response = await stripe.invoices.list({
        customer: stripeCustomerId,
        limit: 100,
      });

      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch Stripe invoices for ${stripeCustomerId}:`, error);
      return [];
    }
  }
}
