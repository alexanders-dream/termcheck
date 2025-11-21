import { AIService } from '../lib/ai/service';
import { SYSTEM_PROMPT } from '../lib/prompts';
import { AppSettings, LegalFlag } from '../lib/types';
import { getProviderConfig } from '../lib/ai/providers';

// Enhanced security and debugging with sender information
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Security: Validate message origin and sender context
  const senderInfo = {
    id: sender.id,
    tabId: sender.tab?.id,
    url: sender.tab?.url,
    title: sender.tab?.title,
    isExtension: sender.id === chrome.runtime.id,
    timestamp: new Date().toISOString()
  };

  // Log for debugging and security monitoring
  console.log(`[TermCheck] Message received from:`, {
    ...senderInfo,
    messageType: message.type,
    hasPayload: !!message.payload
  });

  // Security validation: Only accept messages from our extension or trusted sources
  if (!senderInfo.isExtension && !senderInfo.url) {
    console.warn('[TermCheck] Rejected message from untrusted source:', senderInfo);
    sendResponse({ success: false, error: 'Unauthorized sender' });
    return false;
  }

  if (message.type === 'ANALYZE_DOCUMENT') {
    handleAnalysis(message.payload, sendResponse, senderInfo);
    return true; // Keep channel open for async response
  }

  // Handle other message types with sender context
  if (message.type === 'GET_ANALYSIS_STATUS') {
    handleStatusRequest(sendResponse, senderInfo);
    return false; // Synchronous response
  }

  console.warn('[TermCheck] Unknown message type:', message.type);
  sendResponse({ success: false, error: 'Unknown message type' });
  return false;
});

async function handleAnalysis(
  text: string,
  sendResponse: (response: any) => void,
  senderInfo: any
) {
  try {
    console.log(`[TermCheck] Starting analysis for tab: ${senderInfo.tabId} (${senderInfo.title})`);

    // 1. Get Settings
    const storage = await chrome.storage.local.get(['settings']);
    const settings: AppSettings = storage.settings;

    const providerConfig = getProviderConfig(settings.provider);
    if (providerConfig?.requiresApiKey && !settings?.apiKeys?.[settings.provider]) {
      console.error(`[TermCheck] API Key missing for provider ${settings.provider}`);
      sendResponse({ success: false, error: `API Key missing for ${settings.provider}` });
      return;
    }

    // 2. Route to Provider using AIService
    let flags: LegalFlag[] = [];
    try {
      const aiService = new AIService(settings);
      console.log(`[TermCheck] Analyzing with ${settings.provider} for: ${senderInfo.url}`);
      flags = await aiService.analyzeText(text, SYSTEM_PROMPT);
    } catch (error) {
      console.error(`[TermCheck] AI Service error:`, error);
      throw error;
    }

    // 3. Cache results with enhanced metadata
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

    await chrome.storage.local.set({
      lastAnalysis: analysisResult
    });

    console.log(`[TermCheck] Analysis complete for: ${senderInfo.title} - Found ${flags.length} flags`);
    sendResponse({ success: true, data: flags, metadata: analysisResult.metadata });
  } catch (error) {
    console.error(`[TermCheck] Analysis failed for ${senderInfo.title}:`, error);
    sendResponse({ success: false, error: (error as Error).message });
  }
}

function handleStatusRequest(sendResponse: (response: any) => void, senderInfo: any) {
  // Provide analysis status for the requesting tab
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

    console.log(`[TermCheck] Status request from tab ${senderInfo.tabId}:`, status);
    sendResponse({ success: true, status });
  });
  return false;
}