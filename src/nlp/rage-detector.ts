import { RageIndicator, RageType } from '../types/index.js';

export class RageDetector {
  private ragePatterns: Array<{
    type: RageType;
    pattern: RegExp;
    weight: number;
  }> = [];

  constructor() {
    this.initializePatterns();
  }

  /**
   * Detect rage indicators in text
   */
  public detectRageIndicators(text: string): RageIndicator[] {
    const indicators: RageIndicator[] = [];
    const lowerText = text.toLowerCase();

    for (const pattern of this.ragePatterns) {
      const matches = lowerText.match(pattern.pattern);
      if (matches) {
        const indicator = this.createRageIndicator(
          pattern.type,
          matches,
          pattern.weight,
          text
        );
        if (indicator) {
          indicators.push(indicator);
        }
      }
    }

    // Check for additional indicators
    indicators.push(...this.detectCapsLock(text));
    indicators.push(...this.detectExclamationSpam(text));
    indicators.push(...this.detectProfanity(text));

    return indicators.sort((a, b) => b.intensity - a.intensity);
  }

  /**
   * Calculate overall rage risk from indicators
   */
  public calculateRageRisk(indicators: RageIndicator[]): number {
    if (indicators.length === 0) return 0;

    const typeWeights = {
      [RageType.VERBAL_AGGRESSION]: 0.9,
      [RageType.THREAT_LANGUAGE]: 1.0,
      [RageType.PROFANITY]: 0.6,
      [RageType.CAPS_LOCK]: 0.4,
      [RageType.EXCLAMATION_SPAM]: 0.3
    };

    let totalRisk = 0;
    for (const indicator of indicators) {
      const weight = typeWeights[indicator.type] || 0.5;
      totalRisk += indicator.intensity * weight;
    }

    return Math.min(1, totalRisk / 2); // Normalize
  }

