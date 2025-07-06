import { SentimentAnalyzer } from './sentiment-analyzer.js';
import { DistortionDetector } from './distortion-detector.js';
import { RageDetector } from './rage-detector.js';
import { NLPAnalysis, ExtractedContent } from '../types/index.js';

export class NLPPipeline {
  private sentimentAnalyzer: SentimentAnalyzer;
  private distortionDetector: DistortionDetector;
  private rageDetector: RageDetector;
  private isInitialized: boolean = false;

  constructor() {
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.distortionDetector = new DistortionDetector();
    this.rageDetector = new RageDetector();
  }

  /**
   * Initialize the NLP pipeline
   */
  public async initialize(): Promise<void> {
    try {
      console.log('[Reality Check] Initializing NLP pipeline...');
      
      // Wait for sentiment analyzer to be ready
      let retries = 0;
      while (!this.sentimentAnalyzer.isAnalyzerReady() && retries < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        retries++;
      }
      
      if (!this.sentimentAnalyzer.isAnalyzerReady()) {
        console.warn('[Reality Check] Sentiment analyzer not ready, continuing without it');
      }
      
      this.isInitialized = true;
      console.log('[Reality Check] NLP pipeline initialized successfully');
    } catch (error) {
      console.error('[Reality Check] Failed to initialize NLP pipeline:', error);
      throw error;
    }
  }

  /**
   * Analyze a single piece of content
   */
  public async analyzeContent(content: ExtractedContent): Promise<NLPAnalysis | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const startTime = Date.now();
      
      // Run analysis components in parallel
      const [sentiment, distortions, rageIndicators] = await Promise.all([
        this.sentimentAnalyzer.analyzeEmotionalDimensions(content.text),
        Promise.resolve(this.distortionDetector.detectDistortions(content.text)),
        Promise.resolve(this.rageDetector.detectRageIndicators(content.text))
      ]);

      const processingTime = Date.now() - startTime;

      // Calculate overall confidence
      const confidence = this.calculateConfidence(sentiment, distortions, rageIndicators);

