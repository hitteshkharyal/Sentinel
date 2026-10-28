/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Project Sentinel — ESP32 Production Firmware Main Application
 * ─────────────────────────────────────────────────────────────────────────────
 * File: main.cpp
 * Description: Production entry point for physical and bench-tested ESP32 IoT
 *              nodes. Coordinates hardware watchdog, Wi-Fi networking, Zero-Trust
 *              MQTT broker connectivity, HAL multi-sensor telemetry sampling,
 *              and cloud actuator command execution.
 * ─────────────────────────────────────────────────────────────────────────────
 */

#include <Arduino.h>
#include <esp_task_wdt.h>
#include <HTTPClient.h>

#include "sentinel_config.h"
#include "sentinel_hal.h"
#include "wifi_manager.h"
#include "mqtt_manager.h"

// Operational State Timers
static uint32_t s_last_sample_time = 0;
static uint32_t s_last_heartbeat_time = 0;
static uint32_t s_sampling_interval_ms = DEFAULT_SAMPLING_INTERVAL_MS;
static uint32_t s_mqtt_disconnect_start = 0;

// HTTP REST Heartbeat Fallback (when MQTT is unreachable)
static void send_http_heartbeat_fallback(const hal_device_info_t* info) {
    if (!wifi_manager_is_connected() || !info) return;

    HTTPClient http;
    char url[160];
    snprintf(url, sizeof(url), "http://%s:%d/api/v1/devices/%s/heartbeat",
             DEFAULT_API_HOST, DEFAULT_API_PORT, DEFAULT_DEVICE_ID);

    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Device-Token", DEFAULT_PRESHARED_TOKEN);

    char payload[256];
    snprintf(payload, sizeof(payload),
             "{\"firmwareVersion\":\"%s\",\"ipAddress\":\"%s\",\"wifiRssiDbm\":%d,\"freeHeapBytes\":%u,\"uptimeSeconds\":%u,\"status\":\"ONLINE\"}",
             info->firmware_version, info->ip_address, info->wifi_rssi_dbm,
             info->free_heap_bytes, info->uptime_seconds);

    int httpResponseCode = http.POST((uint8_t*)payload, strlen(payload));
    http.end();
}

// Inbound Cloud Command Notification Hook
static void handle_cloud_command(const char* command_id, const char* command, const char* params_json) {
    // Pulse status LED to provide local visual indication of command receipt
    digitalWrite(PIN_STATUS_LED, HIGH);
    delay(50);
    digitalWrite(PIN_STATUS_LED, LOW);
}

void setup() {
    // 1. Initialize Hardware Serial for Diagnostics
    Serial.begin(SERIAL_DEBUG_BAUD);
    delay(500);
    Serial.println();
    Serial.println(F("=================================================="));
    Serial.println(F("    PROJECT SENTINEL — ESP32 FIRMWARE v1.4.0      "));
    Serial.println(F("    Zero-Trust Multi-Sensor Environmental Node   "));
    Serial.println(F("=================================================="));

    // 2. Initialize Hardware Abstraction Layer (HAL)
    Serial.println(F("[HAL] Initializing hardware peripheral drivers..."));
    if (sentinel_hal_init_all()) {
        Serial.println(F("[HAL] All sensor drivers and safe actuators initialized successfully."));
    } else {
        Serial.println(F("[HAL] WARNING: One or more peripheral drivers reported initialization failure."));
    }

    // 3. Initialize Wi-Fi Connection Manager
    Serial.println(F("[NET] Initializing Wi-Fi manager..."));
    wifi_manager_init(DEFAULT_WIFI_SSID, DEFAULT_WIFI_PASSWORD);

    // 4. Configure MQTT Protocol Manager
    Serial.println(F("[MQTT] Initializing MQTT client & topic subscriptions..."));
    mqtt_manager_config_t mqtt_cfg;
    strncpy(mqtt_cfg.broker_host, DEFAULT_MQTT_HOST, sizeof(mqtt_cfg.broker_host) - 1);
    mqtt_cfg.broker_port = DEFAULT_MQTT_PORT;
    strncpy(mqtt_cfg.device_id, DEFAULT_DEVICE_ID, sizeof(mqtt_cfg.device_id) - 1);
    strncpy(mqtt_cfg.org_id, DEFAULT_ORGANIZATION_ID, sizeof(mqtt_cfg.org_id) - 1);
    strncpy(mqtt_cfg.facility_id, DEFAULT_FACILITY_ID, sizeof(mqtt_cfg.facility_id) - 1);
    strncpy(mqtt_cfg.room_id, DEFAULT_ROOM_ID, sizeof(mqtt_cfg.room_id) - 1);
    strncpy(mqtt_cfg.preshared_token, DEFAULT_PRESHARED_TOKEN, sizeof(mqtt_cfg.preshared_token) - 1);
    mqtt_cfg.keepalive_seconds = 15;

    mqtt_manager_init(&mqtt_cfg);
    mqtt_manager_set_command_handler(handle_cloud_command);

    // 5. Initialize Hardware Watchdog Timer (15s Timeout)
    Serial.println(F("[SYS] Arming ESP32 hardware task watchdog timer..."));
    esp_task_wdt_init(WATCHDOG_TIMEOUT_SECONDS, true); // true = panic and restart on timeout
    esp_task_wdt_add(NULL);                            // Add current loop thread to watchdog

    s_last_sample_time = millis();
    s_last_heartbeat_time = millis();
    Serial.println(F("[SYS] Sentinel Node setup complete. Running operational loop."));
}

void loop() {
    // ── 1. Feed Hardware Watchdog ──
    esp_task_wdt_reset();

    // ── 2. Run Non-blocking Network State Machines ──
    wifi_manager_loop();
    mqtt_manager_loop();

    uint32_t now = millis();

    // ── 3. Periodic Telemetry Sampling & Cloud Dispatch ──
    if (now - s_last_sample_time >= s_sampling_interval_ms) {
        s_last_sample_time = now;

        sentinel_telemetry_packet_t packet;
        if (sentinel_hal_read_all(&packet)) {
            // Publish via MQTT if connected
            if (mqtt_manager_is_connected()) {
                mqtt_manager_publish_telemetry(&packet);
                s_mqtt_disconnect_start = 0;
            } else {
                if (s_mqtt_disconnect_start == 0) {
                    s_mqtt_disconnect_start = now;
                }
            }
        }
    }

    // ── 4. Periodic Heartbeat & Health Check ──
    if (now - s_last_heartbeat_time >= DEFAULT_HEARTBEAT_INTERVAL_MS) {
        s_last_heartbeat_time = now;

        hal_device_info_t info;
        sentinel_hal_get_device_info(&info);

        if (mqtt_manager_is_connected()) {
            mqtt_manager_publish_heartbeat(&info);
        } else if (now - s_mqtt_disconnect_start > 60000 && wifi_manager_is_connected()) {
            // Fallback: If MQTT disconnected for > 60s, dispatch HTTP heartbeat fallback
            send_http_heartbeat_fallback(&info);
        }
    }

    // Cooperative multi-tasking yield
    delay(10);
}
