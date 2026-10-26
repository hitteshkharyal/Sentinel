// ─────────────────────────────────────────────
// SENTINEL Web — Native Browser Notification Engine
// ─────────────────────────────────────────────

import type { Alert } from '@sentinel/types';

class NotificationEngine {
  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      return await Notification.requestPermission();
    } catch {
      return 'denied';
    }
  }

  /**
   * Dispatch native browser desktop notification for high-priority incidents.
   */
  public dispatchAlert(alert: Alert, onClick?: () => void): Notification | null {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return null;
    }

    try {
      const severityIcon = alert.severity === 'CRITICAL' ? '🚨' : alert.severity === 'HIGH' ? '⚠️' : '🔔';
      const title = `${severityIcon} SENTINEL: [${alert.severity}] ${alert.title}`;
      const location = alert.facilityName
        ? `${alert.facilityName}${alert.roomName ? ` / ${alert.roomName}` : ''}`
        : 'Global Organization';

      const options: NotificationOptions = {
        body: `${location}\n${alert.description}\nRecommended: ${alert.recommendedAction || 'Inspect telemetry immediately.'}`,
        tag: `sentinel-alert-${alert.id}`,
        requireInteraction: alert.severity === 'CRITICAL',
      };

      const notification = new Notification(title, options);

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (onClick) onClick();
      };

      return notification;
    } catch (err) {
      console.warn('[NotificationEngine] Failed to dispatch native notification:', err);
      return null;
    }
  }
}

export const notificationEngine = new NotificationEngine();
