import axios from 'axios';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const PLACES_API_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const DIRECTIONS_API_URL = 'https://maps.googleapis.com/maps/api/directions/json';

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

/**
 * Fetch nearby places of a specific type using Google Places API
 */
export const fetchNearbyPlaces = async (latitude, longitude, type, radius = 5000) => {
  try {
    console.log(`🔍 Fetching nearby ${type} within ${radius}m of (${latitude}, ${longitude})`);
    
    const response = await axios.get(PLACES_API_URL, {
      params: {
        location: `${latitude},${longitude}`,
        radius: radius,
        type: type,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    console.log(`✅ Found ${response.data.results.length} ${type} locations`);

    if (response.data.status === 'OK') {
      return response.data.results.map((place, index) => ({
        id: `${place.place_id}_${type}_${index}`, // Unique key combining place_id, type, and index
        place_id: place.place_id, // Keep original place_id for reference
        name: place.name,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        address: place.vicinity,
        rating: place.rating || 0,
        isOpen: place.opening_hours?.open_now,
        distance: calculateDistance(
          latitude,
          longitude,
          place.geometry.location.lat,
          place.geometry.location.lng
        ),
      }));
    } else {
      console.error('❌ Google Places API error:', response.data.status, response.data.error_message);
      throw new Error(response.data.error_message || 'Failed to fetch places');
    }
  } catch (error) {
    console.error('❌ Error fetching nearby places:', error.message);
    throw error;
  }
};

/**
 * Fetch all safe locations (police stations, hospitals, etc.)
 * Limited to 2km radius for safety
 */
export const fetchAllSafeLocations = async (latitude, longitude, radius = 2000) => {
  try {
    console.log('🔍 Fetching all safe locations within 2km radius...');

    // Enforce 2km maximum radius for safety
    const maxRadius = 2000; // 2km
    const effectiveRadius = Math.min(radius, maxRadius);

    if (radius > maxRadius) {
      console.log(`⚠️ Radius limited to ${maxRadius}m (requested: ${radius}m)`);
    }

    const safeLocationTypes = [
      { type: 'police', icon: '🚔', label: 'Police Station' },
      { type: 'hospital', icon: '🏥', label: 'Hospital' },
      { type: 'fire_station', icon: '🚒', label: 'Fire Station' },
      { type: 'pharmacy', icon: '💊', label: 'Medical Shop' },
      { type: 'cafe', icon: '☕', label: 'Public Place' },
      { type: 'shopping_mall', icon: '🏬', label: 'Shopping Mall' },
    ];

    const allLocations = [];

    for (const locationType of safeLocationTypes) {
      try {
        const places = await fetchNearbyPlaces(latitude, longitude, locationType.type, effectiveRadius);
        
        // Add type info to each place
        const placesWithType = places.map((place) => ({
          ...place,
          type: locationType.type,
          icon: locationType.icon,
          label: locationType.label,
        }));

        allLocations.push(...placesWithType);
        console.log(`✅ Added ${placesWithType.length} ${locationType.label}(s)`);
      } catch (error) {
        console.error(`⚠️ Failed to fetch ${locationType.label}:`, error.message);
        // Continue with other types even if one fails
      }
    }

    // Deduplicate by place_id - keep only the first occurrence
    const seenPlaceIds = new Set();
    const uniqueLocations = [];

    for (const location of allLocations) {
      if (!seenPlaceIds.has(location.place_id)) {
        seenPlaceIds.add(location.place_id);
        uniqueLocations.push(location);
      } else {
        console.log(`⚠️ Skipping duplicate location: ${location.name} (${location.place_id})`);
      }
    }

    // Sort by distance
    uniqueLocations.sort((a, b) => a.distance - b.distance);

    console.log(`✅ Total unique safe locations found: ${uniqueLocations.length} (removed ${allLocations.length - uniqueLocations.length} duplicates)`);
    return uniqueLocations;
  } catch (error) {
    console.error('❌ Error fetching safe locations:', error.message);
    throw error;
  }
};

/**
 * Get address from coordinates (Reverse Geocoding)
 */
export const getAddressFromCoordinates = async (latitude, longitude) => {
  try {
    console.log(`🔍 Getting address for (${latitude}, ${longitude})`);
    
    const response = await axios.get(GEOCODING_API_URL, {
      params: {
        latlng: `${latitude},${longitude}`,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const address = response.data.results[0].formatted_address;
      console.log(`✅ Address: ${address}`);
      return address;
    } else {
      console.error('❌ Geocoding error:', response.data.status);
      throw new Error('Failed to get address');
    }
  } catch (error) {
    console.error('❌ Error getting address:', error.message);
    throw error;
  }
};

/**
 * Get directions between two points
 */
export const getDirections = async (origin, destination, mode = 'driving') => {
  try {
    console.log(`🗺️ Getting directions from (${origin.latitude}, ${origin.longitude}) to (${destination.latitude}, ${destination.longitude})`);
    
    const response = await axios.get(DIRECTIONS_API_URL, {
      params: {
        origin: `${origin.latitude},${origin.longitude}`,
        destination: `${destination.latitude},${destination.longitude}`,
        mode: mode,
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    if (response.data.status === 'OK' && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      console.log(`✅ Route found: ${route.summary}, Distance: ${route.legs[0].distance.text}, Duration: ${route.legs[0].duration.text}`);
      
      return {
        distance: route.legs[0].distance,
        duration: route.legs[0].duration,
        steps: route.legs[0].steps,
        polyline: route.overview_polyline.points,
        summary: route.summary,
      };
    } else {
      console.error('❌ Directions error:', response.data.status);
      throw new Error('Failed to get directions');
    }
  } catch (error) {
    console.error('❌ Error getting directions:', error.message);
    throw error;
  }
};

