import { useState, useEffect } from 'react';

/**
 * Custom hook to track user's geolocation
 * @param {number} officeLatitude - Target office latitude
 * @param {number} officeLongitude - Target office longitude
 * @param {number} radiusInMeters - Geofence radius in meters (default: 100)
 * @returns {Object} Location object with lat, lng, isLoading, error, and isWithinOffice
 */
export const useGeolocation = (officeLatitude, officeLongitude, radiusInMeters = 100) => {
  const [location, setLocation] = useState({
    lat: null,
    lng: null,
    isLoading: true,
    error: null,
    isWithinOffice: false,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        isLoading: false,
      }));
      return;
    }

    let watchId;
    let retryCount = 0;
    const maxRetries = 3;

    const updateLocation = (position) => {
      const { latitude, longitude } = position.coords;
      
      // Calculate distance between user and office using Haversine formula
      const distance = calculateDistance(latitude, longitude, officeLatitude, officeLongitude);
      const isWithinRange = distance <= radiusInMeters;

      setLocation({
        lat: latitude,
        lng: longitude,
        isLoading: false,
        error: null,
        isWithinOffice: isWithinRange,
      });
      retryCount = 0; // Reset retry count on success
    };

    const handleError = (error) => {
      let errorMessage = 'Unable to retrieve your location';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location permission denied. Please enable location access.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out. Retrying...';
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(() => {
              navigator.geolocation.watchPosition(updateLocation, handleError, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
              });
            }, 2000);
          }
          break;
        default:
          break;
      }

      setLocation((prev) => ({
        ...prev,
        error: errorMessage,
        isLoading: retryCount < maxRetries,
      }));
    };

    // Watch position for continuous updates
    watchId = navigator.geolocation.watchPosition(updateLocation, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [officeLatitude, officeLongitude, radiusInMeters]);

  return location;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - User latitude
 * @param {number} lon1 - User longitude
 * @param {number} lat2 - Office latitude
 * @param {number} lon2 - Office longitude
 * @returns {number} Distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + 
            Math.cos(φ1) * Math.cos(φ2) * 
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
