/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Project Sentinel — ESP32 HAL Ambient Light (Lux) Sensor Driver
 * ─────────────────────────────────────────────────────────────────────────────
 * File: hal_light.cpp
 * Description: I2C driver for Rohm BH1750 ambient light lux meter with automatic
 *              ADC analog LDR fallback for versatile hardware deployment.
 * ─────────────────────────────────────────────────────────────────────────────
 */

#include <Arduino.h>
#include <Wire.h>
#include <math.h>
#include "../../include/sentinel_hal.h"

static uint8_t s_light_i2c_addr = I2C_ADDR_BH1750;
static uint8_t s_light_adc_pin = PIN_LIGHT_ADC;
static bool s_has_i2c_sensor = false;
static bool s_light_initialized = false;
static hal_light_reading_t s_last_reading;

bool hal_light_init(uint8_t sda_pin, uint8_t scl_pin, uint8_t i2c_addr, uint8_t adc_pin) {
    s_light_i2c_addr = i2c_addr;
    s_light_adc_pin = adc_pin;

    Wire.begin(sda_pin, scl_pin, I2C_FREQUENCY_HZ);

    // Test BH1750 presence
    Wire.beginTransmission(s_light_i2c_addr);
    s_has_i2c_sensor = (Wire.endTransmission() == 0);

    if (s_has_i2c_sensor) {
        // Send Power On (0x01)
        Wire.beginTransmission(s_light_i2c_addr);
        Wire.write(0x01);
        Wire.endTransmission();

        // Continuous High Resolution Mode (0x10)
        Wire.beginTransmission(s_light_i2c_addr);
        Wire.write(0x10);
        Wire.endTransmission();
    } else {
        // Configure ADC pin fallback
        analogReadResolution(12);
        analogSetPinAttenuation(s_light_adc_pin, ADC_11db);
    }

    s_light_initialized = true;
    s_last_reading.lux = 300.0f; // Typical indoor lux
    s_last_reading.healthy = true;

    return true;
}

hal_light_reading_t hal_light_read(void) {
    if (!s_light_initialized) {
        s_last_reading.healthy = false;
        return s_last_reading;
    }

    if (s_has_i2c_sensor) {
        uint8_t count = Wire.requestFrom((int)s_light_i2c_addr, 2);
        if (count == 2) {
            uint16_t raw = (uint16_t)((Wire.read() << 8) | Wire.read());
            // BH1750 lux = raw / 1.2
            float lux = (float)raw / 1.2f;
            if (lux >= 0.0f && lux <= 65535.0f) {
                s_last_reading.lux = lux;
                s_last_reading.healthy = true;
            }
        } else {
            s_last_reading.healthy = false;
        }
    } else {
        // ADC fallback LDR calculation
        uint16_t adc = analogRead(s_light_adc_pin);
        // Map 12-bit ADC (0-4095) inverted: 0=dark, 4095=bright
        float norm = (float)(4095 - adc) / 4095.0f;
        float lux = powf(10.0f, norm * 4.0f); // 1 to 10,000 Lux
        s_last_reading.lux = lux;
        s_last_reading.healthy = true;
    }

    return s_last_reading;
}

bool hal_light_health(void) {
    if (!s_light_initialized) return false;
    if (s_has_i2c_sensor) {
        Wire.beginTransmission(s_light_i2c_addr);
        return (Wire.endTransmission() == 0);
    }
    return true;
}

void hal_light_deinit(void) {
    if (s_light_initialized && s_has_i2c_sensor) {
        // Power down BH1750 (0x00)
        Wire.beginTransmission(s_light_i2c_addr);
        Wire.write(0x00);
        Wire.endTransmission();
    }
    s_light_initialized = false;
}
