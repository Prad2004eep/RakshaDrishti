import axios from 'axios';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

/**
 * Get shortest route between two locations using Google Maps Directions API
 * @param {Object} origin - { latitude, longitude }
 * @param {Object} destination - { latitude, longitude }
 * @returns {Object} Route data with polyline, distance, duration
 */
export const getShortestRoute = async (origin, destination) => {
  try {
    console.log('🗺️ Getting shortest route...');
    console.log('📍 Origin:', origin);
    console.log('📍 Destination:', destination);

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await axios.get(url);

    if (response.data.status === 'OK') {
      const route = response.data.routes[0];
      const leg = route.legs[0];

      // Decode polyline for map display
      const polylinePoints = decodePolyline(route.overview_polyline.points);

      const routeData = {
        distance: leg.distance.text,
        distanceValue: leg.distance.value, // in meters
        duration: leg.duration.text,
        durationValue: leg.duration.value, // in seconds
        startAddress: leg.start_address,
        endAddress: leg.end_address,
        polyline: route.overview_polyline.points,
        polylineCoordinates: polylinePoints,
        steps: leg.steps.map(step => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remove HTML tags
          distance: step.distance.text,
          duration: step.duration.text,
          startLocation: step.start_location,
          endLocation: step.end_location,
        })),
      };

      console.log('✅ Route found:', routeData.distance, routeData.duration);
      return routeData;
    } else {
      throw new Error(`Directions API error: ${response.data.status}`);
    }
  } catch (error) {
    console.error('❌ Error getting route:', error);
    throw error;
  }
};

/**
 * Decode Google Maps polyline to array of coordinates
 * @param {string} encoded - Encoded polyline string
 * @returns {Array} Array of {latitude, longitude} objects
 */
const decodePolyline = (encoded) => {
  const poly = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    const point = {
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    };

    poly.push(point);
  }

  return poly;
};

/**
 * Open Google Maps navigation to a location
 * @param {Object} destination - { latitude, longitude }
 * @param {string} label - Label for the destination
 */
export const openGoogleMapsNavigation = (destination, label = 'Destination') => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;
  
  // Open in browser/Google Maps app
  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  }
  
  console.log('🗺️ Opening Google Maps navigation:', url);
  return url;
};

/**
 * Calculate estimated time of arrival
 * @param {number} durationInSeconds - Duration in seconds
 * @returns {string} Formatted ETA
 */
export const calculateETA = (durationInSeconds) => {
  const now = new Date();
  const eta = new Date(now.getTime() + durationInSeconds * 1000);
  
  const hours = eta.getHours();
  const minutes = eta.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

export default {
  getShortestRoute,
  openGoogleMapsNavigation,
  calculateETA,
};

