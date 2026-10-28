/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Project Sentinel — ESP32 HAL Actuator Relay Driver
 * ─────────────────────────────────────────────────────────────────────────────
 * File: hal_relay.cpp
 * Description: Fail-safe digital GPIO actuator relay driver for HVAC interlocks,
 *              exhaust dampers, and magnetic door strike automation.
 * ─────────────────────────────────────────────────────────────────────────────
 */

#include <Arduino.h>
#include "../../include/sentinel_hal.h"

static uint8_t s_relay_pin = PIN_ACTUATOR_RELAY;
static bool s_active_high = true;
static bool s_is_energized = false;
static uint32_t s_trigger_count = 0;
static uint32_t s_last_trigger_time = 0;
static bool s_relay_initialized = false;

bool hal_relay_init(uint8_t pin, bool active_high) {
    s_relay_pin = pin;
    s_active_high = active_high;

    // Fail-secure initialization: Immediately ensure de-energized output
    uint8_t safe_state = s_active_high ? LOW : HIGH;
    digitalWrite(s_relay_pin, safe_state);
    pinMode(s_relay_pin, OUTPUT);
    digitalWrite(s_relay_pin, safe_state);

    s_is_energized = false;
    s_trigger_count = 0;
    s_last_trigger_time = 0;
    s_relay_initialized = true;

    return true;
}

bool hal_relay_set(bool energize) {
    if (!s_relay_initialized) return false;

    s_is_energized = energize;
    uint8_t pin_state;
    if (s_active_high) {
        pin_state = energize ? HIGH : LOW;
    } else {
        pin_state = energize ? LOW : HIGH;
    }

    digitalWrite(s_relay_pin, pin_state);
    s_trigger_count++;
    s_last_trigger_time = millis();

    return true;
}

bool hal_relay_pulse(uint32_t duration_ms) {
    if (!s_relay_initialized) return false;

    hal_relay_set(true);
    delay(duration_ms);
    hal_relay_set(false);

    return true;
}

hal_relay_state_t hal_relay_get_state(void) {
    hal_relay_state_t state;
    state.energized = s_is_energized;
    state.trigger_count = s_trigger_count;
    state.last_trigger_timestamp = s_last_trigger_time;
    state.healthy = s_relay_initialized;
    return state;
}

bool hal_relay_health(void) {
    return s_relay_initialized;
}

void hal_relay_deinit(void) {
    if (s_relay_initialized) {
        // Enforce safe de-energization before release
        uint8_t safe_state = s_active_high ? LOW : HIGH;
        digitalWrite(s_relay_pin, safe_state);
        pinMode(s_relay_pin, INPUT);
        s_is_energized = false;
        s_relay_initialized = false;
    }
}
