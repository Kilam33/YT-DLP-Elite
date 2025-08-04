import pako from 'pako';

// Types for compressed messages
export interface CompressedMessage {
  compressed: boolean;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  data: string | Uint8Array;
  timestamp: number;
  messageType: string;
}

export interface CompressionStats {
  totalMessages: number;
  compressedMessages: number;
  totalOriginalSize: number;
  totalCompressedSize: number;
  averageCompressionRatio: number;
  compressionSavings: number;
  lastReset: number;
}

// Compression configuration
export interface CompressionConfig {
  minSizeThreshold: number; // Minimum size to trigger compression (bytes)
  compressionLevel: number; // 0-9, higher = better compression but slower
  enableStats: boolean;
  enableLogging: boolean;
}

const DEFAULT_CONFIG: CompressionConfig = {
  minSizeThreshold: 1024, // 1KB
  compressionLevel: 6,
  enableStats: true,
  enableLogging: false
};

// Message compression class
export class MessageCompressor {
  private static instance: MessageCompressor;
  private config: CompressionConfig;
  private stats: CompressionStats;
  private compressionCache = new Map<string, string>(); // Cache compressed results

  constructor(config: Partial<CompressionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.resetStats();
  }

  static getInstance(config?: Partial<CompressionConfig>): MessageCompressor {
    if (!MessageCompressor.instance) {
      MessageCompressor.instance = new MessageCompressor(config);
    }
    return MessageCompressor.instance;
  }

  private resetStats() {
    this.stats = {
      totalMessages: 0,
      compressedMessages: 0,
      totalOriginalSize: 0,
      totalCompressedSize: 0,
      averageCompressionRatio: 0,
      compressionSavings: 0,
      lastReset: Date.now()
    };
  }

  // Compress a message if it meets the size threshold
  compressMessage(messageType: string, data: any): CompressedMessage {
    const originalData = JSON.stringify(data);
    const originalSize = new Blob([originalData]).size;
    const timestamp = Date.now();

    // Check if compression is needed
    if (originalSize < this.config.minSizeThreshold) {
      this.updateStats(originalSize, originalSize, false);
      return {
        compressed: false,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
        data: originalData,
        timestamp,
        messageType
      };
    }

    // Check cache first
    const cacheKey = `${messageType}_${originalData}`;
    if (this.compressionCache.has(cacheKey)) {
      const cached = this.compressionCache.get(cacheKey)!;
      const compressedSize = new Blob([cached]).size;
      const compressionRatio = compressedSize / originalSize;
      
      this.updateStats(originalSize, compressedSize, true);
      
      if (this.config.enableLogging) {
        console.log(`Message compression (cached): ${messageType}`, {
          originalSize,
          compressedSize,
          compressionRatio: compressionRatio.toFixed(3),
          savings: `${((1 - compressionRatio) * 100).toFixed(1)}%`
        });
      }

      return {
        compressed: true,
        originalSize,
        compressedSize,
        compressionRatio,
        data: cached,
        timestamp,
        messageType
      };
    }

    try {
      // Compress the data
      const uint8Array = new TextEncoder().encode(originalData);
      const compressed = pako.deflate(uint8Array, { level: this.config.compressionLevel });
      
      // Convert to base64 for safe transmission
      const compressedBase64 = btoa(String.fromCharCode(...compressed));
      const compressedSize = new Blob([compressedBase64]).size;
      const compressionRatio = compressedSize / originalSize;

      // Cache the result
      this.compressionCache.set(cacheKey, compressedBase64);

      // Limit cache size to prevent memory leaks
      if (this.compressionCache.size > 1000) {
        const firstKey = this.compressionCache.keys().next().value;
        this.compressionCache.delete(firstKey);
      }

      this.updateStats(originalSize, compressedSize, true);

      if (this.config.enableLogging) {
        console.log(`Message compression: ${messageType}`, {
          originalSize,
          compressedSize,
          compressionRatio: compressionRatio.toFixed(3),
          savings: `${((1 - compressionRatio) * 100).toFixed(1)}%`
        });
      }

      return {
        compressed: true,
        originalSize,
        compressedSize,
        compressionRatio,
        data: compressedBase64,
        timestamp,
        messageType
      };

    } catch (error) {
      console.error('Compression failed:', error);
      
      // Fallback to uncompressed
      this.updateStats(originalSize, originalSize, false);
      
      return {
        compressed: false,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
        data: originalData,
        timestamp,
        messageType
      };
    }
  }

