/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Project Sentinel — ESP32 HAL Sound Level (SPL) Sensor Driver
 * ─────────────────────────────────────────────────────────────────────────────
 * File: hal_sound.cpp
 * Description: ADC analog acoustic pressure driver with peak-to-peak windowing
 *              and logarithmic conversion to Sound Pressure Level (dB SPL).
 * ─────────────────────────────────────────────────────────────────────────────
 */

#include <Arduino.h>
#include <math.h>
#include "../../include/sentinel_hal.h"

static uint8_t s_sound_adc_pin = PIN_SOUND_ADC;
static bool s_sound_initialized = false;
static const uint32_t SAMPLE_WINDOW_MS = 50; // 50ms sampling window (20Hz limit)
static const float NOISE_FLOOR_DB = 32.0f;
static const float MAX_CEILING_DB = 125.0f;

bool hal_sound_init(uint8_t adc_pin) {
    s_sound_adc_pin = adc_pin;
    
    // Configure ESP32 ADC: 12-bit resolution (0 - 4095), 11dB attenuation (up to ~3.3V)
    analogReadResolution(12);
    analogSetPinAttenuation(s_sound_adc_pin, ADC_11db);
    
    s_sound_initialized = true;
    return true;
}

hal_sound_reading_t hal_sound_read(void) {
    hal_sound_reading_t reading;
    memset(&reading, 0, sizeof(reading));

    if (!s_sound_initialized) {
        reading.healthy = false;
        return reading;
    }

    uint32_t start_time = millis();
    uint16_t signal_max = 0;
    uint16_t signal_min = 4095;

    // Collect peak-to-peak amplitude across audio window
    while (millis() - start_time < SAMPLE_WINDOW_MS) {
        uint16_t sample = analogRead(s_sound_adc_pin);
        if (sample < 4096) {
            if (sample > signal_max) {
                signal_max = sample;
            }
            if (sample < signal_min) {
                signal_min = sample;
            }
        }
    }

    uint16_t peak_to_peak = (signal_max >= signal_min) ? (signal_max - signal_min) : 0;
    reading.peak_adc = peak_to_peak;

    // Convert ADC peak-to-peak to volts (0 - 3.3V across 4095 counts)
    float volts_p_p = ((float)peak_to_peak * 3.3f) / 4095.0f;

    // Convert Volts peak-to-peak to decibels SPL:
    // Reference 0.001V = ~30 dB SPL
    float db_spl;
    if (volts_p_p <= 0.005f) {
        db_spl = NOISE_FLOOR_DB;
    } else {
        db_spl = 20.0f * log10f(volts_p_p / 0.001f) + 10.0f;
    }

    if (db_spl < NOISE_FLOOR_DB) db_spl = NOISE_FLOOR_DB;
    if (db_spl > MAX_CEILING_DB) db_spl = MAX_CEILING_DB;

    reading.spl_db = db_spl;
    reading.healthy = true;

    return reading;
}

bool hal_sound_health(void) {
    return s_sound_initialized;
}

void hal_sound_deinit(void) {
    s_sound_initialized = false;
}
