# Security Documentation

## API Key Encryption & Storage

### Overview
This application uses **multi-layered security** to protect sensitive API keys, especially the Stripe API key.

---

## Security Layers

### 1. **OS-Level Encryption** (Electron SafeStorage)
- Uses **Electron's `safeStorage` API**
- Leverages operating system's secure credential storage:
  - **macOS**: Keychain
  - **Windows**: DPAPI (Data Protection API)
  - **Linux**: libsecret/gnome-keyring

### 2. **Encrypted Storage**
- API keys are **never stored in plain text**
- Keys are encrypted before being written to disk
- Stored in Electron Store with an additional encryption layer
- Located in user data directory (OS-dependent)

### 3. **Environment Variable Protection**
- `.env` file is **git-ignored** (never committed to repository)
- Environment variables are cleared from memory after encryption
- Keys are loaded once on startup, then encrypted and stored

### 4. **Restricted API Key**
- Using Stripe **restricted key** (`rk_live_...`) instead of secret key
- Read-only permissions: Can only **retrieve** data, not create charges
- Limits potential damage if key is compromised

---

## How It Works

### Initialization Flow

```
1. App Starts
   ↓
2. ApiKeyManager.initialize()
   ↓
3. Load .env file
   ↓
4. Check if key already encrypted in storage
   ↓
5. If not encrypted:
   - Encrypt using OS-level encryption
   - Store encrypted version
   - Clear from memory
   ↓
6. Delete .env variables from process.env
```

### Runtime Usage

```
1. StripeService needs API key
   ↓
2. ApiKeyManager.getStripeKey()
   ↓
3. Decrypt from secure storage
   ↓
4. Return decrypted key (kept in memory briefly)
   ↓
5. Use for Stripe API call
```

---

## Security Best Practices Implemented

✅ **Never commit `.env` to git** - Already in `.gitignore`
✅ **Use OS-level encryption** - Electron SafeStorage
✅ **Encrypted at rest** - Keys encrypted in storage
✅ **Restricted API keys** - Read-only Stripe key
✅ **Memory clearing** - Environment variables cleared after encryption
✅ **Secure initialization** - Keys encrypted on first run
✅ **No hardcoded secrets** - All secrets external

---

## File Locations

### Source Code
- **ApiKeyManager**: `src/main/services/security/ApiKeyManager.ts`
- **SecureStorage**: `src/main/utils/crypto.ts`
- **SettingsStorage**: `src/main/services/storage/SettingsStorage.ts`

### Encrypted Storage Location
- **macOS**: `~/Library/Application Support/ar-aging-tracker/settings.json`
- **Windows**: `%APPDATA%\ar-aging-tracker\settings.json`
- **Linux**: `~/.config/ar-aging-tracker/settings.json`

The `settings.json` contains **encrypted** values only.

---

## Stripe API Key Details

### Current Key
- **Type**: Restricted Key (Read-only)
- **Prefix**: `rk_live_...`
- **Mode**: Live (Production)
- **Permissions**: Read-only access to:
  - Customers
  - Invoices
  - Balance
  - Account information

### What This Key CANNOT Do
❌ Create charges
❌ Create payment intents
❌ Modify customer data
❌ Delete data
❌ Access webhooks
❌ Manage subscriptions

### What This Key CAN Do
✅ Retrieve customer information
✅ List invoices
✅ Get invoice details
✅ Check account balance
✅ View payment links (if already created)

---

## Adding/Updating API Keys

### First Time Setup
1. Create `.env` file in project root (copy from `.env.example`)
2. Add your Stripe API key: `STRIPE_API_KEY=rk_live_...`
3. Start the app - key will be automatically encrypted

### Updating Keys
```typescript
import { ApiKeyManager } from './services/security/ApiKeyManager';

// Update Stripe key
ApiKeyManager.updateStripeKey('new_key_here');

// Remove Stripe key
ApiKeyManager.removeStripeKey();

// Check if key exists
const hasKey = ApiKeyManager.hasStripeKey();
```

---

## Security Considerations

### ⚠️ Important Notes

1. **First Run**: On first run, the app reads from `.env` and encrypts the key. After that, `.env` is not used.

2. **Backup**: If you lose the encrypted storage file, you'll need to re-add the API key from `.env` or settings UI.

3. **OS Protection**: The encryption is tied to the user account and machine. Keys cannot be decrypted on a different machine or user account.

4. **Network Security**: All Stripe API calls use HTTPS (TLS 1.2+) by default.

5. **Logging**: API keys are **never logged**. Only key existence is logged (e.g., "Stripe key configured: YES").

---

## Compliance

This implementation follows security best practices:
- **PCI DSS** - No storage of full credit card data
- **OWASP** - Protection against common vulnerabilities
- **Stripe Security** - Uses restricted keys with minimal permissions
- **Data Protection** - API keys encrypted at rest

---

## Testing Security

### Test Stripe Connection
```typescript
// Via IPC
const result = await stripeAPI.testConnection();
console.log(result); // { success: true, message: "..." }
```

### Verify Encryption
```typescript
// Check if encryption is available
import { SecureStorage } from './utils/crypto';
console.log(SecureStorage.isAvailable()); // Should be true
```

---

## Threat Model

### Protected Against
✅ Source code inspection (keys not in code)
✅ Git history leaks (`.env` is git-ignored)
✅ File system access (keys are encrypted)
✅ Memory dumps (keys cleared after encryption)
✅ Key compromise impact (restricted permissions)

### Not Protected Against
⚠️ OS-level malware with keychain access
⚠️ Physical access to unlocked machine
⚠️ Root/admin access to the system
⚠️ Network MITM (but Stripe uses certificate pinning)

---

## Future Enhancements

Potential improvements for even better security:
- [ ] Key rotation mechanism
- [ ] Multi-factor authentication for key access
- [ ] Audit logging for all key usage
- [ ] Settings UI for key management
- [ ] Biometric authentication (fingerprint/FaceID)
- [ ] Hardware security module (HSM) integration

---

## Contact & Support

For security concerns or questions:
- Review code in `src/main/services/security/`
- Check Electron SafeStorage docs: https://www.electronjs.org/docs/latest/api/safe-storage
- Stripe security best practices: https://stripe.com/docs/security

---

**Last Updated**: 2025-02-12
**Security Version**: 1.0
