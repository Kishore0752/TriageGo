import axios from 'axios';
import { API_BASE_URL } from '../constants/theme';

const OFFLINE_KEY   = 'medcompare_offline_cache';
const OFFLINE_LIMIT = 20;

function saveOffline(results) {
  try {
    const existing = JSON.parse(localStorage.getItem(OFFLINE_KEY) || '[]');
    const merged   = [...results, ...existing];
    const unique   = Array.from(new Map(merged.map(r => [r.id, r])).values());
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(unique.slice(0, OFFLINE_LIMIT)));
  } catch {}
}

function loadOffline() {
  try { return JSON.parse(localStorage.getItem(OFFLINE_KEY) || '[]'); } catch { return []; }
}

// mode: "symptoms" | "hospitals"
export const fetchHospitals = async (lat, lon, query = '', mode = 'symptoms') => {
  try {
    const response = await axios.post(`${API_BASE_URL}/search`, { lat, lon, query, mode });
    const data     = response.data;
    const results  = Array.isArray(data) ? data : (data.results ?? []);
    if (results.length > 0) saveOffline(results);
    return Array.isArray(data) ? { results: data, total_results: data.length } : data;
  } catch (error) {
    console.error('API Error:', error.message);
    const cached = loadOffline();
    if (cached.length > 0) {
      console.warn('[Offline] Serving cached results');
      return { results: cached, total_results: cached.length, offline: true };
    }
    return { results: [], total_results: 0, error: error.message };
  }
};

export const fetchSOS = async (lat, lon) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/sos`, { lat, lon });
    return response.data;
  } catch (error) {
    console.error('SOS API Error:', error.message);
    throw error;
  }
};

export const fetchHeatmap = async (lat, lon, query = '') => {
  try {
    const response = await axios.post(`${API_BASE_URL}/heatmap`, { lat, lon, query });
    return response.data;
  } catch (error) {
    console.error('Heatmap API Error:', error.message);
    return { points: [], total: 0 };
  }
};

export const getOfflineResults = () => loadOffline();
export const clearOfflineCache = () => {
  try { localStorage.removeItem(OFFLINE_KEY); } catch {}
};