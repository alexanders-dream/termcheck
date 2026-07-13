import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppSettings, LegalFlag, AIProvider, AIModel } from '../lib/types';
import { AIService } from '../lib/ai/service';
import { getModelsForProvider, getProviderConfig, fetchModelsForProvider } from '../lib/ai/providers';
import { StorageService } from '../lib/storage';
import { SecureStorage } from '../lib/secureStorage';
import { UI_CONFIG, DEFAULT_SETTINGS } from '../lib/config';
import { extractPdfText } from '../lib/pdfExtractor';
import browser from '../lib/browser';

import { Layout } from './components/Layout';
import { Header } from './components/Header';
import { AnalyzeView } from './components/AnalyzeView';
import { ResultsList } from './components/ResultsList';
import { SettingsView } from './components/SettingsView';
import { ToastProvider, useToast } from './components/ui/Toast';
import { ThemeProvider } from '../lib/theme';

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
  const [currentPageTitle, setCurrentPageTitle] = useState('');
  const [currentPageUrl, setCurrentPageUrl] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const { toast } = useToast();

  // Initialize: load settings and migrate legacy keys
  useEffect(() => {
    (async () => {
      await SecureStorage.migrateLegacySettings();

      const res = await browser.storage.local.get('settings');
      if (res.settings) {
        const migratedSettings = { ...DEFAULT_SETTINGS, ...res.settings };
        try {
          const secureKeys = await SecureStorage.getApiKeys();
          migratedSettings.apiKeys = { ...migratedSettings.apiKeys, ...secureKeys };
        } catch (e) {
          console.warn('[App] Could not restore secure keys', e);
        }
        setSettings(migratedSettings);
        await loadModelsForProvider(migratedSettings.provider, migratedSettings.apiKeys[migratedSettings.provider]);
      } else {
        setView('settings');
        const models = await getModelsForProvider('openai');
        setAvailableModels(models);
      }
      setIsInitializing(false);

      try { await StorageService.cleanupExpiredResults(); } catch { /* ignore */ }
    })();
  }, []);

  // Check for cached results and capture page info
  useEffect(() => {
    const checkCache = async () => {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (tab?.url) {
        const cachedFlags = await StorageService.getAnalysisResult(tab.url);
        if (cachedFlags) { 
          setFlags(cachedFlags); 
        } else {
          const data = await browser.storage.local.get('analyzingUrls');
          const analyzingUrls = data.analyzingUrls || [];
          if (analyzingUrls.includes(tab.url)) {
            setLoading(true);
          }
        }
        setCurrentPageUrl(tab.url);
        setCurrentPageTitle(tab.title || '');
      }
    };
    checkCache();
  }, []);

  useEffect(() => {
    const handleStorageChange = async (changes: any, areaName: string) => {
      if (areaName === 'local' && currentPageUrl) {
        const key = `analysis_cache_${currentPageUrl}`;
        if (changes[key] && changes[key].newValue) {
           setFlags(changes[key].newValue.flags);
           setLoading(false);
        } else if (changes.analyzingUrls) {
           const newUrls = changes.analyzingUrls.newValue || [];
           if (!newUrls.includes(currentPageUrl) && loading) {
             setLoading(false);
           }
        }
      }
    };
    browser.storage.onChanged.addListener(handleStorageChange);
    return () => browser.storage.onChanged.removeListener(handleStorageChange);
  }, [currentPageUrl, loading]);

  const loadModelsForProvider = async (provider: AIProvider, apiKey: string, forceRefresh = false) => {
    setModelsLoading(true);
    try {
      const result = await fetchModelsForProvider(provider, apiKey || '', forceRefresh);
      setAvailableModels(result.models);
      setModelsSource(result.source);

      if (result.models.length > 0) {
        setSettings(prev => {
          const currentModelExists = result.models.some(m => m.id === prev.model);
          if (!currentModelExists) {
            return { ...prev, model: result.models[0].id };
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
      if (forceRefresh) { toast('Failed to refresh models', 'error'); }
    } finally {
      setModelsLoading(false);
    }
  };

  const handleProviderChange = async (provider: AIProvider) => {
    const apiKey = settings.apiKeys[provider];
    const defaultModel = await AIService.getDefaultModel(provider, apiKey);
    setSettings(prev => ({ ...prev, provider, model: defaultModel }));
    setValidationError('');
    setIsDirty(true);
    await loadModelsForProvider(provider, apiKey);
  };

  const handleModelChange = (model: string) => {
    setSettings(prev => ({ ...prev, model }));
    setValidationError('');
    setIsDirty(true);
  };

  const handleApiKeyChange = async (apiKey: string) => {
    setSettings(prev => ({
      ...prev,
      apiKeys: { ...prev.apiKeys, [prev.provider]: apiKey }
    }));
    setValidationError('');
    setIsDirty(true);
    if (apiKey) {
      await loadModelsForProvider(settings.provider, apiKey);
    } else {
      const models = await getModelsForProvider(settings.provider);
      setAvailableModels(models);
      setModelsSource('minimal-fallback');
    }
  };

  const handleNavigateBack = () => {
    if (isDirty) {
      const leave = window.confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!leave) return;
    }
    setView('analyze');
  };

  const saveSettings = async () => {
    const validation = AIService.validateSettings(settings, availableModels);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid settings');
      toast(validation.error || 'Invalid settings', 'error');
      return;
    }

    try {
      await SecureStorage.saveApiKeys(settings.apiKeys);
    } catch (e) {
      console.warn('[App] Failed to secure API keys', e);
    }

    // Strip apiKeys before saving settings to browser.storage.local to keep them in secure storage only
    const settingsToSave = { ...settings };
    delete (settingsToSave as any).apiKeys;

    await browser.storage.local.set({ settings: settingsToSave });
    setValidationError('');
    setIsDirty(false);
    setView('analyze');
    toast('Settings saved successfully', 'success');
  };

  const analyzePage = async () => {
    setLoading(true);
    setFlags([]);

    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      if (!tab?.id) return;

      setCurrentPageUrl(tab.url || '');
      setCurrentPageTitle(tab.title || '');

      let content = '';
      const isPdfUrl = tab.url && (/\.pdf($|[?#])/i).test(tab.url);

      if (isPdfUrl) {
        try {
          const res = await fetch(tab.url!, { credentials: 'same-origin' });
          if (!res.ok) {
            throw new Error(`Failed to fetch PDF (${res.status})`);
          }
          const buffer = await res.arrayBuffer();
          content = await extractPdfText(buffer);
        } catch (pdfError: any) {
          toast(`Failed to load PDF: ${pdfError.message || 'Unknown error'}`, 'error');
          setLoading(false);
          return;
        }
      } else {
        try {
          await browser.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
        } catch (error) {
          console.log('Content script already injected or failed to inject:', error);
        }

        await new Promise(resolve => setTimeout(resolve, UI_CONFIG.CONTENT_SCRIPT_READY_DELAY));

        let contentRes: { success: boolean; content?: string; isLegal?: boolean; error?: string } | undefined;
        let retries = UI_CONFIG.RETRY_COUNT;

        while (retries > 0) {
          try {
            contentRes = await browser.tabs.sendMessage(tab.id, { type: 'GET_PAGE_CONTENT' });
            if (contentRes && contentRes.success) break;

            if (contentRes && !contentRes.success) {
              console.error('Content script error:', contentRes.error);
              if (retries === 1) { throw new Error(contentRes.error || 'Failed to extract page content'); }
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

        content = contentRes.content;
      }

      const validation = AIService.validateSettings(settings, availableModels);
      if (!validation.valid) {
        toast(`Configuration error: ${validation.error}`, 'error');
        setView('settings');
        setLoading(false);
        return;
      }

      const response = (await browser.runtime.sendMessage({
        type: 'ANALYZE_DOCUMENT',
        payload: content
      })) as any;

      if (response.success) {
        setFlags(response.data);
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
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4" role="status" aria-label="Loading"></div>
            <p className="text-ink-secondary">Loading configuration...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header
        providerName={getProviderConfig(settings.provider).displayName}
        modelName={settings.model}
        onSettingsClick={() => setView('settings')}
      />

      <main className="flex-1 p-5 overflow-y-auto scrollbar-thin">
        <AnimatePresence mode="wait">
          {view === 'settings' ? (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <SettingsView
                settings={settings}
                availableModels={availableModels}
                modelsLoading={modelsLoading}
                modelsSource={modelsSource}
                validationError={validationError}
                onBack={handleNavigateBack}
                onSave={saveSettings}
                onProviderChange={handleProviderChange}
                onModelChange={handleModelChange}
                onApiKeyChange={handleApiKeyChange}
                onRefreshModels={() => loadModelsForProvider(settings.provider, settings.apiKeys[settings.provider], true)}
              />
            </motion.div>
          ) : (
            <motion.div
              key="analyze"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {loading ? (
                <AnalyzeView loading={true} onAnalyze={analyzePage} pageUrl={currentPageUrl} pageTitle={currentPageTitle} />
              ) : flags.length > 0 ? (
                <ResultsList flags={flags} onRescan={analyzePage} pageUrl={currentPageUrl} pageTitle={currentPageTitle} />
              ) : (
                <AnalyzeView loading={false} onAnalyze={analyzePage} pageUrl={currentPageUrl} pageTitle={currentPageTitle} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <TermCheckApp />
      </ToastProvider>
    </ThemeProvider>
  );
}
