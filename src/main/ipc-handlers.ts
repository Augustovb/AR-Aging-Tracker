import { ipcMain } from 'electron';
import path from 'path';
import { IPC_CHANNELS } from './types/ipc';
import SettingsStorage from './services/storage/SettingsStorage';
import { SyncEngine } from './services/sync/SyncEngine';
import { InvoiceRepository } from './services/database/repositories/InvoiceRepository';
import { CustomerRepository } from './services/database/repositories/CustomerRepository';
import logger from './utils/logger';

export function registerIPCHandlers(): void {
  const invoiceRepo = new InvoiceRepository();
  const customerRepo = new CustomerRepository();

  // Settings handlers
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async (_, key: string) => {
    try {
      return SettingsStorage.get(key as any);
    } catch (error) {
      logger.error('Failed to get setting:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, async (_, key: string, value: any) => {
    try {
      SettingsStorage.set(key as any, value);
      return { success: true };
    } catch (error) {
      logger.error('Failed to set setting:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_ALL, async () => {
    try {
      return SettingsStorage.getAll();
    } catch (error) {
      logger.error('Failed to get all settings:', error);
      throw error;
    }
  });

  // Sync handlers
  ipcMain.handle(IPC_CHANNELS.SYNC_START, async () => {
    try {
      logger.info('Sync started');

      // Use the Excel file in the project root
      const excelPath = path.join(__dirname, '../../..', 'Billing _ AR Aging.xlsx');
      const syncEngine = new SyncEngine(excelPath);
      const result = await syncEngine.sync();

      return result;
    } catch (error: any) {
      logger.error('Sync failed:', error);
      return {
        success: false,
        message: 'Sync failed',
        error: error.message,
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.SYNC_HISTORY, async () => {
    try {
      return SyncEngine.getSyncHistory();
    } catch (error) {
      logger.error('Failed to get sync history:', error);
      throw error;
    }
  });

  // Invoices handlers
  ipcMain.handle(IPC_CHANNELS.INVOICES_GET_ALL, async (_event, filters?: any) => {
    try {
      return invoiceRepo.getAll(filters);
    } catch (error) {
      logger.error('Failed to get invoices:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.INVOICES_GET_BY_ID, async (_event, id: string) => {
    try {
      return invoiceRepo.getById(id);
    } catch (error) {
      logger.error('Failed to get invoice:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.INVOICES_GET_BY_CUSTOMER, async (_event, customerId: string) => {
    try {
      return invoiceRepo.getByCustomer(customerId);
    } catch (error) {
      logger.error('Failed to get invoices by customer:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.INVOICES_GET_SUMMARY, async () => {
    try {
      return invoiceRepo.getSummary();
    } catch (error) {
      logger.error('Failed to get invoice summary:', error);
      throw error;
    }
  });

  // Customers handlers
  ipcMain.handle(IPC_CHANNELS.CUSTOMERS_GET_ALL, async () => {
    try {
      return customerRepo.getAll();
    } catch (error) {
      logger.error('Failed to get customers:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.CUSTOMERS_GET_BY_ID, async (_event, id: string) => {
    try {
      return customerRepo.getById(id);
    } catch (error) {
      logger.error('Failed to get customer:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.CUSTOMERS_GET_WITH_OVERDUE, async () => {
    try {
      return customerRepo.getWithOverdueInvoices();
    } catch (error) {
      logger.error('Failed to get customers with overdue invoices:', error);
      throw error;
    }
  });

  logger.info('IPC handlers registered');
}
