// ─────────────────────────────────────────────
// SENTINEL Tests — Unit: Predictive Anomaly Detector
// ─────────────────────────────────────────────

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Calculates Z-Score anomaly metric for sensory stream
 */
function calculateZScore(value, mean, stdDev) {
  if (stdDev === 0) return 0;
  return Math.abs((value - mean) / stdDev);
}

/**
 * Calculates Exponentially Weighted Moving Average (EWMA)
 */
function calculateEWMA(currentVal, previousEWMA, alpha = 0.2) {
  if (previousEWMA === null || previousEWMA === undefined) return currentVal;
  return alpha * currentVal + (1 - alpha) * previousEWMA;
}

/**
 * Simple Ordinary Least Squares linear regression slope
 */
function calculateDriftSlope(points) {
  const n = points.length;
  if (n < 2) return 0;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    const y = points[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return 0;
  return (n * sumXY - sumX * sumY) / denominator;
}

describe('Predictive Anomaly Detector Unit Tests', () => {
  it('should compute accurate Z-score for normal and anomalous readings', () => {
    const mean = 20.0;
    const stdDev = 2.0;

    // Value 21.0 -> 0.5 standard deviations (normal)
    assert.equal(calculateZScore(21.0, mean, stdDev), 0.5);

    // Value 27.0 -> 3.5 standard deviations (anomaly, > 3.0 threshold)
    const anomalousZ = calculateZScore(27.0, mean, stdDev);
    assert.equal(anomalousZ, 3.5);
    assert.ok(anomalousZ > 3.0);
  });

  it('should compute smoothed EWMA series', () => {
    let ewma = null;
    const readings = [20, 21, 22, 23, 25];
    const alpha = 0.3;

    for (const r of readings) {
      ewma = calculateEWMA(r, ewma, alpha);
    }

    assert.ok(ewma > 20 && ewma < 25);
  });

  it('should compute linear regression slope indicating positive thermal drift', () => {
    // Steadily increasing temperature over 5 intervals
    const temps = [20.0, 20.5, 21.0, 21.5, 22.0];
    const slope = calculateDriftSlope(temps);

    // Expected slope = 0.5 degrees per interval
    assert.ok(Math.abs(slope - 0.5) < 0.0001);
  });
});

