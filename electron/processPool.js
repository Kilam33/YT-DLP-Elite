import { spawn } from 'child_process';
import EventEmitter from 'events';

/**
 * Process Pool for yt-dlp operations
 * Reuses processes to avoid startup overhead
 */
class YtDlpProcessPool extends EventEmitter {
  constructor(maxProcesses = 3) {
    super();
    this.maxProcesses = maxProcesses;
    this.availableProcesses = [];
    this.busyProcesses = new Map();
    this.pendingRequests = [];
    this.isShuttingDown = false;
    
    // Initialize process pool
    this.initializePool();
  }

  /**
   * Initialize the process pool with available processes
   */
  initializePool() {
    for (let i = 0; i < this.maxProcesses; i++) {
      this.createProcess();
    }
  }

  /**
   * Create a new yt-dlp process
   */
  createProcess() {
    try {
      const process = spawn('yt-dlp', ['--version'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      const processId = Date.now() + Math.random();
      
      // Set up process event handlers
      process.on('error', (error) => {
        console.error(`Process ${processId} error:`, error);
        this.handleProcessError(processId, error);
      });

      process.on('exit', (code, signal) => {
        console.log(`Process ${processId} exited with code ${code}, signal ${signal}`);
        this.handleProcessExit(processId, code, signal);
      });

      // Store process info
      this.availableProcesses.push({
        id: processId,
        process: process,
        lastUsed: Date.now(),
        isHealthy: true
      });

      console.log(`Created yt-dlp process ${processId}. Available processes: ${this.availableProcesses.length}`);
    } catch (error) {
      console.error('Failed to create yt-dlp process:', error);
      this.emit('error', error);
    }
  }

  /**
   * Get an available process from the pool
   */
  getProcess() {
    if (this.availableProcesses.length > 0) {
      const processInfo = this.availableProcesses.shift();
      processInfo.lastUsed = Date.now();
      this.busyProcesses.set(processInfo.id, processInfo);
      return processInfo;
    }
    return null;
  }

  /**
   * Return a process to the pool
   */
  returnProcess(processId) {
    const processInfo = this.busyProcesses.get(processId);
    if (processInfo) {
      this.busyProcesses.delete(processId);
      
      // Check if process is still healthy
      if (processInfo.isHealthy && !processInfo.process.killed) {
        this.availableProcesses.push(processInfo);
        console.log(`Returned process ${processId} to pool. Available: ${this.availableProcesses.length}`);
      } else {
        // Replace unhealthy process
        console.log(`Replacing unhealthy process ${processId}`);
        this.createProcess();
      }
    }
  }

  /**
   * Execute a command using a process from the pool
   */
  async executeCommand(args, options = {}) {
    return new Promise((resolve, reject) => {
      const request = {
        args,
        options,
        resolve,
        reject,
        timestamp: Date.now()
      };

      // Check if we have an available process
      const processInfo = this.getProcess();
      if (processInfo) {
        this.executeWithProcess(processInfo, request);
      } else {
        // Queue the request
        this.pendingRequests.push(request);
        console.log(`Queued request. Pending: ${this.pendingRequests.length}`);
      }
    });
  }

  /**
   * Execute a streaming command (for downloads)
   */
  async executeStreamingCommand(args, options = {}, onData, onError) {
    return new Promise((resolve, reject) => {
      const request = {
        args,
        options,
        resolve,
        reject,
        onData,
        onError,
        timestamp: Date.now(),
        isStreaming: true
      };

      // Check if we have an available process
      const processInfo = this.getProcess();
      if (processInfo) {
        this.executeStreamingWithProcess(processInfo, request);
      } else {
        // Queue the request
        this.pendingRequests.push(request);
        console.log(`Queued streaming request. Pending: ${this.pendingRequests.length}`);
      }
    });
  }

  /**
   * Execute a command with a specific process
   */
  executeWithProcess(processInfo, request) {
    const { process, id } = processInfo;
    const { args, options, resolve, reject } = request;

    let stdout = '';
    let stderr = '';
    let hasResolved = false;

    // Set up data handlers
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Set up completion handler
    const onComplete = (code) => {
      if (hasResolved) return;
      hasResolved = true;

      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject(new Error(`yt-dlp exited with code ${code}: ${stderr}`));
      }

      // Return process to pool
      this.returnProcess(id);
      
      // Process next pending request
      this.processNextRequest();
    };

    process.on('exit', onComplete);
    process.on('error', (error) => {
      if (hasResolved) return;
      hasResolved = true;
      reject(error);
      this.returnProcess(id);
      this.processNextRequest();
    });

    // Execute the command
    try {
      const fullArgs = ['--newline', ...args];
      const childProcess = spawn('yt-dlp', fullArgs, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        ...options
      });

      // Replace the process reference
      processInfo.process = childProcess;
      processInfo.lastUsed = Date.now();

      // Set up the same handlers for the new process
      childProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      childProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      childProcess.on('exit', onComplete);
      childProcess.on('error', (error) => {
        if (hasResolved) return;
        hasResolved = true;
        reject(error);
        this.returnProcess(id);
        this.processNextRequest();
      });

    } catch (error) {
      if (hasResolved) return;
      hasResolved = true;
      reject(error);
      this.returnProcess(id);
      this.processNextRequest();
    }
  }