      return {
        sentiment: sentiment || { valence: 0, arousal: 0, confidence: 0 },
        cognitiveDistortions: distortions,
        rageIndicators,
        confidence,
        processingTime
      };
    } catch (error) {
      console.error('[Reality Check] Content analysis error:', error);
      return null;
    }
  }

  /**
   * Analyze multiple pieces of content
   */
  public async analyzeBatch(contents: ExtractedContent[]): Promise<(NLPAnalysis | null)[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (contents.length === 0) {
      return [];
    }

    try {
      const startTime = Date.now();
      
      // Extract texts for batch processing
      const texts = contents.map(content => content.text);
      
      // Run batch analysis
      const [sentiments, distortionResults, rageResults] = await Promise.all([
        this.sentimentAnalyzer.analyzeBatch(texts),
        Promise.resolve(texts.map(text => this.distortionDetector.detectDistortions(text))),
        Promise.resolve(texts.map(text => this.rageDetector.detectRageIndicators(text)))
      ]);

      const processingTime = Date.now() - startTime;
      const avgProcessingTime = processingTime / contents.length;

      // Combine results
      return contents.map((content, index) => {
        const sentiment = sentiments[index];
        const distortions = distortionResults[index];
        const rageIndicators = rageResults[index];
        
        if (!sentiment && distortions.length === 0 && rageIndicators.length === 0) {
          return null;
        }

        const confidence = this.calculateConfidence(sentiment, distortions, rageIndicators);

        return {
          sentiment: sentiment || { valence: 0, arousal: 0, confidence: 0 },
          cognitiveDistortions: distortions,
          rageIndicators,
          confidence,
          processingTime: avgProcessingTime
        };
      });
    } catch (error) {
      console.error('[Reality Check] Batch analysis error:', error);
      return contents.map(() => null);
    }
  }

  /**
   * Get pipeline status
   */
  public getStatus(): {
    initialized: boolean;
    sentimentReady: boolean;
    distortionReady: boolean;
    rageReady: boolean;
  } {
    return {
      initialized: this.isInitialized,
      sentimentReady: this.sentimentAnalyzer.isAnalyzerReady(),
      distortionReady: true, // Rule-based, always ready
      rageReady: true // Rule-based, always ready
    };
  }

  /**
   * Calculate aggregated analysis from multiple analyses
   */
  public aggregateAnalyses(analyses: NLPAnalysis[]): NLPAnalysis {
    if (analyses.length === 0) {
      return {
        sentiment: { valence: 0, arousal: 0, confidence: 0 },
        cognitiveDistortions: [],
        rageIndicators: [],
        confidence: 0,
        processingTime: 0
      };
    }

    // Aggregate sentiment
    const sentiments = analyses.map(a => a.sentiment);
    const avgSentiment = {
      valence: sentiments.reduce((sum, s) => sum + s.valence, 0) / sentiments.length,
      arousal: sentiments.reduce((sum, s) => sum + s.arousal, 0) / sentiments.length,
      confidence: sentiments.reduce((sum, s) => sum + s.confidence, 0) / sentiments.length
    };

    // Aggregate distortions
    const allDistortions = analyses.flatMap(a => a.cognitiveDistortions);
    
    // Aggregate rage indicators
    const allRageIndicators = analyses.flatMap(a => a.rageIndicators);

    // Calculate overall confidence
    const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length;
    
    // Calculate total processing time
    const totalProcessingTime = analyses.reduce((sum, a) => sum + a.processingTime, 0);

    return {
      sentiment: avgSentiment,
      cognitiveDistortions: allDistortions,
      rageIndicators: allRageIndicators,
      confidence: avgConfidence,
      processingTime: totalProcessingTime
    };
  }

  /**
   * Calculate risk score from analysis
   */
  public calculateRiskScore(analysis: NLPAnalysis): number {
    let riskScore = 0;

    // Sentiment risk (negative valence + high arousal)
    const sentimentRisk = Math.max(0, (-analysis.sentiment.valence + analysis.sentiment.arousal) / 2);
    riskScore += sentimentRisk * 0.3;

    // Distortion risk
    const distortionRisk = this.distortionDetector.calculateDistortionRisk(
      analysis.cognitiveDistortions.map(d => d.context).join(' ')
    );
    riskScore += distortionRisk * 0.4;

    // Rage risk
    const rageRisk = this.rageDetector.calculateRageRisk(analysis.rageIndicators);
    riskScore += rageRisk * 0.3;

    return Math.min(1, riskScore);
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    sentiment: any,
    distortions: any[],
    rageIndicators: any[]
  ): number {
    let confidence = 0;
    let factors = 0;

    // Sentiment confidence
    if (sentiment && sentiment.confidence > 0) {
      confidence += sentiment.confidence;
      factors++;
    }

    // Distortion confidence (based on number and severity)
    if (distortions.length > 0) {
      const distortionConfidence = Math.min(1, distortions.length * 0.2 + 
        distortions.reduce((sum, d) => sum + d.severity, 0) / distortions.length);
      confidence += distortionConfidence;
      factors++;
    }

    // Rage confidence (based on number and intensity)
    if (rageIndicators.length > 0) {
      const rageConfidence = Math.min(1, rageIndicators.length * 0.2 + 
        rageIndicators.reduce((sum, r) => sum + r.intensity, 0) / rageIndicators.length);
      confidence += rageConfidence;
      factors++;
    }

    return factors > 0 ? confidence / factors : 0;
  }

  /**
   * Get detailed analysis summary
   */
  public getAnalysisSummary(analysis: NLPAnalysis): {
    sentimentCategory: string;
    riskLevel: 'low' | 'medium' | 'high';
    primaryConcerns: string[];
    recommendations: string[];
  } {
    const riskScore = this.calculateRiskScore(analysis);
    
    // Determine sentiment category
    let sentimentCategory = 'neutral';
    if (analysis.sentiment.valence > 0.3) {
      sentimentCategory = 'positive';
    } else if (analysis.sentiment.valence < -0.3) {
      sentimentCategory = 'negative';
    }
    
    if (analysis.sentiment.arousal > 0.6) {
      sentimentCategory += ' high-arousal';
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (riskScore > 0.7) {
      riskLevel = 'high';
    } else if (riskScore > 0.4) {
      riskLevel = 'medium';
    }

    // Identify primary concerns
    const primaryConcerns: string[] = [];
    if (analysis.cognitiveDistortions.length > 0) {
      const topDistortion = analysis.cognitiveDistortions[0];
      primaryConcerns.push(`${topDistortion.type} thinking patterns`);
    }
    
    if (analysis.rageIndicators.length > 0) {
      primaryConcerns.push('aggressive language patterns');
    }
    
    if (analysis.sentiment.arousal > 0.8) {
      primaryConcerns.push('high emotional intensity');
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (riskLevel === 'high') {
      recommendations.push('Consider taking a break from this content');
      recommendations.push('Practice mindfulness or grounding techniques');
    } else if (riskLevel === 'medium') {
      recommendations.push('Be mindful of your emotional state');
      recommendations.push('Consider diversifying your content consumption');
    }

    return {
      sentimentCategory,
      riskLevel,
      primaryConcerns,
      recommendations
    };
  }
} 