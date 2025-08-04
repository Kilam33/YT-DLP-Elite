import os from 'os';
import fs from 'fs/promises';
import path from 'path';

/**
 * System Resource Monitor
 * Tracks CPU, memory, disk usage, and process statistics
 */
class ResourceMonitor {
  constructor() {
    this.metrics = {
      cpu: {
        usage: 0,
        loadAverage: [0, 0, 0],
        cores: os.cpus().length
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: 0,
        usage: 0
      },
      disk: {
        total: 0,
        free: 0,
        used: 0,
        usage: 0
      },
      processes: {
        count: 0,
        ytDlp: 0,
        ffmpeg: 0
      },
      network: {
        bytesReceived: 0,
        bytesSent: 0
      }
    };
    
    this.history = [];
    this.maxHistorySize = 100;
    this.isMonitoring = false;
    this.monitoringInterval = null;
  }

  /**
   * Start resource monitoring
   */
  startMonitoring(intervalMs = 5000) {
    if (this.isMonitoring) {
      console.log('Resource monitoring already active');
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
    }, intervalMs);

    console.log(`Resource monitoring started with ${intervalMs}ms interval`);
  }

  /**
   * Stop resource monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('Resource monitoring stopped');
  }

  /**
   * Update all metrics
   */
  async updateMetrics() {
    try {
      // Update CPU metrics
      this.updateCpuMetrics();
      
      // Update memory metrics
      this.updateMemoryMetrics();
      
      // Update disk metrics
      await this.updateDiskMetrics();
      
      // Update process metrics
      await this.updateProcessMetrics();
      
      // Update network metrics
      await this.updateNetworkMetrics();
      
      // Store in history
      this.storeMetrics();
      
    } catch (error) {
      console.error('Error updating metrics:', error);
    }
  }

  /**
   * Update CPU metrics
   */
  updateCpuMetrics() {
    const cpus = os.cpus();
    const loadAverage = os.loadavg();
    
    this.metrics.cpu = {
      usage: this.calculateCpuUsage(cpus),
      loadAverage: loadAverage,
      cores: cpus.length
    };
  }

  /**
   * Calculate CPU usage percentage
   */
  calculateCpuUsage(cpus) {
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - (100 * idle / total);

    return Math.round(usage * 100) / 100;
  }

  /**
   * Update memory metrics
   */
  updateMemoryMetrics() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const usage = (used / total) * 100;

    this.metrics.memory = {
      total,
      free,
      used,
      usage: Math.round(usage * 100) / 100
    };
  }

  /**
   * Update disk metrics
   */
  async updateDiskMetrics() {
    try {
      // Get disk usage for the downloads directory
      const downloadsPath = path.join(process.cwd(), 'downloads');
      
      // Check if directory exists
      try {
        await fs.access(downloadsPath);
      } catch {
        // Directory doesn't exist, use current directory
        const currentPath = process.cwd();
        const stats = await this.getDiskStats(currentPath);
        this.metrics.disk = stats;
        return;
      }

      const stats = await this.getDiskStats(downloadsPath);
      this.metrics.disk = stats;
    } catch (error) {
      console.error('Error updating disk metrics:', error);
    }
  }

  /**
   * Get disk statistics for a path
   */
  async getDiskStats(path) {
    try {
      // This is a simplified implementation
      // In a real app, you might use a library like 'diskusage' for more accurate stats
      const total = 1024 * 1024 * 1024 * 100; // 100GB example
      const free = 1024 * 1024 * 1024 * 50;   // 50GB example
      const used = total - free;
      const usage = (used / total) * 100;

      return {
        total,
        free,
        used,
        usage: Math.round(usage * 100) / 100
      };
    } catch (error) {
      console.error('Error getting disk stats:', error);
      return {
        total: 0,
        free: 0,
        used: 0,
        usage: 0
      };
    }
  }

  /**
   * Update process metrics
   */
  async updateProcessMetrics() {
    try {
      // Count yt-dlp and ffmpeg processes
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const [ytDlpCount, ffmpegCount] = await Promise.all([
        this.countProcesses('yt-dlp'),
        this.countProcesses('ffmpeg')
      ]);

      this.metrics.processes = {
        count: ytDlpCount + ffmpegCount,
        ytDlp: ytDlpCount,
        ffmpeg: ffmpegCount
      };
    } catch (error) {
      console.error('Error updating process metrics:', error);
    }
  }

  /**
   * Count processes by name
   */
  async countProcesses(processName) {
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      let command;
      if (process.platform === 'win32') {
        command = `tasklist /FI "IMAGENAME eq ${processName}.exe" 2>NUL | find /I /C "${processName}.exe"`;
      } else {
        command = `pgrep -c ${processName}`;
      }

      const { stdout } = await execAsync(command);
      return parseInt(stdout.trim()) || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Update network metrics
   */
  async updateNetworkMetrics() {
    try {
      // This is a simplified implementation
      // In a real app, you might use a library like 'network-usage' for accurate stats
      this.metrics.network = {
        bytesReceived: 0,
        bytesSent: 0
      };
    } catch (error) {
      console.error('Error updating network metrics:', error);
    }
  }

  /**
   * Store metrics in history
   */
  storeMetrics() {
    const timestamp = Date.now();
    const metricsWithTimestamp = {
      timestamp,
      ...this.metrics
    };

    this.history.push(metricsWithTimestamp);

    // Keep only the last N entries
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get metrics history
   */
  getMetricsHistory() {
    return [...this.history];
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary() {
    if (this.history.length === 0) {
      return null;
    }

    const recentMetrics = this.history.slice(-10); // Last 10 measurements
    
    const cpuUsage = recentMetrics.map(m => m.cpu.usage);
    const memoryUsage = recentMetrics.map(m => m.memory.usage);
    const diskUsage = recentMetrics.map(m => m.disk.usage);

    return {
      cpu: {
        average: this.average(cpuUsage),
        min: Math.min(...cpuUsage),
        max: Math.max(...cpuUsage)
      },
      memory: {
        average: this.average(memoryUsage),
        min: Math.min(...memoryUsage),
        max: Math.max(...memoryUsage)
      },
      disk: {
        average: this.average(diskUsage),
        min: Math.min(...diskUsage),
        max: Math.max(...diskUsage)
      },
      processes: this.metrics.processes,
      monitoringDuration: this.history.length * 5 // 5 seconds per measurement
    };
  }

  /**
   * Calculate average of array
   */
  average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  /**
   * Check if system resources are healthy
   */
  isSystemHealthy() {
    const { cpu, memory, disk } = this.metrics;
    
    return {
      healthy: true,
      warnings: [],
      critical: []
    };
  }

  /**
   * Get resource alerts
   */
  getResourceAlerts() {
    const alerts = [];
    const { cpu, memory, disk } = this.metrics;

    if (cpu.usage > 90) {
      alerts.push({
        type: 'critical',
        component: 'cpu',
        message: `High CPU usage: ${cpu.usage}%`,
        value: cpu.usage
      });
    } else if (cpu.usage > 80) {
      alerts.push({
        type: 'warning',
        component: 'cpu',
        message: `Elevated CPU usage: ${cpu.usage}%`,
        value: cpu.usage
      });
    }

    if (memory.usage > 90) {
      alerts.push({
        type: 'critical',
        component: 'memory',
        message: `High memory usage: ${memory.usage}%`,
        value: memory.usage
      });
    } else if (memory.usage > 80) {
      alerts.push({
        type: 'warning',
        component: 'memory',
        message: `Elevated memory usage: ${memory.usage}%`,
        value: memory.usage
      });
    }

    if (disk.usage > 95) {
      alerts.push({
        type: 'critical',
        component: 'disk',
        message: `Low disk space: ${disk.usage}% used`,
        value: disk.usage
      });
    } else if (disk.usage > 85) {
      alerts.push({
        type: 'warning',
        component: 'disk',
        message: `Limited disk space: ${disk.usage}% used`,
        value: disk.usage
      });
    }

    return alerts;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopMonitoring();
    this.history = [];
  }
}

export default ResourceMonitor; 