import { AppSettings, AIProvider, AIModel } from '../../lib/types';
import { PROVIDER_CONFIGS, getProviderConfig } from '../../lib/ai/providers';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { ArrowLeft, Save, Key, Cpu, Box, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

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
        <div className="space-y-4 pb-4">
            <div className="flex items-center gap-2 mb-2">
                <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 text-slate-500">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                </Button>
                <h2 className="text-lg font-semibold text-slate-900">Configuration</h2>
            </div>

            {validationError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                    <div className="mt-0.5">⚠️</div>
                    <p>{validationError}</p>
                </div>
            )}

            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Box className="h-4 w-4 text-blue-600" />
                        AI Provider
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <select
                            value={settings.provider}
                            onChange={(e) => onProviderChange(e.target.value as AIProvider)}
                            className="w-full p-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        >
                            {Object.entries(PROVIDER_CONFIGS).map(([key, config]) => (
                                <option key={key} value={key}>{config.displayName}</option>
                            ))}
                        </select>
                        <div className="mt-2 text-right">
                            <a
                                href={getProviderConfig(settings.provider).apiKeyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
                            >
                                Get API Key <span aria-hidden="true">→</span>
                            </a>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Key className="h-4 w-4 text-blue-600" />
                        API Key
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <input
                            type="password"
                            value={settings.apiKeys[settings.provider]}
                            onChange={(e) => onApiKeyChange(e.target.value)}
                            className="w-full p-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                            placeholder={`Enter ${getProviderConfig(settings.provider).displayName} API Key`}
                        />
                        <p className="text-xs text-slate-500">
                            Stored locally on your device. Never shared.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-blue-600" />
                        Model Selection
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <select
                                value={settings.model}
                                onChange={(e) => onModelChange(e.target.value)}
                                className="flex-1 min-w-0 p-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-400"
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
                            </select>
                            <Button
                                variant="outline"
                                onClick={onRefreshModels}
                                disabled={modelsLoading}
                                className="px-3 aspect-square"
                                title="Refresh models"
                            >
                                <RefreshCw className={cn("h-4 w-4", modelsLoading && "animate-spin")} />
                            </Button>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                            {modelsSource === 'api' && (
                                <span className="text-green-600 font-medium flex items-center gap-1">
                                    ✓ Live API List
                                </span>
                            )}
                            {modelsSource === 'cache' && (
                                <span className="text-blue-600 font-medium flex items-center gap-1">
                                    📦 Cached List
                                </span>
                            )}
                            {modelsSource === 'minimal-fallback' && (
                                <span className="text-amber-600 font-medium flex items-center gap-1">
                                    ⚠️ Basic List (Add API Key for more)
                                </span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Button
                onClick={onSave}
                className="w-full mt-4"
                size="lg"
            >
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
            </Button>
        </div>
    );
};
