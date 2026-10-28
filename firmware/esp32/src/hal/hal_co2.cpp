/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Project Sentinel — ESP32 HAL Sensirion SCD40 / SCD30 CO2 Sensor Driver
 * ─────────────────────────────────────────────────────────────────────────────
 * File: hal_co2.cpp
 * Description: Photoacoustic I2C driver for Sensirion SCD40/SCD41 CO2 sensor
 *              with Sensirion CRC-8 checksum verification and periodic measurement.
 * ─────────────────────────────────────────────────────────────────────────────
 */

#include <Arduino.h>
#include <Wire.h>
#include "../../include/sentinel_hal.h"

static uint8_t s_co2_i2c_addr = I2C_ADDR_SCD40;
static bool s_co2_initialized = false;
static hal_co2_reading_t s_last_co2_reading;
static uint32_t s_last_read_time = 0;

// Sensirion CRC-8 verification (Polynomial: 0x31, Init: 0xFF)
static uint8_t sensirion_crc8(const uint8_t* data, uint8_t len) {
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

static bool scd40_send_cmd(uint16_t cmd) {
    Wire.beginTransmission(s_co2_i2c_addr);
    Wire.write((uint8_t)(cmd >> 8));
    Wire.write((uint8_t)(cmd & 0xFF));
    return (Wire.endTransmission() == 0);
}

bool hal_co2_init(uint8_t sda_pin, uint8_t scl_pin, uint8_t i2c_addr) {
    s_co2_i2c_addr = i2c_addr;
    Wire.begin(sda_pin, scl_pin, I2C_FREQUENCY_HZ);

    // Stop periodic measurement first (in case already running)
    scd40_send_cmd(0x3F86);
    delay(500);

    // Start periodic measurement (Command: 0x21B1)
    bool started = scd40_send_cmd(0x21B1);
    
    s_co2_initialized = true;
    s_last_co2_reading.co2_ppm = 450.0f; // Ambient baseline
    s_last_co2_reading.healthy = started;
    s_last_read_time = millis();

    return started;
}

hal_co2_reading_t hal_co2_read(void) {
    if (!s_co2_initialized) {
        s_last_co2_reading.healthy = false;
        return s_last_co2_reading;
    }

    // SCD40 updates measurement every 5 seconds
    if (millis() - s_last_read_time < 4500 && s_last_read_time > 0) {
        return s_last_co2_reading;
    }

    // Command: read_measurement (0xEC05)
    if (!scd40_send_cmd(0xEC05)) {
        s_last_co2_reading.healthy = false;
        return s_last_co2_reading;
    }

    delay(5); // SCD40 I2C processing wait
    uint8_t bytes_received = Wire.requestFrom((int)s_co2_i2c_addr, 9);
    if (bytes_received == 9) {
        uint8_t buf[9];
        for (int i = 0; i < 9; i++) {
            buf[i] = Wire.read();
        }

        // Validate CRC on CO2 word (bytes 0, 1 vs byte 2)
        if (sensirion_crc8(buf, 2) == buf[2]) {
            uint16_t raw_co2 = (uint16_t)((buf[0] << 8) | buf[1]);
            if (raw_co2 >= 300 && raw_co2 <= 10000) {
                s_last_co2_reading.co2_ppm = (float)raw_co2;
                s_last_co2_reading.healthy = true;
                s_last_read_time = millis();
            }
        } else {
            s_last_co2_reading.healthy = false;
        }
    } else {
        s_last_co2_reading.healthy = false;
    }

    return s_last_co2_reading;
}

bool hal_co2_health(void) {
    if (!s_co2_initialized) return false;
    Wire.beginTransmission(s_co2_i2c_addr);
    return (Wire.endTransmission() == 0);
}

void hal_co2_deinit(void) {
    if (s_co2_initialized) {
        // Stop periodic measurement
        scd40_send_cmd(0x3F86);
        s_co2_initialized = false;
    }
}
