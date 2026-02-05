import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useLocationTracking(enabled = false) {
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const watchRef = useRef(null);

  useEffect(() => {
    if (!enabled || !user) return;

    let isMounted = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (isMounted) setErrorMsg('Location permission denied');
        return;
      }

      // Get initial location
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      if (isMounted) {
        setLocation(current.coords);
        updateCourierLocation(current.coords);
      }

      // Watch for location changes
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (loc) => {
          if (isMounted) {
            setLocation(loc.coords);
            updateCourierLocation(loc.coords);
          }
        }
      );
    })();

    return () => {
      isMounted = false;
      if (watchRef.current) {
        watchRef.current.remove();
      }
    };
  }, [enabled, user]);

  async function updateCourierLocation(coords) {
    if (!user) return;
    try {
      await supabase.from('courier_locations').upsert(
        {
          courier_id: user.id,
          latitude: coords.latitude,
          longitude: coords.longitude,
          heading: coords.heading,
          speed: coords.speed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'courier_id' }
      );
    } catch (err) {
      console.error('Error updating location:', err);
    }
  }

  return { location, errorMsg };
}

export async function getCoordinatesFromAddress(address) {
  try {
    const results = await Location.geocodeAsync(address);
    if (results.length > 0) {
      return {
        latitude: results[0].latitude,
        longitude: results[0].longitude,
      };
    }
    return null;
  } catch {
    return null;
  }
}
