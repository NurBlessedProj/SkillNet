/**
 * This file is imported early in the client bundle to override console methods
 * It's a .js file to ensure it's as lightweight as possible
 */

// Only run in production and in the browser
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Override all console methods
  console.log = () => {};
  console.error = () => {};
  console.warn = () => {};
  console.info = () => {};
  console.debug = () => {};
  console.trace = () => {};
}