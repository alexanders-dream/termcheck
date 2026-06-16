import { LegalFlag } from './types';
import browser from './browser';

interface CachedResult {
    flags: LegalFlag[];
    timestamp: number;
}

const STORAGE_KEY_PREFIX = 'analysis_cache_';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const StorageService = {
    /**
     * Save kháSave analysis result for a specific URL
     */
    async saveAnalysisResult(url: string, flags: LegalFlag[]): Promise<void> {
        const key = `${STORAGE_KEY_PREFIX}${url}`;
        const data: CachedResult = {
            flags,
            timestamp: Date.now(),
        };
        await browser.storage.local.set({ [key]: data });
    },

    /**
     * Get cached analysis result for a specific URL
     * Returns null if not found or expired
     */
    async getAnalysisResult(url: string): Promise<LegalFlag[] | null> {
        const key = `${STORAGE_KEY_PREFIX}${url}`;
        const result = await browser.storage.local.get(key);
        const data = result[key] as CachedResult | undefined;

        if (!data) {
            return null;
        }

        const now = Date.now();
        if (now - data.timestamp > TTL_MS) {
            // Expired, remove it
            await browser.storage.local.remove(key);
            return null;
        }

        return data.flags;
    },

    /**
     * Remove expired results to keep storage clean
     * This can be called on app startup
     */
    async cleanupExpiredResults(): Promise<void> {
        const allData = await browser.storage.local.get(null);
        const keysToRemove: string[] = [];
        const now = Date.now();

        for (const [key, value] of Object.entries(allData)) {
            if (key.startsWith(STORAGE_KEY_PREFIX)) {
                const data = value as CachedResult;
                if (now - data.timestamp > TTL_MS) {
                    keysToRemove.push(key);
                }
            }
        }

        if (keysToRemove.length > 0) {
            await browser.storage.local.remove(keysToRemove);
        }
    }
};
