/**
 * Search History Management
 * Track and manage user search history
 */

const SEARCH_HISTORY_KEY = 'medcompare_search_history';
const MAX_HISTORY = 20;

/**
 * Get search history
 */
export const getSearchHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
};

/**
 * Add search to history
 */
export const addSearchToHistory = (query, mode = 'symptoms', lat, lon) => {
  try {
    const history = getSearchHistory();
    
    // Remove duplicates
    const filtered = history.filter(h => 
      !(h.query === query && h.mode === mode)
    );
    
    // Add new search
    const searchEntry = {
      query,
      mode,
      lat,
      lon,
      searchedAt: new Date().toISOString(),
    };
    
    filtered.unshift(searchEntry);
    
    // Keep only last MAX_HISTORY
    const limited = filtered.slice(0, MAX_HISTORY);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(limited));
  } catch (error) {
    console.error('Error adding to search history:', error);
  }
};

/**
 * Clear search history
 */
export const clearSearchHistory = () => {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    return { success: true };
  } catch (error) {
    return { success: false };
  }
};

/**
 * Get recent searches
 */
export const getRecentSearches = (limit = 5) => {
  return getSearchHistory().slice(0, limit);
};

/**
 * Get search suggestions based on history
 */
export const getSearchSuggestions = (prefix) => {
  const history = getSearchHistory();
  const lowerPrefix = prefix.toLowerCase();
  
  return history
    .map(h => h.query)
    .filter(q => q.toLowerCase().includes(lowerPrefix))
    .filter((q, i, arr) => arr.indexOf(q) === i) // Remove duplicates
    .slice(0, 5);
};