  // Decompress a message
  decompressMessage(compressedMessage: CompressedMessage): any {
    if (!compressedMessage.compressed) {
      return JSON.parse(compressedMessage.data as string);
    }

    try {
      // Convert base64 back to Uint8Array
      const compressed = Uint8Array.from(atob(compressedMessage.data as string), c => c.charCodeAt(0));
      
      // Decompress
      const decompressed = pako.inflate(compressed, { to: 'string' });
      
      return JSON.parse(decompressed);

    } catch (error) {
      console.error('Decompression failed:', error);
      throw new Error(`Failed to decompress message: ${error.message}`);
    }
  }

  // Compress multiple messages in batch
  compressBatch(messages: Array<{ type: string; data: any }>): CompressedMessage[] {
    return messages.map(msg => this.compressMessage(msg.type, msg.data));
  }

  // Decompress multiple messages in batch
  decompressBatch(compressedMessages: CompressedMessage[]): any[] {
    return compressedMessages.map(msg => this.decompressMessage(msg));
  }

  // Update compression statistics
  private updateStats(originalSize: number, compressedSize: number, wasCompressed: boolean) {
    this.stats.totalMessages++;
    this.stats.totalOriginalSize += originalSize;
    this.stats.totalCompressedSize += compressedSize;

    if (wasCompressed) {
      this.stats.compressedMessages++;
    }

    // Calculate averages
    this.stats.averageCompressionRatio = this.stats.totalCompressedSize / this.stats.totalOriginalSize;
    this.stats.compressionSavings = this.stats.totalOriginalSize - this.stats.totalCompressedSize;
  }

  // Get compression statistics
  getStats(): CompressionStats {
    return { ...this.stats };
  }

  // Reset statistics
  resetStats() {
    this.resetStats();
  }

  // Update configuration
  updateConfig(newConfig: Partial<CompressionConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current configuration
  getConfig(): CompressionConfig {
    return { ...this.config };
  }

  // Clear compression cache
  clearCache() {
    this.compressionCache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      size: this.compressionCache.size,
      keys: Array.from(this.compressionCache.keys())
    };
  }
}

// IPC message compression wrapper
export class IPCCompression {
  private compressor: MessageCompressor;

  constructor(config?: Partial<CompressionConfig>) {
    this.compressor = MessageCompressor.getInstance(config);
  }

  // Send compressed message via IPC
  async sendCompressedMessage(channel: string, messageType: string, data: any): Promise<void> {
    const compressedMessage = this.compressor.compressMessage(messageType, data);
    
    // Send to main process
    if (window.electronAPI?.sendCompressedMessage) {
      await window.electronAPI.sendCompressedMessage(channel, compressedMessage);
    } else {
      // Fallback to regular IPC
      if (window.electronAPI?.sendMessage) {
        await window.electronAPI.sendMessage(channel, data);
      }
    }
  }

  // Receive and decompress message from IPC
  async receiveCompressedMessage(channel: string): Promise<{ type: string; data: any }> {
    if (window.electronAPI?.receiveCompressedMessage) {
      const compressedMessage = await window.electronAPI.receiveCompressedMessage(channel);
      const data = this.compressor.decompressMessage(compressedMessage);
      return {
        type: compressedMessage.messageType,
        data
      };
    } else {
      // Fallback to regular IPC
      if (window.electronAPI?.receiveMessage) {
        const message = await window.electronAPI.receiveMessage(channel);
        return message;
      }
      throw new Error('No IPC method available');
    }
  }

