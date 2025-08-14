import * as Sentry from '@sentry/nextjs';

export async function register() {
  // Disable server-side console logs in production
  if (process.env.NODE_ENV === 'production') {
    // Keep the original error method for critical server errors
    const originalError = console.error;
    
    // Override console methods for server-side
      console.log = () => {};
      console.info = () => {};
      console.warn = () => {};
      console.debug = () => {};
    console.trace = () => {};
    
    // Optionally keep error logs but with a prefix to identify critical issues
    console.error = (...args) => {
      // Only log errors that might be critical (customize as needed)
      if (args[0] && typeof args[0] === 'string' && 
          (args[0].includes('FATAL') || args[0].includes('CRITICAL'))) {
        originalError('[SERVER]', ...args);
      }
    };
  }
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}
export const onRequestError = Sentry.captureRequestError;
