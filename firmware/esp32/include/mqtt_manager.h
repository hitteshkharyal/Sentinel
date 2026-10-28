/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Project Sentinel — ESP32 MQTT Protocol & Command Manager Header
 * ─────────────────────────────────────────────────────────────────────────────
 * File: mqtt_manager.h
 * Description: High-reliability MQTT client interfacing with Sentinel's Aedes
 *              broker, handling zero-trust credentials, telemetry serialization,
 *              inbound remote commands, and execution acknowledgments.
 * ─────────────────────────────────────────────────────────────────────────────
 */

#ifndef SENTINEL_MQTT_MANAGER_H
#define SENTINEL_MQTT_MANAGER_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>
#include "sentinel_hal.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    char broker_host[64];
    uint16_t broker_port;
    char device_id[64];
    char org_id[64];
    char facility_id[64];
    char room_id[64];
    char preshared_token[128]; // Preshared cryptographic token (sent_dev_...)
    uint32_t keepalive_seconds;
} mqtt_manager_config_t;

typedef void (*sentinel_command_callback_t)(
    const char* command_id,
    const char* command,
    const char* params_json
);

// Lifecycle
bool mqtt_manager_init(const mqtt_manager_config_t* config);
void mqtt_manager_set_command_handler(sentinel_command_callback_t handler);
void mqtt_manager_loop(void);
bool mqtt_manager_is_connected(void);
void mqtt_manager_disconnect(void);

// Cloud Communication
bool mqtt_manager_publish_telemetry(const sentinel_telemetry_packet_t* packet);
bool mqtt_manager_publish_status(const char* status, const char* error_msg);
bool mqtt_manager_publish_ack(const char* command_id, const char* status, const char* details);
bool mqtt_manager_publish_heartbeat(const hal_device_info_t* info);

#ifdef __cplusplus
}
#endif

#endif // SENTINEL_MQTT_MANAGER_H
