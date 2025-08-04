import { z } from 'zod';

// Type definitions for data integrity
export interface DataIntegrityCheck {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  timestamp: number;
  dataType: string;
  dataSize: number;
}

export interface IPCDataIntegrity {
  messageType: string;
  payload: any;
  timestamp: number;
  source: 'main' | 'renderer';
  validationResult: DataIntegrityCheck;
}

// Runtime type guards
export const isDownloadData = (data: any): data is any => {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.url === 'string' &&
    typeof data.status === 'string' &&
    typeof data.progress === 'number' &&
    typeof data.filename === 'string' &&
    typeof data.quality === 'string' &&
    typeof data.outputPath === 'string' &&
    typeof data.addedAt === 'string'
  );
};

export const isMetadataData = (data: any): data is any => {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.title === 'string' &&
    typeof data.duration === 'number' &&
    typeof data.uploader === 'string'
  );
};

export const isPlaylistData = (data: any): data is any => {
  return (
    data &&
    typeof data === 'object' &&
    data._type === 'playlist' &&
    typeof data.title === 'string' &&
    Array.isArray(data.entries) &&
    data.entries.length > 0
  );
};

export const isQueueData = (data: any): data is any => {
  return (
    data &&
    typeof data === 'object' &&
    Array.isArray(data.items) &&
    typeof data.status === 'string'
  );
};

// Data integrity validation schemas
export const downloadDataSchema = z.object({
  id: z.string().min(1, 'Download ID is required'),
  url: z.string().url('Invalid download URL'),
  status: z.enum(['pending', 'initializing', 'connecting', 'downloading', 'processing', 'completed', 'error', 'paused']),
  progress: z.number().min(0).max(100),
  speed: z.number().min(0),
  eta: z.number().nullable(),
  filename: z.string().min(1, 'Filename is required'),
  filesize: z.number().min(0),
  downloaded: z.number().min(0),
  quality: z.string().min(1, 'Quality is required'),
  outputPath: z.string().min(1, 'Output path is required'),
  addedAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  metadata: z.any().optional(),
  error: z.string().nullable(),
  retryCount: z.number().min(0),
});

export const metadataDataSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  duration: z.number().min(0, 'Duration must be positive'),
  uploader: z.string().min(1, 'Uploader is required'),
  upload_date: z.string().optional(),
  description: z.string().optional(),
  thumbnail: z.string().url().optional(),
  formats: z.array(z.object({
    format_id: z.string(),
    ext: z.string(),
    height: z.number().optional(),
    filesize: z.number().optional(),
    vcodec: z.string().optional(),
    acodec: z.string().optional(),
  })).optional(),
});

export const playlistDataSchema = z.object({
  _type: z.literal('playlist'),
  title: z.string().min(1, 'Playlist title is required'),
  entries: z.array(z.object({
    id: z.string().min(1, 'Entry ID is required'),
    title: z.string().min(1, 'Entry title is required'),
    duration: z.number().min(0, 'Duration must be positive'),
    uploader: z.string().min(1, 'Uploader is required'),
    thumbnail: z.string().url().optional(),
    url: z.string().url('Invalid entry URL'),
  })).min(1, 'Playlist must have at least one entry'),
});

export const queueDataSchema = z.object({
  items: z.array(z.object({
    id: z.string().min(1, 'Queue item ID is required'),
    url: z.string().url('Invalid queue item URL'),
    priority: z.number().min(0).max(10),
    addedAt: z.string().datetime(),
  })),
  status: z.enum(['idle', 'processing', 'paused', 'error']),
  currentIndex: z.number().min(0),
  maxConcurrent: z.number().min(1).max(10),
});

// Data integrity checker class
export class DataIntegrityChecker {
  private static instance: DataIntegrityChecker;
  private validationHistory: IPCDataIntegrity[] = [];
  private errorThreshold = 5; // Max errors before alerting
  private warningThreshold = 10; // Max warnings before alerting

