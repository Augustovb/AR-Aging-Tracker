import * as dotenv from 'dotenv';
import * as path from 'path';
import SettingsStorage from '../storage/SettingsStorage';
import logger from '../../utils/logger';

/**
 * ApiKeyManager - Securely manages API keys with encryption
 * Keys are loaded from .env only once, then encrypted and stored
 */
export class ApiKeyManager {
  private static initialized = false;

  /**
   * Initialize API keys from .env file
   * This should be called once on app startup
   * Keys are encrypted using OS-level encryption (Electron safeStorage)
   */
  static initialize(): void {
    if (this.initialized) {
      logger.info('API keys already initialized');
      return;
    }

    try {
      // Load .env file from project root
      const envPath = path.join(__dirname, '../../../..', '.env');
      dotenv.config({ path: envPath });

      // Check if Stripe key is already encrypted in storage
      const existingKey = SettingsStorage.getDecrypted('stripeApiKey');

      if (!existingKey && process.env.STRIPE_API_KEY) {
        logger.info('Encrypting and storing Stripe API key...');
        SettingsStorage.setEncrypted('stripeApiKey', process.env.STRIPE_API_KEY);
        logger.info('✓ Stripe API key encrypted and stored securely');

        // Clear from memory
        delete process.env.STRIPE_API_KEY;
      } else if (existingKey) {
        logger.info('✓ Stripe API key already encrypted in secure storage');
        // Clear from memory if present
        delete process.env.STRIPE_API_KEY;
      } else {
        logger.warn('No Stripe API key found in .env file');
      }

      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize API keys:', error);
      throw error;
    }
  }

  /**
   * Get the decrypted Stripe API key
   * Returns the key from encrypted storage
   */
  static getStripeKey(): string | undefined {
    try {
      return SettingsStorage.getDecrypted('stripeApiKey');
    } catch (error) {
      logger.error('Failed to get Stripe key:', error);
      return undefined;
    }
  }

  /**
   * Update the Stripe API key
   * Encrypts and stores the new key
   */
  static updateStripeKey(newKey: string): void {
    try {
      SettingsStorage.setEncrypted('stripeApiKey', newKey);
      logger.info('Stripe API key updated successfully');
    } catch (error) {
      logger.error('Failed to update Stripe key:', error);
      throw error;
    }
  }

  /**
   * Remove the Stripe API key from storage
   */
  static removeStripeKey(): void {
    try {
      SettingsStorage.delete('stripeApiKey');
      logger.info('Stripe API key removed');
    } catch (error) {
      logger.error('Failed to remove Stripe key:', error);
      throw error;
    }
  }

  /**
   * Check if Stripe key is configured
   */
  static hasStripeKey(): boolean {
    const key = this.getStripeKey();
    return !!key && key.length > 0;
  }
}
