import { AppSettings, AIProvider, AIModel } from '../../lib/types';
import { PROVIDER_CONFIGS, getProviderConfig } from '../../lib/ai/providers';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { cn } from '../../lib/utils';
import { ArrowLeft, Save, Key, Cpu, Box, RefreshCw, AlertCircle } from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  availableModels: AIModel[];
  modelsLoading: boolean;
  modelsSource: 'api' | 'cache' | 'minimal-fallback';
  validationError: string;
  onBack: () => void;
  onSave: () => void;
  onProviderChange: (provider: AIProvider) => void;
  onModelChange: (model: string) => void;
  onApiKeyChange: (apiKey: string) => void;
  onRefreshModels: () => void;
}

export const SettingsView = ({
  settings,
  availableModels,
  modelsLoading,
  modelsSource,
  validationError,
  onBack,
  onSave,
  onProviderChange,
  onModelChange,
  onApiKeyChange,
  onRefreshModels,
}: SettingsViewProps) => {
  return (
    <div className="space-y-5 pb-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-ink-muted hover:text-ink-primary">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <h2 className="text-lg font-bold text-ink-primary tracking-tight">Configuration</h2>
      </div>

      {validationError && (
        <div className="bg-severity-critical/10 border border-severity-critical/20 text-severity-critical px-4 py-3 rounded-xl text-sm flex items-start gap-2.5">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p>{validationError}</p>
        </div>
      )}

      <section className="space-y-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-ink-secondary">
              <Box className="h-4 w-4 text-brand-400" />
              AI Provider
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="provider-select" className="sr-only">Select AI Provider</label>
              <Select
                id="provider-select"
                value={settings.provider}
                onChange={(e) => onProviderChange(e.target.value as AIProvider)}
              >
                {Object.entries(PROVIDER_CONFIGS).map(([key, config]) => (
                  <option key={key} value={key}>{config.displayName}</option>
                ))}
              </Select>
              <div className="mt-2 text-right">
                <a
                  href={getProviderConfig(settings.provider).apiKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors inline-flex items-center gap-1"
                >
                  Get API Key <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-ink-secondary">
              <Key className="h-4 w-4 text-brand-400" />
              API Key
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label htmlFor="api-key" className="sr-only">Enter API Key</label>
              <Input
                id="api-key"
                type="password"
                value={settings.apiKeys[settings.provider]}
                onChange={(e) => onApiKeyChange(e.target.value)}
                placeholder={`Enter ${getProviderConfig(settings.provider).displayName} API Key`}
              />
              <p className="text-xs text-ink-muted">
                Stored locally on your device. Never shared or transmitted beyond API calls.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-ink-secondary">
              <Cpu className="h-4 w-4 text-brand-400" />
              Model Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-2">
                <label htmlFor="model-select" className="sr-only">Select Model</label>
                <Select
                  id="model-select"
                  value={settings.model}
                  onChange={(e) => onModelChange(e.target.value)}
                  disabled={modelsLoading}
                >
                  {modelsLoading ? (
                    <option value="">Loading models...</option>
                  ) : (
                    availableModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))
                  )}
                </Select>
                <Button
                  variant="outline"
                  onClick={onRefreshModels}
                  disabled={modelsLoading}
                  className="px-3 aspect-square rounded-lg"
                  title="Refresh models"
                >
                  <RefreshCw className={cn("h-4 w-4", modelsLoading && "animate-spin")} />
                </Button>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {modelsSource === 'api' && (
                  <span className="text-green-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Live API List
                  </span>
                )}
                {modelsSource === 'cache' && (
                  <span className="text-brand-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                    Cached List
                  </span>
                )}
                {modelsSource === 'minimal-fallback' && (
                  <span className="text-severity-medium font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-severity-medium" />
                    Basic List (Add API Key for more)
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <Button
        onClick={onSave}
        className="w-full mt-2"
        size="lg"
        leftIcon={<Save className="h-4 w-4" />}
      >
        Save Configuration
      </Button>
    </div>
  );
};
