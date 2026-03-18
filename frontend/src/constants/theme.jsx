// ── API ───────────────────────────────────────────────────────────────────────
// Change this to your machine's local IP when testing on a physical device
// Keep frontend API base consistent with config/api.js and README
export const API_BASE_URL = "http://localhost:8000/api/v1";

// ── Brand Colors ──────────────────────────────────────────────────────────────
export const COLORS = {
  primary:      '#2563eb',   // blue-600
  primaryLight: '#eff6ff',   // blue-50
  danger:       '#dc2626',   // red-600
  success:      '#16a34a',   // green-600
  warning:      '#d97706',   // amber-600
  verified:     '#059669',   // emerald-600
  background:   '#f8fafc',   // slate-50
  surface:      '#ffffff',
  border:       '#e2e8f0',   // slate-200
  textPrimary:  '#0f172a',   // slate-900
  textSecondary:'#64748b',   // slate-500
  textMuted:    '#94a3b8',   // slate-400
};

// ── Busy status color map ─────────────────────────────────────────────────────
export const BUSY_COLORS = {
  busy:     { bg: '#fef2f2', text: '#b91c1c', dot: '#ef4444' },
  moderate: { bg: '#fffbeb', text: '#b45309', dot: '#f59e0b' },
  quiet:    { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
};

// ── Open status color map ─────────────────────────────────────────────────────
export const OPEN_COLORS = {
  green: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  red:   { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
  gray:  { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' },
};

// ── Sort options ──────────────────────────────────────────────────────────────
export const SORT_OPTIONS = [
  { key: 'ai',       label: '🤖 AI Score' },
  { key: 'distance', label: '📍 Nearest'  },
  { key: 'rating',   label: '⭐ Rating'   },
];