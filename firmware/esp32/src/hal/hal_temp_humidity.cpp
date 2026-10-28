/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Project Sentinel — ESP32 HAL Temperature & Humidity Sensor Driver
 * ─────────────────────────────────────────────────────────────────────────────
 * File: hal_temp_humidity.cpp
 * Description: High-precision I2C driver for Sensirion SHT31/AHT20 ambient thermal
 *              and relative humidity sensor with CRC-8 data integrity checking.
 * ─────────────────────────────────────────────────────────────────────────────
 */

#include <Arduino.h>
#include <Wire.h>
#include "../../include/sentinel_hal.h"

static uint8_t s_sht_i2c_addr = I2C_ADDR_SHT31;
static bool s_temp_hum_initialized = false;
static hal_temp_humidity_reading_t s_last_reading;

// SHT31 CRC-8 verification (Polynomial: 0x31, Init: 0xFF)
static uint8_t sht_crc8(const uint8_t* data, uint8_t len) {
    uint8_t crc = 0xFF;
    for (uint8_t i = 0; i < len; i++) {
        crc ^= data[i];
        for (uint8_t bit = 8; bit > 0; --bit) {
            if (crc & 0x80) {
                crc = (crc << 1) ^ 0x31;
            } else {
                crc = (crc << 1);
            }
        }
    }
    return crc;
}

bool hal_temp_humidity_init(uint8_t sda_pin, uint8_t scl_pin, uint8_t i2c_addr) {
    s_sht_i2c_addr = i2c_addr;
    Wire.begin(sda_pin, scl_pin, I2C_FREQUENCY_HZ);

    // Test connectivity
    Wire.beginTransmission(s_sht_i2c_addr);
    bool ack = (Wire.endTransmission() == 0);

    s_temp_hum_initialized = true;
    s_last_reading.temperature_c = 22.0f; // Baseline fallback
    s_last_reading.humidity_pct = 45.0f;
    s_last_reading.healthy = ack;

    return ack;
}

hal_temp_humidity_reading_t hal_temp_humidity_read(void) {
    if (!s_temp_hum_initialized) {
        s_last_reading.healthy = false;
        return s_last_reading;
    }

    // Trigger measurement: High repeatability without clock stretching (0x2400)
    Wire.beginTransmission(s_sht_i2c_addr);
    Wire.write(0x24);
    Wire.write(0x00);
    if (Wire.endTransmission() != 0) {
        s_last_reading.healthy = false;
        return s_last_reading;
    }

    delay(15); // Wait for conversion completion

    uint8_t count = Wire.requestFrom((int)s_sht_i2c_addr, 6);
    if (count == 6) {
        uint8_t buf[6];
        for (int i = 0; i < 6; i++) {
            buf[i] = Wire.read();
        }

        // Verify Temperature CRC
        bool temp_valid = (sht_crc8(buf, 2) == buf[2]);
        // Verify Humidity CRC
        bool hum_valid = (sht_crc8(&buf[3], 2) == buf[5]);

        if (temp_valid && hum_valid) {
            uint16_t raw_temp = (uint16_t)((buf[0] << 8) | buf[1]);
            uint16_t raw_hum = (uint16_t)((buf[3] << 8) | buf[4]);

            // SHT31 Conversion Formulas:
            // T = -45 + 175 * (raw / 65535)
            // RH = 100 * (raw / 65535)
            float t = -45.0f + 175.0f * ((float)raw_temp / 65535.0f);
            float rh = 100.0f * ((float)raw_hum / 65535.0f);

            // Bounds verification
            if (t >= -40.0f && t <= 85.0f && rh >= 0.0f && rh <= 100.0f) {
                s_last_reading.temperature_c = t;
                s_last_reading.humidity_pct = rh;
                s_last_reading.healthy = true;
            }
        } else {
            s_last_reading.healthy = false;
        }
    } else {
        s_last_reading.healthy = false;
    }

    return s_last_reading;
}

bool hal_temp_humidity_health(void) {
    if (!s_temp_hum_initialized) return false;
    Wire.beginTransmission(s_sht_i2c_addr);
    return (Wire.endTransmission() == 0);
}

void hal_temp_humidity_deinit(void) {
    s_temp_hum_initialized = false;
}
