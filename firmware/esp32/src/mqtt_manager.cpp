/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Project Sentinel — ESP32 MQTT Protocol & Command Manager Implementation
 * ─────────────────────────────────────────────────────────────────────────────
 * File: mqtt_manager.cpp
 * Description: Zero-Trust MQTT client communicating with Sentinel's Aedes broker.
 *              Serializes multi-sensor telemetry, dispatches cloud commands to HAL,
 *              and publishes execution acknowledgments.
 * ─────────────────────────────────────────────────────────────────────────────
 */

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "../include/mqtt_manager.h"
#include "../include/sentinel_config.h"
#include "../include/sentinel_hal.h"

static WiFiClient s_wifi_client;
static PubSubClient s_mqtt_client(s_wifi_client);

static mqtt_manager_config_t s_config;
static sentinel_command_callback_t s_cmd_callback = nullptr;

static char s_topic_telemetry[MQTT_TOPIC_MAX_LEN];
static char s_topic_command[MQTT_TOPIC_MAX_LEN];
static char s_topic_config[MQTT_TOPIC_MAX_LEN];
static char s_topic_status[MQTT_TOPIC_MAX_LEN];
static char s_topic_ack[MQTT_TOPIC_MAX_LEN];

static uint32_t s_last_reconnect_attempt = 0;
static uint32_t s_mqtt_backoff_ms = MQTT_RECONNECT_BASE_MS;
static bool s_mqtt_initialized = false;

// ── Inbound MQTT Message Dispatcher ──────────────────────────────────────────
static void on_mqtt_message_received(char* topic, byte* payload, unsigned int length) {
    if (!payload || length == 0) return;

    // Allocate JSON document using ArduinoJson 7
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, payload, length);
    if (error) {
        return;
    }

    const char* command_id = doc["commandId"] | "cmd_unknown";
    const char* command = doc["command"] | "";
    JsonObject params = doc["params"].as<JsonObject>();

    // Serialize params to string if passing to callback
    String params_str;
    serializeJson(params, params_str);

    // ── Execute Built-in HAL Commands ──
    if (strcmp(command, "TRIGGER_ACTUATOR") == 0) {
        bool energize = params["energize"] | true;
        uint32_t duration_ms = params["durationMs"] | 0;

        if (duration_ms > 0) {
            hal_relay_pulse(duration_ms);
            mqtt_manager_publish_ack(command_id, "ACKNOWLEDGED", "Relay pulsed successfully");
        } else {
            hal_relay_set(energize);
            mqtt_manager_publish_ack(command_id, "ACKNOWLEDGED", energize ? "Relay energized" : "Relay de-energized");
        }
    } else if (strcmp(command, "REBOOT") == 0) {
        mqtt_manager_publish_ack(command_id, "ACKNOWLEDGED", "Rebooting ESP32 silicon");
        delay(250);
        ESP.restart();
    } else if (strcmp(command, "REQUEST_STATUS") == 0) {
        sentinel_telemetry_packet_t packet;
        sentinel_hal_read_all(&packet);
        mqtt_manager_publish_telemetry(&packet);
        mqtt_manager_publish_ack(command_id, "ACKNOWLEDGED", "Telemetry refreshed and dispatched");
    }

    // Forward to application callback if registered
    if (s_cmd_callback) {
        s_cmd_callback(command_id, command, params_str.c_str());
    }
}

