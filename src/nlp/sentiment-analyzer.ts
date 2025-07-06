import { pipeline } from '@xenova/transformers';
import { SentimentAnalysis } from '../types/index.js';

export class SentimentAnalyzer {
  private pipeline: any | null = null;
  private isLoading: boolean = false;
  private isReady: boolean = false;

  constructor() {
    this.initializePipeline();
  }

  /**
   * Initialize the sentiment analysis pipeline
   */
  private async initializePipeline(): Promise<void> {
    if (this.isLoading || this.isReady) return;

    this.isLoading = true;
    
    try {
      console.log('[Reality Check] Loading sentiment analysis model...');
      
      // Use a lightweight sentiment model that can run in the browser
      this.pipeline = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english');
      
      this.isReady = true;
      console.log('[Reality Check] Sentiment analysis model loaded successfully');
    } catch (error) {
      console.error('[Reality Check] Failed to load sentiment analysis model:', error);
      this.isReady = false;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Analyze sentiment of text
   */
  public async analyzeSentiment(text: string): Promise<SentimentAnalysis | null> {
    if (!this.isReady) {
      await this.initializePipeline();
    }

    if (!this.pipeline || !text.trim()) {
      return null;
    }

    try {
      const startTime = Date.now();
      
      // Clean and prepare text
      const cleanedText = this.preprocessText(text);
      
      // Run sentiment analysis
      const result = await this.pipeline(cleanedText);
      
      const processingTime = Date.now() - startTime;
      
      // Convert result to our format
      return this.convertResult(result, processingTime);
      
    } catch (error) {
      console.error('[Reality Check] Sentiment analysis error:', error);
      return null;
    }
  }

  /**
   * Batch analyze multiple texts
   */
  public async analyzeBatch(texts: string[]): Promise<(SentimentAnalysis | null)[]> {
    if (!this.isReady) {
      await this.initializePipeline();
    }

    if (!this.pipeline || texts.length === 0) {
      return [];
    }

    try {
      const startTime = Date.now();
      
      // Clean and prepare texts
      const cleanedTexts = texts.map(text => this.preprocessText(text));
      
      // Run batch sentiment analysis
      const results = await this.pipeline(cleanedTexts);
      
      const processingTime = Date.now() - startTime;
      
      // Convert results to our format
      return results.map((result: any) => this.convertResult(result, processingTime / texts.length));
      
    } catch (error) {
      console.error('[Reality Check] Batch sentiment analysis error:', error);
      return texts.map(() => null);
    }
  }

  /**
   * Check if analyzer is ready
   */
  public isAnalyzerReady(): boolean {
    return this.isReady;
  }

  /**
   * Get analyzer status
   */
  public getStatus(): { ready: boolean; loading: boolean } {
    return {
      ready: this.isReady,
      loading: this.isLoading
    };
  }

  /**
   * Preprocess text for analysis
   */
  private preprocessText(text: string): string {
    // Clean up text for better analysis
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s\.\!\?\,\-\'\"\(\)]/g, '') // Remove special chars except basic punctuation
      .trim()
      .substring(0, 512); // Limit length for model efficiency
  }

  /**
   * Convert model result to our SentimentAnalysis format
   */
  private convertResult(result: any, processingTime: number): SentimentAnalysis {
    let valence = 0;
    let arousal = 0;
    let confidence = 0;

    if (Array.isArray(result)) {
      // Handle batch results
      result = result[0];
    }

    if (result && result.label && result.score) {
      confidence = result.score;
      
      // Convert sentiment labels to valence/arousal
      if (result.label === 'POSITIVE') {
        valence = result.score; // Positive valence
        arousal = Math.min(result.score * 1.2, 1); // Higher arousal for positive
      } else if (result.label === 'NEGATIVE') {
        valence = -result.score; // Negative valence
        arousal = Math.min(result.score * 1.5, 1); // Higher arousal for negative
      }
    }

    return {
      valence: Math.max(-1, Math.min(1, valence)),
      arousal: Math.max(0, Math.min(1, arousal)),
      confidence: Math.max(0, Math.min(1, confidence))
    };
  }

  /**
   * Advanced sentiment analysis with emotional dimensions
   */
  public async analyzeEmotionalDimensions(text: string): Promise<SentimentAnalysis | null> {
    const basicSentiment = await this.analyzeSentiment(text);
    if (!basicSentiment) return null;

    // Enhance with rule-based emotional indicators
    const enhancedSentiment = this.enhanceWithEmotionalRules(text, basicSentiment);
    
    return enhancedSentiment;
  }

  /**
   * Enhance sentiment with rule-based emotional indicators
   */
  private enhanceWithEmotionalRules(text: string, baseSentiment: SentimentAnalysis): SentimentAnalysis {
    const lowerText = text.toLowerCase();
    
    // Arousal indicators
    const highArousalKeywords = [
      'urgent', 'emergency', 'crisis', 'panic', 'excited', 'thrilled',
      'angry', 'furious', 'rage', 'hate', 'love', 'amazing', 'terrible',
      'shocking', 'incredible', 'outrageous', 'awesome', 'devastating'
    ];
    
    const lowArousalKeywords = [
      'calm', 'peaceful', 'relaxed', 'tired', 'bored', 'dull',
      'quiet', 'still', 'gentle', 'soft', 'mild', 'content'
    ];
    
    // Valence indicators
    const positiveKeywords = [
      'happy', 'joy', 'pleased', 'satisfied', 'grateful', 'thankful',
      'wonderful', 'excellent', 'great', 'good', 'nice', 'beautiful'
    ];
    
    const negativeKeywords = [
      'sad', 'disappointed', 'frustrated', 'angry', 'upset', 'worried',
      'terrible', 'awful', 'bad', 'horrible', 'disgusting', 'annoying'
    ];
    
    let arousalBoost = 0;
    let valenceBoost = 0;
    
    // Check for arousal keywords
    for (const keyword of highArousalKeywords) {
      if (lowerText.includes(keyword)) {
        arousalBoost += 0.2;
      }
    }
    
    for (const keyword of lowArousalKeywords) {
      if (lowerText.includes(keyword)) {
        arousalBoost -= 0.15;
      }
    }
    
    // Check for valence keywords
    for (const keyword of positiveKeywords) {
      if (lowerText.includes(keyword)) {
        valenceBoost += 0.15;
      }
    }
    
    for (const keyword of negativeKeywords) {
      if (lowerText.includes(keyword)) {
        valenceBoost -= 0.15;
      }
    }
    
    // Check for intensity indicators
    const intensityWords = ['very', 'extremely', 'incredibly', 'totally', 'completely'];
    const intensityBoost = intensityWords.some(word => lowerText.includes(word)) ? 0.1 : 0;
    
    // Apply enhancements
    const enhancedArousal = Math.max(0, Math.min(1, 
      baseSentiment.arousal + arousalBoost + intensityBoost
    ));
    
    const enhancedValence = Math.max(-1, Math.min(1, 
      baseSentiment.valence + valenceBoost
    ));
    
    return {
      valence: enhancedValence,
      arousal: enhancedArousal,
      confidence: baseSentiment.confidence
    };
  }
} 