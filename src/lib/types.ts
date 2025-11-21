export type Severity = 'Low' | 'Medium' | 'High';

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

export type AIProvider = 'openai' | 'anthropic' | 'groq' | 'gemini' | 'moonshot' | 'openrouter';

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