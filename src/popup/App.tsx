import { useState, useEffect } from 'react';
import { AppSettings, LegalFlag, AIProvider, AIModel } from '../lib/types';
import { AIService } from '../lib/ai/service';
import { getModelsForProvider, getProviderConfig, fetchModelsForProvider } from '../lib/ai/providers';
import { StorageService } from '../lib/storage';
import { UI_CONFIG, DEFAULT_SETTINGS } from '../lib/config';

// Components
import { Layout } from './components/Layout';
import { Header } from './components/Header';
import { AnalyzeView } from './components/AnalyzeView';
import { SettingsView } from './components/SettingsView';
import { ToastProvider, useToast } from './components/ui/Toast';

function TermCheckApp() {
  const [view, setView] = useState<'analyze' | 'settings'>('analyze');
  const [loading, setLoading] = useState(false);
  const [flags, setFlags] = useState<LegalFlag[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [validationError, setValidationError] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [availableModels, setAvailableModels] = useState<AIModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsSource, setModelsSource] = useState<'api' | 'cache' | 'minimal-fallback'>('minimal-fallback');

  const { toast } = useToast();

  useEffect(() => {
    // Load settings on mount
    chrome.storage.local.get(['settings'], async (res) => {
      if (res.settings) {
        let migratedSettings = res.settings;

        // Migration: Convert old apiKey to new apiKeys structure
        if ('apiKey' in res.settings && !('apiKeys' in res.settings)) {
          console.log('[Migration] Converting old apiKey to new apiKeys structure');
          migratedSettings = {
            ...res.settings,
            apiKeys: {
              openai: '',
              anthropic: '',
              groq: '',
              gemini: '',
              moonshot: '',
              openrouter: '',
              [res.settings.provider]: res.settings.apiKey || ''
            }
          };
          delete (migratedSettings as any).apiKey;
          // Save migrated settings
          chrome.storage.local.set({ settings: migratedSettings });
        }

        setSettings(migratedSettings);
        // Load models for the saved provider
        await loadModelsForProvider(migratedSettings.provider, migratedSettings.apiKeys[migratedSettings.provider]);
      } else {
        setView('settings');
        // Load default models for OpenAI
        const models = await getModelsForProvider('openai');
        setAvailableModels(models);
      }
      setIsInitializing(false);
    });

    // Cleanup expired results on startup
    StorageService.cleanupExpiredResults();
  }, []);

  // Check for cached results when the popup opens
  useEffect(() => {
    const checkCache = async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        const cachedFlags = await StorageService.getAnalysisResult(tab.url);
        if (cachedFlags) {
          setFlags(cachedFlags);
        }
      }
    };
    checkCache();
  }, []);

  const loadModelsForProvider = async (provider: AIProvider, apiKey: string, forceRefresh = false) => {
    setModelsLoading(true);
    try {
      const result = await fetchModelsForProvider(provider, apiKey || '', forceRefresh);
      setAvailableModels(result.models);
      setModelsSource(result.source);

      // If current model is not in the new list, switch to the first available one
      if (result.models.length > 0) {
        setSettings(prev => {
          const currentModelExists = result.models.some(m => m.id === prev.model);
          if (!currentModelExists) {
            console.log(`[App] Current model ${prev.model} not found in new list, switching to ${result.models[0].id}`);
            return {
              ...prev,
              model: result.models[0].id
            };
          }
          return prev;
        });
      }

      if (forceRefresh && result.source === 'api') {
        toast('Models refreshed successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      const models = await getModelsForProvider(provider);
      setAvailableModels(models);
      setModelsSource('minimal-fallback');
      if (forceRefresh) {
        toast('Failed to refresh models', 'error');
      }
    } finally {
      setModelsLoading(false);
    }
  };

  const handleProviderChange = async (provider: AIProvider) => {
    const apiKey = settings.apiKeys[provider];
    const defaultModel = await AIService.getDefaultModel(provider, apiKey);
    setSettings(prev => ({
      ...prev,
      provider,
      model: defaultModel
    }));
    setValidationError('');
    await loadModelsForProvider(provider, apiKey);
  };

  const handleModelChange = (model: string) => {
    setSettings(prev => ({ ...prev, model }));
    setValidationError('');
  };

  const handleApiKeyChange = async (apiKey: string) => {
    setSettings(prev => ({
      ...prev,
      apiKeys: {
        ...prev.apiKeys,
        [prev.provider]: apiKey
      }
    }));
    setValidationError('');
    if (apiKey) {
      await loadModelsForProvider(settings.provider, apiKey);
    } else {
      const models = await getModelsForProvider(settings.provider);
      setAvailableModels(models);
      setModelsSource('minimal-fallback');
    }
  };

  const saveSettings = () => {
    const validation = AIService.validateSettings(settings, availableModels);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid settings');
      toast(validation.error || 'Invalid settings', 'error');
      return;
    }

    chrome.storage.local.set({ settings }, () => {
      setValidationError('');
      setView('analyze');
      toast('Settings saved successfully', 'success');
    });
  };

  const analyzePage = async () => {
    setLoading(true);
    setFlags([]);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) return;

      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });
      } catch (error) {
        console.log('Content script already injected or failed to inject:', error);
      }

      await new Promise(resolve => setTimeout(resolve, UI_CONFIG.CONTENT_SCRIPT_READY_DELAY));

      let contentRes;
      let retries = UI_CONFIG.RETRY_COUNT;

      while (retries > 0) {
        try {
          contentRes = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_CONTENT' });
          if (contentRes && contentRes.success) break;

          if (contentRes && !contentRes.success) {
            console.error('Content script error:', contentRes.error);
            if (retries === 1) {
              throw new Error(contentRes.error || 'Failed to extract page content');
            }
          }

          if (!contentRes || !contentRes.content) {
            if (retries === 1) {
              throw new Error("Could not get page content. The page may not be fully loaded or the extension may not have proper permissions.");
            }
          }
        } catch (error) {
          console.log(`Retry ${UI_CONFIG.RETRY_COUNT - retries + 1} failed:`, error);
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, UI_CONFIG.RETRY_DELAY));
          } else {
            throw error;
          }
        }
      }

      if (!contentRes || !contentRes.content) {
        throw new Error("Could not get page content. The page may not be fully loaded or the extension may not have proper permissions.");
      }

      const validation = AIService.validateSettings(settings, availableModels);
      if (!validation.valid) {
        toast(`Configuration error: ${validation.error}`, 'error');
        setView('settings');
        setLoading(false);
        return;
      }

      const response = await chrome.runtime.sendMessage({
        type: 'ANALYZE_DOCUMENT',
        payload: contentRes.content
      });

      if (response.success) {
        setFlags(response.data);
        // Cache the results
        if (tab.url) {
          await StorageService.saveAnalysisResult(tab.url, response.data);
        }
        toast(`Analysis complete. Found ${response.data.length} items.`, 'success');
      } else {
        toast('Analysis failed: ' + response.error, 'error');
      }
    } catch (err) {
      console.error('Analysis error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';

      if (errorMessage.includes('Could not establish connection')) {
        toast('Unable to connect to the page. Try refreshing.', 'error');
      } else {
        toast(`Analysis failed: ${errorMessage}`, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className={`w-[${UI_CONFIG.EXTENSION_WIDTH}px] min-h-[${UI_CONFIG.EXTENSION_MIN_HEIGHT}px] bg-slate-50 p-4 flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <Header
        providerName={getProviderConfig(settings.provider).displayName}
        modelName={settings.model}
        onSettingsClick={() => setView('settings')}
      />

      <main className="flex-1 p-4 overflow-y-auto scrollbar-thin">
        {view === 'settings' ? (
          <SettingsView
            settings={settings}
            availableModels={availableModels}
            modelsLoading={modelsLoading}
            modelsSource={modelsSource}
            validationError={validationError}
            onBack={() => setView('analyze')}
            onSave={saveSettings}
            onProviderChange={handleProviderChange}
            onModelChange={handleModelChange}
            onApiKeyChange={handleApiKeyChange}
            onRefreshModels={() => loadModelsForProvider(settings.provider, settings.apiKeys[settings.provider], true)}
          />
        ) : (
          <AnalyzeView
            loading={loading}
            flags={flags}
            onAnalyze={analyzePage}
          />
        )}
      </main>
    </Layout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <TermCheckApp />
    </ToastProvider>
  );
}