  /**
   * Initialize rage detection patterns
   */
  private initializePatterns(): void {
    this.ragePatterns = [
      // Verbal aggression patterns
      {
        type: RageType.VERBAL_AGGRESSION,
        pattern: /\b(hate|despise|loathe|detest|can't stand|disgusts? me|makes? me sick)\b/gi,
        weight: 0.7
      },
      {
        type: RageType.VERBAL_AGGRESSION,
        pattern: /\b(idiots?|morons?|stupid|dumb|pathetic|worthless|garbage|trash)\b/gi,
        weight: 0.6
      },
      {
        type: RageType.VERBAL_AGGRESSION,
        pattern: /\b(shut up|shut the hell up|get lost|go away|leave me alone)\b/gi,
        weight: 0.5
      },

      // Threat language patterns
      {
        type: RageType.THREAT_LANGUAGE,
        pattern: /\b(i'll kill|gonna kill|want to kill|should die|deserve to die)\b/gi,
        weight: 1.0
      },
      {
        type: RageType.THREAT_LANGUAGE,
        pattern: /\b(i'll destroy|gonna destroy|wipe out|eliminate|get rid of)\b/gi,
        weight: 0.9
      },
      {
        type: RageType.THREAT_LANGUAGE,
        pattern: /\b(hunt down|track down|come after|find you|get you)\b/gi,
        weight: 0.8
      },

      // Extreme anger patterns
      {
        type: RageType.VERBAL_AGGRESSION,
        pattern: /\b(furious|enraged|livid|seething|boiling|exploding with rage)\b/gi,
        weight: 0.8
      },
      {
        type: RageType.VERBAL_AGGRESSION,
        pattern: /\b(so angry|pissed off|fed up|had enough|can't take it)\b/gi,
        weight: 0.6
      }
    ];
  }

  /**
   * Create rage indicator from pattern match
   */
  private createRageIndicator(
    type: RageType,
    matches: RegExpMatchArray,
    weight: number,
    context: string
  ): RageIndicator | null {
    if (!matches || matches.length === 0) return null;

    const intensity = Math.min(1, weight + (matches.length - 1) * 0.1);
    const pattern = matches[0];
    const contextSnippet = this.extractContext(context, pattern);

    return {
      type,
      intensity,
      pattern,
      context: contextSnippet
    };
  }

  /**
   * Detect excessive caps lock usage
   */
  private detectCapsLock(text: string): RageIndicator[] {
    const indicators: RageIndicator[] = [];
    
    // Count capital letters vs total letters
    const letters = text.match(/[A-Za-z]/g) || [];
    const capitals = text.match(/[A-Z]/g) || [];
    
    if (letters.length > 10 && capitals.length > 0) {
      const capsRatio = capitals.length / letters.length;
      
      // Also check for consecutive caps
      const capsSequences = text.match(/[A-Z]{3,}/g) || [];
      
      if (capsRatio > 0.5 || capsSequences.length > 0) {
        const intensity = Math.min(1, capsRatio + capsSequences.length * 0.2);
        
        indicators.push({
          type: RageType.CAPS_LOCK,
          intensity,
          pattern: capsSequences.join(', ') || 'excessive caps',
          context: this.extractContext(text, capitals[0] || '')
        });
      }
    }
    
    return indicators;
  }

  /**
   * Detect excessive exclamation marks
   */
  private detectExclamationSpam(text: string): RageIndicator[] {
    const indicators: RageIndicator[] = [];
    
    const exclamations = text.match(/!+/g) || [];
    const multiExclamations = exclamations.filter(e => e.length > 1);
    
    if (multiExclamations.length > 0) {
      const maxLength = Math.max(...multiExclamations.map(e => e.length));
      const intensity = Math.min(1, (maxLength - 1) * 0.2 + multiExclamations.length * 0.1);
      
      indicators.push({
        type: RageType.EXCLAMATION_SPAM,
        intensity,
        pattern: multiExclamations.join(', '),
        context: this.extractContext(text, multiExclamations[0])
      });
    }
    
    return indicators;
  }

  /**
   * Detect profanity and strong language
   */
  private detectProfanity(text: string): RageIndicator[] {
    const indicators: RageIndicator[] = [];
    
    // Basic profanity patterns (mild ones for demonstration)
    const profanityPatterns = [
      /\b(damn|hell|crap|sucks|bullsh\*t|bs)\b/gi,
      /\b(f\*ck|sh\*t|d\*mn|h\*ll)\b/gi, // Censored versions
      /\b(wtf|stfu|gtfo|fml)\b/gi // Abbreviations
    ];
    
    let totalMatches = 0;
    let allMatches: string[] = [];
    
    for (const pattern of profanityPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        totalMatches += matches.length;
        allMatches.push(...matches);
      }
    }
    
    if (totalMatches > 0) {
      const intensity = Math.min(1, totalMatches * 0.3);
      
      indicators.push({
        type: RageType.PROFANITY,
        intensity,
        pattern: allMatches.join(', '),
        context: this.extractContext(text, allMatches[0])
      });
    }
    
    return indicators;
  }

  /**
   * Extract context around a match
   */
  private extractContext(text: string, match: string): string {
    const matchIndex = text.toLowerCase().indexOf(match.toLowerCase());
    if (matchIndex === -1) return match;

    const start = Math.max(0, matchIndex - 30);
    const end = Math.min(text.length, matchIndex + match.length + 30);
    
    return text.substring(start, end).trim();
  }

  /**
   * Analyze emotional intensity indicators
   */
  public analyzeEmotionalIntensity(text: string): {
    intensity: number;
    indicators: string[];
  } {
    const indicators: string[] = [];
    let intensity = 0;

    // Check for intensity words
    const intensityWords = [
      'extremely', 'incredibly', 'absolutely', 'completely', 'totally',
      'utterly', 'ridiculously', 'insanely', 'massively', 'hugely'
    ];
    
    const lowerText = text.toLowerCase();
    for (const word of intensityWords) {
      if (lowerText.includes(word)) {
        intensity += 0.1;
        indicators.push(word);
      }
    }

    // Check for repetitive punctuation
    const repetitivePattern = /([.!?])\1{2,}/g;
    const repetitiveMatches = text.match(repetitivePattern);
    if (repetitiveMatches) {
      intensity += repetitiveMatches.length * 0.1;
      indicators.push('repetitive punctuation');
    }

    // Check for word repetition
    const words = text.toLowerCase().split(/\s+/);
    const wordCounts = new Map<string, number>();
    
    for (const word of words) {
      if (word.length > 3) { // Only count meaningful words
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }
    
    for (const [word, count] of wordCounts) {
      if (count > 2) {
        intensity += (count - 2) * 0.05;
        indicators.push(`repeated "${word}"`);
      }
    }

    return {
      intensity: Math.min(1, intensity),
      indicators
    };
  }
} 