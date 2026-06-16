import { AIProvider } from '../types';

export const MODEL_DEFAULTS = {
  CONTEXT_WINDOW: 128000,
  MAX_OUTPUT_TOKENS: 4096,
  SUPPORTED_PATTERN: /^gpt-4|claude-|llama-|gemini-/i,
} as const;

export const TEXT_PROCESSING = {
  CONTEXT_WINDOW_USAGE_RATIO: 0.8, // Use 80% of context window for text truncation
  MIN_CONTEXT_WINDOW: 8192,
  MAX_CONTEXT_WINDOW: 2000000,
} as const;

// Provider-specific configurations
export const PROVIDER_CONFIGS = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    requiresApiKey: true
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    apiKeyUrl: 'https://console.anthropic.com/keys',
    requiresApiKey: true
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKeyUrl: 'https://console.groq.com/keys',
    requiresApiKey: true
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    apiKeyUrl: 'https://makersuite.google.com/app/apikey',
    requiresApiKey: true
  },
  openrouter: {
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyUrl: 'https://openrouter.ai/keys',
    requiresApiKey: true
  },
  ollama: {
    baseUrl: 'http://localhost:11434/api',
    apiKeyUrl: '',
    requiresApiKey: false
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    requiresApiKey: true
  },
  moonshot: {
    baseUrl: 'https://api.moonshot.cn/v1',
    apiKeyUrl: 'https://platform.moonshot.cn/api',
    requiresApiKey: true
  },
  zai: {
    baseUrl: 'https://api.zai.dev/v1',
    apiKeyUrl: 'https://zai.dev/settings/api-keys',
    requiresApiKey: true
  },
  nvidia: {
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    apiKeyUrl: 'https://build.nvidia.com/api-keys',
    requiresApiKey: true
  }
};

// Model name formatting patterns
export const MODEL_NAME_PATTERNS = {
  REPLACE_DASHES: /-/g,
  CAPITALIZE_WORDS: /\b\w/g,
  ID_SEPARATOR: ' ',
  CAPITALIZE_FUNCTION: (match: string) => match.toUpperCase()
};

// API endpoint paths
export const API_ENDPOINTS = {
  MODELS: '/models',
  CHAT_COMPLETIONS: '/chat/completions',
  MESSAGES: '/messages'
};

// Error messages
export const ERROR_MESSAGES = {
  FETCH_MODELS_FAILED: 'Failed to fetch models',
  MODEL_NOT_SUPPORTED: (modelId: string) => `Model ${modelId} is not supported`,
  API_KEY_REQUIRED: (providerName: string) => `API key is required for ${providerName}`,
  INVALID_PROVIDER: (provider: string) => `Invalid provider: ${provider}`,
  MODEL_NOT_COMPATIBLE: (modelId: string, provider: string) => `Model ${modelId} is not compatible with ${provider}`,
  PROVIDER_REQUIRED: 'Provider is required',
  MODEL_REQUIRED: 'Model is required'
};

// UI Configuration
export const UI_CONFIG = {
  EXTENSION_WIDTH: 400,
  EXTENSION_MIN_HEIGHT: 500,
  RETRY_COUNT: 3,
  RETRY_DELAY: 500,
  CONTENT_SCRIPT_READY_DELAY: 100,
  SEVERITY_COLORS: {
    high: 'bg-red-100 border-red-500 text-red-800',
    medium: 'bg-orange-100 border-orange-500 text-orange-800',
    low: 'bg-green-100 border-green-500 text-green-800'
  } as const,
  DEFAULT_SEVERITY_COLOR: 'bg-green-100 border-green-500 text-green-800'
};

// Default settings
export const DEFAULT_SETTINGS = {
  provider: 'openai' as AIProvider,
  model: 'gpt-4o-mini',
  apiKeys: {
    openai: '',
    anthropic: '',
    groq: '',
    gemini: '',
    openrouter: '',
    ollama: '',
    deepseek: '',
    moonshot: '',
    zai: '',
    nvidia: ''
  }
};

// Content extraction configuration
export const CONTENT_CONFIG = {
  LEGAL_KEYWORDS: ['terms of service', 'privacy policy', 'user agreement', 'terms and conditions'] as const,
  MAX_CONTENT_LENGTH: 50000, // 50k characters
  URL_CHECK_INTERVAL: 1000, // 1 second
  TEXT_SEARCH_LIMIT: 1000, // characters to search for legal keywords
  CONTENT_SELECTORS: ['article', 'main', '[role="main"]', '.content', '#content', '.main-content'] as const
};