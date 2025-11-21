import { AIProvider, AIModel, ProviderConfig } from '../types';
import { PROVIDER_CONFIGS as CONFIG_PROVIDER_CONFIGS } from '../config';
import { modelCacheManager } from './modelCache';

/**
 * MINIMAL FALLBACKS - Emergency models when API fetch fails
 * These are ONLY used when:
 * 1. No internet connection
 * 2. API is down
 * 3. Invalid API key
 * 4. First-time use before any API call
 * 
 * In normal operation, models are fetched dynamically from provider APIs
 */
export const MINIMAL_FALLBACKS: Record<AIProvider, AIModel> = {
  openai: {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    contextWindow: 128000,
    maxOutputTokens: 16384,
    supported: true,
    pricing: { input: 0.15, output: 0.60 }
  },
  anthropic: {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    contextWindow: 200000,
    maxOutputTokens: 8192,
    supported: true,
    pricing: { input: 3.00, output: 15.00 }
  },
  groq: {
    id: 'llama-3.3-70b-versatile',
    name: 'LLaMA 3.3 70B',
    provider: 'groq',
    contextWindow: 128000,
    maxOutputTokens: 8192,
    supported: true
  },
  gemini: {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'gemini',
    contextWindow: 1000000,
    maxOutputTokens: 8192,
    supported: true,
    pricing: { input: 0.075, output: 0.30 }
  },
  openrouter: {
    id: 'openrouter/auto',
    name: 'Auto (Best for Prompt)',
    provider: 'openrouter',
    contextWindow: 128000,
    maxOutputTokens: 8192,
    supported: true
  },
  ollama: {
    id: 'llama3',
    name: 'Llama 3',
    provider: 'ollama',
    contextWindow: 8192,
    maxOutputTokens: 4096,
    supported: true
  }
};

export const PROVIDER_CONFIGS: Record<AIProvider, ProviderConfig> = {
  openai: {
    name: 'openai',
    displayName: 'OpenAI',
    baseUrl: CONFIG_PROVIDER_CONFIGS.openai.baseUrl,
    models: [],
    requiresApiKey: true,
    apiKeyUrl: CONFIG_PROVIDER_CONFIGS.openai.apiKeyUrl
  },
  anthropic: {
    name: 'anthropic',
    displayName: 'Anthropic',
    baseUrl: CONFIG_PROVIDER_CONFIGS.anthropic.baseUrl,
    models: [],
    requiresApiKey: true,
    apiKeyUrl: CONFIG_PROVIDER_CONFIGS.anthropic.apiKeyUrl
  },
  groq: {
    name: 'groq',
    displayName: 'Groq',
    baseUrl: CONFIG_PROVIDER_CONFIGS.groq.baseUrl,
    models: [],
    requiresApiKey: true,
    apiKeyUrl: CONFIG_PROVIDER_CONFIGS.groq.apiKeyUrl
  },
  gemini: {
    name: 'gemini',
    displayName: 'Google Gemini',
    baseUrl: CONFIG_PROVIDER_CONFIGS.gemini.baseUrl,
    models: [],
    requiresApiKey: true,
    apiKeyUrl: CONFIG_PROVIDER_CONFIGS.gemini.apiKeyUrl
  },
  openrouter: {
    name: 'openrouter',
    displayName: 'OpenRouter',
    baseUrl: CONFIG_PROVIDER_CONFIGS.openrouter.baseUrl,
    models: [],
    requiresApiKey: true,
    apiKeyUrl: CONFIG_PROVIDER_CONFIGS.openrouter.apiKeyUrl
  },
  ollama: {
    name: 'ollama',
    displayName: 'Ollama (Local)',
    baseUrl: CONFIG_PROVIDER_CONFIGS.ollama.baseUrl,
    models: [],
    requiresApiKey: false,
    apiKeyUrl: ''
  }
};

