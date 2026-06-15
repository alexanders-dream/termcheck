export type Severity = 'Low' | 'Medium' | 'High' | 'Critical';

export interface LegalFlag {
  category: string;
  summary: string;
  severity: Severity;
  quote: string;
}

export interface AnalysisResult {
  flags: LegalFlag[];
  overallRisk: Severity;
}

export type AIProvider = 'openai' | 'anthropic' | 'groq' | 'gemini' | 'openrouter' | 'ollama';

export interface AppSettings {
  provider: AIProvider;
  apiKeys: Record<AIProvider, string>;
  model: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow: number;
  maxOutputTokens: number;
  supported: boolean;
  pricing?: {
    input: number; // price per 1M input tokens
    output: number; // price per 1M output tokens
  };
}

export interface ProviderConfig {
  name: string;
  displayName: string;
  baseUrl: string;
  models: AIModel[];
  requiresApiKey: boolean;
  apiKeyUrl: string;
}

export interface PageContent {
  success: boolean;
  isLegal: boolean;
  content: string;
  pageInfo: PageMetadata;
}

export interface PageMetadata {
  url: string;
  title: string;
  isLegal: boolean;
  domain: string;
  protocol: string;
  pathname: string;
  contentLength: number;
  wordCount: number;
  lastModified: string;
  extractionTimestamp: number;
  documentReady: string;
}
