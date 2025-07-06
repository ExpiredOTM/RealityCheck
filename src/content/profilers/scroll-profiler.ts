import { ScrollMetrics } from '../../types/index.js';

export class ScrollProfiler {
  private scrollHistory: ScrollMetrics[] = [];
  private lastScrollPosition: number = 0;
  private lastScrollTime: number = 0;
  private scrollStartTime: number = 0;
  private isScrolling: boolean = false;
  private scrollTimeout: number | null = null;
  private dwellStartTime: number = 0;
  private rapidScrollCount: number = 0;
  private isActive: boolean = false;

  // Configuration
  private readonly RAPID_SCROLL_THRESHOLD = 1000; // pixels per second
  private readonly DWELL_TIME_MIN = 1000; // minimum dwell time in ms
  private readonly SCROLL_HISTORY_LIMIT = 100; // maximum stored scroll events
  private readonly SCROLL_TIMEOUT_MS = 150; // time to wait before considering scroll stopped

  constructor() {
    this.handleScroll = this.handleScroll.bind(this);
    this.handleScrollEnd = this.handleScrollEnd.bind(this);
  }

  /**
   * Start monitoring scroll behavior
   */
  public start(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.lastScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    this.lastScrollTime = Date.now();
    this.dwellStartTime = Date.now();
    
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    
    // Also listen for visibility changes to pause/resume tracking
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }

  /**
   * Stop monitoring scroll behavior
   */
  public stop(): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    window.removeEventListener('scroll', this.handleScroll);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }
  }

  /**
   * Get recent scroll metrics
   */
  public getRecentMetrics(sinceMs: number = 30000): ScrollMetrics[] {
    const since = Date.now() - sinceMs;
    return this.scrollHistory.filter(metric => metric.timestamp > since);
  }

  /**
   * Get current scroll state
   */
  public getCurrentState(): {
    isScrolling: boolean;
    rapidScrollCount: number;
    currentVelocity: number;
    dwellTime: number;
  } {
    const currentTime = Date.now();
    const dwellTime = this.isScrolling ? 0 : currentTime - this.dwellStartTime;
    
    return {
      isScrolling: this.isScrolling,
      rapidScrollCount: this.rapidScrollCount,
      currentVelocity: this.calculateCurrentVelocity(),
      dwellTime
    };
  }

  /**
   * Clear old scroll history to manage memory
   */
  public clearOldHistory(olderThanMs: number = 300000): void { // 5 minutes
    const cutoff = Date.now() - olderThanMs;
    this.scrollHistory = this.scrollHistory.filter(metric => metric.timestamp > cutoff);
  }

  /**
   * Check if current behavior indicates rage scrolling
   */
  public isRageScrolling(): boolean {
    const recentMetrics = this.getRecentMetrics(10000); // Last 10 seconds
    
    if (recentMetrics.length < 3) return false;
    
    // Check for rapid scrolling pattern
    const rapidScrolls = recentMetrics.filter(m => m.velocity > this.RAPID_SCROLL_THRESHOLD);
    const rapidScrollRatio = rapidScrolls.length / recentMetrics.length;
    
    // Check for direction changes (back-and-forth scrolling)
    const directionChanges = this.countDirectionChanges(recentMetrics);
    
    // Check for low dwell times (not pausing to read)
    const avgDwellTime = recentMetrics.reduce((sum, m) => sum + m.dwellTime, 0) / recentMetrics.length;
    
    return (
      rapidScrollRatio > 0.6 || // More than 60% rapid scrolls
      directionChanges > 3 || // More than 3 direction changes
      (avgDwellTime < 500 && rapidScrollRatio > 0.4) // Low dwell time with some rapid scrolls
    );
  }

  /**
   * Get rage scrolling intensity (0-1)
   */
  public getRageScrollIntensity(): number {
    const recentMetrics = this.getRecentMetrics(10000);
    
    if (recentMetrics.length < 2) return 0;
    
    const rapidScrolls = recentMetrics.filter(m => m.velocity > this.RAPID_SCROLL_THRESHOLD);
    const rapidScrollRatio = rapidScrolls.length / recentMetrics.length;
    
    const directionChanges = this.countDirectionChanges(recentMetrics);
    const directionChangeRatio = directionChanges / Math.max(recentMetrics.length - 1, 1);
    
    const avgDwellTime = recentMetrics.reduce((sum, m) => sum + m.dwellTime, 0) / recentMetrics.length;
    const dwellTimeScore = Math.max(0, 1 - avgDwellTime / 2000); // Normalize to 0-1
    
    // Combine metrics with weights
    const intensity = (
      rapidScrollRatio * 0.4 +
      directionChangeRatio * 0.3 +
      dwellTimeScore * 0.3
    );
    
    return Math.min(1, intensity);
  }

  private handleScroll(): void {
    if (!this.isActive) return;
    
    const currentTime = Date.now();
    const currentPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    // Calculate scroll metrics
    const timeDelta = currentTime - this.lastScrollTime;
    const positionDelta = currentPosition - this.lastScrollPosition;
    
    if (timeDelta > 0) {
      const velocity = Math.abs(positionDelta) / timeDelta * 1000; // pixels per second
      const direction = positionDelta > 0 ? 'down' : 'up';
      
      // Update rapid scroll count
      if (velocity > this.RAPID_SCROLL_THRESHOLD) {
        this.rapidScrollCount++;
      }
      
      // Calculate dwell time
      const dwellTime = this.isScrolling ? 0 : currentTime - this.dwellStartTime;
      
      // Create scroll metric
      const scrollMetric: ScrollMetrics = {
        velocity,
        direction,
        dwellTime,
        rapidScrollCount: this.rapidScrollCount,
        timestamp: currentTime
      };
      
      // Add to history
      this.scrollHistory.push(scrollMetric);
      
      // Limit history size
      if (this.scrollHistory.length > this.SCROLL_HISTORY_LIMIT) {
        this.scrollHistory.shift();
      }
      
      // Update state
      this.isScrolling = true;
      this.lastScrollPosition = currentPosition;
      this.lastScrollTime = currentTime;
      
      // Reset scroll timeout
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
      }
      this.scrollTimeout = window.setTimeout(this.handleScrollEnd, this.SCROLL_TIMEOUT_MS);
    }
  }

  private handleScrollEnd(): void {
    this.isScrolling = false;
    this.dwellStartTime = Date.now();
    this.scrollTimeout = null;
    
    // Reset rapid scroll count gradually
    this.rapidScrollCount = Math.max(0, this.rapidScrollCount - 1);
  }

  private handleVisibilityChange(): void {
    if (document.visibilityState === 'hidden') {
      // Page is hidden, pause tracking
      this.isScrolling = false;
      if (this.scrollTimeout) {
        clearTimeout(this.scrollTimeout);
        this.scrollTimeout = null;
      }
    } else {
      // Page is visible again, resume tracking
      this.dwellStartTime = Date.now();
      this.lastScrollTime = Date.now();
      this.lastScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    }
  }

  private calculateCurrentVelocity(): number {
    if (this.scrollHistory.length < 2) return 0;
    
    const recent = this.scrollHistory.slice(-3); // Last 3 scroll events
    const totalVelocity = recent.reduce((sum, metric) => sum + metric.velocity, 0);
    
    return totalVelocity / recent.length;
  }

  private countDirectionChanges(metrics: ScrollMetrics[]): number {
    if (metrics.length < 2) return 0;
    
    let changes = 0;
    for (let i = 1; i < metrics.length; i++) {
      if (metrics[i].direction !== metrics[i - 1].direction) {
        changes++;
      }
    }
    
    return changes;
  }
} 