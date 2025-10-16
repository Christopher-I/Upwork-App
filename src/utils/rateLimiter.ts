/**
 * Rate Limiter for Upwork API
 * Conservative limits: 75% of Upwork's maximum
 * - 7 requests/second (vs. 10/sec max)
 * - 225 requests/minute (vs. 300/min max)
 * - 30,000 requests/day (vs. 40,000/day max)
 */

export class RateLimiter {
  private readonly MAX_PER_SECOND = 7;
  private readonly MAX_PER_MINUTE = 225;
  private readonly MAX_PER_DAY = 30000;

  private requestsThisSecond = 0;
  private requestsThisMinute = 0;
  private requestsToday = 0;

  private secondWindowStart = Date.now();
  private minuteWindowStart = Date.now();
  private dayWindowStart = Date.now();

  /**
   * Throttle an API call to respect rate limits
   */
  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    await this.waitIfNeeded();

    // Increment counters
    this.requestsThisSecond++;
    this.requestsThisMinute++;
    this.requestsToday++;

    try {
      const result = await fn();
      return result;
    } catch (error: any) {
      // Handle 429 Too Many Requests
      if (error.status === 429) {
        const retryAfter = error.headers?.['retry-after'] || 60;
        console.warn(`Rate limited by Upwork. Waiting ${retryAfter}s`);
        await this.delay(retryAfter * 1000);

        // Retry once
        return this.throttle(fn);
      }
      throw error;
    }
  }

  /**
   * Wait if we're approaching rate limits
   */
  private async waitIfNeeded(): Promise<void> {
    this.resetWindowsIfExpired();

    // Check daily limit (hard stop)
    if (this.requestsToday >= this.MAX_PER_DAY) {
      throw new Error(
        `Daily API limit reached (${this.MAX_PER_DAY}). Resets at midnight PST.`
      );
    }

    // Wait if hitting per-second limit
    if (this.requestsThisSecond >= this.MAX_PER_SECOND) {
      const waitTime = 1000 - (Date.now() - this.secondWindowStart);
      if (waitTime > 0) {
        await this.delay(waitTime);
        this.requestsThisSecond = 0;
        this.secondWindowStart = Date.now();
      }
    }

    // Wait if hitting per-minute limit
    if (this.requestsThisMinute >= this.MAX_PER_MINUTE) {
      const waitTime = 60000 - (Date.now() - this.minuteWindowStart);
      if (waitTime > 0) {
        await this.delay(waitTime);
        this.requestsThisMinute = 0;
        this.minuteWindowStart = Date.now();
      }
    }
  }

  /**
   * Reset time windows if expired
   */
  private resetWindowsIfExpired(): void {
    const now = Date.now();

    // Reset second window
    if (now - this.secondWindowStart >= 1000) {
      this.requestsThisSecond = 0;
      this.secondWindowStart = now;
    }

    // Reset minute window
    if (now - this.minuteWindowStart >= 60000) {
      this.requestsThisMinute = 0;
      this.minuteWindowStart = now;
    }

    // Reset day window (PST timezone)
    const pstMidnight = this.getPSTMidnight();
    if (now >= pstMidnight) {
      this.requestsToday = 0;
      this.dayWindowStart = now;
    }
  }

  /**
   * Get midnight timestamp in PST
   */
  private getPSTMidnight(): number {
    const now = new Date();
    const pst = new Date(
      now.toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
      })
    );

    const midnight = new Date(pst);
    midnight.setHours(24, 0, 0, 0);

    return midnight.getTime();
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get current usage statistics
   */
  getUsageStats() {
    return {
      second: `${this.requestsThisSecond}/${this.MAX_PER_SECOND}`,
      minute: `${this.requestsThisMinute}/${this.MAX_PER_MINUTE}`,
      day: `${this.requestsToday}/${this.MAX_PER_DAY}`,
      percentOfDaily:
        ((this.requestsToday / this.MAX_PER_DAY) * 100).toFixed(2) + '%',
    };
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();
