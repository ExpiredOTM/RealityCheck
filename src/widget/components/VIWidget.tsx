import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { VulnerabilityIndex } from '../../types/index.js';

interface VIWidgetProps {
  vulnerability: VulnerabilityIndex | null;
  onInterventionClick?: () => void;
  onDetailsClick?: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  minimized?: boolean;
  onToggleMinimize?: () => void;
}

export function VIWidget({
  vulnerability,
  onInterventionClick,
  onDetailsClick,
  position = 'top-right',
  minimized = false,
  onToggleMinimize
}: VIWidgetProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [pulseActive, setPulseActive] = useState(false);

  useEffect(() => {
    if (vulnerability && vulnerability.current > 70) {
      setPulseActive(true);
      const timer = setTimeout(() => setPulseActive(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [vulnerability?.current]);

  if (!isVisible || !vulnerability) {
    return null;
  }

  const getColorClass = (score: number) => {
    if (score >= 85) return 'bg-danger-500';
    if (score >= 70) return 'bg-warning-500';
    if (score >= 40) return 'bg-warning-300';
    return 'bg-success-500';
  };

  const getTextColorClass = (score: number) => {
    if (score >= 70) return 'text-white';
    return 'text-gray-800';
  };

  const getRiskLevel = (score: number) => {
    if (score >= 85) return 'HIGH';
    if (score >= 70) return 'MEDIUM';
    if (score >= 40) return 'LOW';
    return 'MINIMAL';
  };

  const getPositionClasses = () => {
    const base = 'fixed z-50';
    switch (position) {
      case 'top-right':
        return `${base} top-4 right-4`;
      case 'top-left':
        return `${base} top-4 left-4`;
      case 'bottom-right':
        return `${base} bottom-4 right-4`;
      case 'bottom-left':
        return `${base} bottom-4 left-4`;
      default:
        return `${base} top-4 right-4`;
    }
  };

  if (minimized) {
    return (
      <div 
        className={`${getPositionClasses()} ${getColorClass(vulnerability.current)} rounded-full w-12 h-12 shadow-lg cursor-pointer flex items-center justify-center ${pulseActive ? 'animate-pulse' : ''}`}
        onClick={onToggleMinimize}
        title={`Reality Check: ${Math.round(vulnerability.current)} (${getRiskLevel(vulnerability.current)})`}
      >
        <span className={`text-sm font-bold ${getTextColorClass(vulnerability.current)}`}>
          {Math.round(vulnerability.current)}
        </span>
      </div>
    );
  }

  return (
    <div className={`${getPositionClasses()} bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-64 ${pulseActive ? 'animate-pulse' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getColorClass(vulnerability.current)}`}></div>
          <span className="text-sm font-semibold text-gray-700">Reality Check</span>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={onToggleMinimize}
            className="text-gray-400 hover:text-gray-600 p-1"
            title="Minimize"
          >
            <MinimizeIcon />
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600 p-1"
            title="Hide"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* VI Score Display */}
      <div className="text-center mb-3">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getColorClass(vulnerability.current)} mb-2`}>
          <span className={`text-2xl font-bold ${getTextColorClass(vulnerability.current)}`}>
            {Math.round(vulnerability.current)}
          </span>
        </div>
        <div className="text-xs text-gray-600">
          {getRiskLevel(vulnerability.current)} RISK
        </div>
      </div>

      {/* Trend Indicator */}
      {vulnerability.trend !== 0 && (
        <div className="flex items-center justify-center mb-3">
          <span className="text-xs text-gray-500 mr-1">Trend:</span>
          <div className="flex items-center">
            {vulnerability.trend > 0 ? (
              <TrendUpIcon className="w-3 h-3 text-red-500" />
            ) : (
              <TrendDownIcon className="w-3 h-3 text-green-500" />
            )}
            <span className={`text-xs ml-1 ${vulnerability.trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {vulnerability.trend > 0 ? '+' : ''}{(vulnerability.trend * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* Component Breakdown */}
      <div className="space-y-1 mb-3">
        <ComponentBar label="Sentiment" value={vulnerability.components.sentiment} color="blue" />
        <ComponentBar label="Distortion" value={vulnerability.components.distortion} color="red" />
        <ComponentBar label="Rage" value={vulnerability.components.rage} color="orange" />
        <ComponentBar label="Scroll" value={vulnerability.components.scroll} color="purple" />
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        {vulnerability.current > 70 && (
          <button
            onClick={onInterventionClick}
            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white text-xs py-2 px-3 rounded transition-colors"
          >
            Take Break
          </button>
        )}
        <button
          onClick={onDetailsClick}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-2 px-3 rounded transition-colors"
        >
          Details
        </button>
      </div>

      {/* Confidence Indicator */}
      <div className="mt-2 text-center">
        <span className="text-xs text-gray-400">
          Confidence: {Math.round(vulnerability.confidence * 100)}%
        </span>
      </div>
    </div>
  );
}

interface ComponentBarProps {
  label: string;
  value: number;
  color: 'blue' | 'red' | 'orange' | 'purple';
}

function ComponentBar({ label, value, color }: ComponentBarProps) {
  const getColorClass = () => {
    switch (color) {
      case 'blue': return 'bg-blue-500';
      case 'red': return 'bg-red-500';
      case 'orange': return 'bg-orange-500';
      case 'purple': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-600 w-16">{label}</span>
      <div className="flex-1 mx-2 bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${getColorClass()}`}
          style={{ width: `${Math.min(100, value * 100)}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">
        {Math.round(value * 100)}
      </span>
    </div>
  );
}

// Icon components
function MinimizeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function TrendUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7h-10" />
    </svg>
  );
}

function TrendDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
    </svg>
  );
} 