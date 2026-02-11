import Store from 'electron-store';
import { SecureStorage } from '../../utils/crypto';
import logger from '../../utils/logger';

interface Settings {
  googleSheetsId?: string;
  stripeApiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  theme?: 'light' | 'dark';
  lastSyncTimestamp?: string;
}

class SettingsStorage {
  private store: Store<Settings>;

  constructor() {
    this.store = new Store<Settings>({
      name: 'settings',
      encryptionKey: 'ar-aging-tracker-secret-key',
    });
  }

  get<K extends keyof Settings>(key: K): Settings[K] | undefined {
    return this.store.get(key);
  }

  set<K extends keyof Settings>(key: K, value: Settings[K]): void {
    this.store.set(key, value);
    logger.info(`Setting updated: ${key}`);
  }

  getAll(): Settings {
    return this.store.store;
  }

  setEncrypted(key: string, value: string): void {
    try {
      if (SecureStorage.isAvailable()) {
        const encrypted = SecureStorage.encrypt(value);
        this.store.set(key as keyof Settings, encrypted as any);
      } else {
        // Fallback to unencrypted if encryption not available
        logger.warn('Encryption not available, storing value unencrypted');
        this.store.set(key as keyof Settings, value as any);
      }
    } catch (error) {
      logger.error(`Failed to encrypt setting ${key}:`, error);
      throw error;
    }
  }

  getDecrypted(key: string): string | undefined {
    try {
      const value = this.store.get(key as keyof Settings);
      if (!value || typeof value !== 'string') return undefined;

      if (SecureStorage.isAvailable()) {
        return SecureStorage.decrypt(value);
      } else {
        // Return as-is if encryption not available
        return value;
      }
    } catch (error) {
      logger.error(`Failed to decrypt setting ${key}:`, error);
      return undefined;
    }
  }

  delete(key: keyof Settings): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export default new SettingsStorage();