  /**
   * Execute a streaming command with a specific process
   */
  executeStreamingWithProcess(processInfo, request) {
    const { process, id } = processInfo;
    const { args, options, resolve, reject, onData, onError } = request;

    let hasResolved = false;

    // Set up data handlers for streaming
    process.stdout.on('data', (data) => {
      if (onData) {
        onData(data.toString());
      }
    });

    process.stderr.on('data', (data) => {
      if (onError) {
        onError(data.toString());
      }
    });

    // Set up completion handler
    const onComplete = (code) => {
      if (hasResolved) return;
      hasResolved = true;

      if (code === 0) {
        resolve({ code });
      } else {
        reject(new Error(`yt-dlp exited with code ${code}`));
      }

      // Return process to pool
      this.returnProcess(id);
      
      // Process next pending request
      this.processNextRequest();
    };

    process.on('exit', onComplete);
    process.on('error', (error) => {
      if (hasResolved) return;
      hasResolved = true;
      reject(error);
      this.returnProcess(id);
      this.processNextRequest();
    });

    // Execute the command
    try {
      const fullArgs = ['--newline', ...args];
      const childProcess = spawn('yt-dlp', fullArgs, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        ...options
      });

      // Replace the process reference
      processInfo.process = childProcess;
      processInfo.lastUsed = Date.now();

      // Set up the same handlers for the new process
      childProcess.stdout.on('data', (data) => {
        if (onData) {
          onData(data.toString());
        }
      });

      childProcess.stderr.on('data', (data) => {
        if (onError) {
          onError(data.toString());
        }
      });

      childProcess.on('exit', onComplete);
      childProcess.on('error', (error) => {
        if (hasResolved) return;
        hasResolved = true;
        reject(error);
        this.returnProcess(id);
        this.processNextRequest();
      });

    } catch (error) {
      if (hasResolved) return;
      hasResolved = true;
      reject(error);
      this.returnProcess(id);
      this.processNextRequest();
    }
  }

  /**
   * Process the next pending request
   */
  processNextRequest() {
    if (this.pendingRequests.length > 0) {
      const request = this.pendingRequests.shift();
      const processInfo = this.getProcess();
      
      if (processInfo) {
        if (request.isStreaming) {
          this.executeStreamingWithProcess(processInfo, request);
        } else {
          this.executeWithProcess(processInfo, request);
        }
      } else {
        // Still no available processes, put request back
        this.pendingRequests.unshift(request);
      }
    }
  }

  /**
   * Handle process errors
   */
  handleProcessError(processId, error) {
    const processInfo = this.busyProcesses.get(processId) || 
                       this.availableProcesses.find(p => p.id === processId);
    
    if (processInfo) {
      processInfo.isHealthy = false;
      this.emit('processError', { processId, error });
    }
  }

  /**
   * Handle process exit
   */
  handleProcessExit(processId, code, signal) {
    // Remove from busy processes
    this.busyProcesses.delete(processId);
    
    // Remove from available processes
    const index = this.availableProcesses.findIndex(p => p.id === processId);
    if (index !== -1) {
      this.availableProcesses.splice(index, 1);
    }

    // Replace the process if we're not shutting down
    if (!this.isShuttingDown) {
      this.createProcess();
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      available: this.availableProcesses.length,
      busy: this.busyProcesses.size,
      pending: this.pendingRequests.length,
      total: this.availableProcesses.length + this.busyProcesses.size,
      maxProcesses: this.maxProcesses
    };
  }

  /**
   * Clean up all processes
   */
  shutdown() {
    this.isShuttingDown = true;
    
    // Kill all processes
    [...this.busyProcesses.values(), ...this.availableProcesses].forEach(processInfo => {
      try {
        if (!processInfo.process.killed) {
          processInfo.process.kill('SIGTERM');
        }
      } catch (error) {
        console.error('Error killing process:', error);
      }
    });

    // Clear arrays
    this.availableProcesses = [];
    this.busyProcesses.clear();
    this.pendingRequests = [];
    
    console.log('Process pool shutdown complete');
  }

  /**
   * Health check for all processes
   */
  async healthCheck() {
    const results = [];
    
    for (const processInfo of [...this.availableProcesses, ...this.busyProcesses.values()]) {
      try {
        const result = await this.executeCommand(['--version']);
        results.push({
          processId: processInfo.id,
          healthy: true,
          version: result.stdout.trim()
        });
      } catch (error) {
        results.push({
          processId: processInfo.id,
          healthy: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
}

export default YtDlpProcessPool; 