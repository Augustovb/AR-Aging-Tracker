import type Database from 'better-sqlite3';
import type { Invoice, InvoiceFilters, ARSummary, AgeBucket } from '../../../types/models';
import DatabaseService from '../DatabaseService';

export class InvoiceRepository {
  private db: Database.Database;

  constructor() {
    this.db = DatabaseService.getDatabase();
  }

  /**
   * Insert or update an invoice
   */
  upsert(invoice: Invoice): void {
    const stmt = this.db.prepare(`
      INSERT INTO invoices (
        id, customer_id, invoice_number, amount, currency, due_date, status,
        days_overdue, age_bucket, category, stripe_invoice_id, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        customer_id = excluded.customer_id,
        invoice_number = excluded.invoice_number,
        amount = excluded.amount,
        currency = excluded.currency,
        due_date = excluded.due_date,
        status = excluded.status,
        days_overdue = excluded.days_overdue,
        age_bucket = excluded.age_bucket,
        category = excluded.category,
        stripe_invoice_id = excluded.stripe_invoice_id,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      invoice.id,
      invoice.customer_id,
      invoice.invoice_number,
      invoice.amount,
      invoice.currency,
      invoice.due_date,
      invoice.status,
      invoice.days_overdue,
      invoice.age_bucket,
      invoice.category,
      invoice.stripe_invoice_id,
      invoice.created_at,
      invoice.updated_at
    );
  }

  /**
   * Batch upsert invoices
   */
  batchUpsert(invoices: Invoice[]): void {
    const upsertMany = this.db.transaction((invoices: Invoice[]) => {
      for (const invoice of invoices) {
        this.upsert(invoice);
      }
    });

    upsertMany(invoices);
  }

  /**
   * Get all invoices with optional filters
   */
  getAll(filters?: InvoiceFilters): Invoice[] {
    let query = `
      SELECT i.*, c.name as customer_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters?.age_bucket && filters.age_bucket.length > 0) {
      query += ` AND i.age_bucket IN (${filters.age_bucket.map(() => '?').join(',')})`;
      params.push(...filters.age_bucket);
    }

    if (filters?.category && filters.category.length > 0) {
      query += ` AND i.category IN (${filters.category.map(() => '?').join(',')})`;
      params.push(...filters.category);
    }

    if (filters?.customer_id) {
      query += ` AND i.customer_id = ?`;
      params.push(filters.customer_id);
    }

    if (filters?.min_amount !== undefined) {
      query += ` AND i.amount >= ?`;
      params.push(filters.min_amount);
    }

    if (filters?.max_amount !== undefined) {
      query += ` AND i.amount <= ?`;
      params.push(filters.max_amount);
    }

    if (filters?.search) {
      query += ` AND (c.name LIKE ? OR i.invoice_number LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    query += ` ORDER BY i.days_overdue DESC, i.amount DESC`;

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as Invoice[];
  }

  /**
   * Get invoice by ID
   */
  getById(id: string): Invoice | undefined {
    const stmt = this.db.prepare(`
      SELECT i.*, c.name as customer_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `);
    return stmt.get(id) as Invoice | undefined;
  }

  /**
   * Get invoices by customer
   */
  getByCustomer(customerId: string): Invoice[] {
    const stmt = this.db.prepare(`
      SELECT i.*, c.name as customer_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.customer_id = ?
      ORDER BY i.days_overdue DESC
    `);
    return stmt.all(customerId) as Invoice[];
  }

  /**
   * Calculate AR summary metrics
   */
  getSummary(): ARSummary {
    // Get category totals
    const categoriesStmt = this.db.prepare(`
      SELECT
        category,
        SUM(amount) as total,
        COUNT(*) as count,
        COUNT(DISTINCT customer_id) as customer_count
      FROM invoices
      WHERE category IS NOT NULL AND status = 'open'
      GROUP BY category
    `);
    const categoryResults = categoriesStmt.all() as any[];

    const critical = categoryResults.find(r => r.category === 'critical') || { total: 0, count: 0, customer_count: 0 };
    const relevant = categoryResults.find(r => r.category === 'relevant') || { total: 0, count: 0, customer_count: 0 };
    const all90 = categoryResults.find(r => r.category === 'all90') || { total: 0, count: 0, customer_count: 0 };

    // Get bucket totals
    const bucketsStmt = this.db.prepare(`
      SELECT
        age_bucket,
        SUM(amount) as total,
        COUNT(*) as count
      FROM invoices
      WHERE status = 'open'
      GROUP BY age_bucket
    `);
    const bucketResults = bucketsStmt.all() as any[];

    const by_bucket: ARSummary['by_bucket'] = {
      current: { total: 0, count: 0 },
      '1-30': { total: 0, count: 0 },
      '31-60': { total: 0, count: 0 },
      '61-90': { total: 0, count: 0 },
      '90+': { total: 0, count: 0 },
    };

    bucketResults.forEach(result => {
      if (result.age_bucket in by_bucket) {
        by_bucket[result.age_bucket as AgeBucket] = {
          total: result.total,
          count: result.count,
        };
      }
    });

    // Get total overdue (exclude current)
    const overdueStmt = this.db.prepare(`
      SELECT
        SUM(amount) as total,
        COUNT(*) as count
      FROM invoices
      WHERE days_overdue > 0 AND status = 'open'
    `);
    const overdueResult = overdueStmt.get() as any;

    return {
      critical: {
        total: critical.total || 0,
        count: critical.count || 0,
        customer_count: critical.customer_count || 0,
      },
      relevant: {
        total: relevant.total || 0,
        count: relevant.count || 0,
        customer_count: relevant.customer_count || 0,
      },
      all90: {
        total: all90.total || 0,
        count: all90.count || 0,
        customer_count: all90.customer_count || 0,
      },
      by_bucket,
      total_overdue: overdueResult?.total || 0,
      total_invoices: overdueResult?.count || 0,
    };
  }

  /**
   * Delete all invoices (for testing)
   */
  deleteAll(): void {
    this.db.prepare('DELETE FROM invoices').run();
  }
}
