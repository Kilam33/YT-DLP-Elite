import { useEffect, useRef, useCallback } from 'react';

interface ComponentDetector {
  componentName: string;
  mountTime: number;
  unmountTime?: number;
  memoryUsage?: number;
  eventListeners: Set<string>;
  timers: Set<number>;
  intervals: Set<number>;
  subscriptions: Set<() => void>;
}

interface MemoryLeakReport {
  componentName: string;
  duration: number;
  memoryUsage: number;
  eventListeners: string[];
  timers: number[];
  intervals: number[];
  subscriptions: number;
  warnings: string[];
}

class MemoryLeakDetector {
  private static instance: MemoryLeakDetector;
  private components = new Map<string, ComponentDetector>();
  private memorySnapshots: { timestamp: number; usage: number }[] = [];
  private isMonitoring = false;

  static getInstance(): MemoryLeakDetector {
    if (!MemoryLeakDetector.instance) {
      MemoryLeakDetector.instance = new MemoryLeakDetector();
    }
    return MemoryLeakDetector.instance;
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;
    
    // Monitor memory usage every 5 seconds
    this.memorySnapshots = [];
    const memoryInterval = setInterval(() => {
      if ((performance as any).memory) {
        const usage = (performance as any).memory.usedJSHeapSize;
        this.memorySnapshots.push({
          timestamp: Date.now(),
          usage
        });
        
        // Keep only last 100 snapshots (8+ minutes of data)
        if (this.memorySnapshots.length > 100) {
          this.memorySnapshots.shift();
        }
        
        // Check for memory growth
        this.checkMemoryGrowth();
      }
    }, 5000);

    // Cleanup interval on window unload
    window.addEventListener('beforeunload', () => {
      clearInterval(memoryInterval);
      this.generateFinalReport();
    });
  }

  private checkMemoryGrowth() {
    if (this.memorySnapshots.length < 10) return;
    
    const recent = this.memorySnapshots.slice(-10);
    const older = this.memorySnapshots.slice(-20, -10);
    
    if (recent.length === 0 || older.length === 0) return;
    
    const recentAvg = recent.reduce((sum, snap) => sum + snap.usage, 0) / recent.length;
    const olderAvg = older.reduce((sum, snap) => sum + snap.usage, 0) / older.length;
    
    const growth = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (growth > 20) { // 20% growth threshold
      console.warn(`Memory leak detected: ${growth.toFixed(2)}% growth over last 50 seconds`);
      this.reportMemoryLeak(growth);
    }
  }

  private reportMemoryLeak(growth: number) {
    const report = {
      type: 'memory_leak',
      growth,
      timestamp: Date.now(),
      components: Array.from(this.components.values()).map(comp => ({
        name: comp.componentName,
        duration: comp.unmountTime ? comp.unmountTime - comp.mountTime : Date.now() - comp.mountTime,
        eventListeners: comp.eventListeners.size,
        timers: comp.timers.size,
        intervals: comp.intervals.size,
        subscriptions: comp.subscriptions.size
      }))
    };
    
    // Send to monitoring system
    if ((window as any).electronAPI?.reportMemoryLeak) {
      (window as any).electronAPI.reportMemoryLeak(report);
    }
    
    console.warn('Memory Leak Report:', report);
  }

  registerComponent(componentName: string): ComponentDetector {
    const detector: ComponentDetector = {
      componentName,
      mountTime: Date.now(),
      eventListeners: new Set<string>(),
      timers: new Set<number>(),
      intervals: new Set<number>(),
      subscriptions: new Set<() => void>()
    };
    
    this.components.set(componentName, detector);
    return detector;
  }

  unregisterComponent(componentName: string) {
    const detector = this.components.get(componentName);
    if (detector) {
      detector.unmountTime = Date.now();
      
      // Check for cleanup issues
      const warnings: string[] = [];
      
      if (detector.eventListeners.size > 0) {
        warnings.push(`${detector.eventListeners.size} event listeners not cleaned up`);
      }
      
      if (detector.timers.size > 0) {
        warnings.push(`${detector.timers.size} timers not cleared`);
      }
      
      if (detector.intervals.size > 0) {
        warnings.push(`${detector.intervals.size} intervals not cleared`);
      }
      
      if (detector.subscriptions.size > 0) {
        warnings.push(`${detector.subscriptions.size} subscriptions not unsubscribed`);
      }
      
      if (warnings.length > 0) {
        console.warn(`Component ${componentName} cleanup issues:`, warnings);
      }
      
      // Remove after 5 minutes to allow for delayed cleanup
      setTimeout(() => {
        this.components.delete(componentName);
      }, 300000);
    }
  }

