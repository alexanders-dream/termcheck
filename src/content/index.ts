// Content script configuration (bundled to avoid ES6 module issues in content scripts)
(function () {
  // Prevent multiple injections
  if ((window as any).hasRunTermCheckContentScript) {
    console.log('[TermCheck Content] Content script already loaded');
    return;
  }
  (window as any).hasRunTermCheckContentScript = true;

  const CONTENT_CONFIG = {
    LEGAL_KEYWORDS: ['terms of service', 'privacy policy', 'user agreement', 'terms and conditions'] as const,
    MAX_CONTENT_LENGTH: 50000, // 50k characters
    URL_CHECK_INTERVAL: 1000, // 1 second
    TEXT_SEARCH_LIMIT: 1000, // characters to search for legal keywords
    CONTENT_SELECTORS: ['article', 'main', '[role="main"]', '.content', '#content', '.main-content'] as const
  };

  function isLegalPage(): boolean {
    // Ensure document is ready and body exists
    if (!document.body) {
      console.warn('[TermCheck Content] Document body not ready');
      return false;
    }

    const text = document.body.innerText.toLowerCase();
    const title = document.title.toLowerCase();
    return CONTENT_CONFIG.LEGAL_KEYWORDS.some(kw => title.includes(kw) || text.slice(0, CONTENT_CONFIG.TEXT_SEARCH_LIMIT).includes(kw));
  }

  // Enhanced message handler with sender validation and security checks
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    // Security: Validate sender is our extension
    const isValidSender = sender.id === chrome.runtime.id;
    const senderInfo = {
      id: sender.id,
      tabId: sender.tab?.id,
      url: sender.url,
      isExtension: isValidSender,
      timestamp: new Date().toISOString()
    };

    // Log for debugging and security monitoring
    console.log(`[TermCheck Content] Message received:`, {
      type: msg.type,
      sender: senderInfo,
      currentUrl: window.location.href
    });

    // Security: Reject messages from unauthorized sources
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
      // Wait for document to be ready
      if (document.readyState !== 'complete') {
        console.log('[TermCheck Content] Document not ready, waiting...');

        // Wait for document to be ready
        const waitForReady = () => {
          if (document.readyState === 'complete') {
            processContentExtraction();
          } else {
            setTimeout(waitForReady, 100);
          }
        };

        const processContentExtraction = () => {
          try {
            const isLegal = isLegalPage();

            // Enhanced content extraction with validation
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

            console.log(`[TermCheck Content] Page analysis complete:`, pageInfo);

            sendResponse({
              success: true,
              isLegal,
              content,
              pageInfo,
              senderValidation: {
                validated: true,
                senderId: sender.id,
                timestamp: senderInfo.timestamp
              }
            });
          } catch (error) {
            console.error('[TermCheck Content] Error extracting page content:', error);
            sendResponse({
              success: false,
              error: 'Failed to extract page content',
              details: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        };

        waitForReady();
        return true; // Asynchronous response
      }

      // Document is ready, process immediately
      try {
        const isLegal = isLegalPage();

        // Enhanced content extraction with validation
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

        console.log(`[TermCheck Content] Page analysis complete:`, pageInfo);

        sendResponse({
          success: true,
          isLegal,
          content,
          pageInfo,
          senderValidation: {
            validated: true,
            senderId: sender.id,
            timestamp: senderInfo.timestamp
          }
        });
      } catch (error) {
        console.error('[TermCheck Content] Error extracting page content:', error);
        sendResponse({
          success: false,
          error: 'Failed to extract page content',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      return false; // Synchronous response
    }

    if (msg.type === 'GET_PAGE_METADATA') {
      // Provide enhanced metadata about the current page
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
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      };

      console.log(`[TermCheck Content] Metadata request from extension:`, metadata);
      sendResponse({ success: true, metadata });
      return false;
    }

    console.warn('[TermCheck Content] Unknown message type:', msg.type);
    sendResponse({
      success: false,
      error: `Unknown message type: ${msg.type}`,
      supportedTypes: ['GET_PAGE_CONTENT', 'GET_PAGE_METADATA']
    });
    return false;
  });

  /**
   * Enhanced content extraction with better filtering and validation
   */
  function extractPageContent(): string {
    try {
      // Remove script and style elements
      const elementsToRemove = document.querySelectorAll('script, style, noscript, iframe, object, embed');
      elementsToRemove.forEach(el => el.remove());

      // Get main content areas first (article, main, content divs)
      let content = '';

      for (const selector of CONTENT_CONFIG.CONTENT_SELECTORS) {
        const element = document.querySelector(selector) as HTMLElement;
        if (element) {
          content = element.innerText;
          break;
        }
      }

      // Fallback to body content if no main content found
      if (!content) {
        content = document.body.innerText;
      }

      // Clean up the content
      content = content
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/\n\s*\n/g, '\n\n') // Normalize line breaks
        .trim();

      // Limit content length to prevent memory issues
      if (content.length > CONTENT_CONFIG.MAX_CONTENT_LENGTH) {
        console.warn(`[TermCheck Content] Content truncated from ${content.length} to ${CONTENT_CONFIG.MAX_CONTENT_LENGTH} characters`);
        content = content.substring(0, CONTENT_CONFIG.MAX_CONTENT_LENGTH) + '... [truncated]';
      }

      return content;
    } catch (error) {
      console.error('[TermCheck Content] Content extraction failed:', error);
      // Fallback to basic body text
      return document.body?.innerText || '';
    }
  }

  /**
   * Monitor for page changes and notify extension
   */
  let lastUrl = window.location.href;
  let urlCheckInterval: number;

  function startUrlMonitoring() {
    urlCheckInterval = window.setInterval(() => {
      if (window.location.href !== lastUrl) {
        console.log(`[TermCheck Content] URL changed: ${lastUrl} -> ${window.location.href}`);
        lastUrl = window.location.href;

        // Notify extension about URL change
        chrome.runtime.sendMessage({
          type: 'URL_CHANGED',
          oldUrl: lastUrl,
          newUrl: window.location.href,
          timestamp: Date.now()
        }).catch(error => {
          console.warn('[TermCheck Content] Failed to notify extension of URL change:', error);
        });
      }
    }, CONTENT_CONFIG.URL_CHECK_INTERVAL);
  }

  // Start monitoring when content script loads
  startUrlMonitoring();

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    if (urlCheckInterval) {
      clearInterval(urlCheckInterval);
    }
  });

  // Signal that content script is ready
  if (document.readyState === 'complete') {
    console.log('[TermCheck Content] Content script loaded and ready');
  } else {
    console.log('[TermCheck Content] Content script loaded, waiting for document...');
    window.addEventListener('load', () => {
      console.log('[TermCheck Content] Content script ready after page load');
    });
  }
})();