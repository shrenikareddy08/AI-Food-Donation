import { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Crosshair,
  Map as MapIcon,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';

import MapView from '../components/MapView';
import LocationHeader from '../components/LocationHeader';
import EmptyState from '../components/EmptyState';

import { useLocationContext } from '../context/LocationContext';
import { useToast } from '../context/ToastContext';

import { ngoService } from '../services/ngoService';

import {
  formatDistance,
  withDistance,
  withinRadius,
} from '../utils/distance';

import '../styles/nearby-ngos.css';

export default function NearbyNGOs() {
  const {
    location,
    detectLocation,
    locating,
  } = useLocationContext();

  const toast = useToast();

  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [radius, setRadius] = useState(20);

  const [selectedNgo, setSelectedNgo] = useState(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  // =========================================================
  // LOAD NEARBY NGOS
  // =========================================================

  async function loadNGOs(showRefresh = false) {
    if (
      location?.latitude == null ||
      location?.longitude == null
    ) {
      setNgos([]);
      setLoading(false);
      return;
    }

    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      /*
        IMPORTANT:
        ngoService.getNearby expects an object.
      */

      const data = await ngoService.getNearby({
        latitude: Number(location.latitude),
        longitude: Number(location.longitude),
        radiusKm: Number(radius),
      });

      const ngoList = Array.isArray(data)
        ? data
        : [];

      setNgos(ngoList);

      /*
        Clear selected NGO if it is no longer
        available in the new result set.
      */
      setSelectedNgo((current) => {
        if (!current) {
          return null;
        }

        const exists = ngoList.some(
          (ngo) =>
            Number(ngo.ngo_id) ===
            Number(current.ngo_id)
        );

        return exists ? current : null;
      });

    } catch (err) {
      console.error(
        'Failed to load nearby NGOs:',
        err
      );

      setNgos([]);

      setError(
        err?.message ||
        'Unable to load nearby NGOs.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // =========================================================
  // RELOAD WHEN LOCATION OR RADIUS CHANGES
  // =========================================================

  useEffect(() => {
    loadNGOs();
  }, [
    location?.latitude,
    location?.longitude,
    radius,
  ]);

  // =========================================================
  // ADD DISTANCE + VERIFIED + RADIUS + SEARCH FILTER
  // =========================================================

  const nearbyNGOs = useMemo(() => {
    if (
      location?.latitude == null ||
      location?.longitude == null
    ) {
      return [];
    }

    /*
      Calculate frontend distance independently.
      This makes the UI safe even when the backend
      returns more NGOs than requested.
    */

    const withDistances = withDistance(
      ngos,
      Number(location.latitude),
      Number(location.longitude)
    );

    /*
      Only verified NGOs should appear to donors.
    */
    const verifiedOnly = withDistances.filter(
      (ngo) =>
        String(
          ngo?.verification_status || ''
        ).toUpperCase() === 'VERIFIED'
    );

    /*
      Apply the selected radius on the frontend too.
    */
    const insideRadius = withinRadius(
      verifiedOnly,
      Number(location.latitude),
      Number(location.longitude),
      Number(radius)
    ).map((ngo) => ({
      ...ngo,

      /*
        Make sure distanceKm is available
        after the radius filter.
      */
      distanceKm:
        ngo.distanceKm ??
        null,
    }));

    /*
      Search by:
      - NGO name
      - address
      - food requirements
    */
    const query = search
      .trim()
      .toLowerCase();

    const searched = query
      ? insideRadius.filter((ngo) => {
          const name = String(
            ngo.organization_name || ''
          ).toLowerCase();

          const address = String(
            ngo.address || ''
          ).toLowerCase();

          const requirements = String(
            ngo.food_requirements || ''
          ).toLowerCase();

          return (
            name.includes(query) ||
            address.includes(query) ||
            requirements.includes(query)
          );
        })
      : insideRadius;

    /*
      Nearest NGO first.
    */
    return [...searched].sort(
      (a, b) =>
        (a.distanceKm ?? Infinity) -
        (b.distanceKm ?? Infinity)
    );
  }, [
    ngos,
    location?.latitude,
    location?.longitude,
    radius,
    search,
  ]);

  // =========================================================
  // MAP MARKERS
  // =========================================================

  const ngoMarkers = useMemo(() => {
    return nearbyNGOs
      .filter(
        (ngo) =>
          ngo.latitude != null &&
          ngo.longitude != null
      )
      .map((ngo) => ({
        ...ngo,

        name:
          ngo.organization_name ||
          'NGO',

        verified:
          String(
            ngo.verification_status || ''
          ).toUpperCase() === 'VERIFIED',

        area:
          ngo.address || '',

        /*
          Do NOT use the selected donor location
          as the NGO city/state.
          The NGO's address is already its own
          location information.
        */
        city:
          ngo.city ||
          location?.city ||
          '',

        state:
          ngo.state ||
          location?.state ||
          '',

        onView: () => {
          setSelectedNgo(ngo);
        },

        onRoute: () => {
          openDirections(ngo);
        },
      }));
  }, [
    nearbyNGOs,
    location?.city,
    location?.state,
  ]);

  // =========================================================
  // DIRECTIONS
  // =========================================================

  function openDirections(ngo) {
    if (
      ngo?.latitude == null ||
      ngo?.longitude == null
    ) {
      toast.error(
        'Location is not available for this NGO.'
      );

      return;
    }

    const url =
      `https://www.google.com/maps/dir/?api=1&destination=` +
      `${ngo.latitude},${ngo.longitude}`;

    window.open(
      url,
      '_blank',
      'noopener,noreferrer'
    );
  }

  // =========================================================
  // CURRENT LOCATION
  // =========================================================

  async function handleCurrentLocation() {
    try {
      await detectLocation();

      setRecenterTrigger(
        (value) => value + 1
      );

      toast.success(
        'Current location updated.'
      );
    } catch (err) {
      toast.error(
        err?.message ||
        'Unable to detect your current location.'
      );
    }
  }

  // =========================================================
  // SELECT NGO
  // =========================================================

  function handleSelectNgo(ngo) {
    setSelectedNgo(ngo);
  }

  // =========================================================
  // CLEAR SEARCH
  // =========================================================

  function clearSearch() {
    setSearch('');
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="nearby-ngos-page">

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="nearby-ngos-page__hero">
        <div className="nearby-ngos-page__hero-inner">

          <div>
            <div className="nearby-ngos-page__eyebrow">
              <ShieldCheck size={15} />
              Trusted organizations near you
            </div>

            <h1 className="nearby-ngos-page__title">
              Nearby NGOs
            </h1>

            <p className="nearby-ngos-page__subtitle">
              Find verified organizations around your
              selected location before you donate your food.
            </p>
          </div>

          <button
            type="button"
            className="nearby-ngos-page__refresh"
            onClick={() => loadNGOs(true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? 'nearby-ngos-page__spin'
                  : ''
              }
            />

            {refreshing
              ? 'Refreshing...'
              : 'Refresh'}
          </button>

        </div>
      </section>


      <div className="container">

        {/* ===================================================
            LOCATION + SEARCH
        =================================================== */}

        <section className="nearby-ngos-page__controls">

          <div className="nearby-ngos-page__location">

            <LocationHeader />

            <button
              type="button"
              className="nearby-ngos-page__current-location"
              onClick={handleCurrentLocation}
              disabled={locating}
            >
              <Crosshair size={16} />

              {locating
                ? 'Detecting...'
                : 'Use current location'}
            </button>

          </div>


          {/* SEARCH */}

          <div className="nearby-ngos-page__search">

            <Search size={18} />

            <input
              type="text"
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value
                );
              }}
              placeholder="Search NGO, area or food requirement..."
              aria-label="Search NGOs"
            />

            {search && (
              <button
                type="button"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <X size={17} />
              </button>
            )}

          </div>


          {/* RADIUS */}

          <div className="nearby-ngos-page__radius">

            <span>
              Search radius
            </span>

            {[5, 10, 20, 50].map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  className={
                    radius === value
                      ? 'nearby-ngos-page__radius-btn nearby-ngos-page__radius-btn--active'
                      : 'nearby-ngos-page__radius-btn'
                  }
                  onClick={() =>
                    setRadius(value)
                  }
                >
                  {value} km
                </button>
              )
            )}

          </div>

        </section>


        {/* ===================================================
            SUMMARY
        =================================================== */}

        {!loading && !error && (
          <div className="nearby-ngos-page__summary">

            <div>
              <span className="nearby-ngos-page__summary-number">
                {nearbyNGOs.length}
              </span>

              <span>
                {nearbyNGOs.length === 1
                  ? ' NGO found'
                  : ' NGOs found'}
              </span>
            </div>

            <span>
              Within {radius} km
            </span>

          </div>
        )}


        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="nearby-ngos-page__error">

            <div>
              <strong>
                Could not load nearby NGOs
              </strong>

              <p>
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                loadNGOs(true)
              }
            >
              Try again
            </button>

          </div>
        )}


        {/* ===================================================
            LOADING
        =================================================== */}

        {loading ? (
          <div className="nearby-ngos-page__loading">

            <RefreshCw
              size={28}
              className="nearby-ngos-page__spin"
            />

            <p>
              Finding verified NGOs near you...
            </p>

          </div>

        ) : !error &&
          nearbyNGOs.length === 0 ? (

          <EmptyState
            icon={Building2}
            title={
              search
                ? 'No matching NGOs found'
                : 'No NGOs found nearby'
            }
            message={
              search
                ? 'Try a different NGO name, area or food requirement.'
                : `There are no verified NGOs within ${radius} km of ${location?.label || 'your selected location'}.`
            }
          />

        ) : !error ? (

          <section className="nearby-ngos-page__content">

            {/* =================================================
                NGO LIST
            ================================================= */}

            <div className="nearby-ngos-page__list">

              <div className="nearby-ngos-page__section-heading">

                <div>
                  <h2>
                    Organizations near you
                  </h2>

                  <p>
                    Only verified organizations within
                    your selected radius are shown.
                  </p>
                </div>

              </div>


              {nearbyNGOs.map((ngo) => (
                <article
                  key={ngo.ngo_id}
                  className={
                    selectedNgo?.ngo_id ===
                    ngo.ngo_id
                      ? 'ngo-nearby-card ngo-nearby-card--selected'
                      : 'ngo-nearby-card'
                  }
                  onClick={() =>
                    handleSelectNgo(ngo)
                  }
                >

                  {/* ICON */}

                  <div className="ngo-nearby-card__icon">
                    <Building2 size={24} />
                  </div>


                  {/* BODY */}

                  <div className="ngo-nearby-card__body">

                    <div className="ngo-nearby-card__top">

                      <div>

                        <h3>
                          {ngo.organization_name}
                        </h3>

                        <span className="ngo-nearby-card__verified">
                          <CheckCircle2 size={14} />
                          Verified NGO
                        </span>

                      </div>


                      {ngo.distanceKm != null && (
                        <span className="ngo-nearby-card__distance">
                          {formatDistance(
                            ngo.distanceKm
                          )}
                        </span>
                      )}

                    </div>


                    {/* ADDRESS */}

                    <div className="ngo-nearby-card__address">
                      <MapPin size={15} />

                      <span>
                        {ngo.address ||
                          'Address not available'}
                      </span>
                    </div>


                    {/* REQUIREMENTS */}

                    {ngo.food_requirements && (
                      <p className="ngo-nearby-card__requirements">
                        Needs:{' '}
                        {ngo.food_requirements}
                      </p>
                    )}


                    {/* CAPACITY */}

                    {ngo.capacity != null && (
                      <div className="ngo-nearby-card__capacity">
                        Capacity:{' '}
                        {ngo.capacity}{' '}
                        {ngo.capacity_unit || 'kg'}
                      </div>
                    )}


                    {/* ACTIONS */}

                    <div className="ngo-nearby-card__actions">

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleSelectNgo(ngo);
                        }}
                      >
                        View details
                      </button>


                      <button
                        type="button"
                        className="ngo-nearby-card__route"
                        onClick={(event) => {
                          event.stopPropagation();
                          openDirections(ngo);
                        }}
                      >
                        <Navigation size={15} />
                        Directions
                      </button>

                    </div>

                  </div>

                </article>
              ))}

            </div>


            {/* =================================================
                MAP
            ================================================= */}

            <div className="nearby-ngos-page__map-panel">

              <div className="nearby-ngos-page__map-heading">

                <div>
                  <h2>
                    Explore nearby
                  </h2>

                  <p>
                    Showing verified NGOs within {radius} km.
                  </p>
                </div>

                <MapIcon size={19} />

              </div>


              <div className="nearby-ngos-page__map">

                <MapView
                  center={{
                    latitude:
                      Number(
                        location?.latitude
                      ) || 17.385,

                    longitude:
                      Number(
                        location?.longitude
                      ) || 78.4867,
                  }}

                  zoom={13}

                  userPosition={{
                    latitude:
                      Number(
                        location?.latitude
                      ) || 17.385,

                    longitude:
                      Number(
                        location?.longitude
                      ) || 78.4867,

                    label:
                      location?.label ||
                      'Your Location',
                  }}

                  ngoMarkers={ngoMarkers}

                  recenterTrigger={
                    recenterTrigger
                  }

                  onRecenter={() => {
                    setRecenterTrigger(
                      (value) =>
                        value + 1
                    );
                  }}

                  height="100%"

                  onMarkerClick={
                    handleSelectNgo
                  }
                />

              </div>


              {/* =================================================
                  SELECTED NGO
              ================================================= */}

              {selectedNgo && (
                <div className="nearby-ngos-page__selected">

                  <div>
                    <strong>
                      {selectedNgo.organization_name}
                    </strong>

                    <span>
                      {selectedNgo.address ||
                        'Address not available'}
                    </span>

                    {selectedNgo.distanceKm != null && (
                      <small>
                        {formatDistance(
                          selectedNgo.distanceKm
                        )}{' '}
                        away
                      </small>
                    )}
                  </div>


                  <div className="nearby-ngos-page__selected-actions">

                    <button
                      type="button"
                      onClick={() =>
                        openDirections(
                          selectedNgo
                        )
                      }
                    >
                      <Navigation size={15} />
                      Directions
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedNgo(null)
                      }
                      aria-label="Close selected NGO"
                    >
                      <X size={17} />
                    </button>

                  </div>

                </div>
              )}

            </div>

          </section>

        ) : null}

      </div>

    </div>
  );
}