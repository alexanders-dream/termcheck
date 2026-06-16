import { AIService } from '../lib/ai/service';
import { SYSTEM_PROMPT } from '../lib/prompts';
import { AppSettings, LegalFlag } from '../lib/types';
import { getProviderConfig } from '../lib/ai/providers';
import { SecureStorage } from '../lib/secureStorage';

// Context menu for quick analysis
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'termcheck-analyze',
    title: 'Analyze page with TermCheck',
    contexts: ['page', 'selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'termcheck-analyze' && tab?.id) {
    chrome.action.openPopup();
    // Note: triggering analysis from context menu requires messaging to popup
    // which is limited in Manifest V3; we open the popup for now
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const senderInfo = {
    id: sender.id,
    tabId: sender.tab?.id,
    url: sender.tab?.url,
    title: sender.tab?.title,
    isExtension: sender.id === chrome.runtime.id,
    timestamp: new Date().toISOString()
  };

  if (!senderInfo.isExtension && !senderInfo.url) {
    console.warn('[TermCheck] Rejected message from untrusted source:', senderInfo);
    sendResponse({ success: false, error: 'Unauthorized sender' });
    return false;
  }

  if (message.type === 'ANALYZE_DOCUMENT') {
    handleAnalysis(message.payload, sendResponse, senderInfo);
    return true;
  }

  if (message.type === 'GET_ANALYSIS_STATUS') {
    handleStatusRequest(sendResponse, senderInfo);
    return false;
  }

  console.warn('[TermCheck] Unknown message type:', message.type);
  sendResponse({ success: false, error: 'Unknown message type' });
  return false;
});

async function handleAnalysis(
  text: string,
  sendResponse: (response: any) => void,
  senderInfo: Record<string, any>
) {
  try {
    const storage = await chrome.storage.local.get(['settings']);
    const settings: AppSettings = storage.settings;

    // Restore API keys from secure storage
    try {
      const secureKeys = await SecureStorage.getApiKeys();
      settings.apiKeys = { ...settings.apiKeys, ...secureKeys };
    } catch (e) {
      console.warn('[Background] Could not restore secure keys', e);
    }

    const providerConfig = getProviderConfig(settings.provider);
    if (providerConfig?.requiresApiKey && !settings?.apiKeys?.[settings.provider]) {
      sendResponse({ success: false, error: `API Key missing for ${settings.provider}` });
      return;
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

    await chrome.storage.local.set({ lastAnalysis: analysisResult });

    sendResponse({ success: true, data: flags, metadata: analysisResult.metadata });
  } catch (error) {
    console.error(`[TermCheck] Analysis failed:`, error);
    sendResponse({ success: false, error: (error as Error).message });
  }
}

function handleStatusRequest(sendResponse: (response: any) => void, senderInfo: Record<string, any>) {
  chrome.storage.local.get(['lastAnalysis'], (result) => {
    const lastAnalysis = result.lastAnalysis;
    const status = {
      hasAnalysis: !!lastAnalysis,
      analysisAge: lastAnalysis ? Date.now() - lastAnalysis.timestamp : null,
      flagsCount: lastAnalysis?.flags?.length || 0,
      lastUrl: lastAnalysis?.metadata?.url,
      currentTabUrl: senderInfo.url,
      isSameUrl: lastAnalysis?.metadata?.url === senderInfo.url
    };

    sendResponse({ success: true, status });
  });
  return false;
}
