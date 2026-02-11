import { ipcMain } from 'electron';
import { IPC_CHANNELS } from './types/ipc';
import SettingsStorage from './services/storage/SettingsStorage';
import logger from './utils/logger';

export function registerIPCHandlers(): void {
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

  // Invoices handlers (placeholders for now)
  ipcMain.handle(IPC_CHANNELS.INVOICES_GET_ALL, async (_event, _filters?: any) => {
    try {
      // TODO: Implement invoice fetching
      return [];
    } catch (error) {
      logger.error('Failed to get invoices:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.INVOICES_GET_SUMMARY, async () => {
    try {
      // TODO: Implement summary calculation
      return {
        critical: { total: 0, count: 0, customer_count: 0 },
        relevant: { total: 0, count: 0, customer_count: 0 },
        all90: { total: 0, count: 0, customer_count: 0 },
        by_bucket: {
          current: { total: 0, count: 0 },
          '1-30': { total: 0, count: 0 },
          '31-60': { total: 0, count: 0 },
          '61-90': { total: 0, count: 0 },
          '90+': { total: 0, count: 0 },
        },
        total_overdue: 0,
        total_invoices: 0,
      };
    } catch (error) {
      logger.error('Failed to get invoice summary:', error);
      throw error;
    }
  });

  // Sync handlers (placeholders)
  ipcMain.handle(IPC_CHANNELS.SYNC_START, async () => {
    try {
      logger.info('Sync started');
      // TODO: Implement sync logic
      return { success: true, message: 'Sync not implemented yet' };
    } catch (error) {
      logger.error('Sync failed:', error);
      throw error;
    }
  });

  logger.info('IPC handlers registered');
}
