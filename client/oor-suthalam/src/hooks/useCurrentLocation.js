import { requestLocation } from '../utils/requestLocation';
import { useEffect, useRef, useState } from 'react';
export default function useCurrentLocation() {
  const [coordinates, setCoordinates] = useState(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState('');
  const active = useRef(true),
    request = useRef(0);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      request.current++;
    };
  }, []);
  function locate() {
    if (loading) return;
    setError('');
    if (!navigator.geolocation) {
      setError('Location is unavailable in this browser.');
      return;
    }
    const version = ++request.current;
    setLoading(true);
    requestLocation(navigator.geolocation)
      .then((position) => {
        if (active.current && version === request.current) {
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active.current && version === request.current) {
          setError(
            err.code === 1
              ? 'Location access is blocked. Allow location in your browser’s site settings, or choose a town.'
              : 'Automatic location is unavailable on this device. Choose your starting town to see the distance.',
          );
          setLoading(false);
        }
      });
  }

  function clear() {
    request.current++;
    setCoordinates(null);
    setError('');
    setLoading(false);
  }
  function choose(place) {
    if (!place || !Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return;
    request.current++;
    setCoordinates({ lat: place.lat, lng: place.lng, label: place.name });
    setLoading(false);
    setError('');
  }
  return { coordinates, loading, error, locate, clear, choose };
}