  static getInstance(): DataIntegrityChecker {
    if (!DataIntegrityChecker.instance) {
      DataIntegrityChecker.instance = new DataIntegrityChecker();
    }
    return DataIntegrityChecker.instance;
  }

  validateDownloadData(data: any): DataIntegrityCheck {
    const errors: string[] = [];
    const warnings: string[] = [];
    const timestamp = Date.now();
    const dataSize = JSON.stringify(data).length;

    try {
      // Schema validation
      downloadDataSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.issues.map(issue => issue.message));
      } else {
        errors.push('Unknown validation error');
      }
    }

    // Runtime type checking
    if (!isDownloadData(data)) {
      errors.push('Data does not match download structure');
    }

    // Business logic validation
    if (data.progress < 0 || data.progress > 100) {
      errors.push('Progress must be between 0 and 100');
    }

    if (data.speed < 0) {
      warnings.push('Speed cannot be negative');
    }

    if (data.filesize < 0) {
      warnings.push('Filesize cannot be negative');
    }

    if (data.downloaded > data.filesize && data.filesize > 0) {
      errors.push('Downloaded bytes cannot exceed filesize');
    }

    // Data consistency checks
    if (data.status === 'completed' && data.progress !== 100) {
      warnings.push('Completed download should have 100% progress');
    }

    if (data.status === 'error' && !data.error) {
      warnings.push('Error status should have error message');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      timestamp,
      dataType: 'download',
      dataSize
    };
  }

  validateMetadataData(data: any): DataIntegrityCheck {
    const errors: string[] = [];
    const warnings: string[] = [];
    const timestamp = Date.now();
    const dataSize = JSON.stringify(data).length;

    try {
      metadataDataSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.issues.map(issue => issue.message));
      } else {
        errors.push('Unknown validation error');
      }
    }

    // Runtime type checking
    if (!isMetadataData(data)) {
      errors.push('Data does not match metadata structure');
    }

    // Business logic validation
    if (data.duration < 0) {
      errors.push('Duration cannot be negative');
    }

    if (data.duration > 86400) { // 24 hours in seconds
      warnings.push('Unusually long duration detected');
    }

    if (data.title.length > 500) {
      warnings.push('Title is unusually long');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      timestamp,
      dataType: 'metadata',
      dataSize
    };
  }

  validatePlaylistData(data: any): DataIntegrityCheck {
    const errors: string[] = [];
    const warnings: string[] = [];
    const timestamp = Date.now();
    const dataSize = JSON.stringify(data).length;

    try {
      playlistDataSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.issues.map(issue => issue.message));
      } else {
        errors.push('Unknown validation error');
      }
    }

    // Runtime type checking
    if (!isPlaylistData(data)) {
      errors.push('Data does not match playlist structure');
    }

    // Business logic validation
    if (data.entries.length > 1000) {
      warnings.push('Very large playlist detected');
    }

    // Check for duplicate entries
    const entryIds = data.entries.map((entry: any) => entry.id);
    const uniqueIds = new Set(entryIds);
    if (entryIds.length !== uniqueIds.size) {
      warnings.push('Duplicate entries detected in playlist');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      timestamp,
      dataType: 'playlist',
      dataSize
    };
  }

  validateQueueData(data: any): DataIntegrityCheck {
    const errors: string[] = [];
    const warnings: string[] = [];
    const timestamp = Date.now();
    const dataSize = JSON.stringify(data).length;

    try {
      queueDataSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.issues.map(issue => issue.message));
      } else {
        errors.push('Unknown validation error');
      }
    }

    // Runtime type checking
    if (!isQueueData(data)) {
      errors.push('Data does not match queue structure');
    }

    // Business logic validation
    if (data.currentIndex >= data.items.length) {
      errors.push('Current index cannot exceed queue length');
    }

    if (data.maxConcurrent > 10) {
      warnings.push('High concurrent download limit');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      timestamp,
      dataType: 'queue',
      dataSize
    };
  }

  validateIPCData(messageType: string, payload: any, source: 'main' | 'renderer'): IPCDataIntegrity {
    let validationResult: DataIntegrityCheck;

    switch (messageType) {
      case 'download-update':
      case 'download-complete':
      case 'download-error':
        validationResult = this.validateDownloadData(payload);
        break;
      case 'metadata-received':
        validationResult = this.validateMetadataData(payload);
        break;
      case 'playlist-received':
        validationResult = this.validatePlaylistData(payload);
        break;
      case 'queue-update':
        validationResult = this.validateQueueData(payload);
        break;
      default:
        validationResult = {
          isValid: true,
          errors: [],
          warnings: [`Unknown message type: ${messageType}`],
          timestamp: Date.now(),
          dataType: 'unknown',
          dataSize: JSON.stringify(payload).length
        };
    }

    const integrityCheck: IPCDataIntegrity = {
      messageType,
      payload,
      timestamp: Date.now(),
      source,
      validationResult
    };

    // Store in history
    this.validationHistory.push(integrityCheck);

    // Keep only last 1000 validations
    if (this.validationHistory.length > 1000) {
      this.validationHistory = this.validationHistory.slice(-1000);
    }

    // Check for integrity issues
    this.checkIntegrityIssues();

    return integrityCheck;
  }

  private checkIntegrityIssues() {
    const recentValidations = this.validationHistory.slice(-100);
    const errors = recentValidations.filter(v => v.validationResult.errors.length > 0);
    const warnings = recentValidations.filter(v => v.validationResult.warnings.length > 0);

    if (errors.length > this.errorThreshold) {
      console.error(`Data integrity error threshold exceeded: ${errors.length} errors in last 100 validations`);
      this.reportIntegrityIssue('error', errors);
    }

    if (warnings.length > this.warningThreshold) {
      console.warn(`Data integrity warning threshold exceeded: ${warnings.length} warnings in last 100 validations`);
      this.reportIntegrityIssue('warning', warnings);
    }
  }

  private reportIntegrityIssue(type: 'error' | 'warning', issues: IPCDataIntegrity[]) {
    const report = {
      type: 'data_integrity_issue',
      issueType: type,
      count: issues.length,
      timestamp: Date.now(),
      issues: issues.map(issue => ({
        messageType: issue.messageType,
        source: issue.source,
        errors: issue.validationResult.errors,
        warnings: issue.validationResult.warnings
      }))
    };

    // Send to monitoring system
    if (window.electronAPI?.reportDataIntegrityIssue) {
      window.electronAPI.reportDataIntegrityIssue(report);
    }

    console.warn('Data Integrity Issue Report:', report);
  }

  getValidationHistory(): IPCDataIntegrity[] {
    return [...this.validationHistory];
  }

  getIntegrityStats() {
    const total = this.validationHistory.length;
    const errors = this.validationHistory.filter(v => v.validationResult.errors.length > 0).length;
    const warnings = this.validationHistory.filter(v => v.validationResult.warnings.length > 0).length;

    return {
      total,
      errors,
      warnings,
      errorRate: total > 0 ? (errors / total) * 100 : 0,
      warningRate: total > 0 ? (warnings / total) * 100 : 0
    };
  }

  clearHistory() {
    this.validationHistory = [];
  }
}

// Export singleton instance
export const dataIntegrityChecker = DataIntegrityChecker.getInstance();

// Utility functions for common validation patterns
export const validateObjectStructure = (obj: any, requiredKeys: string[]): boolean => {
  if (!obj || typeof obj !== 'object') return false;
  return requiredKeys.every(key => key in obj);
};

export const validateArrayStructure = (arr: any[], itemValidator: (item: any) => boolean): boolean => {
  if (!Array.isArray(arr)) return false;
  return arr.every(itemValidator);
};

export const validateNumericRange = (value: number, min: number, max: number): boolean => {
  return typeof value === 'number' && value >= min && value <= max;
};

export const validateStringLength = (value: string, maxLength: number): boolean => {
  return typeof value === 'string' && value.length <= maxLength;
};

export const validateUrlFormat = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}; 