export const formatDistance = (km) => {
  if (km === undefined || km === null || km >= 9999) return 'N/A';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${parseFloat(km).toFixed(1)} km`;
};

export const formatETA = (eta) => {
  if (!eta || eta === 'N/A') return 'N/A';
  return eta;
};

export const formatReviews = (n) => {
  if (n == null) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};

export const formatScore = (score) => {
  if (score == null) return '0%';
  return `${Math.round(score * 100)}%`;
};