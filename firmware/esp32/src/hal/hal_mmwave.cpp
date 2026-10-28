/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Project Sentinel — ESP32 HAL 60GHz mmWave Radar Driver
 * ─────────────────────────────────────────────────────────────────────────────
 * File: hal_mmwave.cpp
 * Description: High-precision UART driver for 60GHz FMCW mmWave human presence,
 *              micro-movement detection, target distance, and headcount radar.
 * ─────────────────────────────────────────────────────────────────────────────
 */

#include <Arduino.h>
#include <HardwareSerial.h>
#include "../../include/sentinel_hal.h"

static HardwareSerial s_radar_serial(2); // Use ESP32 UART2
static bool s_mmwave_initialized = false;
static hal_mmwave_reading_t s_last_reading;
static uint32_t s_last_frame_millis = 0;
static const uint32_t RADAR_TIMEOUT_MS = 4000;

// Protocol Constants (Standard 60GHz Presence Radar Frame)
#define FRAME_HEADER_1    0xAA
#define FRAME_HEADER_2    0xFF
#define FRAME_TAIL_1      0x55
#define FRAME_TAIL_2      0xCC
#define FRAME_MAX_LEN     32

static uint8_t s_frame_buf[FRAME_MAX_LEN];
static uint8_t s_buf_idx = 0;

bool hal_mmwave_init(uint8_t rx_pin, uint8_t tx_pin, uint32_t baud) {
    s_radar_serial.begin(baud, SERIAL_8N1, rx_pin, tx_pin);
    s_mmwave_initialized = true;
    s_last_frame_millis = millis();

    memset(&s_last_reading, 0, sizeof(s_last_reading));
    s_last_reading.healthy = true;
    s_last_reading.presence = false;
    return true;
}

// Parse a single validated frame from radar module
static void parse_radar_frame(const uint8_t* data, size_t len) {
    if (len < 10) return;

    // Byte 2: Target Status (0x00=No target, 0x01=Moving, 0x02=Static, 0x03=Both)
    uint8_t target_state = data[2];
    s_last_reading.presence = (target_state != 0x00);

    // Byte 3-4: Distance in cm (16-bit little-endian)
    uint16_t dist_cm = (uint16_t)(data[3] | (data[4] << 8));
    s_last_reading.distance_m = (float)dist_cm / 100.0f;

    // Byte 5: Headcount estimate
    s_last_reading.count = s_last_reading.presence ? (data[5] > 0 ? data[5] : 1) : 0;

    // Byte 6: Energy / Signal Strength
    s_last_reading.energy = (float)data[6];

    // Byte 7: Movement Confidence (0-100)
    s_last_reading.movement_confidence = data[7] > 100 ? 100 : data[7];

    // Byte 8: Stationary / Micro-movement Confidence (0-100)
    s_last_reading.stationary_confidence = data[8] > 100 ? 100 : data[8];

    s_last_reading.healthy = true;
    s_last_frame_millis = millis();
}

hal_mmwave_reading_t hal_mmwave_read(void) {
    if (!s_mmwave_initialized) {
        s_last_reading.healthy = false;
        return s_last_reading;
    }

    // Process all incoming UART bytes non-blockingly
    while (s_radar_serial.available() > 0) {
        uint8_t b = (uint8_t)s_radar_serial.read();

        if (s_buf_idx == 0) {
            if (b == FRAME_HEADER_1) {
                s_frame_buf[s_buf_idx++] = b;
            }
        } else if (s_buf_idx == 1) {
            if (b == FRAME_HEADER_2) {
                s_frame_buf[s_buf_idx++] = b;
            } else {
                s_buf_idx = 0; // Header sync mismatch
            }
        } else {
            s_frame_buf[s_buf_idx++] = b;

            // Check if end of frame reached
            if (s_buf_idx >= 10 &&
                s_frame_buf[s_buf_idx - 2] == FRAME_TAIL_1 &&
                s_frame_buf[s_buf_idx - 1] == FRAME_TAIL_2) {
                parse_radar_frame(s_frame_buf, s_buf_idx);
                s_buf_idx = 0;
            } else if (s_buf_idx >= FRAME_MAX_LEN) {
                // Buffer overflow protection
                s_buf_idx = 0;
            }
        }
    }

    // Check UART stream timeout
    if (millis() - s_last_frame_millis > RADAR_TIMEOUT_MS) {
        // Fallback or keep last known state if disconnected
        s_last_reading.healthy = false;
    }

    return s_last_reading;
}

bool hal_mmwave_health(void) {
    if (!s_mmwave_initialized) return false;
    return (millis() - s_last_frame_millis) <= RADAR_TIMEOUT_MS;
}

void hal_mmwave_deinit(void) {
    if (s_mmwave_initialized) {
        s_radar_serial.end();
        s_mmwave_initialized = false;
    }
}
