import { promises as fs } from 'fs';
import path from 'path';

// File operation result interface
interface FileOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  path?: string;
}

// File operation options
interface FileOperationOptions {
  encoding?: BufferEncoding;
  flag?: string;
  mode?: number;
  timeout?: number;
}

/**
 * Optimized file operations with proper error handling and async operations
 */
export class FileOperations {
  private static readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  /**
   * Safely read a file with timeout and error handling
   */
  static async readFile(
    filePath: string, 
    options: FileOperationOptions = {}
  ): Promise<FileOperationResult<string>> {
    try {
      const timeout = options.timeout || this.DEFAULT_TIMEOUT;
      
      const result = await Promise.race([
        fs.readFile(filePath, { encoding: options.encoding || 'utf8', flag: options.flag }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('File read timeout')), timeout)
        )
      ]);

      return {
        success: true,
        data: result as string,
        path: filePath
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown file read error',
        path: filePath
      };
    }
  }

  /**
   * Safely write a file with timeout and error handling
   */
  static async writeFile(
    filePath: string, 
    data: string | Buffer, 
    options: FileOperationOptions = {}
  ): Promise<FileOperationResult> {
    try {
      const timeout = options.timeout || this.DEFAULT_TIMEOUT;
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await this.ensureDirectoryExists(dir);

      await Promise.race([
        fs.writeFile(filePath, data, { 
          encoding: options.encoding || 'utf8', 
          flag: options.flag,
          mode: options.mode 
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('File write timeout')), timeout)
        )
      ]);

      return {
        success: true,
        path: filePath
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown file write error',
        path: filePath
      };
    }
  }

  /**
   * Safely append to a file
   */
  static async appendFile(
    filePath: string, 
    data: string | Buffer, 
    options: FileOperationOptions = {}
  ): Promise<FileOperationResult> {
    try {
      const timeout = options.timeout || this.DEFAULT_TIMEOUT;
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      await this.ensureDirectoryExists(dir);

      await Promise.race([
        fs.appendFile(filePath, data, { 
          encoding: options.encoding || 'utf8', 
          flag: options.flag,
          mode: options.mode 
        }),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('File append timeout')), timeout)
        )
      ]);

      return {
        success: true,
        path: filePath
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown file append error',
        path: filePath
      };
    }
  }

  /**
   * Check if file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file stats with error handling
   */
  static async getFileStats(filePath: string): Promise<FileOperationResult<fs.Stats>> {
    try {
      const stats = await fs.stat(filePath);
      return {
        success: true,
        data: stats,
        path: filePath
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown file stats error',
        path: filePath
      };
    }
  }

  /**
   * Safely delete a file
   */
  static async deleteFile(filePath: string): Promise<FileOperationResult> {
    try {
      await fs.unlink(filePath);
      return {
        success: true,
        path: filePath
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown file delete error',
        path: filePath
      };
    }
  }

  /**
   * Safely copy a file
   */
  static async copyFile(
    sourcePath: string, 
    destPath: string, 
    options: FileOperationOptions = {}
  ): Promise<FileOperationResult> {
    try {
      const timeout = options.timeout || this.DEFAULT_TIMEOUT;
      
      // Ensure destination directory exists
      const destDir = path.dirname(destPath);
      await this.ensureDirectoryExists(destDir);

      await Promise.race([
        fs.copyFile(sourcePath, destPath, options.mode),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('File copy timeout')), timeout)
        )
      ]);

      return {
        success: true,
        path: destPath
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown file copy error',
        path: destPath
      };
    }
  }

  /**
   * Safely move/rename a file
   */
  static async moveFile(
    sourcePath: string, 
    destPath: string, 
    options: FileOperationOptions = {}
  ): Promise<FileOperationResult> {
    try {
      const timeout = options.timeout || this.DEFAULT_TIMEOUT;
      
      // Ensure destination directory exists
      const destDir = path.dirname(destPath);
      await this.ensureDirectoryExists(destDir);

      await Promise.race([
        fs.rename(sourcePath, destPath),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('File move timeout')), timeout)
        )
      ]);

      return {
        success: true,
        path: destPath
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown file move error',
        path: destPath
      };
    }
  }

  /**
   * Read directory contents with error handling
   */
  static async readDirectory(dirPath: string): Promise<FileOperationResult<string[]>> {
    try {
      const files = await fs.readdir(dirPath);
      return {
        success: true,
        data: files,
        path: dirPath
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown directory read error',
        path: dirPath
      };
    }
  }

  /**
   * Ensure directory exists, create if it doesn't
   */
  static async ensureDirectoryExists(dirPath: string): Promise<FileOperationResult> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      return {
        success: true,
        path: dirPath
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown directory creation error',
        path: dirPath
      };
    }
  }

  /**
   * Get available disk space for a path
   */
  static async getDiskSpace(dirPath: string): Promise<FileOperationResult<number>> {
    try {
      const stats = await fs.stat(dirPath);
      // This is a simplified implementation - in a real app you'd use a native module
      // to get actual disk space information
      return {
        success: true,
        data: 1024 * 1024 * 1024, // 1GB placeholder
        path: dirPath
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown disk space error',
        path: dirPath
      };
    }
  }

  /**
   * Validate file path for security
   */
  static validateFilePath(filePath: string): { isValid: boolean; error?: string } {
    // Check for path traversal attacks
    if (filePath.includes('..') || filePath.includes('//')) {
      return { isValid: false, error: 'Invalid file path' };
    }

    // Check for absolute paths (optional security measure)
    if (path.isAbsolute(filePath)) {
      return { isValid: false, error: 'Absolute paths not allowed' };
    }

    return { isValid: true };
  }

  /**
   * Get file extension safely
   */
  static getFileExtension(filePath: string): string {
    return path.extname(filePath).toLowerCase();
  }

  /**
   * Get file name without extension
   */
  static getFileNameWithoutExtension(filePath: string): string {
    return path.basename(filePath, path.extname(filePath));
  }

  /**
   * Generate unique filename to avoid conflicts
   */
  static async generateUniqueFilename(
    basePath: string, 
    filename: string, 
    extension: string
  ): Promise<string> {
    let counter = 1;
    let uniquePath = path.join(basePath, `${filename}${extension}`);
    
    while (await this.fileExists(uniquePath)) {
      uniquePath = path.join(basePath, `${filename}_${counter}${extension}`);
      counter++;
    }
    
    return uniquePath;
  }

  /**
   * Batch file operations with progress tracking
   */
  static async batchFileOperations<T>(
    operations: Array<() => Promise<T>>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<Array<{ success: boolean; data?: T; error?: string }>> {
    const results: Array<{ success: boolean; data?: T; error?: string }> = [];
    
    for (let i = 0; i < operations.length; i++) {
      try {
        const result = await operations[i]();
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
      
      if (onProgress) {
        onProgress(i + 1, operations.length);
      }
    }
    
    return results;
  }
} 