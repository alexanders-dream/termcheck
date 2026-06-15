import { LegalFlag, AIProvider, AppSettings, AIModel } from '../types';
import {
  analyzeWithOpenAI,
  analyzeWithAnthropic,
  analyzeWithGroq,
  analyzeWithGemini,
  analyzeWithOpenRouter,
  analyzeWithOllama,
} from './adapters';
import { getProviderConfig, getModelById, getModelsForProvider } from './providers';
import { chunkText, mergeFlags, getChunkSize } from '../chunking';

export interface AnalysisError {
  chunkIndex: number;
  error: string;
}

export class AIService {
  private settings: AppSettings;

  constructor(settings: AppSettings) {
    this.settings = settings;
  }

  async analyzeText(text: string, systemPrompt: string): Promise<LegalFlag[]> {
    const { provider, apiKeys, model } = this.settings;
    const apiKey = apiKeys[provider];

    if (!apiKey && provider !== 'ollama') {
      throw new Error(`API key is required for ${provider}`);
    }

    let selectedModel = await getModelById(provider, model, apiKey);

    if (!selectedModel) {
      selectedModel = {
        id: model,
        name: model,
        provider,
        contextWindow: 128000,
        maxOutputTokens: 4096,
        supported: true,
      };
    }

    const chunkSize = getChunkSize(text.length);
    console.log(`[AIService] Document length: ${text.length}, chunk size: ${chunkSize}`);

    if (text.length <= chunkSize) {
      console.log(`[AIService] Text fits in single chunk, analyzing directly`);
      return await this.analyzeChunkWithRetry(text, provider, apiKey || '', model, systemPrompt);
    }

    const chunks = chunkText(text, chunkSize, 500);
    console.log(`[AIService] Analyzing ${chunks.length} chunks for long document`);

    // Process chunks concurrently with a limit of 3 to avoid rate limits
    const results = await this.processChunksConcurrently(
      chunks,
      provider,
      apiKey || '',
      model,
      systemPrompt,
      3
    );

    const mergedFlags = mergeFlags(results.filter((r): r is LegalFlag[] => r !== null));
    console.log(`[AIService] Found ${mergedFlags.length} unique flags across all chunks`);
    return mergedFlags;
  }

  private async processChunksConcurrently(
    chunks: string[],
    provider: AIProvider,
    apiKey: string,
    model: string,
    systemPrompt: string,
    concurrency: number
  ): Promise<(LegalFlag[] | null)[]> {
    const results: (LegalFlag[] | null)[] = [];
    let index = 0;

    const workers = Array.from({ length: concurrency }, async (_, workerIndex) => {
      while (index < chunks.length) {
        const i = index++;
        console.log(`[AIService] Analyzing chunk ${i + 1}/${chunks.length} on worker ${workerIndex}`);
        try {
          if (i > 0) await new Promise((r) => setTimeout(r, 500)); // small delay between workers
          const flags = await this.analyzeChunkWithRetry(chunks[i], provider, apiKey, model, systemPrompt);
          results[i] = flags;
        } catch (error) {
          console.error(`[AIService] Failed to analyze chunk ${i + 1}:`, error);
          results[i] = null;
        }
      }
    });

    await Promise.all(workers);
    return results;
  }

  private async analyzeChunkWithRetry(
    text: string,
    provider: AIProvider,
    apiKey: string,
    model: string,
    systemPrompt: string,
    retries = 3
  ): Promise<LegalFlag[]> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`[AIService] Retry attempt ${attempt} after ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        return await this.analyzeChunk(text, provider, apiKey, model, systemPrompt);
      } catch (error) {
        console.warn(`[AIService] Attempt ${attempt + 1} failed:`, error);
        lastError = error as Error;
      }
    }

    if (lastError) throw lastError;
    throw new Error('Analysis failed after all retries');
  }

  private async analyzeChunk(
    text: string,
    provider: AIProvider,
    apiKey: string,
    model: string,
    systemPrompt: string
  ): Promise<LegalFlag[]> {
    switch (provider) {
      case 'openai':
        return await analyzeWithOpenAI(text, apiKey, systemPrompt, model);
      case 'anthropic':
        return await analyzeWithAnthropic(text, apiKey, systemPrompt, model);
      case 'groq':
        return await analyzeWithGroq(text, apiKey, systemPrompt, model);
      case 'gemini':
        return await analyzeWithGemini(text, apiKey, systemPrompt, model);
      case 'openrouter':
        return await analyzeWithOpenRouter(text, apiKey, systemPrompt, model);
      case 'ollama':
        return await analyzeWithOllama(text, apiKey, systemPrompt, model);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  static validateSettings(
    settings: AppSettings,
    availableModels?: AIModel[]
  ): { valid: boolean; error?: string } {
    if (!settings.provider) {
      return { valid: false, error: 'Provider is required' };
    }

    const providerConfig = getProviderConfig(settings.provider);
    if (!providerConfig) {
      return { valid: false, error: `Invalid provider: ${settings.provider}` };
    }

    if (providerConfig.requiresApiKey && !settings.apiKeys[settings.provider]) {
      return { valid: false, error: `API key is required for ${providerConfig.displayName}` };
    }

    if (!settings.model) {
      return { valid: false, error: 'Model is required' };
    }

    if (availableModels && availableModels.length > 0) {
      const modelExists = availableModels.find((m) => m.id === settings.model);
      if (!modelExists) {
        console.warn(`[AIService] Model ${settings.model} not in available models list, but allowing it`);
      }
    }

    return { valid: true };
  }

  static async getDefaultModel(provider: AIProvider, apiKey?: string): Promise<string> {
    const models = await getModelsForProvider(provider, apiKey);
    return models.length > 0 ? models[0].id : '';
  }
}
