// Content script configuration (bundled to avoid ES6 module issues in content scripts)
(function () {
  // Prevent multiple injections
  if ((window as any).hasRunTermCheckContentScript) {
    console.log('[TermCheck Content] Content script already loaded');
    return;
  }
  (window as any).hasRunTermCheckContentScript = true;

  const CONTENT_CONFIG = {
    LEGAL_KEYWORDS: ['terms of service', 'privacy policy', 'user agreement', 'terms and conditions', 'contract', 'agreement', 'legal'] as const,
    MAX_CONTENT_LENGTH: 100000, // 100k characters (increased for contracts/PDFs)
    URL_CHECK_INTERVAL: 500, // 500ms
    TEXT_SEARCH_LIMIT: 1500,
    CONTENT_SELECTORS: ['article', 'main', '[role="main"]', '.content', '#content', '.main-content', 'pre', 'embed[type="application/pdf"]'] as const
  };

  function isLegalPage(): boolean {
    if (!document.body) {
      console.warn('[TermCheck Content] Document body not ready');
      return false;
    }

    const text = document.body.innerText.toLowerCase();
    const title = document.title.toLowerCase();
    return CONTENT_CONFIG.LEGAL_KEYWORDS.some(kw => title.includes(kw) || text.slice(0, CONTENT_CONFIG.TEXT_SEARCH_LIMIT).includes(kw));
  }

  // Non-destructive DOM clone for content extraction
  function cloneBody(): HTMLElement {
    const clone = document.body.cloneNode(true) as HTMLElement;
    const elementsToRemove = clone.querySelectorAll('script, style, noscript, iframe, object, embed, nav, footer, header, aside, .advertisement, .ads');
    elementsToRemove.forEach(el => el.remove());
    return clone;
  }

  function extractPageContent(): string {
    try {
      const contentSelectors = CONTENT_CONFIG.CONTENT_SELECTORS;
      let content = '';

      // For PDF pages, try to extract text from embed/object
      const pdfEmbed = document.querySelector('embed[type="application/pdf"]') as HTMLEmbedElement;
      if (pdfEmbed) {
        // Note: actual PDF text extraction requires PDF.js or server-side processing
        // We signal that this is a PDF page but can't extract text client-side securely
        console.log('[TermCheck Content] PDF detected, extracting available text');
      }

      // Use cloned body to avoid DOM mutation
      const clonedBody = cloneBody();

      for (const selector of contentSelectors) {
        const element = clonedBody.querySelector(selector) as HTMLElement;
        if (element) {
          content = element.innerText;
          break;
        }
      }

      if (!content) {
        content = clonedBody.innerText;
      }

      content = content
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();

      if (content.length > CONTENT_CONFIG.MAX_CONTENT_LENGTH) {
        console.warn(`[TermCheck Content] Content truncated from ${content.length} to ${CONTENT_CONFIG.MAX_CONTENT_LENGTH} characters`);
        content = content.substring(0, CONTENT_CONFIG.MAX_CONTENT_LENGTH) + '... [truncated]';
      }

      return content;
    } catch (error) {
      console.error('[TermCheck Content] Content extraction failed:', error);
      return document.body?.innerText || '';
    }
  }

  // Enhanced message handler with sender validation and security checks
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    const isValidSender = sender.id === chrome.runtime.id;
    const senderInfo = {
      id: sender.id,
      tabId: sender.tab?.id,
      url: sender.url,
      isExtension: isValidSender,
      timestamp: new Date().toISOString()
    };

    if (!isValidSender) {
      console.warn('[TermCheck Content] Rejected message from unauthorized sender:', senderInfo);
      sendResponse({
        success: false,
        error: 'Unauthorized: Message must come from TermCheck extension',
        securityAlert: true
      });
      return false;
    }

    if (msg.type === 'GET_PAGE_CONTENT') {
      if (document.readyState !== 'complete') {
        const processContentExtraction = () => {
          try {
            const isLegal = isLegalPage();
            const content = extractPageContent();
            const pageInfo = {
              url: window.location.href,
              title: document.title,
              isLegal,
              contentLength: content.length,
              wordCount: content.split(/\s+/).length,
              lastModified: document.lastModified,
              extractionTimestamp: Date.now(),
              documentReady: document.readyState
            };

            sendResponse({
              success: true,
              isLegal,
              content,
              pageInfo,
              senderValidation: { validated: true, senderId: sender.id, timestamp: senderInfo.timestamp }
            });
          } catch (error) {
            sendResponse({
              success: false,
              error: 'Failed to extract page content',
              details: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        };

        const waitForReady = () => {
          if (document.readyState === 'complete') {
            processContentExtraction();
          } else {
            setTimeout(waitForReady, 100);
          }
        };

        waitForReady();
        return true;
      }

      try {
        const isLegal = isLegalPage();
        const content = extractPageContent();
        const pageInfo = {
          url: window.location.href,
          title: document.title,
          isLegal,
          contentLength: content.length,
          wordCount: content.split(/\s+/).length,
          lastModified: document.lastModified,
          extractionTimestamp: Date.now(),
          documentReady: document.readyState
        };

        sendResponse({
          success: true,
          isLegal,
          content,
          pageInfo,
          senderValidation: { validated: true, senderId: sender.id, timestamp: senderInfo.timestamp }
        });
      } catch (error) {
        sendResponse({
          success: false,
          error: 'Failed to extract page content',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      return false;
    }

    if (msg.type === 'GET_PAGE_METADATA') {
      const metadata = {
        url: window.location.href,
        title: document.title,
        isLegal: isLegalPage(),
        domain: window.location.hostname,
        protocol: window.location.protocol,
        pathname: window.location.pathname,
        searchParams: window.location.search,
        lastModified: document.lastModified,
        documentReady: document.readyState,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      };

      sendResponse({ success: true, metadata });
      return false;
    }

    sendResponse({
      success: false,
      error: `Unknown message type: ${msg.type}`,
      supportedTypes: ['GET_PAGE_CONTENT', 'GET_PAGE_METADATA']
    });
    return false;
  });

  // Improved URL monitoring: capture oldUrl BEFORE updating lastUrl
  let lastUrl = window.location.href;
  let urlCheckInterval: number;

  function startUrlMonitoring() {
    urlCheckInterval = window.setInterval(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        const oldUrl = lastUrl;
        lastUrl = currentUrl;
        console.log(`[TermCheck Content] URL changed: ${oldUrl} -> ${currentUrl}`);

        chrome.runtime.sendMessage({
          type: 'URL_CHANGED',
          oldUrl: oldUrl,
          newUrl: currentUrl,
          timestamp: Date.now()
        }).catch(error => {
          console.warn('[TermCheck Content] Failed to notify extension of URL change:', error);
        });
      }
    }, CONTENT_CONFIG.URL_CHECK_INTERVAL);
  }

  startUrlMonitoring();

  window.addEventListener("beforeunload", () => {
    if (urlCheckInterval) {
      clearInterval(urlCheckInterval);
    }
  });

  // Signal ready state
  if (document.readyState === 'complete') {
    console.log('[TermCheck Content] Content script loaded and ready');
  } else {
    console.log('[TermCheck Content] Content script loaded, waiting for document...');
    window.addEventListener('load', () => {
      console.log('[TermCheck Content] Content script ready after page load');
    });
  }
})();
