import { CognitiveDistortion, DistortionType, RuleConfig } from '../types/index.js';

export class DistortionDetector {
  private rules: RuleConfig[] = [];
  private isInitialized: boolean = false;

  constructor() {
    this.initializeRules();
  }

  /**
   * Detect cognitive distortions in text
   */
  public detectDistortions(text: string): CognitiveDistortion[] {
    if (!this.isInitialized) {
      this.initializeRules();
    }

    const distortions: CognitiveDistortion[] = [];
    const lowerText = text.toLowerCase();

    // Check each rule
    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      const matches = this.checkRule(lowerText, rule);
      if (matches.length > 0) {
        const distortion = this.createDistortion(rule, matches, text);
        if (distortion) {
          distortions.push(distortion);
        }
      }
    }

    // Sort by severity (highest first)
    return distortions.sort((a, b) => b.severity - a.severity);
  }

  /**
   * Get distortion summary
   */
  public getDistortionSummary(distortions: CognitiveDistortion[]): {
    totalSeverity: number;
    mostSevereType: DistortionType | null;
    typeCount: Record<DistortionType, number>;
  } {
    const typeCount: Record<DistortionType, number> = {
      [DistortionType.PERSECUTION]: 0,
      [DistortionType.GRANDIOSITY]: 0,
      [DistortionType.CONSPIRACY]: 0,
      [DistortionType.CATASTROPHIZING]: 0,
      [DistortionType.ALL_OR_NOTHING]: 0,
      [DistortionType.MIND_READING]: 0,
      [DistortionType.FORTUNE_TELLING]: 0
    };

    let totalSeverity = 0;
    let mostSevereType: DistortionType | null = null;
    let maxSeverity = 0;

    for (const distortion of distortions) {
      totalSeverity += distortion.severity;
      typeCount[distortion.type]++;

      if (distortion.severity > maxSeverity) {
        maxSeverity = distortion.severity;
        mostSevereType = distortion.type;
      }
    }

    return {
      totalSeverity: Math.min(1, totalSeverity),
      mostSevereType,
      typeCount
    };
  }

  /**
   * Initialize detection rules
   */
  private initializeRules(): void {
    this.rules = [
      // Persecution patterns
      {
        ruleId: 'persecution_watching',
        pattern: '(they|everyone|people).*(watching|monitoring|tracking|following|stalking).*(me|us)',
        weight: 0.8,
        category: DistortionType.PERSECUTION,
        enabled: true
      },
      {
        ruleId: 'persecution_targeting',
        pattern: '(they|everyone).*(targeting|after|coming for|out to get).*(me|us)',
        weight: 0.9,
        category: DistortionType.PERSECUTION,
        enabled: true
      },
      {
        ruleId: 'persecution_control',
        pattern: '(they|government|system).*(controlling|manipulating|brainwashing).*(me|us|people)',
        weight: 0.7,
        category: DistortionType.PERSECUTION,
        enabled: true
      },

      // Conspiracy patterns
      {
        ruleId: 'conspiracy_deep_state',
        pattern: '(deep state|shadow government|cabal|elites).*(control|run|manipulate)',
        weight: 0.6,
        category: DistortionType.CONSPIRACY,
        enabled: true
      },
      {
        ruleId: 'conspiracy_planned',
        pattern: '(all planned|orchestrated|coordinated).*(by|from).*(them|elites|government)',
        weight: 0.7,
        category: DistortionType.CONSPIRACY,
        enabled: true
      },
      {
        ruleId: 'conspiracy_sheep',
        pattern: '(sheep|sheeple|wake up|open your eyes).*(truth|reality|what.*really)',
        weight: 0.5,
        category: DistortionType.CONSPIRACY,
        enabled: true
      },

      // Grandiosity patterns
      {
        ruleId: 'grandiosity_chosen',
        pattern: '(i am|i\'m).*(chosen|special|enlightened|awakened|above)',
        weight: 0.6,
        category: DistortionType.GRANDIOSITY,
        enabled: true
      },
      {
        ruleId: 'grandiosity_superior',
        pattern: '(i|me).*(superior|better than|above).*(everyone|most people|them)',
        weight: 0.7,
        category: DistortionType.GRANDIOSITY,
        enabled: true
      },
      {
        ruleId: 'grandiosity_genius',
        pattern: '(i am|i\'m).*(genius|brilliant|extraordinary|gifted)',
        weight: 0.4,
        category: DistortionType.GRANDIOSITY,
        enabled: true
      },

      // Catastrophizing patterns
      {
        ruleId: 'catastrophizing_end',
        pattern: '(end of|collapse|destruction|apocalypse|doom).*(world|society|everything)',
        weight: 0.6,
        category: DistortionType.CATASTROPHIZING,
        enabled: true
      },
      {
        ruleId: 'catastrophizing_disaster',
        pattern: '(disaster|catastrophe|crisis|emergency).*(coming|approaching|inevitable)',
        weight: 0.7,
        category: DistortionType.CATASTROPHIZING,
        enabled: true
      },
      {
        ruleId: 'catastrophizing_worst',
        pattern: '(worst|terrible|horrible|awful).*(ever|possible|imaginable)',
        weight: 0.5,
        category: DistortionType.CATASTROPHIZING,
        enabled: true
      },

      // All-or-nothing patterns
      {
        ruleId: 'all_or_nothing_always',
        pattern: '(always|never|everyone|no one|everything|nothing).*(does|is|will)',
        weight: 0.4,
        category: DistortionType.ALL_OR_NOTHING,
        enabled: true
      },
      {
        ruleId: 'all_or_nothing_perfect',
        pattern: '(perfect|complete|total|absolute).*(failure|success|disaster|victory)',
        weight: 0.5,
        category: DistortionType.ALL_OR_NOTHING,
        enabled: true
      },

      // Mind reading patterns
      {
        ruleId: 'mind_reading_think',
        pattern: '(they|everyone|people).*(think|believe|know).*(i am|i\'m|about me)',
        weight: 0.6,
        category: DistortionType.MIND_READING,
        enabled: true
      },
      {
        ruleId: 'mind_reading_judging',
        pattern: '(they|everyone).*(judging|laughing at|looking down on).*(me|us)',
        weight: 0.7,
        category: DistortionType.MIND_READING,
        enabled: true
      },

      // Fortune telling patterns
      {
        ruleId: 'fortune_telling_will',
        pattern: '(this will|it will|they will).*(destroy|ruin|end|fail)',
        weight: 0.5,
        category: DistortionType.FORTUNE_TELLING,
        enabled: true
      },
      {
        ruleId: 'fortune_telling_never',
        pattern: '(i will never|it will never|nothing will ever).*(work|succeed|get better)',
        weight: 0.6,
        category: DistortionType.FORTUNE_TELLING,
        enabled: true
      }
    ];

    this.isInitialized = true;
  }

  /**
   * Check if text matches a rule
   */
  private checkRule(text: string, rule: RuleConfig): string[] {
    const matches: string[] = [];
    
    try {
      // Convert rule pattern to regex
      const regex = new RegExp(rule.pattern, 'gi');
      const found = text.match(regex);
      
      if (found) {
        matches.push(...found);
      }
    } catch (error) {
      console.error(`[Reality Check] Error checking rule ${rule.ruleId}:`, error);
    }
    
    return matches;
  }

  /**
   * Create distortion object from rule match
   */
  private createDistortion(rule: RuleConfig, matches: string[], context: string): CognitiveDistortion | null {
    if (matches.length === 0) return null;

    // Calculate severity based on rule weight and match frequency
    const baseScore = rule.weight;
    const frequencyMultiplier = Math.min(matches.length * 0.1, 0.5);
    const severity = Math.min(1, baseScore + frequencyMultiplier);

    // Extract keywords from matches
    const keywords = matches.map(match => match.toLowerCase().trim());

    // Get context around the match
    const contextSnippet = this.extractContext(context, matches[0]);

    return {
      type: rule.category as DistortionType,
      severity,
      keywords,
      context: contextSnippet
    };
  }

  /**
   * Extract context around a match
   */
  private extractContext(text: string, match: string): string {
    const matchIndex = text.toLowerCase().indexOf(match.toLowerCase());
    if (matchIndex === -1) return match;

    const start = Math.max(0, matchIndex - 50);
    const end = Math.min(text.length, matchIndex + match.length + 50);
    
    return text.substring(start, end).trim();
  }

  /**
   * Add custom rule
   */
  public addRule(rule: RuleConfig): void {
    this.rules.push(rule);
  }

  /**
   * Update rule status
   */
  public updateRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.find(r => r.ruleId === ruleId);
    if (rule) {
      rule.enabled = enabled;
    }
  }

  /**
   * Get all rules
   */
  public getRules(): RuleConfig[] {
    return [...this.rules];
  }

  /**
   * Get rules by category
   */
  public getRulesByCategory(category: DistortionType): RuleConfig[] {
    return this.rules.filter(rule => rule.category === category);
  }

  /**
   * Calculate overall distortion risk
   */
  public calculateDistortionRisk(text: string): number {
    const distortions = this.detectDistortions(text);
    const summary = this.getDistortionSummary(distortions);
    
    // Weight different types of distortions
    const typeWeights = {
      [DistortionType.PERSECUTION]: 0.9,
      [DistortionType.CONSPIRACY]: 0.8,
      [DistortionType.GRANDIOSITY]: 0.6,
      [DistortionType.CATASTROPHIZING]: 0.7,
      [DistortionType.ALL_OR_NOTHING]: 0.5,
      [DistortionType.MIND_READING]: 0.6,
      [DistortionType.FORTUNE_TELLING]: 0.5
    };

    let weightedRisk = 0;
    for (const [type, count] of Object.entries(summary.typeCount)) {
      const weight = typeWeights[type as DistortionType] || 0.5;
      weightedRisk += count * weight * 0.1;
    }

    return Math.min(1, weightedRisk + summary.totalSeverity * 0.5);
  }
} 