import { randomUUID } from 'crypto';
import { DataTransformer } from './DataTransformer';
import { InvoiceRepository } from '../database/repositories/InvoiceRepository';
import { CustomerRepository } from '../database/repositories/CustomerRepository';
import DatabaseService from '../database/DatabaseService';
import logger from '../../utils/logger';

interface SyncResult {
  success: boolean;
  message: string;
  customersImported?: number;
  invoicesImported?: number;
  error?: string;
}

export class SyncEngine {
  private invoiceRepo: InvoiceRepository;
  private customerRepo: CustomerRepository;
  private excelFilePath: string;

  constructor(excelFilePath: string) {
    this.excelFilePath = excelFilePath;
    this.invoiceRepo = new InvoiceRepository();
    this.customerRepo = new CustomerRepository();
  }

  /**
   * Execute the sync process
   */
  async sync(): Promise<SyncResult> {
    const syncId = randomUUID();
    const startTime = new Date();

    try {
      logger.info(`Sync started: ${syncId}`);
      this.logSyncStart(syncId, startTime);

      // Step 1: Parse Excel file
      logger.info('Parsing Excel file...');

      // Get the actual invoice rows (starting from row 6, index 6 in raw data)
      const invoiceRows = this.extractInvoiceData(this.excelFilePath);

      if (invoiceRows.length === 0) {
        throw new Error('No invoice data found in Excel file');
      }

      logger.info(`Found ${invoiceRows.length} invoice rows`);

      // Step 2: Transform data
      logger.info('Transforming data...');
      const { invoices, customers } = DataTransformer.transformExcelData(invoiceRows);

      // Step 3: Clear old data and store fresh import
      logger.info('Storing data in database...');
      this.invoiceRepo.deleteAll();
      this.customerRepo.deleteAll();
      this.customerRepo.batchUpsert(Array.from(customers.values()));
      this.invoiceRepo.batchUpsert(invoices);

      // Step 4: Log completion
      const endTime = new Date();
      this.logSyncCompletion(syncId, endTime, customers.size + invoices.length);

      logger.info(`Sync completed: ${syncId}`);

      return {
        success: true,
        message: `Successfully imported ${invoices.length} invoices and ${customers.size} customers`,
        customersImported: customers.size,
        invoicesImported: invoices.length,
      };
    } catch (error: any) {
      logger.error('Sync failed:', error);
      this.logSyncError(syncId, error);

      return {
        success: false,
        message: 'Sync failed',
        error: error.message,
      };
    }
  }

  /**
   * Extract invoice data from Excel file
   * Handles the specific structure of the AR | All sheet
   */
  private extractInvoiceData(filePath: string): any[] {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets['AR | All'];

    // Get raw data
    const rawData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Headers are in row 5 (index 5)
    const headers = rawData[5];

    // Data starts from row 6 (index 6)
    const dataRows = rawData.slice(6);

    // Convert to objects with proper headers
    const invoices = dataRows
      .filter(row => row && row.length > 0 && row[2]) // Filter out empty rows and rows without invoice number
      .map(row => {
        const obj: any = {};
        headers.forEach((header: string, index: number) => {
          obj[header] = row[index];
        });
        return obj;
      });

    return invoices;
  }

  /**
   * Log sync start to database
   */
  private logSyncStart(syncId: string, startTime: Date): void {
    const db = DatabaseService.getDatabase();
    const stmt = db.prepare(`
      INSERT INTO sync_log (id, started_at, status)
      VALUES (?, ?, 'running')
    `);
    stmt.run(syncId, startTime.toISOString());
  }

  /**
   * Log sync completion to database
   */
  private logSyncCompletion(syncId: string, endTime: Date, recordCount: number): void {
    const db = DatabaseService.getDatabase();
    const stmt = db.prepare(`
      UPDATE sync_log
      SET completed_at = ?, status = 'completed', records_synced = ?
      WHERE id = ?
    `);
    stmt.run(endTime.toISOString(), recordCount, syncId);
  }

  /**
   * Log sync error to database
   */
  private logSyncError(syncId: string, error: Error): void {
    const db = DatabaseService.getDatabase();
    const stmt = db.prepare(`
      UPDATE sync_log
      SET completed_at = ?, status = 'failed', error = ?
      WHERE id = ?
    `);
    stmt.run(new Date().toISOString(), error.message, syncId);
  }

  /**
   * Get sync history
   */
  static getSyncHistory(limit: number = 10): any[] {
    const db = DatabaseService.getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM sync_log
      ORDER BY started_at DESC
      LIMIT ?
    `);
    return stmt.all(limit) as any[];
  }
}
