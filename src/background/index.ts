import { AIService } from '../lib/ai/service';
import { SYSTEM_PROMPT } from '../lib/prompts';
import { AppSettings, LegalFlag } from '../lib/types';
import { getProviderConfig } from '../lib/ai/providers';
import { SecureStorage } from '../lib/secureStorage';
import { StorageService } from '../lib/storage';
import browser from '../lib/browser';

// Context menu for quick analysis
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: 'termcheck-analyze',
    title: 'Analyze page with TermCheck',
    contexts: ['page', 'selection'],
  });
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'termcheck-analyze' && tab?.id) {
    try {
      await browser.action.openPopup();
    } catch (e) {
      console.warn('[TermCheck] Could not open popup from context menu:', e);
    }
  }
});

browser.runtime.onMessage.addListener((message: any, sender: any) => {
  const senderInfo = {
    id: sender.id,
    tabId: sender.tab?.id,
    url: sender.tab?.url,
    title: sender.tab?.title,
    isExtension: sender.id === browser.runtime.id,
    timestamp: new Date().toISOString()
  };

  if (!senderInfo.isExtension && !senderInfo.url) {
    console.warn('[TermCheck] Rejected message from untrusted source:', senderInfo);
    return Promise.resolve({ success: false, error: 'Unauthorized sender' });
  }

  if (message.type === 'ANALYZE_DOCUMENT') {
    return handleAnalysis(message.payload, senderInfo);
  }

  if (message.type === 'GET_ANALYSIS_STATUS') {
    return handleStatusRequest(senderInfo);
  }

  console.warn('[TermCheck] Unknown message type:', message.type);
  return Promise.resolve({ success: false, error: 'Unknown message type' });
});

async function handleAnalysis(
  text: string,
  senderInfo: Record<string, any>
): Promise<any> {
  if (senderInfo.url) {
    const data = await browser.storage.local.get('analyzingUrls');
    const urls = data.analyzingUrls || [];
    if (!urls.includes(senderInfo.url)) {
      await browser.storage.local.set({ analyzingUrls: [...urls, senderInfo.url] });
    }
  }

  try {
    const storage = await browser.storage.local.get(['settings']);
    const settings: AppSettings = (storage as any).settings;

    // Restore API keys from secure storage
    try {
      const secureKeys = await SecureStorage.getApiKeys();
      settings.apiKeys = { ...settings.apiKeys, ...secureKeys };
    } catch (e) {
      console.warn('[Background] Could not restore secure keys', e);
    }

    const providerConfig = getProviderConfig(settings.provider);
    if (providerConfig?.requiresApiKey && !settings?.apiKeys?.[settings.provider]) {
      return { success: false, error: `API Key missing for ${settings.provider}` };
    }

    let flags: LegalFlag[] = [];
    try {
      const aiService = new AIService(settings);
      flags = await aiService.analyzeText(text, SYSTEM_PROMPT);
    } catch (error) {
      console.error(`[TermCheck] AI Service error:`, error);
      throw error;
    }

    const analysisResult = {
      timestamp: Date.now(),
      flags,
      metadata: {
        url: senderInfo.url,
        title: senderInfo.title,
        tabId: senderInfo.tabId,
        provider: settings.provider,
        wordCount: text.split(/\s+/).length
      }
    };

    await browser.storage.local.set({ lastAnalysis: analysisResult });
    if (senderInfo.url) {
      await StorageService.saveAnalysisResult(senderInfo.url, flags);
    }

    return { success: true, data: flags, metadata: analysisResult.metadata };
  } catch (error) {
    console.error(`[TermCheck] Analysis failed:`, error);
    return { success: false, error: (error as Error).message };
  } finally {
    if (senderInfo.url) {
      const data = await browser.storage.local.get('analyzingUrls');
      const urls = data.analyzingUrls || [];
      await browser.storage.local.set({ analyzingUrls: urls.filter((u: string) => u !== senderInfo.url) });
    }
  }
}

async function handleStatusRequest(senderInfo: Record<string, any>): Promise<any> {
  const result = await browser.storage.local.get(['lastAnalysis']);
  const lastAnalysis = (result as any).lastAnalysis;
  const status = {
    hasAnalysis: !!lastAnalysis,
    analysisAge: lastAnalysis ? Date.now() - lastAnalysis.timestamp : null,
    flagsCount: lastAnalysis?.flags?.length || 0,
    lastUrl: lastAnalysis?.metadata?.url,
    currentTabUrl: senderInfo.url,
    isSameUrl: lastAnalysis?.metadata?.url === senderInfo.url
  };

  return { success: true, status };
}
