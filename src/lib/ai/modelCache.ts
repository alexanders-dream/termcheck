import { AIProvider, AIModel } from '../types';
import browser from '../browser';

/**
 * Cache entry structure for storing model data
 */
export interface ModelCache {
    provider: AIProvider;
    models: AIModel[];
    timestamp: number;
    ttl: number;
    source: 'api' | 'minimal-fallback';
    version: number;
}

/**
 * Cache configuration
 */
const CACHE_CONFIG = {
    DEFAULT_TTL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    STORAGE_KEY_PREFIX: 'models_cache_',
    CACHE_VERSION: 1,
    MAX_CACHE_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days - absolute max age
} as const;

/**
 * Model Cache Manager
 * Handles caching of AI models in browser.storage.local with TTL support
 */
export class ModelCacheManager {
    /**
     * Get cached models for a provider
     * Returns null if cache doesn't exist or is invalid
     */
    async getCachedModels(provider: AIProvider): Promise<ModelCache | null> {
        try {
            const key = this.getCacheKey(provider);
            const result = await browser.storage.local.get(key);

            if (!result[key]) {
                console.log(`[ModelCache] No cache found for ${provider}`);
                return null;
            }

            const cache = result[key] as ModelCache;

            // Validate cache version
            if (cache.version !== CACHE_CONFIG.CACHE_VERSION) {
                console.log(`[ModelCache] Cache version mismatch for ${provider}, invalidating`);
                await this.invalidateCache(provider);
                return null;
            }

            // Check if cache is valid
            if (!this.isCacheValid(cache)) {
                console.log(`[ModelCache] Cache expired for ${provider}`);
                await this.invalidateCache(provider);
                return null;
            }

            console.log(`[ModelCache] Valid cache found for ${provider}, age: ${this.getCacheAge(cache)}ms`);
            return cache;
        } catch (error) {
            console.error(`[ModelCache] Error reading cache for ${provider}:`, error);
            return null;
        }
    }

    /**
     * Store models in cache for a provider
     */
    async setCachedModels(
        provider: AIProvider,
        models: AIModel[],
        source: 'api' | 'minimal-fallback' = 'api',
        ttl: number = CACHE_CONFIG.DEFAULT_TTL
    ): Promise<void> {
        try {
            const key = this.getCacheKey(provider);
            const cache: ModelCache = {
                provider,
                models,
                timestamp: Date.now(),
                ttl,
                source,
                version: CACHE_CONFIG.CACHE_VERSION,
            };

            await browser.storage.local.set({ [key]: cache });
            console.log(`[ModelCache] Cached ${models.length} models for ${provider}, TTL: ${ttl}ms`);
        } catch (error) {
            console.error(`[ModelCache] Error setting cache for ${provider}:`, error);
            throw error;
        }
    }

    /**
     * Check if a cache entry is still valid based on TTL
     */
    isCacheValid(cache: ModelCache): boolean {
        const age = this.getCacheAge(cache);

        // Check TTL
        if (age > cache.ttl) {
            return false;
        }

        // Check absolute max age (safety check)
        if (age > CACHE_CONFIG.MAX_CACHE_AGE) {
            return false;
        }

        // Check if models array is valid
        if (!cache.models || !Array.isArray(cache.models) || cache.models.length === 0) {
            return false;
        }

        return true;
    }

    /**
     * Invalidate (delete) cache for a provider
     */
    async invalidateCache(provider: AIProvider): Promise<void> {
        try {
            const key = this.getCacheKey(provider);
            await browser.storage.local.remove(key);
            console.log(`[ModelCache] Cache invalidated for ${provider}`);
        } catch (error) {
            console.error(`[ModelCache] Error invalidating cache for ${provider}:`, error);
        }
    }

    /**
     * Clear all model caches
     */
    async clearAllCaches(): Promise<void> {
        try {
            const providers: AIProvider[] = ['openai', 'anthropic', 'groq', 'gemini', 'openrouter', 'ollama', 'deepseek', 'moonshot', 'zai', 'nvidia'];
            const keys = providers.map(p => this.getCacheKey(p));
            await browser.storage.local.remove(keys);
            console.log('[ModelCache] All caches cleared');
        } catch (error) {
            console.error('[ModelCache] Error clearing all caches:', error);
        }
    }

    /**
     * Get cache age in milliseconds
     */
    private getCacheAge(cache: ModelCache): number {
        return Date.now() - cache.timestamp;
    }

    /**
     * Get storage key for a provider
     */
    private getCacheKey(provider: AIProvider): string {
        return `${CACHE_CONFIG.STORAGE_KEY_PREFIX}${provider}`;
    }

    /**
     * Get cache statistics for debugging
     */
    async getCacheStats(): Promise<Record<AIProvider, { age: number; modelCount: number; source: string } | null>> {
        const providers: AIProvider[] = ['openai', 'anthropic', 'groq', 'gemini', 'openrouter', 'ollama', 'deepseek', 'moonshot', 'zai', 'nvidia'];
        const stats: Record<string, { age: number; modelCount: number; source: string } | null> = {};

        for (const provider of providers) {
            const cache = await this.getCachedModels(provider);
            if (cache) {
                stats[provider] = {
                    age: this.getCacheAge(cache),
                    modelCount: cache.models.length,
                    source: cache.source,
                };
            } else {
                stats[provider] = null;
            }
        }

        return stats as Record<AIProvider, { age: number; modelCount: number; source: string } | null>;
    }
}

// Export singleton instance
export const modelCacheManager = new ModelCacheManager();
