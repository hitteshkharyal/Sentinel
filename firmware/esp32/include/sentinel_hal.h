/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Project Sentinel — ESP32 Hardware Abstraction Layer (HAL) Header
 * ─────────────────────────────────────────────────────────────────────────────
 * File: sentinel_hal.h
 * Description: Unified C++ interface contracts for physical & virtual sensor
 *              drivers, actuator controls, and device telemetry assembly.
 * ─────────────────────────────────────────────────────────────────────────────
 */

#ifndef SENTINEL_HAL_H
#define SENTINEL_HAL_H

#include <stdint.h>
#include <stdbool.h>
#include "sentinel_config.h"

#ifdef __cplusplus
extern "C" {
#endif

// ── Sensor Reading Data Structures ───────────────────────────────────────────

typedef struct {
    bool presence;
    uint16_t count;
    float distance_m;
    float energy;
    uint8_t stationary_confidence;
    uint8_t movement_confidence;
    bool healthy;
} hal_mmwave_reading_t;

typedef struct {
    float temperature_c;
    float humidity_pct;
    bool healthy;
} hal_temp_humidity_reading_t;

typedef struct {
    float co2_ppm;
    bool healthy;
} hal_co2_reading_t;

typedef struct {
    float spl_db;
    uint16_t peak_adc;
    bool healthy;
} hal_sound_reading_t;

typedef struct {
    bool is_open;
    uint32_t transition_count;
    bool healthy;
} hal_door_reading_t;

typedef struct {
    float pressure_hpa;
    bool healthy;
} hal_pressure_reading_t;

typedef struct {
    float lux;
    bool healthy;
} hal_light_reading_t;

typedef struct {
    bool is_motion_detected;
    uint32_t motion_events;
    bool healthy;
} hal_pir_reading_t;

typedef struct {
    bool energized;
    uint32_t trigger_count;
    uint32_t last_trigger_timestamp;
    bool healthy;
} hal_relay_state_t;

// ── Device Information & Diagnostics ─────────────────────────────────────────

typedef struct {
    char device_id[64];
    char mac_address[18];
    char ip_address[16];
    char chip_model[32];
    char firmware_version[16];
    char hardware_version[16];
    uint32_t free_heap_bytes;
    uint32_t min_free_heap_bytes;
    uint32_t uptime_seconds;
    int8_t wifi_rssi_dbm;
    uint8_t battery_percent;
    bool is_online;
} hal_device_info_t;

// ── Unified Multi-Sensor Telemetry Packet ────────────────────────────────────

typedef struct {
    uint64_t timestamp_ms;
    char iso_timestamp[32];
    
    // Primary Sensors
    bool has_pir;
    hal_pir_reading_t pir;

    bool has_mmwave;
    hal_mmwave_reading_t mmwave;

    bool has_co2;
    hal_co2_reading_t co2;

    bool has_temp_humidity;
    hal_temp_humidity_reading_t temp_humidity;

    bool has_sound;
    hal_sound_reading_t sound;

    bool has_door;
    hal_door_reading_t door;

    bool has_pressure;
    hal_pressure_reading_t pressure;

    bool has_light;
    hal_light_reading_t light;

    // Actuator State
    hal_relay_state_t relay;

    // Device Health Metrics
    hal_device_info_t diagnostics;
} sentinel_telemetry_packet_t;

// ── Generic HAL Sensor Configuration ─────────────────────────────────────────

typedef enum {
    HAL_INTERFACE_GPIO = 0,
    HAL_INTERFACE_ADC,
    HAL_INTERFACE_PWM,
    HAL_INTERFACE_I2C,
    HAL_INTERFACE_SPI,
    HAL_INTERFACE_UART
} hal_interface_type_t;

typedef struct {
    const char* sensor_type;
    hal_interface_type_t interface_type;
    uint8_t pin;
    uint8_t i2c_address;
    uint32_t sampling_interval_ms;
    float calibration_offset;
    float calibration_multiplier;
} hal_sensor_config_t;

// ── Driver Lifecycle Contract Signatures ─────────────────────────────────────

// 1. PIR Sensor Driver (GPIO Digital)
bool hal_pir_init(uint8_t pin);
hal_pir_reading_t hal_pir_read(void);
bool hal_pir_health(void);
void hal_pir_deinit(void);

// 2. mmWave Radar Driver (UART 60GHz)
bool hal_mmwave_init(uint8_t rx_pin, uint8_t tx_pin, uint32_t baud);
hal_mmwave_reading_t hal_mmwave_read(void);
bool hal_mmwave_health(void);
void hal_mmwave_deinit(void);

// 3. CO2 Sensor Driver (I2C SCD30 / SCD40)
bool hal_co2_init(uint8_t sda_pin, uint8_t scl_pin, uint8_t i2c_addr);
hal_co2_reading_t hal_co2_read(void);
bool hal_co2_health(void);
void hal_co2_deinit(void);

// 4. Temperature & Humidity Driver (I2C SHT31 / AHT20)
bool hal_temp_humidity_init(uint8_t sda_pin, uint8_t scl_pin, uint8_t i2c_addr);
hal_temp_humidity_reading_t hal_temp_humidity_read(void);
bool hal_temp_humidity_health(void);
void hal_temp_humidity_deinit(void);

// 5. Sound Level Driver (ADC Analog Peak / RMS)
bool hal_sound_init(uint8_t adc_pin);
hal_sound_reading_t hal_sound_read(void);
bool hal_sound_health(void);
void hal_sound_deinit(void);

// 6. Magnetic Door Reed Switch Driver (GPIO Digital Pullup)
bool hal_door_init(uint8_t pin);
hal_door_reading_t hal_door_read(void);
bool hal_door_health(void);
void hal_door_deinit(void);

// 7. Barometric Pressure Driver (I2C BMP280)
bool hal_pressure_init(uint8_t sda_pin, uint8_t scl_pin, uint8_t i2c_addr);
hal_pressure_reading_t hal_pressure_read(void);
bool hal_pressure_health(void);
void hal_pressure_deinit(void);

// 8. Ambient Light Sensor Driver (I2C BH1750 / ADC)
bool hal_light_init(uint8_t sda_pin, uint8_t scl_pin, uint8_t i2c_addr, uint8_t adc_pin);
hal_light_reading_t hal_light_read(void);
bool hal_light_health(void);
void hal_light_deinit(void);

// 9. Actuator Relay Driver (GPIO Digital Output, Safe Fail-Secure)
bool hal_relay_init(uint8_t pin, bool active_high);
bool hal_relay_set(bool energize);
bool hal_relay_pulse(uint32_t duration_ms);
hal_relay_state_t hal_relay_get_state(void);
bool hal_relay_health(void);
void hal_relay_deinit(void);

// ── Master HAL Orchestration Methods ─────────────────────────────────────────

bool sentinel_hal_init_all(void);
bool sentinel_hal_read_all(sentinel_telemetry_packet_t* packet);
bool sentinel_hal_get_device_info(hal_device_info_t* info);
void sentinel_hal_deinit_all(void);

#ifdef __cplusplus
}
#endif

#endif // SENTINEL_HAL_H
