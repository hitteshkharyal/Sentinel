/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Project Sentinel — ESP32 HAL PIR Motion Sensor Driver
 * ─────────────────────────────────────────────────────────────────────────────
 * File: hal_pir.cpp
 * Description: Digital GPIO driver for Passive Infrared motion detection with
 *              hardware interrupt edge counting and software debounce filter.
 * ─────────────────────────────────────────────────────────────────────────────
 */

#include <Arduino.h>
#include "../../include/sentinel_hal.h"

static uint8_t s_pir_pin = PIN_PIR_MOTION;
static volatile uint32_t s_pir_events = 0;
static volatile uint32_t s_last_interrupt_time = 0;
static bool s_pir_initialized = false;
static const uint32_t DEBOUNCE_MS = 150;

// Hardware ISR for PIR pulse edge
static void IRAM_ATTR pir_isr_handler(void) {
    uint32_t now = millis();
    if (now - s_last_interrupt_time > DEBOUNCE_MS) {
        s_pir_events++;
        s_last_interrupt_time = now;
    }
}

bool hal_pir_init(uint8_t pin) {
    s_pir_pin = pin;
    pinMode(s_pir_pin, INPUT);
    
    // Attach rising edge interrupt to count real motion pulses
    attachInterrupt(digitalPinToInterrupt(s_pir_pin), pir_isr_handler, RISING);
    
    s_pir_initialized = true;
    s_pir_events = 0;
    return true;
}

hal_pir_reading_t hal_pir_read(void) {
    hal_pir_reading_t reading;
    memset(&reading, 0, sizeof(reading));

    if (!s_pir_initialized) {
        reading.healthy = false;
        return reading;
    }

    // Read direct instantaneous digital state
    int raw_state = digitalRead(s_pir_pin);
    reading.is_motion_detected = (raw_state == HIGH);
    reading.motion_events = s_pir_events;
    reading.healthy = true;

    return reading;
}

bool hal_pir_health(void) {
    return s_pir_initialized;
}

void hal_pir_deinit(void) {
    if (s_pir_initialized) {
        detachInterrupt(digitalPinToInterrupt(s_pir_pin));
        pinMode(s_pir_pin, INPUT);
        s_pir_initialized = false;
    }
}
