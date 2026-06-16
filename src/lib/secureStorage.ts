// Secure Storage Service
// Uses browser.storage.local with simple obfuscation for API keys.
// For production extensions, consider using browser.storage.session (cleared on browser exit)
// or a native messaging host for hardware-backed encryption.

import browser from './browser';

const ENCRYPTION_KEY = 'termcheck-secure-v1-';

function obfuscate(str: string): string {
  // Simple XOR obfuscation - not cryptographically secure but prevents casual snooping
  return btoa(
    str
      .split('')
      .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)))
      .join('')
  );
}

function deobfuscate(str: string): string {
  try {
    const decoded = atob(str);
    return decoded
      .split('')
      .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length)))
      .join('');
  } catch {
    return str; // fallback for unencrypted legacy values
  }
}

export const SecureStorage = {
  async saveApiKeys(apiKeys: Record<string, string>): Promise<void> {
    const encrypted: Record<string, string> = {};
    for (const [provider, key] of Object.entries(apiKeys)) {
      encrypted[provider] = obfuscate(key);
    }
    await browser.storage.local.set({ _secure_api_keys: encrypted });
  },

  async getApiKeys(): Promise<Record<string, string>> {
    const result = await browser.storage.local.get('_secure_api_keys');
    const encrypted = result._secure_api_keys || {};
    const decrypted: Record<string, string> = {};
    for (const [provider, key] of Object.entries(encrypted)) {
      decrypted[provider] = deobfuscate(key as string);
    }
    return decrypted;
  },

  async migrateLegacySettings(): Promise<void> {
    // Migrate old plaintext settings to secure storage
    const result = await browser.storage.local.get(['settings', '_migrated_v1']);
    const settingsData = (result as any).settings;
    if (result._migrated_v1 && !settingsData?.apiKeys) return;
    if (!settingsData?.apiKeys) {
      await browser.storage.local.set({ _migrated_v1: true });
      return;
    }

    const keys = settingsData.apiKeys;
    await SecureStorage.saveApiKeys(keys);

    // Remove plaintext keys from settings
    const newSettings = { ...settingsData };
    delete newSettings.apiKeys;
    await browser.storage.local.set({ settings: newSettings, _migrated_v1: true });
  },
};
