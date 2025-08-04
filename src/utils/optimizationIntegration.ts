import { useMemoryLeakDetection } from '../hooks/useMemoryLeakDetection';
import { dataIntegrityChecker } from './dataIntegrity';
import { ipcCompression, compressionMonitor } from './messageCompression';

// Integration class that coordinates all three optimizations
export class OptimizationIntegration {
  private static instance: OptimizationIntegration;
  private memoryDetector!: ReturnType<typeof useMemoryLeakDetection>;
  private isInitialized = false;

  static getInstance(): OptimizationIntegration {
    if (!OptimizationIntegration.instance) {
      OptimizationIntegration.instance = new OptimizationIntegration();
    }
    return OptimizationIntegration.instance;
  }

  // Initialize all optimizations
  initialize(componentName: string) {
    if (this.isInitialized) return;

    // Initialize memory leak detection
    this.memoryDetector = useMemoryLeakDetection(componentName);

    // Initialize data integrity monitoring
    this.setupDataIntegrityMonitoring();

    // Initialize compression monitoring
    this.setupCompressionMonitoring();

    this.isInitialized = true;
    console.log('Optimization integration initialized for:', componentName);
  }

  private setupDataIntegrityMonitoring() {
    // Monitor IPC data integrity
    const originalSendMessage = (window as any).electronAPI?.sendMessage;
    if (originalSendMessage && (window as any).electronAPI) {
      (window as any).electronAPI.sendMessage = async (channel: string, data: any) => {
        // Validate data before sending
        const integrityCheck = dataIntegrityChecker.validateIPCData(
          channel, 
          data, 
          'renderer'
        );

        if (!integrityCheck.validationResult.isValid) {
          console.error('Data integrity check failed:', integrityCheck);
          throw new Error(`Data integrity validation failed: ${integrityCheck.validationResult.errors.join(', ')}`);
        }

        // Use compression if available
        if ((window as any).electronAPI?.sendCompressedMessage) {
          await ipcCompression.sendCompressedMessage(channel, channel, data);
        } else {
          await originalSendMessage(channel, data);
        }
      };
    }
  }

  private setupCompressionMonitoring() {
    // Monitor compression performance
    setInterval(() => {
      const stats = ipcCompression.getStats();
      const perfStats = compressionMonitor.getPerformanceStats();
      
      if (stats.totalMessages > 0) {
        console.log('Compression Stats:', {
          totalMessages: stats.totalMessages,
          compressedMessages: stats.compressedMessages,
          averageCompressionRatio: stats.averageCompressionRatio.toFixed(3),
          compressionSavings: `${(stats.compressionSavings / 1024).toFixed(2)}KB saved`
        });
      }

      if (perfStats) {
        console.log('Compression Performance:', {
          avgCompressionTime: `${perfStats.avgCompressionTime.toFixed(2)}ms`,
          avgDecompressionTime: `${perfStats.avgDecompressionTime.toFixed(2)}ms`,
          totalSavings: `${(perfStats.totalSavings / 1024).toFixed(2)}KB`
        });
      }
    }, 30000); // Log every 30 seconds
  }

  // Track resource usage for memory leak detection
  trackResourceUsage(resourceType: 'eventListener' | 'timer' | 'interval' | 'subscription', id: string | number) {
    if (!this.memoryDetector) return;

    switch (resourceType) {
      case 'eventListener':
        this.memoryDetector.trackEventListeners(id as string);
        break;
      case 'timer':
        this.memoryDetector.trackTimer(id as number);
        break;
      case 'interval':
        this.memoryDetector.trackInterval(id as number);
        break;
      case 'subscription':
        this.memoryDetector.trackSubscription(id as unknown as () => void);
        break;
    }
  }

  // Cleanup resource usage
  cleanupResourceUsage(resourceType: 'eventListener' | 'timer' | 'interval' | 'subscription', id: string | number) {
    if (!this.memoryDetector) return;

    switch (resourceType) {
      case 'eventListener':
        this.memoryDetector.cleanupEventListeners(id as string);
        break;
      case 'timer':
        this.memoryDetector.cleanupTimer(id as number);
        break;
      case 'interval':
        this.memoryDetector.cleanupInterval(id as number);
        break;
      case 'subscription':
        this.memoryDetector.cleanupSubscription(id as unknown as () => void);
        break;
    }
  }

  // Send optimized IPC message with all checks
  async sendOptimizedMessage(channel: string, data: any): Promise<void> {
    // 1. Data integrity check
    const integrityCheck = dataIntegrityChecker.validateIPCData(channel, data, 'renderer');
    
    if (!integrityCheck.validationResult.isValid) {
      console.error('Data integrity validation failed:', integrityCheck.validationResult.errors);
      throw new Error(`Data integrity check failed: ${integrityCheck.validationResult.errors.join(', ')}`);
    }

    // 2. Compress and send
    try {
      await ipcCompression.sendCompressedMessage(channel, channel, data);
    } catch (error) {
      console.error('Failed to send compressed message:', error);
      // Fallback to regular IPC
      if ((window as any).electronAPI?.sendMessage) {
        await (window as any).electronAPI.sendMessage(channel, data);
      }
    }
  }

