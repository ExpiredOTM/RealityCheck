import { BaseDOMExtractor } from './base-extractor.js';
import { ExtractedContent, Platform, ContentType } from '../../types/index.js';

export class TwitterExtractor extends BaseDOMExtractor {
  constructor() {
    super(Platform.TWITTER);
  }

  protected getContentSelectors(): string[] {
    return [
      // Main tweet content
      '[data-testid="tweet"]',
      '[data-testid="tweetText"]',
      'article[data-testid="tweet"]',
      
      // Tweet text specifically
      '[data-testid="tweetText"] span',
      '.tweet-text',
      '.r-37j5jr', // Common Twitter text class
      
      // Quoted tweets
      '[data-testid="quoteTweet"]',
      
      // Replies and comments
      '[data-testid="reply"]',
      '[data-testid="cellInnerDiv"]',
      
      // Compose tweet area
      '[data-testid="tweetTextarea_0"]',
      '[data-testid="tweetButton"]',
      '.public-DraftEditor-content',
      
      // Thread content
      '[data-testid="UserCell"]',
      '[data-testid="primaryColumn"]',
      
      // Trending topics and recommended content
      '[data-testid="trend"]',
      '[data-testid="UserCell"]'
    ];
  }

  protected extractContentFromElement(element: Element): ExtractedContent | null {
    try {
      const timestamp = Date.now();
      let text = '';
      let contentType = ContentType.UNKNOWN;

      // Check for compose area
      if (element.matches('[data-testid="tweetTextarea_0"], .public-DraftEditor-content')) {
        text = this.extractTextFromInput(element);
        contentType = ContentType.USER_MESSAGE;
      }
      // Check for tweet content
      else if (element.matches('[data-testid="tweet"], article[data-testid="tweet"]')) {
        text = this.extractTweetText(element);
        contentType = ContentType.SOCIAL_POST;
      }
      // Check for quote tweets
      else if (element.matches('[data-testid="quoteTweet"]')) {
        text = this.extractQuoteTweetText(element);
        contentType = ContentType.SOCIAL_POST;
      }
      // Check for replies
      else if (this.isReplyElement(element)) {
        text = this.extractReplyText(element);
        contentType = ContentType.COMMENT;
      }
      // Generic text extraction
      else {
        text = this.extractGenericText(element);
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
      console.debug('Twitter extraction error:', error);
      return null;
    }
  }

  protected determineContentType(element: Element): ContentType {
    // Check for tweet containers
    if (element.matches('[data-testid="tweet"], article[data-testid="tweet"]')) {
      return ContentType.SOCIAL_POST;
    }

    // Check for reply indicators
    if (this.isReplyElement(element)) {
      return ContentType.COMMENT;
    }

    // Check for compose area
    if (element.matches('[data-testid="tweetTextarea_0"], .public-DraftEditor-content')) {
      return ContentType.USER_MESSAGE;
    }

    // Check for quoted content
    if (element.matches('[data-testid="quoteTweet"]')) {
      return ContentType.SOCIAL_POST;
    }

    return ContentType.FEED_ITEM;
  }

  private extractTweetText(element: Element): string {
    // First try to find the tweet text element
    const tweetTextElement = element.querySelector('[data-testid="tweetText"]');
    if (tweetTextElement) {
      return this.extractTextFromTweetElement(tweetTextElement);
    }

    // Fallback to extracting from the main tweet container
    return this.extractTextFromTweetElement(element);
  }

  private extractTextFromTweetElement(element: Element): string {
    const clone = element.cloneNode(true) as Element;
    
    // Remove UI elements that shouldn't be included
    const unwantedSelectors = [
      'svg',
      '[aria-hidden="true"]',
      '.r-1wbh5a2', // Common Twitter icon class
      '[data-testid="like"]',
      '[data-testid="retweet"]',
      '[data-testid="reply"]',
      '[data-testid="share"]',
      '.tweet-actions',
      '.tweet-header',
      '.tweet-footer'
    ];

    unwantedSelectors.forEach(selector => {
      const unwantedElements = clone.querySelectorAll(selector);
      unwantedElements.forEach(el => el.remove());
    });

    // Extract text while preserving some structure
    let text = clone.textContent || '';
    
    // Handle hashtags and mentions specially
    const hashtags = clone.querySelectorAll('a[href*="/hashtag/"]');
    const mentions = clone.querySelectorAll('a[href*="/"]');
    
    return text;
  }

  private extractQuoteTweetText(element: Element): string {
    // Quote tweets have nested structure
    const originalTweet = element.querySelector('[data-testid="tweetText"]');
    const quotedTweet = element.querySelector('[data-testid="quoteTweet"] [data-testid="tweetText"]');
    
    let text = '';
    if (originalTweet) {
      text += this.extractTextFromTweetElement(originalTweet);
    }
    if (quotedTweet) {
      text += ' [QUOTED] ' + this.extractTextFromTweetElement(quotedTweet);
    }
    
    return text;
  }

  private extractReplyText(element: Element): string {
    // Replies might be nested or in thread format
    const replyText = element.querySelector('[data-testid="tweetText"]');
    if (replyText) {
      return this.extractTextFromTweetElement(replyText);
    }
    
    return this.extractGenericText(element);
  }

  private extractTextFromInput(element: Element): string {
    if (element.matches('textarea, input')) {
      return (element as HTMLInputElement).value;
    }
    
    // For contentEditable elements like Twitter's compose
    if (element.matches('.public-DraftEditor-content')) {
      return element.textContent || '';
    }
    
    return element.textContent || '';
  }

  private extractGenericText(element: Element): string {
    const clone = element.cloneNode(true) as Element;
    
    // Remove common UI elements
    const unwantedSelectors = [
      'svg',
      'button',
      '[aria-hidden="true"]',
      '.sr-only',
      '[data-testid*="icon"]'
    ];

    unwantedSelectors.forEach(selector => {
      const unwantedElements = clone.querySelectorAll(selector);
      unwantedElements.forEach(el => el.remove());
    });

    return clone.textContent || '';
  }

  private isReplyElement(element: Element): boolean {
    // Check for reply indicators
    const replyIndicators = [
      '[data-testid="reply"]',
      '.reply-to',
      '[aria-label*="reply"]',
      '[aria-label*="Reply"]'
    ];

    return replyIndicators.some(selector => {
      try {
        return element.matches(selector) || 
               element.closest(selector) !== null ||
               element.querySelector(selector) !== null;
      } catch (e) {
        return false;
      }
    });
  }

  private getContextHint(element: Element): string {
    // Check for tweet context
    if (element.closest('[data-testid="tweet"]')) {
      return 'main_tweet';
    }
    
    // Check for reply context
    if (this.isReplyElement(element)) {
      return 'reply_tweet';
    }
    
    // Check for quote tweet context
    if (element.closest('[data-testid="quoteTweet"]')) {
      return 'quote_tweet';
    }
    
    // Check for compose context
    if (element.matches('[data-testid="tweetTextarea_0"], .public-DraftEditor-content')) {
      return 'compose_tweet';
    }
    
    // Check for timeline position
    const timelineElement = element.closest('[data-testid="primaryColumn"]');
    if (timelineElement) {
      const allTweets = timelineElement.querySelectorAll('[data-testid="tweet"]');
      const currentIndex = Array.from(allTweets).indexOf(element.closest('[data-testid="tweet"]') || element);
      
      if (currentIndex >= 0) {
        return `timeline_position_${currentIndex}`;
      }
    }
    
    return 'twitter_content';
  }
} 