bool mqtt_manager_init(const mqtt_manager_config_t* config) {
    if (!config) return false;
    memcpy(&s_config, config, sizeof(mqtt_manager_config_t));

    // Construct Canonical Sentinel MQTT Topics:
    // sentinel/{orgId}/{facilityId}/{deviceId}/{channel}
    snprintf(s_topic_telemetry, sizeof(s_topic_telemetry), "sentinel/%s/%s/%s/telemetry",
             s_config.org_id, s_config.facility_id, s_config.device_id);
    snprintf(s_topic_command, sizeof(s_topic_command), "sentinel/%s/%s/%s/command",
             s_config.org_id, s_config.facility_id, s_config.device_id);
    snprintf(s_topic_config, sizeof(s_topic_config), "sentinel/%s/%s/%s/config",
             s_config.org_id, s_config.facility_id, s_config.device_id);
    snprintf(s_topic_status, sizeof(s_topic_status), "sentinel/%s/%s/%s/status",
             s_config.org_id, s_config.facility_id, s_config.device_id);
    snprintf(s_topic_ack, sizeof(s_topic_ack), "sentinel/%s/%s/%s/ack",
             s_config.org_id, s_config.facility_id, s_config.device_id);

    s_mqtt_client.setServer(s_config.broker_host, s_config.broker_port);
    s_mqtt_client.setCallback(on_mqtt_message_received);
    s_mqtt_client.setBufferSize(MQTT_BUFFER_SIZE);

    s_mqtt_initialized = true;
    s_mqtt_backoff_ms = MQTT_RECONNECT_BASE_MS;
    s_last_reconnect_attempt = millis() - s_mqtt_backoff_ms;

    return true;
}

void mqtt_manager_set_command_handler(sentinel_command_callback_t handler) {
    s_cmd_callback = handler;
}

static bool attempt_connect(void) {
    if (!WiFi.isConnected()) return false;

    char client_id[80];
    snprintf(client_id, sizeof(client_id), "Sentinel-%s-%lu", s_config.device_id, (unsigned long)(millis() & 0xFFFF));

    // Zero-Trust Authentication:
    // Username: deviceId
    // Password: Pre-shared token (sent_dev_...)
    bool success = s_mqtt_client.connect(
        client_id,
        s_config.device_id,
        s_config.preshared_token
    );

    if (success) {
        s_mqtt_backoff_ms = MQTT_RECONNECT_BASE_MS;

        // Subscribe to Command and Config Channels
        s_mqtt_client.subscribe(s_topic_command, 1);
        s_mqtt_client.subscribe(s_topic_config, 1);

        // Announce ONLINE state
        mqtt_manager_publish_status("ONLINE", nullptr);
    } else {
        s_mqtt_backoff_ms *= 2;
        if (s_mqtt_backoff_ms > MQTT_RECONNECT_MAX_MS) {
            s_mqtt_backoff_ms = MQTT_RECONNECT_MAX_MS;
        }
    }

    return success;
}

void mqtt_manager_loop(void) {
    if (!s_mqtt_initialized) return;

    if (!s_mqtt_client.connected()) {
        uint32_t now = millis();
        if (now - s_last_reconnect_attempt >= s_mqtt_backoff_ms) {
            s_last_reconnect_attempt = now;
            attempt_connect();
        }
    } else {
        s_mqtt_client.loop();
    }
}

bool mqtt_manager_is_connected(void) {
    return s_mqtt_initialized && s_mqtt_client.connected();
}

void mqtt_manager_disconnect(void) {
    if (s_mqtt_client.connected()) {
        mqtt_manager_publish_status("OFFLINE", nullptr);
        s_mqtt_client.disconnect();
    }
}

