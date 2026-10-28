/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Project Sentinel — ESP32 Wi-Fi Manager Implementation
 * ─────────────────────────────────────────────────────────────────────────────
 * File: wifi_manager.cpp
 * Description: Non-blocking Wi-Fi lifecycle manager with exponential backoff
 *              reconnection, NTP UTC time synchronization, and RSSI tracking.
 * ─────────────────────────────────────────────────────────────────────────────
 */

#include <Arduino.h>
#include <WiFi.h>
#include <time.h>
#include "../include/wifi_manager.h"
#include "../include/sentinel_config.h"

static wifi_manager_config_t s_config;
static wifi_manager_state_t s_state = WIFI_MGR_DISCONNECTED;
static uint32_t s_last_attempt_time = 0;
static uint32_t s_current_backoff_ms = WIFI_RECONNECT_BASE_MS;
static uint32_t s_connect_start_time = 0;
static bool s_ntp_synced = false;

static void setup_ntp(void) {
    if (!s_ntp_synced) {
        // Synchronize UTC time via NTP
        configTime(0, 0, "pool.ntp.org", "time.google.com");
        s_ntp_synced = true;
    }
}

bool wifi_manager_init(const char* ssid, const char* password) {
    if (!ssid || strlen(ssid) == 0) return false;

    strncpy(s_config.ssid, ssid, sizeof(s_config.ssid) - 1);
    if (password) {
        strncpy(s_config.password, password, sizeof(s_config.password) - 1);
    } else {
        s_config.password[0] = '\0';
    }

    s_config.reconnect_interval_ms = WIFI_RECONNECT_BASE_MS;
    s_config.max_reconnect_interval_ms = WIFI_RECONNECT_MAX_MS;

    WiFi.mode(WIFI_STA);
    WiFi.disconnect(true);
    delay(100);

    s_state = WIFI_MGR_DISCONNECTED;
    s_current_backoff_ms = WIFI_RECONNECT_BASE_MS;
    s_last_attempt_time = millis() - s_current_backoff_ms; // Trigger immediate connect

    return true;
}

void wifi_manager_loop(void) {
    wl_status_t status = WiFi.status();

    switch (s_state) {
        case WIFI_MGR_DISCONNECTED: {
            uint32_t now = millis();
            if (now - s_last_attempt_time >= s_current_backoff_ms) {
                s_last_attempt_time = now;
                s_connect_start_time = now;
                s_state = WIFI_MGR_CONNECTING;

                if (strlen(s_config.password) > 0) {
                    WiFi.begin(s_config.ssid, s_config.password);
                } else {
                    WiFi.begin(s_config.ssid);
                }
            }
            break;
        }

        case WIFI_MGR_CONNECTING: {
            if (status == WL_CONNECTED) {
                s_state = WIFI_MGR_CONNECTED;
                s_current_backoff_ms = WIFI_RECONNECT_BASE_MS; // Reset backoff
                setup_ntp();
            } else if (millis() - s_connect_start_time > 15000) {
                // Connection attempt timed out
                s_state = WIFI_MGR_DISCONNECTED;
                s_last_attempt_time = millis();

                // Increase exponential backoff
                s_current_backoff_ms *= 2;
                if (s_current_backoff_ms > s_config.max_reconnect_interval_ms) {
                    s_current_backoff_ms = s_config.max_reconnect_interval_ms;
                }
            }
            break;
        }

        case WIFI_MGR_CONNECTED: {
            if (status != WL_CONNECTED) {
                s_state = WIFI_MGR_DISCONNECTED;
                s_last_attempt_time = millis();
            }
            break;
        }

        case WIFI_MGR_FAILED: {
            s_state = WIFI_MGR_DISCONNECTED;
            break;
        }
    }
}

bool wifi_manager_is_connected(void) {
    return (s_state == WIFI_MGR_CONNECTED && WiFi.status() == WL_CONNECTED);
}

wifi_manager_state_t wifi_manager_get_state(void) {
    return s_state;
}

void wifi_manager_disconnect(void) {
    WiFi.disconnect(true);
    s_state = WIFI_MGR_DISCONNECTED;
}

void wifi_manager_reconnect(void) {
    wifi_manager_disconnect();
    s_current_backoff_ms = WIFI_RECONNECT_BASE_MS;
    s_last_attempt_time = millis() - s_current_backoff_ms;
}

int8_t wifi_manager_get_rssi(void) {
    if (wifi_manager_is_connected()) {
        return (int8_t)WiFi.RSSI();
    }
    return -100;
}

void wifi_manager_get_ip(char* buffer, size_t max_len) {
    if (!buffer || max_len == 0) return;
    if (wifi_manager_is_connected()) {
        String ip = WiFi.localIP().toString();
        strncpy(buffer, ip.c_str(), max_len - 1);
        buffer[max_len - 1] = '\0';
    } else {
        strncpy(buffer, "0.0.0.0", max_len - 1);
    }
}

void wifi_manager_get_mac(char* buffer, size_t max_len) {
    if (!buffer || max_len == 0) return;
    String mac = WiFi.macAddress();
    strncpy(buffer, mac.c_str(), max_len - 1);
    buffer[max_len - 1] = '\0';
}

uint32_t wifi_manager_get_uptime_seconds(void) {
    return millis() / 1000;
}
