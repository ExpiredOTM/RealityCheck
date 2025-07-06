// Core Types and Interfaces for Reality Check Suite

export interface ExtractedContent {
  id: string;
  text: string;
  timestamp: number;
  platform: Platform;
  type: ContentType;
  metadata: ContentMetadata;
}

export interface ContentMetadata {
  url: string;
  scrollPosition: number;
  isVisible: boolean;
  parentElement?: string;
  contextHint?: string;
}

export enum Platform {
  CHATGPT = 'chatgpt',
  CLAUDE = 'claude',
  GEMINI = 'gemini',
  TWITTER = 'twitter',
  REDDIT = 'reddit',
  FACEBOOK = 'facebook',
  YOUTUBE = 'youtube',
  UNKNOWN = 'unknown'
}

export enum ContentType {
  USER_MESSAGE = 'user_message',
  AI_RESPONSE = 'ai_response',
  SOCIAL_POST = 'social_post',
  COMMENT = 'comment',
  FEED_ITEM = 'feed_item',
  UNKNOWN = 'unknown'
}

export interface ScrollMetrics {
  velocity: number;
  direction: 'up' | 'down';
  dwellTime: number;
  rapidScrollCount: number;
  timestamp: number;
}

export interface NLPAnalysis {
  sentiment: SentimentAnalysis;
  cognitiveDistortions: CognitiveDistortion[];
  rageIndicators: RageIndicator[];
  confidence: number;
  processingTime: number;
}

export interface SentimentAnalysis {
  valence: number; // -1 to 1
  arousal: number; // 0 to 1
  dominance?: number; // 0 to 1
  confidence: number;
}

export interface CognitiveDistortion {
  type: DistortionType;
  severity: number; // 0 to 1
  keywords: string[];
  context: string;
}

export enum DistortionType {
  PERSECUTION = 'persecution',
  GRANDIOSITY = 'grandiosity',
  CONSPIRACY = 'conspiracy',
  CATASTROPHIZING = 'catastrophizing',
  ALL_OR_NOTHING = 'all_or_nothing',
  MIND_READING = 'mind_reading',
  FORTUNE_TELLING = 'fortune_telling'
}

export interface RageIndicator {
  type: RageType;
  intensity: number; // 0 to 1
  pattern: string;
  context: string;
}

export enum RageType {
  VERBAL_AGGRESSION = 'verbal_aggression',
  CAPS_LOCK = 'caps_lock',
  EXCLAMATION_SPAM = 'exclamation_spam',
  PROFANITY = 'profanity',
  THREAT_LANGUAGE = 'threat_language'
}

export interface VulnerabilityIndex {
  current: number; // 0 to 100
  trend: number; // -1 to 1
  components: VIComponents;
  timestamp: number;
  confidence: number;
}

export interface VIComponents {
  sentiment: number;
  distortion: number;
  rage: number;
  timeIntensity: number;
  crossPlatform: number;
  scroll: number;
}

export interface InterventionTrigger {
  id: string;
  type: InterventionType;
  condition: TriggerCondition;
  config: InterventionConfig;
  lastTriggered?: number;
  cooldownMs: number;
}

export enum InterventionType {
  GENTLE_NUDGE = 'gentle_nudge',
  BREATHING_REMINDER = 'breathing_reminder',
  BREAK_SUGGESTION = 'break_suggestion',
  GREY_OUT = 'grey_out',
  SOUND_ALERT = 'sound_alert'
}

export interface TriggerCondition {
  viThreshold?: number;
  durationMs?: number;
  spikeThreshold?: number;
  scrollThreshold?: number;
}

export interface InterventionConfig {
  title: string;
  message: string;
  duration?: number;
  dismissible: boolean;
  breakDurationMs?: number;
  soundEnabled?: boolean;
}

export interface SessionData {
  id: string;
  startTime: number;
  endTime?: number;
  platform: Platform;
  url: string;
  contentCount: number;
  viHistory: VulnerabilityIndex[];
  scrollMetrics: ScrollMetrics[];
  interventions: InterventionEvent[];
  totalTimeMs: number;
  averageVI: number;
  peakVI: number;
}

export interface InterventionEvent {
  id: string;
  type: InterventionType;
  timestamp: number;
  viAtTrigger: number;
  userResponse: 'dismissed' | 'accepted' | 'ignored' | 'pending';
  responseTime?: number;
}

export interface UserSettings {
  enabledPlatforms: Platform[];
  interventionSettings: {
    [key in InterventionType]: {
      enabled: boolean;
      threshold: number;
      cooldownMs: number;
    };
  };
  privacySettings: {
    localProcessingOnly: boolean;
    encryptStorage: boolean;
    shareAnonymousData: boolean;
  };
  displaySettings: {
    widgetPosition: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    showDetailedMetrics: boolean;
    darkMode: boolean;
  };
}

export interface RuleConfig {
  ruleId: string;
  pattern: string;
  weight: number;
  category: DistortionType | RageType;
  enabled: boolean;
}

export interface AnalysisWindow {
  windowId: string;
  startTime: number;
  endTime: number;
  content: ExtractedContent[];
  analysis: NLPAnalysis;
  vi: VulnerabilityIndex;
}

// Event types for communication between components
export interface ExtensionMessage {
  type: MessageType;
  data?: any;
  timestamp: number;
  source: 'content' | 'background' | 'popup' | 'widget';
}

export enum MessageType {
  CONTENT_EXTRACTED = 'content_extracted',
  ANALYSIS_COMPLETE = 'analysis_complete',
  VI_UPDATED = 'vi_updated',
  INTERVENTION_TRIGGERED = 'intervention_triggered',
  SETTINGS_UPDATED = 'settings_updated',
  SESSION_STARTED = 'session_started',
  SESSION_ENDED = 'session_ended'
} 