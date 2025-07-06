import { BaseDOMExtractor } from './base-extractor.js';
import { ExtractedContent, Platform, ContentType } from '../../types/index.js';

export class ChatGPTExtractor extends BaseDOMExtractor {
  constructor() {
    super(Platform.CHATGPT);
  }

  protected getContentSelectors(): string[] {
    return [
      // Main chat messages
      '[data-message-author-role="user"]',
      '[data-message-author-role="assistant"]',
      '.group\\/conversation-turn',
      
      // Fallback selectors for different UI versions
      '[data-testid*="conversation-turn"]',
      '.text-base',
      '.markdown',
      
      // Message containers
      '.group.w-full',
      '.flex.flex-col.items-start',
      '.relative.flex.w-full',
      
      // Input area (user typing)
      '#prompt-textarea',
      '[data-testid="prompt-textarea"]'
    ];
  }

  protected extractContentFromElement(element: Element): ExtractedContent | null {
    try {
      const timestamp = Date.now();
      let text = '';
      let contentType = ContentType.UNKNOWN;

      // Check for user input
      if (element.matches('#prompt-textarea, [data-testid="prompt-textarea"]')) {
        const input = element as HTMLTextAreaElement;
        text = input.value;
        contentType = ContentType.USER_MESSAGE;
      }
      // Check for user messages
      else if (element.matches('[data-message-author-role="user"]') || 
               this.isUserMessage(element)) {
        text = this.extractTextFromMessageElement(element);
        contentType = ContentType.USER_MESSAGE;
      }
      // Check for assistant messages
      else if (element.matches('[data-message-author-role="assistant"]') || 
               this.isAssistantMessage(element)) {
        text = this.extractTextFromMessageElement(element);
        contentType = ContentType.AI_RESPONSE;
      }
      // Generic message extraction
      else {
        text = this.extractTextFromMessageElement(element);
        contentType = this.determineContentType(element);
      }

      if (!text || text.trim().length < 10) {
        return null;
      }

      const cleanedText = this.cleanText(text);
      const id = this.generateContentId(cleanedText, timestamp);

      return {
        id,
        text: cleanedText,
        timestamp,
        platform: this.platform,
        type: contentType,
        metadata: {
          ...this.getBaseMetadata(),
          parentElement: element.tagName.toLowerCase(),
          contextHint: this.getContextHint(element)
        }
      };
    } catch (error) {
      console.debug('ChatGPT extraction error:', error);
      return null;
    }
  }

  protected determineContentType(element: Element): ContentType {
    // Check for user indicators
    if (this.isUserMessage(element)) {
      return ContentType.USER_MESSAGE;
    }
    
    // Check for assistant indicators
    if (this.isAssistantMessage(element)) {
      return ContentType.AI_RESPONSE;
    }

    // Check for input elements
    if (element.matches('textarea, input[type="text"]')) {
      return ContentType.USER_MESSAGE;
    }

    return ContentType.UNKNOWN;
  }

  private isUserMessage(element: Element): boolean {
    // Check for user-specific attributes and classes
    const userIndicators = [
      '[data-message-author-role="user"]',
      '.bg-gray-50',
      '.dark\\:bg-gray-800',
      '.user-message'
    ];

    return userIndicators.some(selector => {
      try {
        return element.matches(selector) || element.closest(selector) !== null;
      } catch (e) {
        return false;
      }
    });
  }

  private isAssistantMessage(element: Element): boolean {
    // Check for assistant-specific attributes and classes
    const assistantIndicators = [
      '[data-message-author-role="assistant"]',
      '.gizmo-bot-avatar',
      '.assistant-message'
    ];

    return assistantIndicators.some(selector => {
      try {
        return element.matches(selector) || element.closest(selector) !== null;
      } catch (e) {
        return false;
      }
    });
  }

  private extractTextFromMessageElement(element: Element): string {
    // Remove unwanted elements
    const clone = element.cloneNode(true) as Element;
    
    // Remove buttons, icons, and other UI elements
    const unwantedSelectors = [
      'button',
      'svg',
      '.sr-only',
      '[aria-hidden="true"]',
      '.copy-button',
      '.edit-button',
      '.regenerate-button'
    ];

    unwantedSelectors.forEach(selector => {
      const unwantedElements = clone.querySelectorAll(selector);
      unwantedElements.forEach(el => el.remove());
    });

    // Get text content
    let text = clone.textContent || '';
    
    // Special handling for code blocks and formatted content
    const codeBlocks = clone.querySelectorAll('pre, code');
    if (codeBlocks.length > 0) {
      // Preserve code structure
      text = this.preserveCodeStructure(clone);
    }

    return text;
  }

  private preserveCodeStructure(element: Element): string {
    let result = '';
    
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      null,
      false
    );

    let node = walker.nextNode();
    while (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        result += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        if (el.tagName === 'PRE' || el.tagName === 'CODE') {
          result += '\n' + el.textContent + '\n';
        } else if (el.tagName === 'BR') {
          result += '\n';
        }
      }
      node = walker.nextNode();
    }

    return result;
  }

  private getContextHint(element: Element): string {
    // Try to determine context from surrounding elements
    const parent = element.closest('[data-message-author-role], .group\\/conversation-turn');
    if (parent) {
      const role = parent.getAttribute('data-message-author-role');
      if (role) {
        return `${role}_message`;
      }
    }

    // Check for conversation position
    const allMessages = document.querySelectorAll('[data-message-author-role]');
    const currentIndex = Array.from(allMessages).indexOf(element.closest('[data-message-author-role]') || element);
    
    if (currentIndex >= 0) {
      return `conversation_turn_${currentIndex}`;
    }

    return 'chat_content';
  }
} 