  // Receive and validate optimized IPC message
  async receiveOptimizedMessage(channel: string): Promise<{ type: string; data: any }> {
    try {
      const message = await ipcCompression.receiveCompressedMessage(channel);
      
      // Validate received data
      const integrityCheck = dataIntegrityChecker.validateIPCData(
        message.type, 
        message.data, 
        'renderer'
      );

      if (!integrityCheck.validationResult.isValid) {
        console.error('Received data integrity validation failed:', integrityCheck.validationResult.errors);
        throw new Error(`Received data integrity check failed: ${integrityCheck.validationResult.errors.join(', ')}`);
      }

      return message;
    } catch (error) {
      console.error('Failed to receive compressed message:', error);
      // Fallback to regular IPC
      if ((window as any).electronAPI?.receiveMessage) {
        const message = await (window as any).electronAPI.receiveMessage(channel);
        return message;
      }
      throw error;
    }
  }

  // Get comprehensive optimization statistics
  getOptimizationStats() {
    const memoryReport = this.memoryDetector?.generateReport() || [];
    const integrityStats = dataIntegrityChecker.getIntegrityStats();
    const compressionStats = ipcCompression.getStats();
    const compressionPerfStats = compressionMonitor.getPerformanceStats();

    return {
      memory: {
        activeComponents: memoryReport.length,
        componentsWithIssues: memoryReport.filter(r => r.warnings.length > 0).length,
        totalEventListeners: memoryReport.reduce((sum, r) => sum + r.eventListeners.length, 0),
        totalTimers: memoryReport.reduce((sum, r) => sum + r.timers.length, 0),
        totalIntervals: memoryReport.reduce((sum, r) => sum + r.intervals.length, 0),
        totalSubscriptions: memoryReport.reduce((sum, r) => sum + r.subscriptions, 0)
      },
      dataIntegrity: integrityStats,
      compression: {
        ...compressionStats,
        performance: compressionPerfStats
      }
    };
  }

  // Generate optimization report
  generateOptimizationReport() {
    const stats = this.getOptimizationStats();
    
    const report = {
      timestamp: Date.now(),
      summary: {
        memoryLeaks: stats.memory.componentsWithIssues > 0 ? 'WARNING' : 'OK',
        dataIntegrity: stats.dataIntegrity.errorRate > 5 ? 'WARNING' : 'OK',
        compressionEfficiency: stats.compression.averageCompressionRatio < 0.8 ? 'GOOD' : 'NEEDS_IMPROVEMENT'
      },
      details: stats,
      recommendations: this.generateRecommendations(stats)
    };

    console.log('Optimization Report:', report);
    return report;
  }

  private generateRecommendations(stats: any) {
    const recommendations: string[] = [];

    if (stats.memory.componentsWithIssues > 0) {
      recommendations.push('Review component cleanup - memory leaks detected');
    }

    if (stats.dataIntegrity.errorRate > 5) {
      recommendations.push('High data integrity error rate - review data validation');
    }

    if (stats.compression.averageCompressionRatio > 0.9) {
      recommendations.push('Low compression efficiency - consider adjusting compression settings');
    }

    if (stats.compression.performance?.avgCompressionTime > 10) {
      recommendations.push('Slow compression performance - consider reducing compression level');
    }

    return recommendations;
  }

  // Cleanup all optimizations
  cleanup() {
    this.isInitialized = false;
    compressionMonitor.clearMetrics();
    dataIntegrityChecker.clearHistory();
    console.log('Optimization integration cleaned up');
  }
}

// Export singleton instance
export const optimizationIntegration = OptimizationIntegration.getInstance();

// React hook for easy integration
export const useOptimizationIntegration = (componentName: string) => {
  const integration = optimizationIntegration;
  
  // Note: This hook should be used within a React component
  // The actual useEffect would be implemented in the component using this hook
  
  return {
    trackResourceUsage: integration.trackResourceUsage.bind(integration),
    cleanupResourceUsage: integration.cleanupResourceUsage.bind(integration),
    sendOptimizedMessage: integration.sendOptimizedMessage.bind(integration),
    receiveOptimizedMessage: integration.receiveOptimizedMessage.bind(integration),
    getOptimizationStats: integration.getOptimizationStats.bind(integration),
    generateOptimizationReport: integration.generateOptimizationReport.bind(integration),
    initialize: integration.initialize.bind(integration)
  };
}; 