  // Batch send multiple compressed messages
  async sendCompressedBatch(channel: string, messages: Array<{ type: string; data: any }>): Promise<void> {
    const compressedMessages = this.compressor.compressBatch(messages);
    
    if (window.electronAPI?.sendCompressedBatch) {
      await window.electronAPI.sendCompressedBatch(channel, compressedMessages);
    } else {
      // Fallback to individual messages
      for (const message of messages) {
        await this.sendCompressedMessage(channel, message.type, message.data);
      }
    }
  }

  // Get compression statistics
  getStats(): CompressionStats {
    return this.compressor.getStats();
  }

  // Reset statistics
  resetStats() {
    this.compressor.resetStats();
  }
}

// Utility functions for common compression patterns
export const compressDownloadUpdate = (downloadData: any): CompressedMessage => {
  const compressor = MessageCompressor.getInstance();
  return compressor.compressMessage('download-update', downloadData);
};

export const compressMetadata = (metadata: any): CompressedMessage => {
  const compressor = MessageCompressor.getInstance();
  return compressor.compressMessage('metadata', metadata);
};

export const compressPlaylist = (playlist: any): CompressedMessage => {
  const compressor = MessageCompressor.getInstance();
  return compressor.compressMessage('playlist', playlist);
};

export const compressBatch = (messages: Array<{ type: string; data: any }>): CompressedMessage[] => {
  const compressor = MessageCompressor.getInstance();
  return compressor.compressBatch(messages);
};

// Performance monitoring for compression
export class CompressionMonitor {
  private static instance: CompressionMonitor;
  private performanceMetrics: Array<{
    timestamp: number;
    messageType: string;
    originalSize: number;
    compressedSize: number;
    compressionTime: number;
    decompressionTime: number;
  }> = [];

  static getInstance(): CompressionMonitor {
    if (!CompressionMonitor.instance) {
      CompressionMonitor.instance = new CompressionMonitor();
    }
    return CompressionMonitor.instance;
  }

  recordCompression(messageType: string, originalSize: number, compressedSize: number, compressionTime: number) {
    this.performanceMetrics.push({
      timestamp: Date.now(),
      messageType,
      originalSize,
      compressedSize,
      compressionTime,
      decompressionTime: 0
    });

    // Keep only last 1000 metrics
    if (this.performanceMetrics.length > 1000) {
      this.performanceMetrics = this.performanceMetrics.slice(-1000);
    }
  }

  recordDecompression(messageType: string, decompressionTime: number) {
    const lastMetric = this.performanceMetrics[this.performanceMetrics.length - 1];
    if (lastMetric && lastMetric.messageType === messageType) {
      lastMetric.decompressionTime = decompressionTime;
    }
  }

  getPerformanceStats() {
    const total = this.performanceMetrics.length;
    if (total === 0) return null;

    const avgCompressionTime = this.performanceMetrics.reduce((sum, m) => sum + m.compressionTime, 0) / total;
    const avgDecompressionTime = this.performanceMetrics.reduce((sum, m) => sum + m.decompressionTime, 0) / total;
    const avgCompressionRatio = this.performanceMetrics.reduce((sum, m) => sum + (m.compressedSize / m.originalSize), 0) / total;

    return {
      totalMessages: total,
      avgCompressionTime,
      avgDecompressionTime,
      avgCompressionRatio,
      totalSavings: this.performanceMetrics.reduce((sum, m) => sum + (m.originalSize - m.compressedSize), 0)
    };
  }

  clearMetrics() {
    this.performanceMetrics = [];
  }
}

// Export singleton instances
export const ipcCompression = new IPCCompression();
export const compressionMonitor = CompressionMonitor.getInstance(); 