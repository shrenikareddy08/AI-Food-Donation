import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  MapPin, Package, Utensils, Bike, Navigation, Clock, TrendingUp,
  Map as MapIcon, List, ShieldCheck,
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import LocationHeader from '../components/LocationHeader';
import FoodCard from '../components/FoodCard';
import EmptyState from '../components/EmptyState';
import MapView from '../components/MapView';
import { useToast } from '../context/ToastContext';
import { useLocationContext } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import { FOOD_CATEGORIES, SORT_OPTIONS } from '../utils/constants';
import { MOCK_FOOD_LISTINGS, MOCK_NGOS } from '../utils/mockData';
import { sortByDistance, withDistance, formatDistance } from '../utils/distance';

const CATEGORY_ICONS = {
  All: Utensils, Meals: Utensils, Rice: Package, Fruits: Package,
  Vegetables: Package, Bakery: Package, 'Packaged Food': Package,
};

const NEARBY_FILTERS = [
  { id: 'near-me', label: 'Near Me', icon: MapPin },
  { id: 'food', label: 'Nearby Food', icon: Package },
  { id: 'ngos', label: 'Nearby NGOs', icon: ShieldCheck },
  { id: 'volunteers', label: 'Nearby Volunteers', icon: Bike },
  { id: 'pickup', label: 'Pickup Locations', icon: Navigation },
];

