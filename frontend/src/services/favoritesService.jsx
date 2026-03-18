/**
 * Favorites Management
 * Save and manage favorite hospitals locally
 */

const FAVORITES_KEY = 'medcompare_favorites';
const MAX_FAVORITES = 50;

/**
 * Get all favorite hospitals
 */
export const getFavorites = () => {
  try {
    const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    return favorites;
  } catch {
    return [];
  }
};

/**
 * Add hospital to favorites
 */
export const addFavorite = (hospital) => {
  try {
    const favorites = getFavorites();
    
    // Check if already favorited
    if (favorites.some(h => h.id === hospital.id)) {
      return { success: false, message: 'Already in favorites' };
    }
    
    // Add timestamp
    const favorite = {
      ...hospital,
      savedAt: new Date().toISOString(),
    };
    
    favorites.push(favorite);
    
    // Limit to MAX_FAVORITES
    if (favorites.length > MAX_FAVORITES) {
      favorites.shift(); // Remove oldest
    }
    
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return { success: true, message: 'Added to favorites' };
  } catch (error) {
    console.error('Error adding favorite:', error);
    return { success: false, message: 'Error saving favorite' };
  }
};

/**
 * Remove hospital from favorites
 */
export const removeFavorite = (hospitalId) => {
  try {
    const favorites = getFavorites();
    const filtered = favorites.filter(h => h.id !== hospitalId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
    return { success: true, message: 'Removed from favorites' };
  } catch (error) {
    console.error('Error removing favorite:', error);
    return { success: false, message: 'Error removing favorite' };
  }
};

/**
 * Check if hospital is favorited
 */
export const isFavorited = (hospitalId) => {
  const favorites = getFavorites();
  return favorites.some(h => h.id === hospitalId);
};

/**
 * Get favorite count
 */
export const getFavoriteCount = () => {
  return getFavorites().length;
};

/**
 * Clear all favorites
 */
export const clearFavorites = () => {
  try {
    localStorage.removeItem(FAVORITES_KEY);
    return { success: true, message: 'All favorites cleared' };
  } catch (error) {
    console.error('Error clearing favorites:', error);
    return { success: false, message: 'Error clearing favorites' };
  }
};

/**
 * Export favorites as JSON
 */
export const exportFavorites = () => {
  const favorites = getFavorites();
  const dataStr = JSON.stringify(favorites, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  return URL.createObjectURL(dataBlob);
};

/**
 * Import favorites from JSON
 */
export const importFavorites = (jsonData) => {
  try {
    const imported = JSON.parse(jsonData);
    if (!Array.isArray(imported)) {
      return { success: false, message: 'Invalid format' };
    }
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(imported));
    return { success: true, message: `Imported ${imported.length} favorites` };
  } catch (error) {
    return { success: false, message: 'Error importing favorites' };
  }
};
