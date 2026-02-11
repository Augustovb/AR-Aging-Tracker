import { safeStorage } from 'electron';

export class SecureStorage {
  static encrypt(plainText: string): string {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption is not available on this system');
    }
    const buffer = safeStorage.encryptString(plainText);
    return buffer.toString('base64');
  }

  static decrypt(encryptedText: string): string {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Encryption is not available on this system');
    }
    const buffer = Buffer.from(encryptedText, 'base64');
    return safeStorage.decryptString(buffer);
  }

  static isAvailable(): boolean {
    return safeStorage.isEncryptionAvailable();
  }
}
