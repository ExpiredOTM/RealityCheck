import { ExtractedContent, ContentMetadata, Platform, ContentType } from '../../types/index.js';

export abstract class BaseDOMExtractor {
  protected platform: Platform;
  protected mutationObserver: MutationObserver | null = null;
  protected extractedContent: Map<string, ExtractedContent> = new Map();
  protected lastExtractedTime: number = 0;
  protected isActive: boolean = false;

  constructor(platform: Platform) {
    this.platform = platform;
  }

  /**
   * Start monitoring the DOM for content changes
   */
  public start(): void {
    if (this.isActive) return;

    this.isActive = true;
    this.setupMutationObserver();
    this.performInitialExtraction();
  }

  /**
   * Stop monitoring the DOM
   */
  public stop(): void {
    this.isActive = false;
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }

  /**
   * Get all extracted content since last call
   */
  public getNewContent(): ExtractedContent[] {
    const newContent = Array.from(this.extractedContent.values())
      .filter(content => content.timestamp > this.lastExtractedTime);
    
    if (newContent.length > 0) {
      this.lastExtractedTime = Math.max(...newContent.map(c => c.timestamp));
    }
    
    return newContent;
  }

  /**
   * Clear stored content (for memory management)
   */
  public clearOldContent(olderThanMs: number = 300000): void { // 5 minutes
    const cutoff = Date.now() - olderThanMs;
    const toDelete: string[] = [];
    
    for (const [id, content] of this.extractedContent) {
      if (content.timestamp < cutoff) {
        toDelete.push(id);
      }
    }
    
    toDelete.forEach(id => this.extractedContent.delete(id));
  }

  /**
   * Abstract methods to be implemented by platform-specific extractors
   */
  protected abstract getContentSelectors(): string[];
  protected abstract extractContentFromElement(element: Element): ExtractedContent | null;
  protected abstract determineContentType(element: Element): ContentType;

  /**
   * Setup MutationObserver to watch for DOM changes
   */
  private setupMutationObserver(): void {
    this.mutationObserver = new MutationObserver((mutations) => {
      let shouldExtract = false;

      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              if (this.isRelevantElement(element)) {
                shouldExtract = true;
                break;
              }
            }
          }
        }
        if (shouldExtract) break;
      }

      if (shouldExtract) {
        this.extractContent();
      }
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    });
  }

  /**
   * Perform initial extraction of existing content
   */
  private performInitialExtraction(): void {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.extractContent();
      });
    } else {
      this.extractContent();
    }
  }

  /**
   * Extract content from all relevant elements
   */
  private extractContent(): void {
    const selectors = this.getContentSelectors();
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      
      elements.forEach(element => {
        const content = this.extractContentFromElement(element);
        if (content && this.isValidContent(content)) {
          this.extractedContent.set(content.id, content);
        }
      });
    }
  }

  /**
   * Check if an element is relevant for content extraction
   */
  private isRelevantElement(element: Element): boolean {
    const selectors = this.getContentSelectors();
    return selectors.some(selector => {
      try {
        return element.matches(selector) || element.querySelector(selector) !== null;
      } catch (e) {
        return false;
      }
    });
  }

  /**
   * Validate extracted content
   */
  private isValidContent(content: ExtractedContent): boolean {
    if (!content.text || content.text.trim().length < 10) {
      return false;
    }

    // Check for duplicate content
    if (this.extractedContent.has(content.id)) {
      return false;
    }

    // Check for similar content (basic deduplication)
    const existingTexts = Array.from(this.extractedContent.values())
      .map(c => c.text.toLowerCase().trim());
    
    const newText = content.text.toLowerCase().trim();
    if (existingTexts.some(text => text === newText)) {
      return false;
    }

    return true;
  }

  /**
   * Generate unique ID for content
   */
  protected generateContentId(text: string, timestamp: number): string {
    const textHash = this.simpleHash(text);
    return `${this.platform}_${textHash}_${timestamp}`;
  }

  /**
   * Simple hash function for content deduplication
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get metadata about the current page context
   */
  protected getBaseMetadata(): ContentMetadata {
    return {
      url: window.location.href,
      scrollPosition: window.pageYOffset || document.documentElement.scrollTop,
      isVisible: document.visibilityState === 'visible'
    };
  }

  /**
   * Clean text content for analysis
   */
  protected cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width characters
      .trim();
  }
} 