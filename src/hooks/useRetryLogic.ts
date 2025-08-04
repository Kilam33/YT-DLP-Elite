import { useCallback, useRef } from 'react';

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

interface RetryState {
  retryCount: number;
  lastError: Error | null;
  isRetrying: boolean;
  nextRetryDelay: number;
}

const defaultConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
};

/**
 * Custom hook for retry logic with exponential backoff
 * Provides smart retry mechanism with circuit breaker pattern
 */
export const useRetryLogic = (config: Partial<RetryConfig> = {}) => {
  const finalConfig = { ...defaultConfig, ...config };
  const retryState = useRef<Map<string, RetryState>>(new Map());
  const circuitBreaker = useRef<Map<string, { failures: number; lastFailure: number; isOpen: boolean }>>(new Map());

  // Calculate exponential backoff delay
  const calculateDelay = useCallback((retryCount: number): number => {
    const delay = finalConfig.baseDelay * Math.pow(finalConfig.backoffMultiplier, retryCount);
    return Math.min(delay, finalConfig.maxDelay);
  }, [finalConfig]);

  // Check if circuit breaker is open
  const isCircuitBreakerOpen = useCallback((id: string): boolean => {
    const breaker = circuitBreaker.current.get(id);
    if (!breaker) return false;
    
    // Circuit breaker opens after 3 consecutive failures
    if (breaker.failures >= 3) {
      const timeSinceLastFailure = Date.now() - breaker.lastFailure;
      // Circuit breaker stays open for 60 seconds
      if (timeSinceLastFailure < 60000) {
        return true;
      } else {
        // Reset circuit breaker
        breaker.failures = 0;
        breaker.isOpen = false;
        return false;
      }
    }
    
    return false;
  }, []);

  // Record a failure
  const recordFailure = useCallback((id: string, error: Error) => {
    const breaker = circuitBreaker.current.get(id) || { failures: 0, lastFailure: 0, isOpen: false };
    breaker.failures++;
    breaker.lastFailure = Date.now();
    breaker.isOpen = breaker.failures >= 3;
    circuitBreaker.current.set(id, breaker);
  }, []);

  // Record a success (reset circuit breaker)
  const recordSuccess = useCallback((id: string) => {
    circuitBreaker.current.delete(id);
  }, []);

  // Get retry state for an operation
  const getRetryState = useCallback((id: string): RetryState => {
    return retryState.current.get(id) || {
      retryCount: 0,
      lastError: null,
      isRetrying: false,
      nextRetryDelay: 0,
    };
  }, []);

  // Execute operation with retry logic
  const executeWithRetry = useCallback(async <T>(
    id: string,
    operation: () => Promise<T>,
    onRetry?: (retryCount: number, delay: number) => void,
    onMaxRetriesExceeded?: (error: Error) => void
  ): Promise<T> => {
    // Check circuit breaker first
    if (isCircuitBreakerOpen(id)) {
      const breaker = circuitBreaker.current.get(id)!;
      const remainingTime = 60000 - (Date.now() - breaker.lastFailure);
      throw new Error(`Circuit breaker is open. Retry in ${Math.ceil(remainingTime / 1000)} seconds.`);
    }

    let currentState = getRetryState(id);
    let lastError: Error;

    for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
      try {
        // Update retry state
        currentState.isRetrying = attempt > 0;
        currentState.retryCount = attempt;
        retryState.current.set(id, currentState);

        // Execute operation
        const result = await operation();
        
        // Success - reset circuit breaker and return result
        recordSuccess(id);
        currentState.isRetrying = false;
        currentState.lastError = null;
        retryState.current.set(id, currentState);
        
        return result;
      } catch (error) {
        lastError = error as Error;
        currentState.lastError = lastError;
        
        // If this was the last attempt, give up
        if (attempt === finalConfig.maxRetries) {
          recordFailure(id, lastError);
          currentState.isRetrying = false;
          retryState.current.set(id, currentState);
          
          if (onMaxRetriesExceeded) {
            onMaxRetriesExceeded(lastError);
          }
          
          throw lastError;
        }

        // Calculate delay for next retry
        const delay = calculateDelay(attempt);
        currentState.nextRetryDelay = delay;
        retryState.current.set(id, currentState);

        // Notify about retry
        if (onRetry) {
          onRetry(attempt + 1, delay);
        }

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }, [finalConfig.maxRetries, calculateDelay, getRetryState, isCircuitBreakerOpen, recordFailure, recordSuccess]);

  // Reset retry state for an operation
  const resetRetryState = useCallback((id: string) => {
    retryState.current.delete(id);
    circuitBreaker.current.delete(id);
  }, []);

  // Get current retry statistics
  const getRetryStats = useCallback((id: string) => {
    const state = getRetryState(id);
    const breaker = circuitBreaker.current.get(id);
    
    return {
      retryCount: state.retryCount,
      isRetrying: state.isRetrying,
      lastError: state.lastError,
      nextRetryDelay: state.nextRetryDelay,
      circuitBreakerOpen: breaker?.isOpen || false,
      consecutiveFailures: breaker?.failures || 0,
    };
  }, [getRetryState]);

  return {
    executeWithRetry,
    resetRetryState,
    getRetryStats,
    isCircuitBreakerOpen,
  };
}; 