export default function FindFood() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const toast = useToast();
  const { location } = useLocationContext();
  const { isAuthenticated } = useAuth();

  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeFilter, setActiveFilter] = useState('near-me');
  const [sortBy, setSortBy] = useState('nearest');
  const [viewMode, setViewMode] = useState('list');
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  const refLat = location.latitude;
  const refLng = location.longitude;

  const foodWithDistance = useMemo(
    () => withDistance(MOCK_FOOD_LISTINGS, refLat, refLng),
    [refLat, refLng]
  );

  const ngosWithDistance = useMemo(
    () => withDistance(MOCK_NGOS, refLat, refLng),
    [refLat, refLng]
  );

  const filteredFoods = useMemo(() => {
    let results = [...foodWithDistance];

    if (query) {
      const q = query.toLowerCase();
      results = results.filter((f) =>
        f.name.toLowerCase().includes(q) ||
        f.foodType.toLowerCase().includes(q) ||
        f.area.toLowerCase().includes(q) ||
        f.city.toLowerCase().includes(q)
      );
    }

    if (activeCategory !== 'all') {
      results = results.filter((f) => f.category === activeCategory);
    }

    if (sortBy === 'nearest') {
      results = sortByDistance(results, refLat, refLng);
    } else if (sortBy === 'best-match') {
      results.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    } else if (sortBy === 'expiring') {
      results.sort((a, b) => {
        const aTime = a.availableUntil || '99:99';
        const bTime = b.availableUntil || '99:99';
        return aTime.localeCompare(bTime);
      });
    }

    return results;
  }, [foodWithDistance, query, activeCategory, sortBy, refLat, refLng]);

  const filteredNgos = useMemo(() => {
    let results = [...ngosWithDistance];
    if (sortBy === 'nearest') {
      results = sortByDistance(results, refLat, refLng);
    }
    return results;
  }, [ngosWithDistance, refLat, refLng, sortBy]);

  const showNgos = activeFilter === 'ngos';
  const displayResults = showNgos ? filteredNgos : filteredFoods;

  const foodMarkers = filteredFoods.map((f) => ({
    ...f,
    latitude: f.latitude,
    longitude: f.longitude,
  }));

  const ngoMarkers = filteredNgos.map((n) => ({
    ...n,
    latitude: n.latitude,
    longitude: n.longitude,
  }));

  const handleRequestFood = () => {
    if (!isAuthenticated) {
      toast.info('Please log in to request food.');
    } else {
      toast.success('Food request sent! The donor will be notified.');
    }
  };

  const handleRecenter = () => {
    setRecenterTrigger((t) => t + 1);
  };

  const sortOpts = SORT_OPTIONS.map((s) => ({ id: s.id, label: s.label }));

  return (
    <div className="container" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-9)' }}>
      <div className="find-food">
        {/* Header */}
        <div className="find-food__header">
          <div className="page-header">
            <h1 className="page-header__title">Find Food</h1>
            <p className="page-header__subtitle">Discover surplus food available near you in India</p>
          </div>

          <div className="find-food__location-row">
            <LocationHeader />
          </div>

          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search food, NGO, location..."
            showFilters
          />

          {/* Nearby filters */}
          <div className="nearby-filters">
            {NEARBY_FILTERS.map((filter) => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  className={`nearby-filter ${activeFilter === filter.id ? 'nearby-filter--active' : ''}`}
                  onClick={() => setActiveFilter(filter.id)}
                >
                  <Icon size={15} />
                  {filter.label}
                </button>
              );
            })}
          </div>

          <div className="categories">
            {FOOD_CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.label] || Package;
              return (
                <button
                  key={cat.id}
                  className={`category-chip ${activeCategory === cat.id ? 'category-chip--active' : ''}`}
                  onClick={() => { setActiveCategory(cat.id); setActiveFilter('food'); }}
                >
                  <Icon size={16} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Sort + View toggle */}
          <div className="filter-bar__row" style={{ justifyContent: 'space-between' }}>
            <div className="filter-bar__sort">
              <span className="filter-bar__sort-label">Sort by:</span>
              <div className="filter-bar__sort-select">
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sort results">
                  {sortOpts.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="find-food__view-toggle">
              <button
                className={`find-food__view-btn ${viewMode === 'list' ? 'find-food__view-btn--active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <List size={16} /> List
              </button>
              <button
                className={`find-food__view-btn ${viewMode === 'map' ? 'find-food__view-btn--active' : ''}`}
                onClick={() => setViewMode('map')}
              >
                <MapIcon size={16} /> Map
              </button>
            </div>
          </div>
        </div>

        {/* Results — split view on desktop, toggle on mobile */}
        {displayResults.length === 0 ? (
          <EmptyState
            icon={showNgos ? ShieldCheck : Package}
            title={showNgos ? 'No nearby NGOs found' : 'No nearby food donations found'}
            message="Try adjusting your search or filters to find available results near you."
          />
        ) : (
          <div className="find-food__split">
            {/* List panel */}
            <div className="find-food__list-panel" style={{ display: viewMode === 'map' ? 'none' : 'flex' }}>
              {showNgos ? (
                filteredNgos.map((ngo) => (
                  <div key={ngo.id} className="ngo-card">
                    <div className="ngo-card__header">
                      <h3 className="ngo-card__name">{ngo.name}</h3>
                      {ngo.verified && (
                        <span className="ngo-card__verified">
                          <ShieldCheck size={12} /> Verified
                        </span>
                      )}
                    </div>
                    <span className="ngo-card__distance">
                      <MapPin size={14} /> {formatDistance(ngo.distanceKm)} away
                    </span>
                    <div className="ngo-card__address">
                      {ngo.area}, {ngo.city}, {ngo.state}, India
                    </div>
                    <div className="ngo-card__address" style={{ color: 'var(--color-text-secondary)' }}>
                      Capacity: {ngo.capacity}
                    </div>
                    <div className="ngo-card__actions">
                      <button className="btn btn--outline btn--sm">View Details</button>
                      <button className="btn btn--ghost btn--sm"><Navigation size={14} /> Route</button>
                    </div>
                  </div>
                ))
              ) : (
                filteredFoods.map((food) => (
                  <FoodCard key={food.id} food={food} onRequest={handleRequestFood} />
                ))
              )}
            </div>

            {/* Map panel */}
            <div className="find-food__map-panel" style={{ display: viewMode === 'list' ? 'none' : 'block' }}>
              <MapView
                center={{ latitude: refLat, longitude: refLng }}
                zoom={13}
                height="600px"
                userPosition={{ latitude: refLat, longitude: refLng, label: location.label }}
                ngoMarkers={showNgos ? ngoMarkers : []}
                foodMarkers={!showNgos ? foodMarkers : []}
                recenterTrigger={recenterTrigger}
                onRecenter={handleRecenter}
              />
            </div>
          </div>
        )}

        {/* Default sections when no search/filter active */}
        {!query && activeCategory === 'all' && activeFilter === 'near-me' && displayResults.length > 0 && (
          <div className="find-food__results" style={{ marginTop: 'var(--space-8)' }}>
            <div>
              <h2 className="find-food__section-title">
                <MapPin size={20} style={{ color: 'var(--color-accent-500)' }} />
                Nearby Food
                <span className="find-food__count">({filteredFoods.length})</span>
              </h2>
            </div>
            <div>
              <h2 className="find-food__section-title">
                <ShieldCheck size={20} style={{ color: 'var(--color-primary-600)' }} />
                Nearby NGOs
                <span className="find-food__count">({filteredNgos.length})</span>
              </h2>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
