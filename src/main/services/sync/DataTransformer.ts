import { v4 as uuidv4 } from 'uuid';
import { ARCalculationService } from '../ar/ARCalculationService';
import type { Invoice, Customer } from '../../types/models';
import logger from '../../utils/logger';

export class DataTransformer {
  /**
   * Transform raw Excel data to Invoice and Customer models
   */
  static transformExcelData(rows: any[]): {
    invoices: Invoice[];
    customers: Map<string, Customer>;
  } {
    const customers = new Map<string, Customer>();
    const invoices: Invoice[] = [];

    for (const row of rows) {
      try {
        // Skip invalid rows
        if (!row['Invoice #'] || !row['Due Date Day'] || !row.Value) {
          continue;
        }

        const customerId = row.Cus_id || `cus_${uuidv4()}`;
        const customerName = row['Client Name'] || 'Unknown';
        const customerEmail = row.Email || null;
        const customerARR = this.parseARR(row["Customer's ARR"]);

        // Create or update customer
        if (!customers.has(customerId)) {
          customers.set(customerId, {
            id: customerId,
            name: customerName,
            email: customerEmail,
            arr: customerARR,
            tenant: null,
            stripe_customer_id: customerId.startsWith('cus_') ? customerId : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }

        // Transform invoice
        const dueDate = ARCalculationService.excelDateToJSDate(row['Due Date Day']);
        const createdDate = row['Invoice Created At Day']
          ? ARCalculationService.excelDateToJSDate(row['Invoice Created At Day'])
          : new Date();

        const daysOverdue = ARCalculationService.calculateDaysOverdue(dueDate);
        const ageBucket = ARCalculationService.assignAgeBucket(daysOverdue);

        const invoice: Invoice = {
          id: `inv_${uuidv4()}`,
          customer_id: customerId,
          invoice_number: row['Invoice #'],
          amount: row.Value,
          currency: (row.Currency || 'usd').toLowerCase(),
          due_date: ARCalculationService.formatDate(dueDate),
          status: 'open',
          days_overdue: daysOverdue,
          age_bucket: ageBucket,
          category: null, // Will be set after
          stripe_invoice_id: row['Invoice #'],
          created_at: ARCalculationService.formatDate(createdDate),
          updated_at: new Date().toISOString(),
        };

        // Categorize invoice
        invoice.category = ARCalculationService.categorizeInvoice(invoice);

        invoices.push(invoice);
      } catch (error) {
        logger.error('Failed to transform row:', error, row);
      }
    }

    logger.info(`Transformed ${invoices.length} invoices and ${customers.size} customers`);
    return { invoices, customers };
  }

  /**
   * Parse ARR value which might be number or string
   */
  private static parseARR(value: any): number | null {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }
}
