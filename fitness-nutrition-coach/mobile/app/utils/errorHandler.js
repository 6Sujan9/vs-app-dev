/**
 * Error handling utility for the Fitness Nutrition Coach app
 * Provides centralized error management, logging, and user feedback
 */

// Error severity levels
export const ErrorLevel = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

// Error types
export const ErrorType = {
  NETWORK: 'NETWORK_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTH_ERROR',
  AUTHORIZATION: 'AUTHZ_ERROR',
  SERVER: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  PARSE: 'PARSE_ERROR',
  OFFLINE: 'OFFLINE_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

class ErrorHandler {
  constructor() {
    this.errorListeners = [];
    this.errorLog = [];
    this.maxLogSize = 100;
  }

  /**
   * Handle an error with full context
   * @param {Error|Object} error - The error object
   * @param {string} context - Where the error occurred (e.g., 'HomeScreen', 'api.fetchWorkouts')
   * @param {Object} metadata - Additional context data
   * @returns {Object} Processed error object
   */
  handle(error, context = 'Unknown', metadata = {}) {
    const processedError = this.processError(error, context, metadata);

    // Log the error
    this.logError(processedError);

    // Notify listeners
    this.notifyListeners(processedError);

    // Log to console in development
    if (__DEV__) {
      this.logToConsole(processedError);
    }

    return processedError;
  }

  /**
   * Process error and extract key information
   * @private
   */
  processError(error, context, metadata) {
    const errorObj = {
      message: this.getMessage(error),
      type: this.getErrorType(error),
      level: this.getErrorLevel(error),
      context,
      metadata,
      timestamp: new Date().toISOString(),
      stack: error?.stack || null,
    };

    // Add HTTP-specific info
    if (error?.response) {
      errorObj.httpStatus = error.response.status;
      errorObj.httpData = error.response.data;
    }

    // Add network-specific info
    if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      errorObj.type = ErrorType.TIMEOUT;
    }

    return errorObj;
  }

  /**
   * Extract user-friendly message
   * @private
   */
  getMessage(error) {
    if (typeof error === 'string') return error;

    // HTTP errors
    if (error?.response?.status === 401) return 'Authentication failed. Please log in again.';
    if (error?.response?.status === 403) return 'You do not have permission to access this.';
    if (error?.response?.status === 404) return 'The requested item was not found.';
    if (error?.response?.status >= 500) return 'Server error. Please try again later.';

    // Network errors
    if (error?.code === 'ECONNREFUSED') return 'Cannot connect to server.';
    if (error?.message?.includes('timeout')) return 'Request timed out. Please try again.';
    if (error?.message?.includes('offline')) return 'You are offline. Please check your connection.';

    // Parse errors
    if (error?.message?.includes('JSON')) return 'Error processing response.';

    // Fallback
    return error?.message || 'An unexpected error occurred.';
  }

  /**
   * Determine error type
   * @private
   */
  getErrorType(error) {
    if (!error) return ErrorType.UNKNOWN;

    // Network errors
    if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      return ErrorType.TIMEOUT;
    }
    if (error?.message?.includes('offline') || error?.code === 'ENOTFOUND') {
      return ErrorType.OFFLINE;
    }
    if (error?.message?.includes('Network')) {
      return ErrorType.NETWORK;
    }

    // HTTP errors
    if (error?.response) {
      if (error.response.status === 401 || error.response.status === 403) {
        return ErrorType.AUTHENTICATION;
      }
      if (error.response.status >= 500) {
        return ErrorType.SERVER;
      }
    }

    // Parsing errors
    if (error?.message?.includes('JSON') || error?.message?.includes('parse')) {
      return ErrorType.PARSE;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * Determine error severity level
   * @private
   */
  getErrorLevel(error) {
    if (!error) return ErrorLevel.WARNING;

    // Critical errors
    if (error?.response?.status >= 500) return ErrorLevel.CRITICAL;
    if (error?.message?.includes('offline')) return ErrorLevel.WARNING;

    // Error level errors
    if (error?.response?.status >= 400) return ErrorLevel.ERROR;
    if (error?.message?.includes('timeout')) return ErrorLevel.WARNING;

    return ErrorLevel.WARNING;
  }

  /**
   * Log error to internal buffer
   * @private
   */
  logError(errorObj) {
    this.errorLog.push(errorObj);

    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }
  }

  /**
   * Log error to console
   * @private
   */
  logToConsole(errorObj) {
    const prefix = `[${errorObj.type}] ${errorObj.context}:`;

    switch (errorObj.level) {
      case ErrorLevel.CRITICAL:
        console.error(prefix, errorObj);
        break;
      case ErrorLevel.ERROR:
        console.error(prefix, errorObj.message);
        break;
      case ErrorLevel.WARNING:
        console.warn(prefix, errorObj.message);
        break;
      case ErrorLevel.INFO:
        console.log(prefix, errorObj.message);
        break;
      default:
        console.log(prefix, errorObj);
    }
  }

  /**
   * Subscribe to error events
   * @param {Function} callback - Called with error object
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }

    this.errorListeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.errorListeners = this.errorListeners.filter((l) => l !== callback);
    };
  }

  /**
   * Notify all listeners
   * @private
   */
  notifyListeners(errorObj) {
    this.errorListeners.forEach((listener) => {
      try {
        listener(errorObj);
      } catch (err) {
        console.warn('Error in error listener:', err);
      }
    });
  }

  /**
   * Get error log
   * @returns {Array<Object>}
   */
  getLog() {
    return [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearLog() {
    this.errorLog = [];
  }

  /**
   * Retry a function with exponential backoff
   * @param {Function} fn - Function to retry
   * @param {Object} options - { maxRetries, delay, backoffFactor }
   * @returns {Promise}
   */
  async retry(fn, options = {}) {
    const { maxRetries = 3, delay = 1000, backoffFactor = 2 } = options;

    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (i < maxRetries - 1) {
          const waitTime = delay * Math.pow(backoffFactor, i);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError;
  }

  /**
   * Create a safe async wrapper
   * @param {Function} fn - Async function to wrap
   * @param {string} context - Error context
   * @returns {Promise}
   */
  async safe(fn, context = 'Unknown') {
    try {
      return await fn();
    } catch (error) {
      this.handle(error, context);
      throw error;
    }
  }
}

// Export singleton instance
const errorHandler = new ErrorHandler();
export default errorHandler;

/**
 * Hook for using error handler in components
 * @example
 * const { error, clearError } = useErrorHandler();
 */
export function useErrorHandler() {
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    // Subscribe to errors
    const unsubscribe = errorHandler.subscribe((errorObj) => {
      setError(errorObj);
    });

    return unsubscribe;
  }, []);

  const clearError = () => setError(null);
  const handleError = (err, context, metadata) => {
    const processed = errorHandler.handle(err, context, metadata);
    setError(processed);
    return processed;
  };

  return {
    error,
    clearError,
    handleError,
    errorLog: errorHandler.getLog(),
  };
}
