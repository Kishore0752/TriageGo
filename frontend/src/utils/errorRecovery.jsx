/**
 * Error Recovery & Network Status Utilities
 */

/**
 * Check if user is online
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * Retry a function with exponential backoff
 */
export const retryWithBackoff = async (fn, maxRetries = 3, initialDelay = 1000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = initialDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Format error message for user display
 */
export const getErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';
  
  // Network errors
  if (error.message === 'Network Error' || !isOnline()) {
    return 'Network error. Please check your connection.';
  }
  
  // Server errors
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message;
    
    if (status === 404) return 'Hospital not found';
    if (status === 500) return 'Server error. Please try again later.';
    if (status === 503) return 'Service unavailable. Please try again later.';
    if (message) return message;
  }
  
  // Request errors
  if (error.request) {
    return 'Unable to reach the server. Please check your internet connection.';
  }
  
  return error.message || 'An error occurred';
};

/**
 * Setup online/offline listeners
 */
export const setupNetworkListeners = (onOnline, onOffline) => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};

/**
 * Debounce function for search
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Throttle function for scroll events
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
