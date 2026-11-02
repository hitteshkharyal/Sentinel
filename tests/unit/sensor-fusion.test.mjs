// ─────────────────────────────────────────────
// SENTINEL Tests — Unit: Sensor Fusion & State Correlation
// ─────────────────────────────────────────────

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Sensor Fusion State Classifier
 */
function classifySpatialState(signals) {
  const { pirMotion, mmwavePresence, mmwaveHeadcount, mmwaveMicromovement, fallIndication } = signals;

  if (fallIndication) {
    return { state: 'ASSISTANCE_REQUIRED', confidence: 0.95 };
  }

  if (mmwaveHeadcount && mmwaveHeadcount > 10) {
    return { state: 'OVERCAPACITY', confidence: 0.90 };
  }

  if (pirMotion && mmwavePresence) {
    return { state: 'CONFIRMED_ACTIVE_OCCUPANCY', confidence: 0.98 };
  }

  if (!pirMotion && mmwavePresence && mmwaveMicromovement) {
    return { state: 'SEDENTARY_OCCUPANCY', confidence: 0.88 };
  }

  if (!pirMotion && !mmwavePresence) {
    return { state: 'VACANT', confidence: 0.99 };
  }

  return { state: 'TRANSIENT_MOTION', confidence: 0.70 };
}

/**
 * Exponential Confidence Decay Calculation:
 * C(t) = C_0 * e^(-lambda * delta_t)
 */
function calculateDecayedConfidence(initialConfidence, elapsedMs, halfLifeMs = 60000) {
  if (elapsedMs <= 0) return initialConfidence;
  const lambda = Math.LN2 / halfLifeMs;
  const decayed = initialConfidence * Math.exp(-lambda * elapsedMs);
  return Math.max(0.1, Math.min(1.0, decayed));
}

describe('Sensor Fusion & Correlation Unit Tests', () => {
  it('should detect CONFIRMED_ACTIVE_OCCUPANCY when both PIR and mmWave fire', () => {
    const result = classifySpatialState({
      pirMotion: true,
      mmwavePresence: true,
      mmwaveHeadcount: 2,
      mmwaveMicromovement: true,
    });
    assert.equal(result.state, 'CONFIRMED_ACTIVE_OCCUPANCY');
    assert.ok(result.confidence >= 0.95);
  });

  it('should classify SEDENTARY_OCCUPANCY when mmWave micro-movement detects resting occupant with no PIR trip', () => {
    const result = classifySpatialState({
      pirMotion: false,
      mmwavePresence: true,
      mmwaveHeadcount: 1,
      mmwaveMicromovement: true,
    });
    assert.equal(result.state, 'SEDENTARY_OCCUPANCY');
    assert.ok(result.confidence >= 0.85);
  });

  it('should trigger ASSISTANCE_REQUIRED immediately on fall indication', () => {
    const result = classifySpatialState({
      pirMotion: false,
      mmwavePresence: true,
      mmwaveHeadcount: 1,
      fallIndication: true,
    });
    assert.equal(result.state, 'ASSISTANCE_REQUIRED');
    assert.equal(result.confidence, 0.95);
  });

  it('should correctly classify VACANT state when all sensors report clear', () => {
    const result = classifySpatialState({
      pirMotion: false,
      mmwavePresence: false,
      mmwaveHeadcount: 0,
      mmwaveMicromovement: false,
    });
    assert.equal(result.state, 'VACANT');
    assert.ok(result.confidence > 0.95);
  });

  it('should accurately decay confidence over time using half-life', () => {
    const initial = 1.0;
    const halfLife = 60000; // 60s

    const afterOneHalfLife = calculateDecayedConfidence(initial, 60000, halfLife);
    assert.ok(Math.abs(afterOneHalfLife - 0.5) < 0.01);

    const afterTwoHalfLives = calculateDecayedConfidence(initial, 120000, halfLife);
    assert.ok(Math.abs(afterTwoHalfLives - 0.25) < 0.01);
  });
});

