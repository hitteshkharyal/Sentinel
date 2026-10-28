/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Project Sentinel — ESP32 HAL Master Orchestration Driver
 * ─────────────────────────────────────────────────────────────────────────────
 * File: hal_master.cpp
 * Description: Master coordinator initializing all HAL peripherals, sampling
 *              multi-sensor arrays into unified telemetry packets, and reading
 *              silicon diagnostics (free heap, MAC, uptime, RSSI).
 * ─────────────────────────────────────────────────────────────────────────────
 */

#include <Arduino.h>
#include <WiFi.h>
#include <esp_system.h>
#include <time.h>
#include "../../include/sentinel_hal.h"
#include "../../include/sentinel_config.h"

static bool s_master_initialized = false;
static uint32_t s_boot_millis = 0;

bool sentinel_hal_init_all(void) {
    s_boot_millis = millis();

    // 1. Digital Actuators & Switches
    hal_relay_init(PIN_ACTUATOR_RELAY, true); // Active HIGH, default LOW (safe)
    hal_door_init(PIN_DOOR_REED);
    hal_pir_init(PIN_PIR_MOTION);

    // 2. Analog ADCs
    hal_sound_init(PIN_SOUND_ADC);

    // 3. Serial UART Sensors
    hal_mmwave_init(PIN_UART2_RX, PIN_UART2_TX, UART2_BAUD_RATE);

    // 4. I2C Sensors (SCD40, SHT31, BMP280, BH1750)
    hal_co2_init(PIN_I2C_SDA, PIN_I2C_SCL, I2C_ADDR_SCD40);
    hal_temp_humidity_init(PIN_I2C_SDA, PIN_I2C_SCL, I2C_ADDR_SHT31);
    hal_pressure_init(PIN_I2C_SDA, PIN_I2C_SCL, I2C_ADDR_BMP280);
    hal_light_init(PIN_I2C_SDA, PIN_I2C_SCL, I2C_ADDR_BH1750, PIN_LIGHT_ADC);

    // Status LED indicator
    pinMode(PIN_STATUS_LED, OUTPUT);
    digitalWrite(PIN_STATUS_LED, HIGH); // Blink on init
    delay(100);
    digitalWrite(PIN_STATUS_LED, LOW);

    s_master_initialized = true;
    return true;
}

bool sentinel_hal_get_device_info(hal_device_info_t* info) {
    if (!info) return false;

    memset(info, 0, sizeof(hal_device_info_t));
    strncpy(info->device_id, DEFAULT_DEVICE_ID, sizeof(info->device_id) - 1);
    strncpy(info->chip_model, SENTINEL_DEFAULT_CHIP_MODEL, sizeof(info->chip_model) - 1);
    strncpy(info->firmware_version, SENTINEL_FW_VERSION, sizeof(info->firmware_version) - 1);
    strncpy(info->hardware_version, SENTINEL_HW_VERSION, sizeof(info->hardware_version) - 1);

    // Query MAC Address
    String mac = WiFi.macAddress();
    strncpy(info->mac_address, mac.c_str(), sizeof(info->mac_address) - 1);

    // Query IP Address
    if (WiFi.status() == WL_CONNECTED) {
        String ip = WiFi.localIP().toString();
        strncpy(info->ip_address, ip.c_str(), sizeof(info->ip_address) - 1);
        info->wifi_rssi_dbm = (int8_t)WiFi.RSSI();
        info->is_online = true;
    } else {
        strncpy(info->ip_address, "0.0.0.0", sizeof(info->ip_address) - 1);
        info->wifi_rssi_dbm = -100;
        info->is_online = false;
    }

    // Memory & Uptime
    info->free_heap_bytes = esp_get_free_heap_size();
    info->min_free_heap_bytes = esp_get_minimum_free_heap_size();
    info->uptime_seconds = (millis() - s_boot_millis) / 1000;
    info->battery_percent = 100; // Mains powered

    return true;
}

bool sentinel_hal_read_all(sentinel_telemetry_packet_t* packet) {
    if (!s_master_initialized || !packet) return false;

    memset(packet, 0, sizeof(sentinel_telemetry_packet_t));
    packet->timestamp_ms = millis();

    // Generate ISO8601 timestamp string if RTC/NTP synchronized
    time_t now;
    time(&now);
    struct tm timeinfo;
    if (gmtime_r(&now, &timeinfo) && timeinfo.tm_year > (2020 - 1900)) {
        strftime(packet->iso_timestamp, sizeof(packet->iso_timestamp), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
    } else {
        // Fallback relative timestamp format
        snprintf(packet->iso_timestamp, sizeof(packet->iso_timestamp), "UPTIME_%lu", (unsigned long)(packet->timestamp_ms / 1000));
    }

    // Sample All Sensor Drivers
    packet->has_pir = true;
    packet->pir = hal_pir_read();

    packet->has_mmwave = true;
    packet->mmwave = hal_mmwave_read();

    packet->has_co2 = true;
    packet->co2 = hal_co2_read();

    packet->has_temp_humidity = true;
    packet->temp_humidity = hal_temp_humidity_read();

    packet->has_sound = true;
    packet->sound = hal_sound_read();

    packet->has_door = true;
    packet->door = hal_door_read();

    packet->has_pressure = true;
    packet->pressure = hal_pressure_read();

    packet->has_light = true;
    packet->light = hal_light_read();

    // Query Actuator State
    packet->relay = hal_relay_get_state();

    // Query Device Diagnostics
    sentinel_hal_get_device_info(&packet->diagnostics);

    return true;
}

void sentinel_hal_deinit_all(void) {
    hal_relay_deinit(); // Ensure relay de-energized
    hal_door_deinit();
    hal_pir_deinit();
    hal_sound_deinit();
    hal_mmwave_deinit();
    hal_co2_deinit();
    hal_temp_humidity_deinit();
    hal_pressure_deinit();
    hal_light_deinit();
    s_master_initialized = false;
}
