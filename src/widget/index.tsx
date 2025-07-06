import { h, render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { VIWidget } from './components/VIWidget.js';
import { VulnerabilityIndex, ExtensionMessage, MessageType } from '../types/index.js';
import '../styles/widget.css';

class RealityCheckWidget {
  private container: HTMLElement | null = null;
  private vulnerability: VulnerabilityIndex | null = null;
  private isMinimized: boolean = false;

  constructor() {
    this.createContainer();
    this.setupMessageListener();
    this.render();
  }

  private createContainer(): void {
    // Create widget container
    this.container = document.createElement('div');
    this.container.id = 'reality-check-widget';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 2147483647;
    `;

    // Add to document
    document.body.appendChild(this.container);
    console.log('[Reality Check] Widget container created');
  }

  private setupMessageListener(): void {
    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
      if (message.type === MessageType.VI_UPDATED && message.data) {
        this.updateVulnerability(message.data);
      }
    });
  }

  private updateVulnerability(vi: VulnerabilityIndex): void {
    this.vulnerability = vi;
    this.render();
  }

  private handleInterventionClick = (): void => {
    // Send intervention request
    chrome.runtime.sendMessage({
      type: MessageType.INTERVENTION_TRIGGERED,
      data: {
        type: 'break_suggestion',
        viAtTrigger: this.vulnerability?.current || 0,
        timestamp: Date.now()
      },
      source: 'widget',
      timestamp: Date.now()
    });
  };

  private handleDetailsClick = (): void => {
    // Open extension popup or detailed view
    chrome.runtime.sendMessage({
      type: 'open_details',
      source: 'widget',
      timestamp: Date.now()
    });
  };

  private handleToggleMinimize = (): void => {
    this.isMinimized = !this.isMinimized;
    this.render();
  };

  private render(): void {
    if (!this.container) return;

    render(
      <WidgetApp
        vulnerability={this.vulnerability}
        minimized={this.isMinimized}
        onInterventionClick={this.handleInterventionClick}
        onDetailsClick={this.handleDetailsClick}
        onToggleMinimize={this.handleToggleMinimize}
      />,
      this.container
    );
  }

  public destroy(): void {
    if (this.container) {
      document.body.removeChild(this.container);
      this.container = null;
    }
  }
}

interface WidgetAppProps {
  vulnerability: VulnerabilityIndex | null;
  minimized: boolean;
  onInterventionClick: () => void;
  onDetailsClick: () => void;
  onToggleMinimize: () => void;
}

function WidgetApp({
  vulnerability,
  minimized,
  onInterventionClick,
  onDetailsClick,
  onToggleMinimize
}: WidgetAppProps) {
  return (
    <div style={{ pointerEvents: 'auto' }}>
      <VIWidget
        vulnerability={vulnerability}
        minimized={minimized}
        onInterventionClick={onInterventionClick}
        onDetailsClick={onDetailsClick}
        onToggleMinimize={onToggleMinimize}
        position="top-right"
      />
    </div>
  );
}

// Initialize widget when script loads
let widget: RealityCheckWidget | null = null;

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeWidget);
} else {
  initializeWidget();
}

function initializeWidget() {
  if (!widget) {
    widget = new RealityCheckWidget();
    console.log('[Reality Check] Widget initialized');
  }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (widget) {
    widget.destroy();
    widget = null;
  }
});

// Export for testing
if (typeof window !== 'undefined') {
  (window as any).realityCheckWidget = widget;
} 