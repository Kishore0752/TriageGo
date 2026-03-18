import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading]   = useState(true);

  const requestLocation = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location permission denied. Please enable it in Settings.');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(loc.coords);
    } catch {
      setErrorMsg('Could not get location. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { requestLocation(); }, []);

  return { location, errorMsg, loading, refresh: requestLocation };
};