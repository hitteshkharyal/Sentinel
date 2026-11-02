// ─────────────────────────────────────────────
// SENTINEL Tests — Unit: Sliding-Window Rate Limiter
// ─────────────────────────────────────────────

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

class MemoryRateLimiterBucket {
  constructor(windowMs, max) {
    this.windowMs = windowMs;
    this.max = max;
    this.hits = new Map();
  }

  check(key, now = Date.now()) {
    let record = this.hits.get(key);
    if (!record || record.resetTime <= now) {
      record = { count: 1, resetTime: now + this.windowMs };
      this.hits.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, this.max - record.count);
    const blocked = record.count > this.max;
    return { count: record.count, remaining, blocked, resetTime: record.resetTime };
  }
}

describe('Rate Limiter Bucket Mechanics Unit Tests', () => {
  it('should allow requests within limit and decrement remaining tokens', () => {
    const limiter = new MemoryRateLimiterBucket(60000, 5);
    const now = 100000;

    const r1 = limiter.check('192.168.1.50', now);
    assert.equal(r1.count, 1);
    assert.equal(r1.remaining, 4);
    assert.equal(r1.blocked, false);

    const r2 = limiter.check('192.168.1.50', now + 100);
    assert.equal(r2.count, 2);
    assert.equal(r2.remaining, 3);
    assert.equal(r2.blocked, false);
  });

  it('should block requests when exceeding maximum threshold', () => {
    const limiter = new MemoryRateLimiterBucket(60000, 3);
    const now = 100000;

    limiter.check('ip-attacker', now);
    limiter.check('ip-attacker', now + 10);
    const r3 = limiter.check('ip-attacker', now + 20);
    assert.equal(r3.blocked, false);
    assert.equal(r3.remaining, 0);

    const r4 = limiter.check('ip-attacker', now + 30);
    assert.equal(r4.blocked, true);
    assert.equal(r4.count, 4);
    assert.equal(r4.remaining, 0);
  });

  it('should reset bucket count after windowMs expires', () => {
    const limiter = new MemoryRateLimiterBucket(60000, 2);
    const now = 100000;

    limiter.check('test-user', now);
    limiter.check('test-user', now + 1000);

    // After 61 seconds, bucket must reset
    const afterReset = limiter.check('test-user', now + 61000);
    assert.equal(afterReset.count, 1);
    assert.equal(afterReset.remaining, 1);
    assert.equal(afterReset.blocked, false);
  });
});
