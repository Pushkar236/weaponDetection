// Suppress browser extension polyfill errors
const originalError = console.error;
console.error = function(...args) {
  // Filter out common browser extension errors
  const errorStr = args.join(' ');
  if (
    errorStr.includes('Could not establish connection') ||
    errorStr.includes('Receiving end does not exist') ||
    errorStr.includes('polyfill.js') ||
    errorStr.includes('Extension context invalidated')
  ) {
    return; // Suppress these specific errors
  }
  originalError.apply(console, args);
};

// Also suppress unhandled promise rejection for extension errors
window.addEventListener('unhandledrejection', (event) => {
  const errorStr = event.reason?.message || String(event.reason);
  if (
    errorStr.includes('Could not establish connection') ||
    errorStr.includes('Extension context invalidated')
  ) {
    event.preventDefault(); // Prevent logging
  }
});