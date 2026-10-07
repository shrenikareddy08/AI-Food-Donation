/**
 * Haversine distance between two lat/lng points in kilometers.
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

export function formatDistance(km) {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Sort an array of items by distance from a reference point (nearest first).
 * Each item must have latitude/longitude or lat/lng properties.
 */
export function sortByDistance(items, refLat, refLng) {
  if (refLat == null || refLng == null) return items;
  return [...items].sort((a, b) => {
    const aLat = a.latitude ?? a.lat;
    const aLng = a.longitude ?? a.lng;
    const bLat = b.latitude ?? b.lat;
    const bLng = b.longitude ?? b.lng;
    if (aLat == null || aLng == null) return 1;
    if (bLat == null || bLng == null) return -1;
    const da = calculateDistance(refLat, refLng, aLat, aLng);
    const db = calculateDistance(refLat, refLng, bLat, bLng);
    return da - db;
  });
}

/**
 * Attach a computed `distanceKm` to each item based on a reference point.
 */
export function withDistance(items, refLat, refLng) {
  if (refLat == null || refLng == null) return items;
  return items.map((item) => {
    const lat = item.latitude ?? item.lat;
    const lng = item.longitude ?? item.lng;
    if (lat == null || lng == null) return { ...item, distanceKm: item.distanceKm ?? null };
    return { ...item, distanceKm: calculateDistance(refLat, refLng, lat, lng) };
  });
}

/**
 * Filter items within a radius (km) of the reference point.
 */
export function withinRadius(items, refLat, refLng, radiusKm) {
  if (refLat == null || refLng == null) return items;
  return items.filter((item) => {
    const lat = item.latitude ?? item.lat;
    const lng = item.longitude ?? item.lng;
    if (lat == null || lng == null) return false;
    return calculateDistance(refLat, refLng, lat, lng) <= radiusKm;
  });
}
