/**
 * Analytics & User Tracking Utilities
 * Track user interactions for analytics (privacy-friendly)
 */

const ANALYTICS_KEY = 'medcompare_analytics';

/**
 * Log search event
 */
export const logSearch = (query, mode, resultCount) => {
  try {
    const event = {
      type: 'search',
      query,
      mode,
      resultCount,
      timestamp: new Date().toISOString(),
    };
    addAnalyticsEvent(event);
  } catch (error) {
    console.error('Error logging search:', error);
  }
};

/**
 * Log hospital click
 */
export const logHospitalClick = (hospitalId, hospitalName) => {
  try {
    const event = {
      type: 'hospital_click',
      hospitalId,
      hospitalName,
      timestamp: new Date().toISOString(),
    };
    addAnalyticsEvent(event);
  } catch (error) {
    console.error('Error logging hospital click:', error);
  }
};

/**
 * Log favorite action
 */
export const logFavoriteAction = (hospitalId, action) => {
  try {
    const event = {
      type: 'favorite',
      hospitalId,
      action, // 'add' or 'remove'
      timestamp: new Date().toISOString(),
    };
    addAnalyticsEvent(event);
  } catch (error) {
    console.error('Error logging favorite:', error);
  }
};

/**
 * Log call action
 */
export const logCallAction = (hospitalId, hospitalName) => {
  try {
    const event = {
      type: 'call',
      hospitalId,
      hospitalName,
      timestamp: new Date().toISOString(),
    };
    addAnalyticsEvent(event);
  } catch (error) {
    console.error('Error logging call:', error);
  }
};

/**
 * Log direction action
 */
export const logDirectionAction = (hospitalId, hospitalName) => {
  try {
    const event = {
      type: 'direction',
      hospitalId,
      hospitalName,
      timestamp: new Date().toISOString(),
    };
    addAnalyticsEvent(event);
  } catch (error) {
    console.error('Error logging direction:', error);
  }
};

/**
 * Add event to analytics
 */
function addAnalyticsEvent(event) {
  const analytics = getAnalytics();
  analytics.push(event);
  
  // Keep only last 1000 events
  if (analytics.length > 1000) {
    analytics.shift();
  }
  
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(analytics));
}

/**
 * Get all analytics events
 */
export const getAnalytics = () => {
  try {
    return JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '[]');
  } catch {
    return [];
  }
};

/**
 * Get analytics summary
 */
export const getAnalyticsSummary = () => {
  const events = getAnalytics();
  
  return {
    totalEvents: events.length,
    searches: events.filter(e => e.type === 'search').length,
    hospitalClicks: events.filter(e => e.type === 'hospital_click').length,
    favorites: events.filter(e => e.type === 'favorite').length,
    calls: events.filter(e => e.type === 'call').length,
    directions: events.filter(e => e.type === 'direction').length,
    averageSearchResults: calculateAverageResultCount(events),
    lastEventTime: events.length > 0 ? events[events.length - 1].timestamp : null,
  };
};

/**
 * Calculate average search results
 */
function calculateAverageResultCount(events) {
  const searches = events.filter(e => e.type === 'search');
  if (searches.length === 0) return 0;
  
  const total = searches.reduce((sum, e) => sum + (e.resultCount || 0), 0);
  return Math.round(total / searches.length);
}

/**
 * Export analytics as CSV
 */
export const exportAnalyticsCSV = () => {
  const analytics = getAnalytics();
  
  if (analytics.length === 0) {
    return null;
  }
  
  // Create CSV header
  const headers = ['type', 'timestamp', 'details'];
  const rows = analytics.map(event => [
    event.type,
    event.timestamp,
    JSON.stringify(event),
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');
  
  return csv;
};

/**
 * Clear analytics
 */
export const clearAnalytics = () => {
  try {
    localStorage.removeItem(ANALYTICS_KEY);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};
