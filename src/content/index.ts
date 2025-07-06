import { BaseDOMExtractor } from './extractors/base-extractor.js';
import { ChatGPTExtractor } from './extractors/chatgpt-extractor.js';
import { TwitterExtractor } from './extractors/twitter-extractor.js';
import { ScrollProfiler } from './profilers/scroll-profiler.js';
import { Platform, ExtensionMessage, MessageType } from '../types/index.js';

class RealityCheckContentScript {
  private extractor: BaseDOMExtractor | null = null;
  private scrollProfiler: ScrollProfiler;
  private platform: Platform;
  private isActive: boolean = false;
  private processingInterval: number | null = null;
  private cleanupInterval: number | null = null;

  constructor() {
    this.platform = this.detectPlatform();
    this.scrollProfiler = new ScrollProfiler();
    this.initializeExtractor();
  }

  /**
   * Initialize the content script
   */
  public async initialize(): Promise<void> {
    try {
      console.log(`[Reality Check] Initializing for platform: ${this.platform}`);
      
      // Check if platform is supported
      if (this.platform === Platform.UNKNOWN) {
        console.log('[Reality Check] Platform not supported, exiting');
        return;
      }

      // Start monitoring components
      this.startMonitoring();
      
      // Set up message processing
      this.setupMessageProcessing();
      
      // Set up cleanup
      this.setupCleanup();
      
      console.log('[Reality Check] Content script initialized successfully');
    } catch (error) {
      console.error('[Reality Check] Failed to initialize content script:', error);
    }
  }