bool mqtt_manager_publish_telemetry(const sentinel_telemetry_packet_t* packet) {
    if (!s_mqtt_client.connected() || !packet) return false;

    JsonDocument doc;
    doc["deviceId"] = s_config.device_id;
    doc["timestamp"] = packet->iso_timestamp;

    JsonObject sensors = doc["sensors"].to<JsonObject>();

    if (packet->has_pir && packet->pir.healthy) {
        sensors["pir"] = packet->pir.is_motion_detected;
    }

    if (packet->has_mmwave && packet->mmwave.healthy) {
        JsonObject mm = sensors["mmwave"].to<JsonObject>();
        mm["presence"] = packet->mmwave.presence;
        mm["count"] = packet->mmwave.count;
        mm["distance"] = packet->mmwave.distance_m;
        mm["energy"] = packet->mmwave.energy;
        mm["stationaryConfidence"] = packet->mmwave.stationary_confidence;
        mm["movementConfidence"] = packet->mmwave.movement_confidence;
    }

    if (packet->has_co2 && packet->co2.healthy) {
        sensors["co2"] = packet->co2.co2_ppm;
    }

    if (packet->has_temp_humidity && packet->temp_humidity.healthy) {
        sensors["temperature"] = packet->temp_humidity.temperature_c;
        sensors["humidity"] = packet->temp_humidity.humidity_pct;
    }

    if (packet->has_sound && packet->sound.healthy) {
        sensors["soundLevel"] = packet->sound.spl_db;
    }

    if (packet->has_door && packet->door.healthy) {
        sensors["door"] = packet->door.is_open ? "open" : "closed";
    }

    if (packet->has_pressure && packet->pressure.healthy) {
        sensors["pressure"] = packet->pressure.pressure_hpa;
    }

    if (packet->has_light && packet->light.healthy) {
        sensors["light"] = packet->light.lux;
    }

    // Diagnostics Metadata
    JsonObject meta = doc["metadata"].to<JsonObject>();
    meta["wifiRssiDbm"] = packet->diagnostics.wifi_rssi_dbm;
    meta["freeHeapBytes"] = packet->diagnostics.free_heap_bytes;
    meta["uptimeSeconds"] = packet->diagnostics.uptime_seconds;
    meta["firmwareVersion"] = packet->diagnostics.firmware_version;
    meta["ipAddress"] = packet->diagnostics.ip_address;
    meta["actuatorEnergized"] = packet->relay.energized;

    char buffer[MQTT_BUFFER_SIZE];
    size_t len = serializeJson(doc, buffer, sizeof(buffer));

    return s_mqtt_client.publish(s_topic_telemetry, (const uint8_t*)buffer, len, false);
}

bool mqtt_manager_publish_status(const char* status, const char* error_msg) {
    if (!s_mqtt_client.connected()) return false;

    JsonDocument doc;
    doc["deviceId"] = s_config.device_id;
    doc["status"] = status ? status : "ONLINE";
    if (error_msg) {
        doc["error"] = error_msg;
    }

    char ip[16];
    String ipStr = WiFi.localIP().toString();
    strncpy(ip, ipStr.c_str(), sizeof(ip) - 1);
    doc["ipAddress"] = ip;
    doc["timestamp"] = millis();

    char buffer[256];
    size_t len = serializeJson(doc, buffer, sizeof(buffer));

    return s_mqtt_client.publish(s_topic_status, (const uint8_t*)buffer, len, false);
}

bool mqtt_manager_publish_ack(const char* command_id, const char* status, const char* details) {
    if (!s_mqtt_client.connected()) return false;

    JsonDocument doc;
    doc["commandId"] = command_id;
    doc["deviceId"] = s_config.device_id;
    doc["status"] = status ? status : "ACKNOWLEDGED";
    if (details) {
        doc["details"] = details;
    }
    doc["timestamp"] = millis();

    char buffer[256];
    size_t len = serializeJson(doc, buffer, sizeof(buffer));

    return s_mqtt_client.publish(s_topic_ack, (const uint8_t*)buffer, len, false);
}

bool mqtt_manager_publish_heartbeat(const hal_device_info_t* info) {
    if (!s_mqtt_client.connected() || !info) return false;

    JsonDocument doc;
    doc["deviceId"] = s_config.device_id;
    doc["firmwareVersion"] = info->firmware_version;
    doc["ipAddress"] = info->ip_address;
    doc["wifiRssiDbm"] = info->wifi_rssi_dbm;
    doc["freeHeapBytes"] = info->free_heap_bytes;
    doc["uptimeSeconds"] = info->uptime_seconds;
    doc["status"] = "ONLINE";

    char buffer[256];
    size_t len = serializeJson(doc, buffer, sizeof(buffer));

    return s_mqtt_client.publish(s_topic_status, (const uint8_t*)buffer, len, false);
}
