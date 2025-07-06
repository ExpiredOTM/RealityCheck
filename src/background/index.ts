import { ExtensionMessage, MessageType, SessionData } from '../types/index.js';

class RealityCheckBackground {
  private sessions: Map<number, SessionData> = new Map();
  private nlpWorker: Worker | null = null;

  constructor() {
    this.setupMessageHandlers();
    this.setupExtensionLifecycle();
    console.log('[Reality Check] Background script initialized');
  }

  private setupMessageHandlers(): void {
    // Handle messages from content scripts
    chrome.runtime.onMessage.addListener((
      message: ExtensionMessage,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Indicate we will respond asynchronously
    });
  }

  private setupExtensionLifecycle(): void {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener(() => {
      console.log('[Reality Check] Extension installed');
      this.initializeExtension();
    });

    // Handle tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.handleTabUpdate(tabId, tab);
      }
    });

    // Handle tab removal
    chrome.tabs.onRemoved.addListener((tabId) => {
      this.handleTabRemoved(tabId);
    });
  }

  private async handleMessage(
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ): Promise<void> {
    try {
      switch (message.type) {
        case MessageType.SESSION_STARTED:
          if (sender.tab?.id) {
            await this.handleSessionStarted(sender.tab.id, message.data);
          }
          break;

        case MessageType.SESSION_ENDED:
          if (sender.tab?.id) {
            await this.handleSessionEnded(sender.tab.id, message.data);
          }
          break;

        case MessageType.CONTENT_EXTRACTED:
          if (sender.tab?.id) {
            await this.handleContentExtracted(sender.tab.id, message.data);
          }
          break;

        case MessageType.VI_UPDATED:
          if (sender.tab?.id) {
            await this.handleVIUpdated(sender.tab.id, message.data);
          }
          break;

        case MessageType.INTERVENTION_TRIGGERED:
          if (sender.tab?.id) {
            await this.handleInterventionTriggered(sender.tab.id, message.data);
          }
          break;

        default:
          console.log('[Reality Check] Unknown message type:', message.type);
      }

      sendResponse({ success: true });
    } catch (error) {
      console.error('[Reality Check] Error handling message:', error);
      sendResponse({ success: false, error: (error as Error).message });
    }
  }

  private async initializeExtension(): Promise<void> {
    // Set default settings
    const defaultSettings = {
      enabledPlatforms: ['chatgpt', 'twitter', 'reddit'],
      interventionThresholds: {
        gentle_nudge: { enabled: true, threshold: 70 },
        break_suggestion: { enabled: true, threshold: 80 },
        grey_out: { enabled: false, threshold: 90 }
      },
      privacySettings: {
        localProcessingOnly: true,
        encryptStorage: true,
        shareAnonymousData: false
      }
    };

    await chrome.storage.local.set({ settings: defaultSettings });
    console.log('[Reality Check] Default settings initialized');
  }

  private async handleSessionStarted(tabId: number, data: any): Promise<void> {
    const session: SessionData = {
      id: `session_${tabId}_${Date.now()}`,
      startTime: data.timestamp,
      platform: data.platform,
      url: data.url,
      contentCount: 0,
      viHistory: [],
      scrollMetrics: [],
      interventions: [],
      totalTimeMs: 0,
      averageVI: 0,
      peakVI: 0
    };

    this.sessions.set(tabId, session);
    console.log(`[Reality Check] Session started for tab ${tabId}:`, data.platform);
  }

  private async handleSessionEnded(tabId: number, data: any): Promise<void> {
    const session = this.sessions.get(tabId);
    if (session) {
      session.endTime = data.timestamp;
      session.totalTimeMs = session.endTime! - session.startTime;
      
      // Calculate statistics
      if (session.viHistory.length > 0) {
        session.averageVI = session.viHistory.reduce((sum, vi) => sum + vi.current, 0) / session.viHistory.length;
        session.peakVI = Math.max(...session.viHistory.map(vi => vi.current));
      }

      // Store session data
      await this.storeSessionData(session);
      
      // Remove from active sessions
      this.sessions.delete(tabId);
      
      console.log(`[Reality Check] Session ended for tab ${tabId}`);
    }
  }

  private async handleContentExtracted(tabId: number, data: any): Promise<void> {
    const session = this.sessions.get(tabId);
    if (session) {
      session.contentCount += data.content.length;
      
      // Forward to content script for widget updates
      try {
        await chrome.tabs.sendMessage(tabId, {
          type: 'analysis_result',
          data: data,
          source: 'background',
          timestamp: Date.now()
        });
      } catch (error) {
        console.debug('[Reality Check] Could not send message to tab:', error);
      }
    }
  }

  private async handleVIUpdated(tabId: number, data: any): Promise<void> {
    const session = this.sessions.get(tabId);
    if (session) {
      // Store VI in session history
      if (data.vulnerability) {
        session.viHistory.push(data.vulnerability);
      }
      
      // Forward to widget
      try {
        await chrome.tabs.sendMessage(tabId, {
          type: MessageType.VI_UPDATED,
          data: data.vulnerability || data,
          source: 'background',
          timestamp: Date.now()
        });
      } catch (error) {
        console.debug('[Reality Check] Could not send VI update to tab:', error);
      }
    }
  }

  private async handleInterventionTriggered(tabId: number, data: any): Promise<void> {
    const session = this.sessions.get(tabId);
    if (session) {
      // Log intervention
      session.interventions.push({
        id: `intervention_${Date.now()}`,
        type: data.type,
        timestamp: data.timestamp,
        viAtTrigger: data.viAtTrigger,
        userResponse: 'pending'
      });

      console.log(`[Reality Check] Intervention triggered for tab ${tabId}:`, data.type);
      
      // Handle different intervention types
      switch (data.type) {
        case 'break_suggestion':
          await this.showBreakSuggestion(tabId);
          break;
        case 'grey_out':
          await this.activateGreyOut(tabId);
          break;
      }
    }
  }

  private async showBreakSuggestion(tabId: number): Promise<void> {
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: 'show_intervention',
        data: {
          type: 'break_suggestion',
          title: 'Take a Mindful Break',
          message: 'Your digital wellbeing indicators suggest it might be helpful to take a short break. Consider stepping away for a few minutes.',
          duration: 10000 // 10 seconds
        },
        source: 'background',
        timestamp: Date.now()
      });
    } catch (error) {
      console.debug('[Reality Check] Could not show break suggestion:', error);
    }
  }

  private async activateGreyOut(tabId: number): Promise<void> {
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: 'show_intervention',
        data: {
          type: 'grey_out',
          title: 'Pause & Reflect',
          message: 'Your vulnerability indicators are elevated. Take a moment to breathe and reflect before continuing.',
          duration: 60000 // 1 minute
        },
        source: 'background',
        timestamp: Date.now()
      });
    } catch (error) {
      console.debug('[Reality Check] Could not activate grey out:', error);
    }
  }

  private async handleTabUpdate(tabId: number, tab: chrome.tabs.Tab): Promise<void> {
    // Check if tab is on a supported platform
    if (tab.url && this.isSupportedPlatform(tab.url)) {
      console.log(`[Reality Check] Supported platform detected: ${tab.url}`);
    }
  }

  private handleTabRemoved(tabId: number): void {
    // Clean up session data
    if (this.sessions.has(tabId)) {
      this.sessions.delete(tabId);
      console.log(`[Reality Check] Cleaned up session for closed tab ${tabId}`);
    }
  }

  private isSupportedPlatform(url: string): boolean {
    const supportedDomains = [
      'chat.openai.com',
      'claude.ai',
      'gemini.google.com',
      'twitter.com',
      'x.com',
      'reddit.com',
      'facebook.com',
      'youtube.com'
    ];

    return supportedDomains.some(domain => url.includes(domain));
  }

  private async storeSessionData(session: SessionData): Promise<void> {
    try {
      // Get existing session history
      const result = await chrome.storage.local.get(['sessionHistory']);
      const sessionHistory = result.sessionHistory || [];
      
      // Add new session
      sessionHistory.push(session);
      
      // Keep only last 100 sessions
      if (sessionHistory.length > 100) {
        sessionHistory.splice(0, sessionHistory.length - 100);
      }
      
      // Store updated history
      await chrome.storage.local.set({ sessionHistory });
      
      console.log('[Reality Check] Session data stored');
    } catch (error) {
      console.error('[Reality Check] Error storing session data:', error);
    }
  }
}

// Initialize background script
new RealityCheckBackground(); 