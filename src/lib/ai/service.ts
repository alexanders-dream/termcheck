import { LegalFlag, AIProvider, AppSettings, AIModel } from '../types';
import { analyzeWithOpenAI } from './openai';
import { analyzeWithAnthropic, analyzeWithGroq, analyzeWithGemini, analyzeWithMoonshot, analyzeWithOpenRouter } from './adapters.js';
import { getProviderConfig, getModelById, getModelsForProvider } from './providers';

import { chunkText, mergeFlags, getChunkSize } from '../chunking';

export class AIService {
  private settings: AppSettings;

  constructor(settings: AppSettings) {
    this.settings = settings;
  }

  async analyzeText(text: string, systemPrompt: string): Promise<LegalFlag[]> {
    const { provider, apiKeys, model } = this.settings;
    const apiKey = apiKeys[provider];

    if (!apiKey) {
      throw new Error(`API key is required for ${provider}`);
    }

    // Get model configuration using dynamic lookup
    let selectedModel = await getModelById(provider, model, apiKey);

    // If still no model found (shouldn't happen with new dynamic system), create default
    if (!selectedModel) {
      console.log(`[AIService] Model ${model} not found, using default configuration`);
      selectedModel = {
        id: model,
        name: model,
        provider: provider,
        contextWindow: 128000,
        maxOutputTokens: 4096,
        supported: true
      };
    }

    // Calculate chunk size based on document length using adaptive strategy
    const chunkSize = getChunkSize(text.length);
    console.log(`[AIService] Document length: ${text.length}, Adaptive chunk size: ${chunkSize}`);

    // Check if chunking is needed
    if (text.length <= chunkSize) {
      // Text fits in one chunk, analyze directly
      console.log(`[AIService] Text fits in single chunk, analyzing directly`);
      return await this.analyzeChunkWithRetry(text, provider, apiKey, model, systemPrompt);
    }

    // Text is too long, split into chunks
    const chunks = chunkText(text, chunkSize, 500); // 500 char overlap
    console.log(`[AIService] Analyzing ${chunks.length} chunks for long document`);

    // Analyze each chunk sequentially to avoid rate limits
    const allFlags: LegalFlag[][] = [];
    for (let i = 0; i < chunks.length; i++) {
      console.log(`[AIService] Analyzing chunk ${i + 1}/${chunks.length}`);
      try {
        // Add a small delay between chunks to be nice to APIs
        if (i > 0) await new Promise(resolve => setTimeout(resolve, 1000));

        const flags = await this.analyzeChunkWithRetry(chunks[i], provider, apiKey, model, systemPrompt);
        allFlags.push(flags);
      } catch (error) {
        console.error(`[AIService] Failed to analyze chunk ${i + 1}:`, error);
        // Continue with other chunks even if one fails, but log it
      }
    }

    // Merge and deduplicate flags from all chunks
    const mergedFlags = mergeFlags(allFlags);
    console.log(`[AIService] Found ${mergedFlags.length} unique flags across all chunks`);

    return mergedFlags;
  }

  private async analyzeChunkWithRetry(
    text: string,
    provider: AIProvider,
    apiKey: string,
    model: string,
    systemPrompt: string,
    retries = 3
  ): Promise<LegalFlag[]> {
    let lastError;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
          console.log(`[AIService] Retry attempt ${attempt} after ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        return await this.analyzeChunk(text, provider, apiKey, model, systemPrompt);
      } catch (error) {
        console.warn(`[AIService] Attempt ${attempt + 1} failed:`, error);
        lastError = error;

        // If it's a rate limit error, we definitely want to retry
        // But for now we retry on all errors except maybe auth errors?
        // Keeping it simple for now.
      }
    }

    throw lastError;
  }

  private async analyzeChunk(text: string, provider: AIProvider, apiKey: string, model: string, systemPrompt: string): Promise<LegalFlag[]> {
    try {
      switch (provider) {
        case 'openai':
          return await analyzeWithOpenAI(text, apiKey, systemPrompt, model);

        case 'anthropic':
          return await analyzeWithAnthropic(text, apiKey, systemPrompt, model);

        case 'groq':
          return await analyzeWithGroq(text, apiKey, systemPrompt, model);

        case 'gemini':
          return await analyzeWithGemini(text, apiKey, systemPrompt, model);

        case 'moonshot':
          return await analyzeWithMoonshot(text, apiKey, systemPrompt, model);

        case 'openrouter':
          return await analyzeWithOpenRouter(text, apiKey, systemPrompt, model);

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error(`[AIService] Analysis failed for ${provider}:`, error);
      throw error;
    }
  }

  static validateSettings(settings: AppSettings, availableModels?: AIModel[]): { valid: boolean; error?: string } {
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

    // With dynamic loading, we accept any model ID
    // The model will be validated when fetched from the API
    // This allows for new models to be used without code changes
    if (availableModels && availableModels.length > 0) {
      const modelExists = availableModels.find(m => m.id === settings.model);
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