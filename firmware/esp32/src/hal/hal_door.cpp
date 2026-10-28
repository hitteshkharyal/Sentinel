/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Project Sentinel — ESP32 HAL Magnetic Door Reed Switch Driver
 * ─────────────────────────────────────────────────────────────────────────────
 * File: hal_door.cpp
 * Description: Digital GPIO driver with internal pull-up and contact-chatter
 *              debounce filter for physical door open/close interlock detection.
 * ─────────────────────────────────────────────────────────────────────────────
 */

#include <Arduino.h>
#include "../../include/sentinel_hal.h"

static uint8_t s_door_pin = PIN_DOOR_REED;
static bool s_door_initialized = false;
static bool s_last_stable_state = false; // false = closed, true = open
static uint32_t s_transition_count = 0;
static uint32_t s_last_debounce_time = 0;
static const uint32_t DOOR_DEBOUNCE_MS = 50;

bool hal_door_init(uint8_t pin) {
    s_door_pin = pin;
    pinMode(s_door_pin, INPUT_PULLUP);

    // Initial state: LOW = Magnet present (closed), HIGH = Magnet separated (open)
    s_last_stable_state = (digitalRead(s_door_pin) == HIGH);
    s_transition_count = 0;
    s_last_debounce_time = millis();
    s_door_initialized = true;

    return true;
}

hal_door_reading_t hal_door_read(void) {
    hal_door_reading_t reading;
    memset(&reading, 0, sizeof(reading));

    if (!s_door_initialized) {
        reading.healthy = false;
        return reading;
    }

    // Read current pin state
    bool raw_open = (digitalRead(s_door_pin) == HIGH);

    if (raw_open != s_last_stable_state) {
        if ((millis() - s_last_debounce_time) > DOOR_DEBOUNCE_MS) {
            s_last_stable_state = raw_open;
            s_transition_count++;
            s_last_debounce_time = millis();
        }
    }

    reading.is_open = s_last_stable_state;
    reading.transition_count = s_transition_count;
    reading.healthy = true;

    return reading;
}

bool hal_door_health(void) {
    return s_door_initialized;
}

void hal_door_deinit(void) {
    s_door_initialized = false;
}
