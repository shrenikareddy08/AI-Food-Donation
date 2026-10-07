export const INDIA_LOCATIONS = {
  Telangana: {
    Hyderabad: {
      areas: ['Banjara Hills', 'Jubilee Hills', 'Kukatpally', 'Gachibowli', 'Madhapur', 'Secunderabad', 'Ameerpet', 'Begumpet'],
      coords: { lat: 17.385, lng: 78.4867 },
    },
    Warangal: {
      areas: ['Kazipet', 'Hanamkonda'],
      coords: { lat: 17.9689, lng: 79.5941 },
    },
  },
  'Andhra Pradesh': {
    Visakhapatnam: {
      areas: ['Dwaraka Nagar', 'Gajuwaka', 'Rushikonda'],
      coords: { lat: 17.6868, lng: 83.2185 },
    },
    Vijayawada: {
      areas: ['Benz Circle', 'MG Road'],
      coords: { lat: 16.5062, lng: 80.648 },
    },
  },
  Karnataka: {
    Bengaluru: {
      areas: ['Indiranagar', 'Koramangala', 'Whitefield', 'Electronic City', 'Jayanagar', 'HSR Layout', 'Malleshwaram'],
      coords: { lat: 12.9716, lng: 77.5946 },
    },
    Mysuru: {
      areas: ['Vijayanagar', 'Gokulam'],
      coords: { lat: 12.2958, lng: 76.6394 },
    },
  },
  Maharashtra: {
    Mumbai: {
      areas: ['Bandra', 'Andheri', 'Dadar', 'Powai', 'Juhu', 'Colaba', 'Goregaon'],
      coords: { lat: 19.076, lng: 72.8777 },
    },
    Pune: {
      areas: ['Kothrud', 'Hadapsar', 'Viman Nagar', 'Hinjewadi'],
      coords: { lat: 18.5204, lng: 73.8567 },
    },
  },
  'Tamil Nadu': {
    Chennai: {
      areas: ['T Nagar', 'Adyar', 'Velachery', 'Anna Nagar', 'Guindy'],
      coords: { lat: 13.0827, lng: 80.2707 },
    },
    Coimbatore: {
      areas: ['RS Puram', 'Saibaba Colony'],
      coords: { lat: 11.0168, lng: 76.9558 },
    },
  },
  Delhi: {
    'New Delhi': {
      areas: ['Connaught Place', 'Karol Bagh', 'Lajpat Nagar', 'Saket', 'Dwarka', 'Rohini'],
      coords: { lat: 28.6139, lng: 77.209 },
    },
  },
  Kerala: {
    Kochi: {
      areas: ['Kakkanad', 'Edappally', 'Marine Drive'],
      coords: { lat: 9.9312, lng: 76.2673 },
    },
    Thiruvananthapuram: {
      areas: ['Palayam', 'Kowdiar'],
      coords: { lat: 8.5241, lng: 76.9366 },
    },
  },
  Gujarat: {
    Ahmedabad: {
      areas: ['Satellite', 'Bodakdev', 'Maninagar'],
      coords: { lat: 23.0225, lng: 72.5714 },
    },
    Surat: {
      areas: ['Adajan', 'Vesu'],
      coords: { lat: 21.1702, lng: 72.8311 },
    },
  },
  'Uttar Pradesh': {
    Lucknow: {
      areas: ['Hazratganj', 'Gomti Nagar', 'Alambagh'],
      coords: { lat: 26.8467, lng: 80.9462 },
    },
    Kanpur: {
      areas: ['Swaroop Nagar', 'Civil Lines'],
      coords: { lat: 26.4499, lng: 80.3319 },
    },
  },
  'West Bengal': {
    Kolkata: {
      areas: ['Park Street', 'Salt Lake', 'Garia', 'Ballygunge', 'New Town'],
      coords: { lat: 22.5726, lng: 88.3639 },
    },
  },
  Rajasthan: {
    Jaipur: {
      areas: ['Malviya Nagar', 'C Scheme', 'Vaishali Nagar'],
      coords: { lat: 26.9124, lng: 75.7873 },
    },
  },
};

export const INDIA_STATES = Object.keys(INDIA_LOCATIONS);

export function getCitiesForState(state) {
  return Object.keys(INDIA_LOCATIONS[state] || {});
}

export function getAreasForCity(state, city) {
  return (INDIA_LOCATIONS[state]?.[city]?.areas) || [];
}

export function getCoordsForArea(state, city, area) {
  const cityData = INDIA_LOCATIONS[state]?.[city];
  if (!cityData) return null;
  const base = cityData.coords;
  const areas = cityData.areas;
  if (!area || area === 'All Areas') return base;
  const idx = areas.indexOf(area);
  if (idx === -1) return base;
  const offset = (idx - areas.length / 2) * 0.01;
  return { lat: base.lat + offset, lng: base.lng + offset * 0.7 };
}
