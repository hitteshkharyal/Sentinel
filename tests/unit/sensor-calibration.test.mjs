// ─────────────────────────────────────────────
// SENTINEL Tests — Unit: Sensor Calibration & Bounds Validation
// ─────────────────────────────────────────────

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Standard Sentinel Linear Sensor Calibration Formula:
 * Calibrated = (Raw - Baseline) * Multiplier + Offset
 */
function applySensorCalibration(raw, config = {}) {
  const baseline = config.baselineCorrection ?? 0;
  const multiplier = config.calibrationMultiplier ?? 1.0;
  const offset = config.calibrationOffset ?? 0;
  return (raw - baseline) * multiplier + offset;
}

/**
 * Physical Sensory Plausibility Range Verification
 */
function isWithinPhysicalBounds(type, value) {
  switch (type) {
    case 'temperature':
      return value >= -50 && value <= 100; // °C
    case 'co2':
      return value >= 0 && value <= 10000; // ppm
    case 'humidity':
      return value >= 0 && value <= 100; // %RH
    case 'soundLevel':
      return value >= 20 && value <= 140; // dB SPL
    case 'pressure':
      return value >= 300 && value <= 1200; // hPa
    default:
      return true;
  }
}

describe('Sensor Calibration & Bounds Unit Tests', () => {
  it('should calculate accurate linear calibration with multiplier and offset', () => {
    const rawTemp = 24.0;
    const config = {
      baselineCorrection: 1.0,
      calibrationMultiplier: 1.05,
      calibrationOffset: -0.2,
    };
    // Expected: (24.0 - 1.0) * 1.05 - 0.2 = 23 * 1.05 - 0.2 = 24.15 - 0.2 = 23.95
    const calibrated = applySensorCalibration(rawTemp, config);
    assert.ok(Math.abs(calibrated - 23.95) < 0.0001);
  });

  it('should return raw value unchanged when default identity config is applied', () => {
    const rawCo2 = 850;
    const calibrated = applySensorCalibration(rawCo2, {});
    assert.equal(calibrated, rawCo2);
  });

  it('should handle zero raw values and negative baseline corrections', () => {
    const raw = 0;
    const config = {
      baselineCorrection: -5.0,
      calibrationMultiplier: 2.0,
      calibrationOffset: 10.0,
    };
    // (0 - (-5)) * 2 + 10 = 5 * 2 + 10 = 20
    const calibrated = applySensorCalibration(raw, config);
    assert.equal(calibrated, 20);
  });

  it('should validate normal physical sensor bounds', () => {
    assert.equal(isWithinPhysicalBounds('temperature', 22.5), true);
    assert.equal(isWithinPhysicalBounds('co2', 450), true);
    assert.equal(isWithinPhysicalBounds('humidity', 55), true);
    assert.equal(isWithinPhysicalBounds('soundLevel', 65), true);
    assert.equal(isWithinPhysicalBounds('pressure', 1013.25), true);
  });

  it('should reject out-of-range sensor readings (glitches & electrical faults)', () => {
    assert.equal(isWithinPhysicalBounds('temperature', 250), false);
    assert.equal(isWithinPhysicalBounds('co2', -100), false);
    assert.equal(isWithinPhysicalBounds('humidity', 120), false);
    assert.equal(isWithinPhysicalBounds('soundLevel', 180), false);
    assert.equal(isWithinPhysicalBounds('pressure', 50), false);
  });
});

