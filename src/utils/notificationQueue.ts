import toast from 'react-hot-toast';

/**
 * Queue-based notification system for non-blocking notifications
 * Prevents notification spam and provides better UX
 */
export class NotificationQueue {
  private static instance: NotificationQueue;
  private queue: Array<NotificationItem> = [];
  private isProcessing = false;
  private maxConcurrent = 3;
  private currentNotifications = 0;
  private processingInterval: NodeJS.Timeout | null = null;

  // Notification types
  static readonly TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
    LOADING: 'loading'
  } as const;

  // Notification priorities
  static readonly PRIORITIES = {
    LOW: 1,
    NORMAL: 2,
    HIGH: 3,
    CRITICAL: 4
  } as const;

  constructor() {
    if (NotificationQueue.instance) {
      return NotificationQueue.instance;
    }
    NotificationQueue.instance = this;
    this.startProcessing();
  }

  /**
   * Add a notification to the queue
   */
  add(
    message: string,
    type: keyof typeof NotificationQueue.TYPES = 'info',
    priority: keyof typeof NotificationQueue.PRIORITIES = 'NORMAL',
    options: Partial<NotificationOptions> = {}
  ): string {
    const notification: NotificationItem = {
      id: this.generateId(),
      message,
      type,
      priority: NotificationQueue.PRIORITIES[priority],
      options: {
        duration: this.getDefaultDuration(type),
        ...options
      },
      timestamp: Date.now(),
      retryCount: 0
    };

    // Insert based on priority (higher priority first)
    const insertIndex = this.queue.findIndex(item => item.priority < notification.priority);
    if (insertIndex === -1) {
      this.queue.push(notification);
    } else {
      this.queue.splice(insertIndex, 0, notification);
    }

    return notification.id;
  }

  /**
   * Add a success notification
   */
  success(message: string, options?: Partial<NotificationOptions>): string {
    return this.add(message, 'success', 'NORMAL', options);
  }

  /**
   * Add an error notification
   */
  error(message: string, options?: Partial<NotificationOptions>): string {
    return this.add(message, 'error', 'HIGH', options);
  }

  /**
   * Add a warning notification
   */
  warning(message: string, options?: Partial<NotificationOptions>): string {
    return this.add(message, 'warning', 'NORMAL', options);
  }

  /**
   * Add an info notification
   */
  info(message: string, options?: Partial<NotificationOptions>): string {
    return this.add(message, 'info', 'LOW', options);
  }

  /**
   * Add a loading notification
   */
  loading(message: string, options?: Partial<NotificationOptions>): string {
    return this.add(message, 'loading', 'NORMAL', {
      duration: Infinity,
      ...options
    });
  }

  /**
   * Update a loading notification
   */
  update(id: string, message: string, type: keyof typeof NotificationQueue.TYPES = 'success'): void {
    const notification = this.queue.find(item => item.id === id);
    if (notification) {
      notification.message = message;
      notification.type = type;
      notification.options.duration = this.getDefaultDuration(type);
    }
  }

  /**
   * Remove a notification from the queue
   */
  remove(id: string): void {
    const index = this.queue.findIndex(item => item.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    this.queue = [];
    toast.dismiss();
  }

  /**
   * Start processing the notification queue
   */
  private startProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 100); // Process every 100ms
  }

  /**
   * Process the notification queue
   */
  private processQueue(): void {
    if (this.isProcessing || this.queue.length === 0 || this.currentNotifications >= this.maxConcurrent) {
      return;
    }

    this.isProcessing = true;

    try {
      const notification = this.queue.shift();
      if (notification) {
        this.showNotification(notification);
      }
    } catch (error) {
      console.error('Error processing notification queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Show a notification using react-hot-toast
   */
  private showNotification(notification: NotificationItem): void {
    try {
      const toastOptions = {
        id: notification.id,
        duration: notification.options.duration,
        position: notification.options.position || 'bottom-right',
        style: this.getNotificationStyle(notification.type),
        icon: this.getNotificationIcon(notification.type),
        ...notification.options
      };

      switch (notification.type) {
        case 'success':
          toast.success(notification.message, toastOptions);
          break;
        case 'error':
          toast.error(notification.message, toastOptions);
          break;
        case 'warning':
          toast(notification.message, {
            ...toastOptions,
            icon: '⚠️'
          });
          break;
        case 'loading':
          toast.loading(notification.message, toastOptions);
          break;
        default:
          toast(notification.message, toastOptions);
      }

      this.currentNotifications++;

      // Track notification lifecycle
      setTimeout(() => {
        this.currentNotifications--;
      }, notification.options.duration || 4000);

    } catch (error) {
      console.error('Error showing notification:', error);
      // Retry with exponential backoff
      if (notification.retryCount < 3) {
        notification.retryCount++;
        this.queue.unshift(notification);
      }
    }
  }

  /**
   * Get default duration for notification type
   */
  private getDefaultDuration(type: keyof typeof NotificationQueue.TYPES): number {
    switch (type) {
      case 'success':
        return 3000;
      case 'error':
        return 5000;
      case 'warning':
        return 4000;
      case 'info':
        return 3000;
      case 'loading':
        return Infinity;
      default:
        return 4000;
    }
  }

  /**
   * Get notification style based on type
   */
  private getNotificationStyle(type: keyof typeof NotificationQueue.TYPES): React.CSSProperties {
    const baseStyle: React.CSSProperties = {
      background: '#1e293b',
      color: '#ffffff',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '14px',
      fontWeight: '500',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    };

    switch (type) {
      case 'success':
        return {
          ...baseStyle,
          borderColor: '#84cc16',
          background: 'linear-gradient(135deg, #1e293b 0%, #1e3a2b 100%)',
        };
      case 'error':
        return {
          ...baseStyle,
          borderColor: '#ef4444',
          background: 'linear-gradient(135deg, #1e293b 0%, #3b1e1e 100%)',
        };
      case 'warning':
        return {
          ...baseStyle,
          borderColor: '#f59e0b',
          background: 'linear-gradient(135deg, #1e293b 0%, #3b2e1e 100%)',
        };
      case 'info':
        return {
          ...baseStyle,
          borderColor: '#3b82f6',
          background: 'linear-gradient(135deg, #1e293b 0%, #1e2b3b 100%)',
        };
      case 'loading':
        return {
          ...baseStyle,
          borderColor: '#84cc16',
          background: 'linear-gradient(135deg, #1e293b 0%, #1e3a2b 100%)',
        };
      default:
        return baseStyle;
    }
  }

  /**
   * Get notification icon based on type
   */
  private getNotificationIcon(type: keyof typeof NotificationQueue.TYPES): string {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'loading':
        return '⏳';
      default:
        return '💬';
    }
  }

  /**
   * Generate unique notification ID
   */
  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue statistics
   */
  getStats(): NotificationStats {
    return {
      queueLength: this.queue.length,
      currentNotifications: this.currentNotifications,
      maxConcurrent: this.maxConcurrent,
      isProcessing: this.isProcessing,
      oldestNotification: this.queue[0]?.timestamp || 0,
      newestNotification: this.queue[this.queue.length - 1]?.timestamp || 0
    };
  }

  /**
   * Set maximum concurrent notifications
   */
  setMaxConcurrent(max: number): void {
    this.maxConcurrent = Math.max(1, Math.min(10, max));
  }

  /**
   * Get all queued notifications
   */
  getQueuedNotifications(): NotificationItem[] {
    return [...this.queue];
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.clear();
  }
}

// Types
interface NotificationItem {
  id: string;
  message: string;
  type: keyof typeof NotificationQueue.TYPES;
  priority: number;
  options: NotificationOptions;
  timestamp: number;
  retryCount: number;
}

interface NotificationOptions {
  duration: number;
  position?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
  style?: React.CSSProperties;
  icon?: string;
  [key: string]: any;
}

interface NotificationStats {
  queueLength: number;
  currentNotifications: number;
  maxConcurrent: number;
  isProcessing: boolean;
  oldestNotification: number;
  newestNotification: number;
}

// Export singleton instance
export const notificationQueue = new NotificationQueue();
export default notificationQueue; 