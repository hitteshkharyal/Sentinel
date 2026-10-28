/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Project Sentinel — ESP32 HAL Bosch BMP280 Barometric Pressure Driver
 * ─────────────────────────────────────────────────────────────────────────────
 * File: hal_pressure.cpp
 * Description: I2C driver for Bosch Sensortec BMP280 pressure sensor implementing
 *              factory calibration coefficient compensation (hPa cleanroom monitor).
 * ─────────────────────────────────────────────────────────────────────────────
 */

#include <Arduino.h>
#include <Wire.h>
#include "../../include/sentinel_hal.h"

static uint8_t s_bmp_i2c_addr = I2C_ADDR_BMP280;
static bool s_bmp_initialized = false;
static hal_pressure_reading_t s_last_reading;

// BMP280 Calibration Registers Structure
typedef struct {
    uint16_t dig_T1;
    int16_t  dig_T2;
    int16_t  dig_T3;
    uint16_t dig_P1;
    int16_t  dig_P2;
    int16_t  dig_P3;
    int16_t  dig_P4;
    int16_t  dig_P5;
    int16_t  dig_P6;
    int16_t  dig_P7;
    int16_t  dig_P8;
    int16_t  dig_P9;
} bmp280_calib_t;

static bmp280_calib_t s_calib;
static int32_t s_t_fine = 0;

static uint8_t read8(uint8_t reg) {
    Wire.beginTransmission(s_bmp_i2c_addr);
    Wire.write(reg);
    Wire.endTransmission();
    Wire.requestFrom((int)s_bmp_i2c_addr, 1);
    return Wire.read();
}

static uint16_t read16_LE(uint8_t reg) {
    Wire.beginTransmission(s_bmp_i2c_addr);
    Wire.write(reg);
    Wire.endTransmission();
    Wire.requestFrom((int)s_bmp_i2c_addr, 2);
    return (uint16_t)(Wire.read() | (Wire.read() << 8));
}

static int16_t readS16_LE(uint8_t reg) {
    return (int16_t)read16_LE(reg);
}

static void read_calibration_data(void) {
    s_calib.dig_T1 = read16_LE(0x88);
    s_calib.dig_T2 = readS16_LE(0x8A);
    s_calib.dig_T3 = readS16_LE(0x8C);
    s_calib.dig_P1 = read16_LE(0x8E);
    s_calib.dig_P2 = readS16_LE(0x90);
    s_calib.dig_P3 = readS16_LE(0x92);
    s_calib.dig_P4 = readS16_LE(0x94);
    s_calib.dig_P5 = readS16_LE(0x96);
    s_calib.dig_P6 = readS16_LE(0x98);
    s_calib.dig_P7 = readS16_LE(0x9A);
    s_calib.dig_P8 = readS16_LE(0x9C);
    s_calib.dig_P9 = readS16_LE(0x9E);
}

bool hal_pressure_init(uint8_t sda_pin, uint8_t scl_pin, uint8_t i2c_addr) {
    s_bmp_i2c_addr = i2c_addr;
    Wire.begin(sda_pin, scl_pin, I2C_FREQUENCY_HZ);

    // Verify Chip ID (0x58 = BMP280)
    uint8_t chip_id = read8(0xD0);
    bool valid_id = (chip_id == 0x58 || chip_id == 0x60); // BMP280 or BME280

    if (valid_id) {
        read_calibration_data();

        // Configure: normal mode, temp oversampling x1, pressure oversampling x1
        Wire.beginTransmission(s_bmp_i2c_addr);
        Wire.write(0xF4); // ctrl_meas
        Wire.write(0x27); // 001 001 11
        Wire.endTransmission();

        s_bmp_initialized = true;
        s_last_reading.pressure_hpa = 1013.25f; // Standard atmospheric pressure
        s_last_reading.healthy = true;
    } else {
        // Fallback baseline for emulation
        s_bmp_initialized = true;
        s_last_reading.pressure_hpa = 1013.25f;
        s_last_reading.healthy = false;
    }

    return valid_id;
}

hal_pressure_reading_t hal_pressure_read(void) {
    if (!s_bmp_initialized) {
        s_last_reading.healthy = false;
        return s_last_reading;
    }

    // Read 6 bytes starting at 0xF7 (press_msb, press_lsb, press_xlsb, temp_msb, temp_lsb, temp_xlsb)
    Wire.beginTransmission(s_bmp_i2c_addr);
    Wire.write(0xF7);
    if (Wire.endTransmission() != 0) {
        s_last_reading.healthy = false;
        return s_last_reading;
    }

    uint8_t count = Wire.requestFrom((int)s_bmp_i2c_addr, 6);
    if (count == 6) {
        uint32_t raw_p = ((uint32_t)Wire.read() << 12) | ((uint32_t)Wire.read() << 4) | ((uint32_t)Wire.read() >> 4);
        uint32_t raw_t = ((uint32_t)Wire.read() << 12) | ((uint32_t)Wire.read() << 4) | ((uint32_t)Wire.read() >> 4);

        // Compensate Temperature to get s_t_fine
        int32_t var1 = ((((raw_t >> 3) - ((int32_t)s_calib.dig_T1 << 1))) * ((int32_t)s_calib.dig_T2)) >> 11;
        int32_t var2 = (((((raw_t >> 4) - ((int32_t)s_calib.dig_T1)) * ((raw_t >> 4) - ((int32_t)s_calib.dig_T1))) >> 12) * ((int32_t)s_calib.dig_T3)) >> 14;
        s_t_fine = var1 + var2;

        // Compensate Pressure (Bosch 64-bit integer formula)
        int64_t p_var1 = ((int64_t)s_t_fine) - 128000;
        int64_t p_var2 = p_var1 * p_var1 * (int64_t)s_calib.dig_P6;
        p_var2 = p_var2 + ((p_var1 * (int64_t)s_calib.dig_P5) << 17);
        p_var2 = p_var2 + (((int64_t)s_calib.dig_P4) << 35);
        p_var1 = ((p_var1 * p_var1 * (int64_t)s_calib.dig_P3) >> 8) + ((p_var1 * (int64_t)s_calib.dig_P2) << 12);
        p_var1 = (((((int64_t)1) << 47) + p_var1)) * ((int64_t)s_calib.dig_P1) >> 33;

        if (p_var1 != 0) {
            int64_t p = 1048576 - raw_p;
            p = (((p << 31) - p_var2) * 3125) / p_var1;
            p_var1 = (((int64_t)s_calib.dig_P9) * (p >> 13) * (p >> 13)) >> 25;
            p_var2 = (((int64_t)s_calib.dig_P8) * p) >> 19;
            p = ((p + p_var1 + p_var2) >> 8) + (((int64_t)s_calib.dig_P7) << 4);

            float press_pa = (float)p / 256.0f;
            float press_hpa = press_pa / 100.0f;

            if (press_hpa >= 300.0f && press_hpa <= 1200.0f) {
                s_last_reading.pressure_hpa = press_hpa;
                s_last_reading.healthy = true;
            }
        }
    } else {
        s_last_reading.healthy = false;
    }

    return s_last_reading;
}

bool hal_pressure_health(void) {
    if (!s_bmp_initialized) return false;
    Wire.beginTransmission(s_bmp_i2c_addr);
    return (Wire.endTransmission() == 0);
}

void hal_pressure_deinit(void) {
    s_bmp_initialized = false;
}