  /**
   * Start monitoring DOM and scroll behavior
   */
  private startMonitoring(): void {
    if (this.isActive) return;

    this.isActive = true;
    
    // Start DOM extraction
    if (this.extractor) {
      this.extractor.start();
    }
    
    // Start scroll profiling
    this.scrollProfiler.start();
    
    // Send session started message
    this.sendMessage({
      type: MessageType.SESSION_STARTED,
      data: {
        platform: this.platform,
        url: window.location.href,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Stop monitoring
   */
  private stopMonitoring(): void {
    if (!this.isActive) return;

    this.isActive = false;
    
    // Stop DOM extraction
    if (this.extractor) {
      this.extractor.stop();
    }
    
    // Stop scroll profiling
    this.scrollProfiler.stop();
    
    // Clear intervals
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    // Send session ended message
    this.sendMessage({
      type: MessageType.SESSION_ENDED,
      data: {
        platform: this.platform,
        url: window.location.href,
        timestamp: Date.now()
      }
    });
  }

  /**
   * Set up regular message processing
   */
  private setupMessageProcessing(): void {
    // Process content every 2 seconds
    this.processingInterval = window.setInterval(() => {
      this.processContent();
    }, 2000);
  }

  /**
   * Set up cleanup intervals
   */
  private setupCleanup(): void {
    // Cleanup every 5 minutes
    this.cleanupInterval = window.setInterval(() => {
      this.cleanup();
    }, 300000);
  }

  /**
   * Process extracted content and scroll metrics
   */
  private processContent(): void {
    if (!this.isActive || !this.extractor) return;

    try {
      // Get new content
      const newContent = this.extractor.getNewContent();
      
      // Get scroll metrics
      const scrollState = this.scrollProfiler.getCurrentState();
      const recentScrollMetrics = this.scrollProfiler.getRecentMetrics();
      
      // Send content for analysis if available
      if (newContent.length > 0) {
        this.sendMessage({
          type: MessageType.CONTENT_EXTRACTED,
          data: {
            content: newContent,
            scrollState,
            scrollMetrics: recentScrollMetrics,
            platform: this.platform,
            timestamp: Date.now()
          }
        });
      }
      
      // Check for rage scrolling
      if (this.scrollProfiler.isRageScrolling()) {
        const intensity = this.scrollProfiler.getRageScrollIntensity();
        
        this.sendMessage({
          type: MessageType.VI_UPDATED,
          data: {
            rageScrolling: true,
            intensity,
            scrollState,
            timestamp: Date.now()
          }
        });
      }
      
    } catch (error) {
      console.error('[Reality Check] Error processing content:', error);
    }
  }

  /**
   * Cleanup old data
   */
  private cleanup(): void {
    try {
      if (this.extractor) {
        this.extractor.clearOldContent();
      }
      
      this.scrollProfiler.clearOldHistory();
      
      console.log('[Reality Check] Cleanup completed');
    } catch (error) {
      console.error('[Reality Check] Error during cleanup:', error);
    }
  }

  /**
   * Send message to background script
   */
  private sendMessage(message: Omit<ExtensionMessage, 'source'>): void {
    const fullMessage: ExtensionMessage = {
      ...message,
      source: 'content',
      timestamp: Date.now()
    };

    // Send to background script
    chrome.runtime.sendMessage(fullMessage).catch(error => {
      console.error('[Reality Check] Error sending message:', error);
    });
  }

  /**
   * Detect current platform
   */
  private detectPlatform(): Platform {
    const hostname = window.location.hostname.toLowerCase();
    
    if (hostname.includes('chat.openai.com')) {
      return Platform.CHATGPT;
    }
    
    if (hostname.includes('claude.ai')) {
      return Platform.CLAUDE;
    }
    
    if (hostname.includes('gemini.google.com')) {
      return Platform.GEMINI;
    }
    
    if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
      return Platform.TWITTER;
    }
    
    if (hostname.includes('reddit.com')) {
      return Platform.REDDIT;
    }
    
    if (hostname.includes('facebook.com')) {
      return Platform.FACEBOOK;
    }
    
    if (hostname.includes('youtube.com')) {
      return Platform.YOUTUBE;
    }
    
    return Platform.UNKNOWN;
  }

  /**
   * Initialize the appropriate extractor for the current platform
   */
  private initializeExtractor(): void {
    switch (this.platform) {
      case Platform.CHATGPT:
        this.extractor = new ChatGPTExtractor();
        break;
      
      case Platform.TWITTER:
        this.extractor = new TwitterExtractor();
        break;
      
      case Platform.CLAUDE:
        // TODO: Implement Claude extractor
        console.log('[Reality Check] Claude extractor not yet implemented');
        break;
        
      case Platform.GEMINI:
        // TODO: Implement Gemini extractor
        console.log('[Reality Check] Gemini extractor not yet implemented');
        break;
        
      case Platform.REDDIT:
        // TODO: Implement Reddit extractor
        console.log('[Reality Check] Reddit extractor not yet implemented');
        break;
        
      case Platform.FACEBOOK:
        // TODO: Implement Facebook extractor
        console.log('[Reality Check] Facebook extractor not yet implemented');
        break;
        
      case Platform.YOUTUBE:
        // TODO: Implement YouTube extractor
        console.log('[Reality Check] YouTube extractor not yet implemented');
        break;
        
      default:
        console.log(`[Reality Check] No extractor available for platform: ${this.platform}`);
        break;
    }
  }
}

// Initialize content script
const contentScript = new RealityCheckContentScript();

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    contentScript.initialize();
  });
} else {
  contentScript.initialize();
}

// Handle page navigation (for SPAs)
let currentUrl = window.location.href;
const urlCheckInterval = setInterval(() => {
  if (window.location.href !== currentUrl) {
    currentUrl = window.location.href;
    console.log('[Reality Check] Page navigation detected, reinitializing...');
    contentScript.initialize();
  }
}, 1000);

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  clearInterval(urlCheckInterval);
});

// Handle visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    console.log('[Reality Check] Page hidden, monitoring paused');
  } else {
    console.log('[Reality Check] Page visible, monitoring resumed');
  }
});

// Export for testing
if (typeof window !== 'undefined') {
  (window as any).realityCheckContentScript = contentScript;
} 