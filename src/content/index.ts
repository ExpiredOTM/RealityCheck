import { BaseDOMExtractor } from './adapters/base-extractor.js';
import { SiteAdapter } from './adapters/site-adapter.js';
import { findAdapter } from './adapters/index.js';
import { ScrollProfiler } from './profilers/scroll-profiler.js';
import { Platform, ExtensionMessage, MessageType } from '../types/index.js';

class RealityCheckContentScript {
  private adapter: SiteAdapter | null = null;
  private extractor: BaseDOMExtractor | null = null;
  private scrollProfiler: ScrollProfiler;
  private settings: { enabledPlatforms: Platform[] } = { enabledPlatforms: [] };
  private platform!: Platform;
  private isActive: boolean = false;
  private processingInterval: number | null = null;
  private cleanupInterval: number | null = null;

  constructor() {
    this.initializeAdapter();
    this.scrollProfiler = new ScrollProfiler();
  }

  private async loadSettings(): Promise<void> {
    const data = await chrome.storage.local.get(['settings']);
    if (data.settings && Array.isArray(data.settings.enabledPlatforms)) {
      this.settings.enabledPlatforms = data.settings.enabledPlatforms as Platform[];
    } else {
      this.settings.enabledPlatforms = Object.values(Platform);
    }
  }

  /**
   * Initialize the content script
   */
  public async initialize(): Promise<void> {
    try {
      this.initializeAdapter();
      await this.loadSettings();
      console.log(`[Reality Check] Initializing for platform: ${this.platform}`);
      
      // Check if platform is supported
      if (this.platform === Platform.UNKNOWN) {
        console.log('[Reality Check] Platform not supported, exiting');
        return;
      }

      // Start monitoring components if enabled
      if (this.settings.enabledPlatforms.includes(this.platform)) {
        this.startMonitoring();
      } else {
        console.log('[Reality Check] Platform disabled in settings');
      }
      
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
    
    // Start DOM extraction via adapter
    if (this.adapter) {
      this.adapter.start();
      if (this.adapter instanceof BaseDOMExtractor) {
        this.extractor = this.adapter;
      }
    }
    
    // Start scroll profiling
    this.scrollProfiler.start();
    
    // Send session started message
    this.sendMessage({
      type: MessageType.SESSION_STARTED,
      data: {
        platform: this.platform,
        url: window.location.href
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
    if (this.adapter) {
      this.adapter.stop();
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
        url: window.location.href
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
            platform: this.platform
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
            scrollState
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
  private sendMessage(message: Omit<ExtensionMessage, 'source' | 'timestamp'>): void {
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
  private initializeAdapter(): void {
    const adapter = findAdapter(new URL(window.location.href));
    this.adapter = adapter;
    this.extractor = adapter instanceof BaseDOMExtractor ? adapter : null;
    this.platform = adapter ? adapter.name : Platform.UNKNOWN;
  }

  /**
   * Initialize the appropriate extractor for the current platform
   */
  private initializeExtractor(): void {
    this.initializeAdapter();
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

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.settings) {
    contentScript.initialize();
  }
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