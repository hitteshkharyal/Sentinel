/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Project Sentinel — ESP32 Production Firmware Configuration
 * ─────────────────────────────────────────────────────────────────────────────
 * File: sentinel_config.h
 * Description: Master pin mappings, network defaults, buffer sizes, and
 *              timing constraints for physical ESP32-WROOM / ESP32-S3 nodes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

#ifndef SENTINEL_CONFIG_H
#define SENTINEL_CONFIG_H

#include <stdint.h>

// ── Versioning & Identity ────────────────────────────────────────────────────
#define SENTINEL_FW_VERSION           "1.4.0"
#define SENTINEL_HW_VERSION           "v3.2"
#define SENTINEL_DEFAULT_CHIP_MODEL   "ESP32-WROOM-32D"

// ── Default Provisioning Credentials (Overridden via NVS / WebConfig) ─────────
#define DEFAULT_DEVICE_ID             "ESP32-SENTINEL-NODE-01"
#define DEFAULT_ORGANIZATION_ID       "org_sentinel_default"
#define DEFAULT_FACILITY_ID           "fac_primary"
#define DEFAULT_ROOM_ID               "room_main_hall"
#define DEFAULT_PRESHARED_TOKEN       "sent_dev_default_secret_token_12345"

// ── Default Network & Broker Parameters ──────────────────────────────────────
#define DEFAULT_WIFI_SSID             "Sentinel-Secure-IoT"
#define DEFAULT_WIFI_PASSWORD         "SentinelEncryptedPSK2026"
#define DEFAULT_MQTT_HOST             "192.168.1.100"
#define DEFAULT_MQTT_PORT             1883
#define DEFAULT_API_HOST              "192.168.1.100"
#define DEFAULT_API_PORT              4000

// ── GPIO Pin Mapping for ESP32 Standard Dev Board ────────────────────────────
// Digital Inputs & Outputs
#define PIN_STATUS_LED                2    // Onboard blue LED (GPIO 2)
#define PIN_PIR_MOTION                13   // Passive Infrared motion sensor (GPIO 13)
#define PIN_DOOR_REED                 14   // Magnetic door reed switch (GPIO 14, INPUT_PULLUP)
#define PIN_ACTUATOR_RELAY            27   // Fail-safe actuator relay (GPIO 27, Active HIGH)

// Analog Inputs (ADC1 only when Wi-Fi is active)
#define PIN_SOUND_ADC                 34   // Sound level analog microphone (ADC1_CH6, GPIO 34)
#define PIN_LIGHT_ADC                 35   // LDR light level analog input (ADC1_CH7, GPIO 35)

// I2C Bus Configuration (SCD30/40 CO2, SHT31 Temp/Humidity, BMP280 Pressure)
#define PIN_I2C_SDA                   21   // Default ESP32 I2C Data (GPIO 21)
#define PIN_I2C_SCL                   22   // Default ESP32 I2C Clock (GPIO 22)
#define I2C_FREQUENCY_HZ              100000 // Standard 100 kHz I2C bus

// I2C Device Addresses (7-bit)
#define I2C_ADDR_SCD40                0x62 // Sensirion SCD40 CO2, Temperature & RH
#define I2C_ADDR_SHT31                0x44 // Sensirion SHT31 High-Precision Temp & RH
#define I2C_ADDR_BMP280               0x76 // Bosch BMP280 Barometric Pressure (or 0x77)
#define I2C_ADDR_BH1750               0x23 // Rohm BH1750 Ambient Light Sensor (or 0x5C)

// UART2 Interface Configuration (60GHz mmWave Radar)
#define PIN_UART2_RX                  16   // Radar TX -> ESP32 RX2 (GPIO 16)
#define PIN_UART2_TX                  17   // Radar RX -> ESP32 TX2 (GPIO 17)
#define UART2_BAUD_RATE               115200

// ── Timing & Operational Intervals (Milliseconds) ────────────────────────────
#define DEFAULT_SAMPLING_INTERVAL_MS  5000   // 5 seconds sensor read interval
#define MIN_SAMPLING_INTERVAL_MS      1000   // Minimum allowed 1s
#define MAX_SAMPLING_INTERVAL_MS      60000  // Maximum allowed 60s
#define DEFAULT_HEARTBEAT_INTERVAL_MS 30000  // 30 seconds cloud heartbeat
#define WATCHDOG_TIMEOUT_SECONDS      15     // Hardware watchdog timer timeout

// Network Reconnection Backoff (Exponential)
#define WIFI_RECONNECT_BASE_MS        1000   // 1s base backoff
#define WIFI_RECONNECT_MAX_MS         30000  // 30s max backoff
#define MQTT_RECONNECT_BASE_MS        1000   // 1s base backoff
#define MQTT_RECONNECT_MAX_MS         30000  // 30s max backoff

// ── Memory & Buffer Allocations ──────────────────────────────────────────────
#define MQTT_BUFFER_SIZE              2048   // PubSubClient payload buffer
#define MQTT_TOPIC_MAX_LEN            160    // Max topic string length
#define JSON_DOC_BUFFER_SIZE          1536   // ArduinoJson 7 StaticJsonDocument buffer
#define SERIAL_DEBUG_BAUD             115200 // Hardware Serial monitor

#endif // SENTINEL_CONFIG_H
