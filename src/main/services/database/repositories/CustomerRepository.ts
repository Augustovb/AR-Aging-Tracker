import type Database from 'better-sqlite3';
import type { Customer } from '../../../types/models';
import DatabaseService from '../DatabaseService';

export class CustomerRepository {
  private db: Database.Database;

  constructor() {
    this.db = DatabaseService.getDatabase();
  }

  /**
   * Insert or update a customer
   */
  upsert(customer: Customer): void {
    const stmt = this.db.prepare(`
      INSERT INTO customers (id, name, email, arr, tenant, stripe_customer_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        email = excluded.email,
        arr = excluded.arr,
        tenant = excluded.tenant,
        stripe_customer_id = excluded.stripe_customer_id,
        updated_at = excluded.updated_at
    `);

    stmt.run(
      customer.id,
      customer.name,
      customer.email,
      customer.arr,
      customer.tenant,
      customer.stripe_customer_id,
      customer.created_at,
      customer.updated_at
    );
  }

  /**
   * Batch upsert customers
   */
  batchUpsert(customers: Customer[]): void {
    const upsertMany = this.db.transaction((customers: Customer[]) => {
      for (const customer of customers) {
        this.upsert(customer);
      }
    });

    upsertMany(customers);
  }

  /**
   * Get customer by ID
   */
  getById(id: string): Customer | undefined {
    const stmt = this.db.prepare('SELECT * FROM customers WHERE id = ?');
    return stmt.get(id) as Customer | undefined;
  }

  /**
   * Get all customers
   */
  getAll(): Customer[] {
    const stmt = this.db.prepare('SELECT * FROM customers ORDER BY name');
    return stmt.all() as Customer[];
  }

  /**
   * Get customers with overdue invoices
   */
  getWithOverdueInvoices(): Customer[] {
    const stmt = this.db.prepare(`
      SELECT DISTINCT c.*
      FROM customers c
      INNER JOIN invoices i ON c.id = i.customer_id
      WHERE i.days_overdue > 0 AND i.status = 'open'
      ORDER BY c.name
    `);
    return stmt.all() as Customer[];
  }

  /**
   * Get all customers with their AR summary (total owed, invoice count, worst category)
   */
  getAllWithAR(): any[] {
    const stmt = this.db.prepare(`
      SELECT
        c.*,
        COALESCE(SUM(i.amount), 0) as total_ar,
        COUNT(i.id) as invoice_count,
        MAX(i.days_overdue) as max_days_overdue,
        CASE
          WHEN SUM(CASE WHEN i.category = 'critical' THEN 1 ELSE 0 END) > 0 THEN 'critical'
          WHEN SUM(CASE WHEN i.category = 'relevant' THEN 1 ELSE 0 END) > 0 THEN 'relevant'
          WHEN SUM(CASE WHEN i.category = 'all90' THEN 1 ELSE 0 END) > 0 THEN 'all90'
          ELSE NULL
        END as worst_category
      FROM customers c
      LEFT JOIN invoices i ON c.id = i.customer_id AND i.status = 'open'
      GROUP BY c.id
      ORDER BY total_ar DESC
    `);
    return stmt.all();
  }

  /**
   * Delete all customers (for testing)
   */
  deleteAll(): void {
    this.db.prepare('DELETE FROM customers').run();
  }
}