export function getProviderConfig(provider: AIProvider): ProviderConfig {
  return PROVIDER_CONFIGS[provider];
}

/**
 * Get models for a provider - uses cache-first strategy
 * Falls back to minimal fallback if cache is empty
 */
export async function getModelsForProvider(provider: AIProvider, apiKey?: string): Promise<AIModel[]> {
  // Try cache first
  const cache = await modelCacheManager.getCachedModels(provider);
  if (cache) {
    console.log(`[Providers] Using cached models for ${provider}`);
    return cache.models;
  }

  // If API key provided or not required (like ollama), try fetching
  const config = getProviderConfig(provider);
  if (apiKey || !config.requiresApiKey) {
    try {
      const result = await fetchModelsForProvider(provider, apiKey || '');
      return result.models;
    } catch (error) {
      console.error(`[Providers] Failed to fetch models for ${provider}:`, error);
    }
  }

  // Fallback to minimal model
  console.log(`[Providers] Using minimal fallback for ${provider}`);
  return [MINIMAL_FALLBACKS[provider]];
}

/**
 * Get a specific model by ID - searches cache first, then creates dynamic model
 */
export async function getModelById(provider: AIProvider, modelId: string, apiKey?: string): Promise<AIModel | undefined> {
  // Try to find in cached models
  const models = await getModelsForProvider(provider, apiKey);
  const found = models.find(m => m.id === modelId);

  if (found) {
    return found;
  }

  // If not found, create a dynamic model configuration
  console.log(`[Providers] Model ${modelId} not found in cache, creating dynamic configuration`);
  return {
    id: modelId,
    name: modelId.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    provider,
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supported: true
  };
}

// Dynamic model loading functionality
export interface DynamicModelResponse {
  models: AIModel[];
  source: 'api' | 'cache' | 'minimal-fallback';
  lastUpdated?: number;
}

/**
 * Fetch models from provider API with caching
 */
export async function fetchModelsForProvider(provider: AIProvider, apiKey: string, skipCache = false): Promise<DynamicModelResponse> {
  // Check cache first
  if (!skipCache) {
    const cache = await modelCacheManager.getCachedModels(provider);
    if (cache) {
      console.log(`[Providers] Returning cached models for ${provider}`);
      return {
        models: cache.models,
        source: 'cache',
        lastUpdated: cache.timestamp
      };
    }
  }

  // Fetch from API
  try {
    let models: AIModel[] = [];

    switch (provider) {
      case 'openai':
        models = await fetchOpenAIModels(apiKey);
        break;
      case 'anthropic':
        models = await fetchAnthropicModels(apiKey);
        break;
      case 'groq':
        models = await fetchGroqModels(apiKey);
        break;
      case 'gemini':
        models = await fetchGeminiModels(apiKey);
        break;
      case 'openrouter':
        models = await fetchOpenRouterModels(apiKey);
        break;
      case 'ollama':
        models = await fetchOllamaModels();
        break;
    }

    if (models.length > 0) {
      // Cache the fetched models
      await modelCacheManager.setCachedModels(provider, models, 'api');
      console.log(`[Providers] Fetched and cached ${models.length} models for ${provider}`);

      return {
        models,
        source: 'api',
        lastUpdated: Date.now()
      };
    }

    // No models fetched, use minimal fallback
    const fallback = [MINIMAL_FALLBACKS[provider]];
    await modelCacheManager.setCachedModels(provider, fallback, 'minimal-fallback', 1000 * 60 * 60); // 1 hour TTL for fallbacks

    return {
      models: fallback,
      source: 'minimal-fallback'
    };
  } catch (error) {
    console.error(`[Providers] Failed to fetch models for ${provider}:`, error);

    // Use minimal fallback on error
    const fallback = [MINIMAL_FALLBACKS[provider]];
    await modelCacheManager.setCachedModels(provider, fallback, 'minimal-fallback', 1000 * 60 * 60); // 1 hour TTL

    return {
      models: fallback,
      source: 'minimal-fallback'
    };
  }
}

