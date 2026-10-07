import { useMemo } from 'react';
import { sortByDistance, withDistance, withinRadius } from '../utils/distance';

/**
 * useNearbySearch — filters, sorts, and distances items relative to a reference location.
 *
 * @param {Array} items - items with latitude/longitude (or lat/lng) properties
 * @param {number|null} refLat - reference latitude
 * @param {number|null} refLng - reference longitude
 * @param {object} opts - { query, category, sortBy, radiusKm }
 * @returns { results, isLocationBased }
 */
export function useNearbySearch(items, refLat, refLng, opts = {}) {
  const { query = '', category = 'all', sortBy = 'nearest', radiusKm = null } = opts;

  return useMemo(() => {
    let results = [...items];

    if (query) {
      const q = query.toLowerCase();
      results = results.filter((item) => {
        const name = (item.name || '').toLowerCase();
        const foodType = (item.foodType || '').toLowerCase();
        const area = (item.area || '').toLowerCase();
        const city = (item.city || '').toLowerCase();
        return name.includes(q) || foodType.includes(q) || area.includes(q) || city.includes(q);
      });
    }

    if (category && category !== 'all') {
      results = results.filter((item) => item.category === category);
    }

    if (refLat != null && refLng != null) {
      results = withDistance(results, refLat, refLng);
      if (radiusKm) {
        results = withinRadius(results, refLat, refLng, radiusKm);
      }
      if (sortBy === 'nearest') {
        results = sortByDistance(results, refLat, refLng);
      }
    }

    if (sortBy === 'best-match') {
      results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    } else if (sortBy === 'expiring') {
      results.sort((a, b) => {
        const aTime = a.availableUntil || '99:99';
        const bTime = b.availableUntil || '99:99';
        return aTime.localeCompare(bTime);
      });
    }

    return { results, isLocationBased: refLat != null && refLng != null };
  }, [items, refLat, refLng, query, category, sortBy, radiusKm]);
}
