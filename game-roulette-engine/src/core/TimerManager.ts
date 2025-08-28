/**
 * Manages the countdown timer for game switching
 */
export class TimerManager {
  private interval: number | null = null;
  private timeout: number | null = null;
  private intervalMs: number;
  private isRunning: boolean = false;
  private startTime: number = 0;
  private callback: (() => void) | null = null;

  constructor(intervalMs: number = 60000) {
    this.intervalMs = intervalMs;
  }

  /**
   * Start the timer
   */
  public start(callback: () => void): void {
    if (this.isRunning) return;
    
    this.callback = callback;
    this.isRunning = true;
    this.startTime = Date.now();
    
    // Set timeout for the first interval
    this.timeout = window.setTimeout(() => {
      this.executeCallback();
      this.startInterval();
    }, this.intervalMs);
    
    console.log(`⏰ Timer started with ${this.intervalMs / 1000}s interval`);
  }

  /**
   * Stop the timer
   */
  public stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    console.log('⏰ Timer stopped');
  }

  /**
   * Restart the timer
   */
  public restart(): void {
    if (this.isRunning) {
      this.stop();
    }
    
    if (this.callback) {
      this.start(this.callback);
    }
  }

  /**
   * Pause the timer
   */
  public pause(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    
    console.log('⏸️ Timer paused');
  }

  /**
   * Resume the timer
   */
  public resume(): void {
    if (this.isRunning) return;
    
    if (!this.callback) return;
    
    const elapsed = Date.now() - this.startTime;
    const remaining = Math.max(0, this.intervalMs - (elapsed % this.intervalMs));
    
    this.isRunning = true;
    
    // Set timeout for remaining time
    this.timeout = window.setTimeout(() => {
      this.executeCallback();
      this.startInterval();
    }, remaining);
    
    console.log(`▶️ Timer resumed with ${remaining / 1000}s remaining`);
  }

  /**
   * Set new interval
   */
  public setInterval(intervalMs: number): void {
    this.intervalMs = intervalMs;
    
    if (this.isRunning) {
      this.restart();
    }
    
    console.log(`⏰ Timer interval updated to ${intervalMs / 1000}s`);
  }

  /**
   * Get time remaining until next execution
   */
  public getTimeRemaining(): number {
    if (!this.isRunning) return 0;
    
    const elapsed = Date.now() - this.startTime;
    return Math.max(0, this.intervalMs - (elapsed % this.intervalMs));
  }

  /**
   * Get time elapsed since start
   */
  public getTimeElapsed(): number {
    if (!this.isRunning) return 0;
    return Date.now() - this.startTime;
  }

  /**
   * Check if timer is running
   */
  public get running(): boolean {
    return this.isRunning;
  }

  /**
   * Get current interval
   */
  public get interval(): number {
    return this.intervalMs;
  }

  // Private methods

  private startInterval(): void {
    if (!this.isRunning) return;
    
    // Set up recurring interval
    this.interval = window.setInterval(() => {
      this.executeCallback();
    }, this.intervalMs);
  }

  private executeCallback(): void {
    if (this.callback) {
      try {
        this.callback();
      } catch (error) {
        console.error('❌ Error in timer callback:', error);
      }
    }
  }
}
