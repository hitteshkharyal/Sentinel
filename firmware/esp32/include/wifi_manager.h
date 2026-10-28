/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Project Sentinel — ESP32 Wi-Fi Connectivity Manager Header
 * ─────────────────────────────────────────────────────────────────────────────
 * File: wifi_manager.h
 * Description: Non-blocking Wi-Fi lifecycle manager with exponential backoff,
 *              RSSI tracking, and event-driven state transitions.
 * ─────────────────────────────────────────────────────────────────────────────
 */

#ifndef SENTINEL_WIFI_MANAGER_H
#define SENTINEL_WIFI_MANAGER_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
    WIFI_MGR_DISCONNECTED = 0,
    WIFI_MGR_CONNECTING,
    WIFI_MGR_CONNECTED,
    WIFI_MGR_FAILED
} wifi_manager_state_t;

typedef struct {
    char ssid[33];
    char password[65];
    uint32_t reconnect_interval_ms;
    uint32_t max_reconnect_interval_ms;
} wifi_manager_config_t;

// Lifecycle & Control
bool wifi_manager_init(const char* ssid, const char* password);
void wifi_manager_loop(void);
bool wifi_manager_is_connected(void);
wifi_manager_state_t wifi_manager_get_state(void);
void wifi_manager_disconnect(void);
void wifi_manager_reconnect(void);

// Diagnostics & Telemetry
int8_t wifi_manager_get_rssi(void);
void wifi_manager_get_ip(char* buffer, size_t max_len);
void wifi_manager_get_mac(char* buffer, size_t max_len);
uint32_t wifi_manager_get_uptime_seconds(void);

#ifdef __cplusplus
}
#endif

#endif // SENTINEL_WIFI_MANAGER_H
