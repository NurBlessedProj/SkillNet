/**
 * Enhanced logger utility that completely disables logs in production
 * Works for both client and server-side code
 */

// Check if we're in production environment
const isProduction = process.env.NODE_ENV === 'production';

// Store original console methods for reference
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
  trace: console.trace,
};

// Override console methods in production
if (typeof window !== 'undefined') {
  // Client-side override
if (isProduction) {
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
  console.info = () => {};
  console.debug = () => {};
  console.trace = () => {};
}
} else {
  // Server-side override
  if (isProduction) {
    // We can selectively keep error logs on the server if needed
    console.log = () => {};
    console.info = () => {};
    console.warn = () => {};
    console.debug = () => {};
    console.trace = () => {};
    // Optionally keep error logs: console.error = originalConsole.error;
    }
    }

// Export logger utility for explicit usage
export const logger = {
  log: (...args: any[]) => {
    if (!isProduction) {
      originalConsole.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (!isProduction) {
      originalConsole.error(...args);
    }
  },
  warn: (...args: any[]) => {
    if (!isProduction) {
      originalConsole.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (!isProduction) {
      originalConsole.info(...args);
    }
  },
  debug: (...args: any[]) => {
    if (!isProduction) {
      originalConsole.debug(...args);
    }
  },
  trace: (...args: any[]) => {
    if (!isProduction) {
      originalConsole.trace(...args);
    }
  }
};

// Create a special error logger that always logs, even in production
// Useful for critical errors you always want to see
export const criticalLogger = {
  error: (...args: any[]) => {
    originalConsole.error('[CRITICAL]', ...args);
  }
};