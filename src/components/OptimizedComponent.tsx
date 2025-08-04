import React, { useEffect, useState } from 'react';
import { useOptimizationIntegration } from '../utils/optimizationIntegration';

interface OptimizedComponentProps {
  componentName: string;
  children?: React.ReactNode;
}

export const OptimizedComponent: React.FC<OptimizedComponentProps> = ({ 
  componentName, 
  children 
}) => {
  const [optimizationStats, setOptimizationStats] = useState<any>(null);
  const optimization = useOptimizationIntegration(componentName);

  useEffect(() => {
    // Initialize optimizations
    optimization.initialize(componentName);

    // Set up periodic stats collection
    const statsInterval = setInterval(() => {
      const stats = optimization.getOptimizationStats();
      setOptimizationStats(stats);
    }, 10000); // Every 10 seconds

    // Example: Track a timer
    const timerId = setTimeout(() => {
      console.log('Timer completed');
    }, 5000);
    optimization.trackResourceUsage('timer', timerId);

    // Example: Track an event listener
    const handleResize = () => {
      console.log('Window resized');
    };
    window.addEventListener('resize', handleResize);
    optimization.trackResourceUsage('eventListener', 'resize');

    // Cleanup function
    return () => {
      clearInterval(statsInterval);
      clearTimeout(timerId);
      window.removeEventListener('resize', handleResize);
      
      // Cleanup tracked resources
      optimization.cleanupResourceUsage('timer', timerId);
      optimization.cleanupResourceUsage('eventListener', 'resize');
    };
  }, [componentName, optimization]);

  // Example: Send optimized message
  const handleSendOptimizedMessage = async () => {
    try {
      const testData = {
        id: 'test-123',
        url: 'https://example.com',
        status: 'pending',
        progress: 0,
        speed: 0,
        eta: null,
        filename: 'test.mp4',
        filesize: 1024,
        downloaded: 0,
        quality: '720p',
        outputPath: '/downloads',
        addedAt: new Date().toISOString(),
        retryCount: 0
      };

      await optimization.sendOptimizedMessage('download-update', testData);
      console.log('Optimized message sent successfully');
    } catch (error) {
      console.error('Failed to send optimized message:', error);
    }
  };

  // Example: Generate optimization report
  const handleGenerateReport = () => {
    const report = optimization.generateOptimizationReport();
    console.log('Optimization Report:', report);
  };

  return (
    <div className="optimized-component">
      <h3>Optimized Component: {componentName}</h3>
      
      <div className="optimization-controls">
        <button 
          onClick={handleSendOptimizedMessage}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Send Optimized Message
        </button>
        
        <button 
          onClick={handleGenerateReport}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ml-2"
        >
          Generate Report
        </button>
      </div>

      {optimizationStats && (
        <div className="optimization-stats mt-4 p-4 bg-gray-100 rounded">
          <h4 className="font-bold mb-2">Optimization Statistics</h4>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <h5 className="font-semibold">Memory</h5>
              <p>Active Components: {optimizationStats.memory?.activeComponents || 0}</p>
              <p>Components with Issues: {optimizationStats.memory?.componentsWithIssues || 0}</p>
              <p>Event Listeners: {optimizationStats.memory?.totalEventListeners || 0}</p>
              <p>Timers: {optimizationStats.memory?.totalTimers || 0}</p>
            </div>
            
            <div>
              <h5 className="font-semibold">Data Integrity</h5>
              <p>Total Validations: {optimizationStats.dataIntegrity?.total || 0}</p>
              <p>Errors: {optimizationStats.dataIntegrity?.errors || 0}</p>
              <p>Warnings: {optimizationStats.dataIntegrity?.warnings || 0}</p>
              <p>Error Rate: {optimizationStats.dataIntegrity?.errorRate?.toFixed(2) || 0}%</p>
            </div>
            
            <div>
              <h5 className="font-semibold">Compression</h5>
              <p>Total Messages: {optimizationStats.compression?.totalMessages || 0}</p>
              <p>Compressed: {optimizationStats.compression?.compressedMessages || 0}</p>
              <p>Avg Ratio: {optimizationStats.compression?.averageCompressionRatio?.toFixed(3) || 0}</p>
              <p>Savings: {optimizationStats.compression?.compressionSavings ? 
                `${(optimizationStats.compression.compressionSavings / 1024).toFixed(2)}KB` : '0KB'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="component-content mt-4">
        {children}
      </div>
    </div>
  );
};

// Example usage in another component
export const ExampleUsage: React.FC = () => {
  return (
    <OptimizedComponent componentName="ExampleComponent">
      <div className="p-4">
        <h2>Example Optimized Component</h2>
        <p>This component demonstrates the three key optimizations:</p>
        <ul className="list-disc list-inside mt-2">
          <li><strong>Memory Leak Detection:</strong> Tracks event listeners, timers, intervals, and subscriptions</li>
          <li><strong>Data Integrity Checks:</strong> Validates all IPC data before sending/receiving</li>
          <li><strong>Message Compression:</strong> Compresses large messages to reduce IPC overhead</li>
        </ul>
      </div>
    </OptimizedComponent>
  );
}; 