async function fetchOpenAIModels(apiKey: string): Promise<AIModel[]> {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (!response.ok) throw new Error('Failed to fetch OpenAI models');

  const data = await response.json();
  return data.data
    .filter((model: any) => model.id.startsWith('gpt-')) // Only GPT models
    .map((model: any) => ({
      id: model.id,
      name: model.id.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      provider: 'openai' as AIProvider,
      contextWindow: 128000,
      maxOutputTokens: 16384,
      supported: true
    }));
}

async function fetchAnthropicModels(apiKey: string): Promise<AIModel[]> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch Anthropic models');

    const data = await response.json();

    // Map the API response to our AIModel format
    return data.data.map((model: any) => ({
      id: model.id,
      name: model.display_name || model.id,
      provider: 'anthropic' as AIProvider,
      contextWindow: 200000,
      maxOutputTokens: 8192,
      supported: true,
      pricing: model.id.includes('opus')
        ? { input: 15.00, output: 75.00 }
        : model.id.includes('sonnet')
          ? { input: 3.00, output: 15.00 }
          : model.id.includes('haiku')
            ? { input: 0.25, output: 1.25 }
            : undefined
    }));
  } catch (error) {
    console.error('[Providers] Failed to fetch Anthropic models from API:', error);
    // Fallback to minimal fallback model
    return [MINIMAL_FALLBACKS.anthropic];
  }
}

async function fetchGroqModels(apiKey: string): Promise<AIModel[]> {
  const response = await fetch('https://api.groq.com/openai/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (!response.ok) throw new Error('Failed to fetch Groq models');

  const data = await response.json();
  return data.data.map((model: any) => ({
    id: model.id,
    name: model.id.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    provider: 'groq' as AIProvider,
    contextWindow: model.context_window || 128000,
    maxOutputTokens: 8192,
    supported: true
  }));
}

async function fetchGeminiModels(apiKey: string): Promise<AIModel[]> {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

  if (!response.ok) throw new Error('Failed to fetch Gemini models');

  const data = await response.json();

  return data.models
    .filter((model: any) =>
      model.supportedGenerationMethods &&
      model.supportedGenerationMethods.includes('generateContent')
    )
    .map((model: any) => {
      // Strip 'models/' prefix if present for cleaner IDs
      const id = model.name.replace('models/', '');
      return {
        id: id,
        name: model.displayName || id,
        provider: 'gemini' as AIProvider,
        contextWindow: model.inputTokenLimit || 128000,
        maxOutputTokens: model.outputTokenLimit || 8192,
        supported: true
      };
    });
}

async function fetchOpenRouterModels(apiKey: string): Promise<AIModel[]> {
  const response = await fetch('https://openrouter.ai/api/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });

  if (!response.ok) throw new Error('Failed to fetch OpenRouter models');

  const data = await response.json();

  return data.data.map((model: any) => ({
    id: model.id,
    name: model.name,
    provider: 'openrouter' as AIProvider,
    contextWindow: model.context_length || 128000,
    maxOutputTokens: model.top_provider?.max_completion_tokens || 4096,
    supported: true,
    pricing: {
      input: parseFloat(model.pricing?.prompt || '0') * 1000000,
      output: parseFloat(model.pricing?.completion || '0') * 1000000
    }
  }));
}

async function fetchOllamaModels(): Promise<AIModel[]> {
  try {
    const response = await fetch('http://localhost:11434/api/tags');

    if (!response.ok) throw new Error('Failed to fetch Ollama models');

    const data = await response.json();

    return data.models.map((model: any) => ({
      id: model.name,
      name: model.name,
      provider: 'ollama' as AIProvider,
      contextWindow: 8192, // Default for most local models
      maxOutputTokens: 4096,
      supported: true
    }));
  } catch (error) {
    console.error('Failed to fetch Ollama models:', error);
    throw error;
  }
}