  trackEventListener(componentName: string, eventType: string) {
    const detector = this.components.get(componentName);
    if (detector) {
      detector.eventListeners.add(eventType);
    }
  }

  trackTimer(componentName: string, timerId: number) {
    const detector = this.components.get(componentName);
    if (detector) {
      detector.timers.add(timerId);
    }
  }

  trackInterval(componentName: string, intervalId: number) {
    const detector = this.components.get(componentName);
    if (detector) {
      detector.intervals.add(intervalId);
    }
  }

  trackSubscription(componentName: string, unsubscribe: () => void) {
    const detector = this.components.get(componentName);
    if (detector) {
      detector.subscriptions.add(unsubscribe);
    }
  }

  cleanupEventListeners(componentName: string, eventType: string) {
    const detector = this.components.get(componentName);
    if (detector) {
      detector.eventListeners.delete(eventType);
    }
  }

  cleanupTimer(componentName: string, timerId: number) {
    const detector = this.components.get(componentName);
    if (detector) {
      detector.timers.delete(timerId);
    }
  }

  cleanupInterval(componentName: string, intervalId: number) {
    const detector = this.components.get(componentName);
    if (detector) {
      detector.intervals.delete(intervalId);
    }
  }

  cleanupSubscription(componentName: string, unsubscribe: () => void) {
    const detector = this.components.get(componentName);
    if (detector) {
      detector.subscriptions.delete(unsubscribe);
    }
  }

  generateFinalReport(): MemoryLeakReport[] {
    const reports: MemoryLeakReport[] = [];
    
    for (const [name, detector] of this.components) {
      const duration = detector.unmountTime 
        ? detector.unmountTime - detector.mountTime 
        : Date.now() - detector.mountTime;
      
      const warnings: string[] = [];
      if (detector.eventListeners.size > 0) warnings.push('Event listeners not cleaned up');
      if (detector.timers.size > 0) warnings.push('Timers not cleared');
      if (detector.intervals.size > 0) warnings.push('Intervals not cleared');
      if (detector.subscriptions.size > 0) warnings.push('Subscriptions not unsubscribed');
      
      reports.push({
        componentName: name,
        duration,
        memoryUsage: detector.memoryUsage || 0,
        eventListeners: Array.from(detector.eventListeners),
        timers: Array.from(detector.timers),
        intervals: Array.from(detector.intervals),
        subscriptions: detector.subscriptions.size,
        warnings
      });
    }
    
    return reports;
  }
}

export const useMemoryLeakDetection = (componentName: string) => {
  const detector = useRef<ComponentDetector>();
  const memoryDetector = MemoryLeakDetector.getInstance();

  useEffect(() => {
    detector.current = memoryDetector.registerComponent(componentName);
    memoryDetector.startMonitoring();

    return () => {
      if (detector.current) {
        memoryDetector.unregisterComponent(componentName);
      }
    };
  }, [componentName]);

  const trackEventListeners = useCallback((eventType: string) => {
    if (detector.current) {
      memoryDetector.trackEventListener(componentName, eventType);
    }
  }, [componentName]);

  const trackTimer = useCallback((timerId: number) => {
    if (detector.current) {
      memoryDetector.trackTimer(componentName, timerId);
    }
  }, [componentName]);

  const trackInterval = useCallback((intervalId: number) => {
    if (detector.current) {
      memoryDetector.trackInterval(componentName, intervalId);
    }
  }, [componentName]);

  const trackSubscription = useCallback((unsubscribe: () => void) => {
    if (detector.current) {
      memoryDetector.trackSubscription(componentName, unsubscribe);
    }
  }, [componentName]);

  const cleanupEventListeners = useCallback((eventType: string) => {
    if (detector.current) {
      memoryDetector.cleanupEventListeners(componentName, eventType);
    }
  }, [componentName]);

  const cleanupTimer = useCallback((timerId: number) => {
    if (detector.current) {
      memoryDetector.cleanupTimer(componentName, timerId);
    }
  }, [componentName]);

  const cleanupInterval = useCallback((intervalId: number) => {
    if (detector.current) {
      memoryDetector.cleanupInterval(componentName, intervalId);
    }
  }, [componentName]);

  const cleanupSubscription = useCallback((unsubscribe: () => void) => {
    if (detector.current) {
      memoryDetector.cleanupSubscription(componentName, unsubscribe);
    }
  }, [componentName]);

  return {
    trackEventListeners,
    trackTimer,
    trackInterval,
    trackSubscription,
    cleanupEventListeners,
    cleanupTimer,
    cleanupInterval,
    cleanupSubscription,
    generateReport: () => memoryDetector.generateFinalReport()
  };
}; 