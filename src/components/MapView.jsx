import { useEffect } from 'react';

import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMap,
} from 'react-leaflet';

import L from 'leaflet';

import 'leaflet/dist/leaflet.css';


// =========================================================
// OPENSTREETMAP
// =========================================================

const TILE_URL =
  'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

const TILE_ATTRIBUTION =
  '&copy; OpenStreetMap contributors';


// =========================================================
// CUSTOM MARKER
// =========================================================

function createIcon(color, letter) {
  const svg = `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="38"
      height="46"
      viewBox="0 0 38 46"
    >
      <path
        d="
          M19 1
          C9.1 1 1 9.1 1 19
          C1 30.5 19 45 19 45
          C19 45 37 30.5 37 19
          C37 9.1 28.9 1 19 1
          Z
        "
        fill="${color}"
        stroke="#ffffff"
        stroke-width="2"
      />

      <circle
        cx="19"
        cy="19"
        r="9"
        fill="#ffffff"
      />

      <text
        x="19"
        y="23"
        text-anchor="middle"
        font-size="11"
        font-family="Arial, sans-serif"
        font-weight="700"
        fill="${color}"
      >
        ${letter}
      </text>
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'mapview__custom-marker',
    iconSize: [38, 46],
    iconAnchor: [19, 46],
    popupAnchor: [0, -40],
  });
}


// =========================================================
// MARKER ICONS
// =========================================================

const PICKUP_ICON = createIcon('#E7B75A', 'P');

const DESTINATION_ICON = createIcon('#2AAE68', 'N');

const VOLUNTEER_ICON = createIcon('#4D8FE8', 'V');

const USER_ICON = createIcon('#E7B75A', 'U');

const NGO_ICON = createIcon('#2AAE68', 'N');

const FOOD_ICON = createIcon('#E7B75A', 'F');


// =========================================================
// MAP CONTROLLER
// =========================================================

function MapController({
  center,
  zoom,
  recenterTrigger,
}) {
  const map = useMap();

  useEffect(() => {
    if (
      center &&
      Number.isFinite(Number(center.latitude)) &&
      Number.isFinite(Number(center.longitude))
    ) {
      map.setView(
        [
          Number(center.latitude),
          Number(center.longitude),
        ],
        zoom || map.getZoom(),
        {
          animate: true,
        }
      );

      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [
    center?.latitude,
    center?.longitude,
    zoom,
    recenterTrigger,
    map,
  ]);

  return null;
}


// =========================================================
// POPUP
// =========================================================

function MarkerPopup({
  title,
  text,
}) {
  return (
    <div className="mapview__popup">
      <strong>{title}</strong>

      {text && (
        <span>{text}</span>
      )}
    </div>
  );
}


// =========================================================
// MAP VIEW
// =========================================================

export default function MapView({
  center = {
    latitude: 17.385,
    longitude: 78.4867,
  },

  zoom = 13,

  pickup,

  destination,

  volunteerPosition,

  userPosition,

  route,

  recenterTrigger = 0,

  onRecenter,

  className = '',

  markers = [],

  ngoMarkers = [],

  foodMarkers = [],

  height = '400px',

  onMarkerClick,
}) {

  // =======================================================
  // SAFE CENTER
  // =======================================================

  const safeCenter = {
    latitude: Number.isFinite(
      Number(center?.latitude)
    )
      ? Number(center.latitude)
      : 17.385,

    longitude: Number.isFinite(
      Number(center?.longitude)
    )
      ? Number(center.longitude)
      : 78.4867,
  };


  const centerCoords = [
    safeCenter.latitude,
    safeCenter.longitude,
  ];


  // =======================================================
  // ROUTE
  // =======================================================

  let routePositions = null;

  if (
    Array.isArray(route) &&
    route.length >= 2
  ) {
    routePositions = route;
  }

  else if (
    pickup &&
    volunteerPosition
  ) {
    routePositions = [
      [
        Number(volunteerPosition.latitude),
        Number(volunteerPosition.longitude),
      ],
      [
        Number(pickup.latitude),
        Number(pickup.longitude),
      ],
    ];
  }

  else if (
    pickup &&
    destination
  ) {
    routePositions = [
      [
        Number(pickup.latitude),
        Number(pickup.longitude),
      ],
      [
        Number(destination.latitude),
        Number(destination.longitude),
      ],
    ];
  }


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div
      className={`mapview ${className}`}
      style={{
        height,
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >

      <MapContainer
        center={centerCoords}
        zoom={zoom}
        scrollWheelZoom={true}
        zoomControl={true}
        attributionControl={true}
        style={{
          height: '100%',
          width: '100%',
          minHeight: '300px',
        }}
      >

        {/* =================================================
            OPENSTREETMAP ONLY
        ================================================= */}

        <TileLayer
          url={TILE_URL}
          attribution={TILE_ATTRIBUTION}
          maxZoom={19}
          minZoom={2}
        />


        {/* =================================================
            USER LOCATION
        ================================================= */}

        {userPosition &&
          userPosition.latitude != null &&
          userPosition.longitude != null && (

            <Marker
              position={[
                Number(userPosition.latitude),
                Number(userPosition.longitude),
              ]}
              icon={USER_ICON}
            >
              <Popup>
                <MarkerPopup
                  title="Your Location"
                  text={
                    userPosition.label ||
                    'Current position'
                  }
                />
              </Popup>
            </Marker>
          )}


        {/* =================================================
            PICKUP
        ================================================= */}

        {pickup &&
          pickup.latitude != null &&
          pickup.longitude != null && (

            <Marker
              position={[
                Number(pickup.latitude),
                Number(pickup.longitude),
              ]}
              icon={PICKUP_ICON}
            >
              <Popup>
                <MarkerPopup
                  title="Pickup Point"
                  text={
                    pickup.label ||
                    'Food pickup location'
                  }
                />
              </Popup>
            </Marker>
          )}


        {/* =================================================
            NGO DESTINATION
        ================================================= */}

        {destination &&
          destination.latitude != null &&
          destination.longitude != null && (

            <Marker
              position={[
                Number(destination.latitude),
                Number(destination.longitude),
              ]}
              icon={DESTINATION_ICON}
            >
              <Popup>
                <MarkerPopup
                  title="Selected NGO"
                  text={
                    destination.label ||
                    'NGO destination'
                  }
                />
              </Popup>
            </Marker>
          )}


        {/* =================================================
            VOLUNTEER
            ONLY RENDERED WHEN REAL DATA EXISTS
        ================================================= */}

        {volunteerPosition &&
          volunteerPosition.latitude != null &&
          volunteerPosition.longitude != null && (

            <Marker
              position={[
                Number(volunteerPosition.latitude),
                Number(volunteerPosition.longitude),
              ]}
              icon={VOLUNTEER_ICON}
            >
              <Popup>
                <MarkerPopup
                  title="Volunteer"
                  text={
                    volunteerPosition.label ||
                    'Volunteer current location'
                  }
                />
              </Popup>
            </Marker>
          )}


        {/* =================================================
            NGO MARKERS
        ================================================= */}

        {Array.isArray(ngoMarkers) &&
          ngoMarkers.map((ngo, index) => {

            if (
              ngo.latitude == null ||
              ngo.longitude == null
            ) {
              return null;
            }

            return (
              <Marker
                key={
                  ngo.id ??
                  ngo.ngo_id ??
                  `ngo-${index}`
                }
                position={[
                  Number(ngo.latitude),
                  Number(ngo.longitude),
                ]}
                icon={NGO_ICON}
                eventHandlers={{
                  click: () =>
                    onMarkerClick?.(ngo),
                }}
              >

                <Popup>

                  <div className="mapview__popup mapview__popup--ngo">

                    <strong>
                      {ngo.name || 'NGO'}
                    </strong>

                    {ngo.verified && (
                      <span className="mapview__popup-tag">
                        ✓ Verified
                      </span>
                    )}

                    {ngo.distanceKm != null && (
                      <span>
                        {Number(
                          ngo.distanceKm
                        ).toFixed(1)} km away
                      </span>
                    )}

                    {ngo.address && (
                      <span>
                        {ngo.address}
                      </span>
                    )}

                    {ngo.onView && (
                      <button
                        type="button"
                        className="mapview__popup-btn"
                        onClick={ngo.onView}
                      >
                        View Details
                      </button>
                    )}

                    {ngo.onRoute && (
                      <button
                        type="button"
                        className="
                          mapview__popup-btn
                          mapview__popup-btn--accent
                        "
                        onClick={ngo.onRoute}
                      >
                        Directions
                      </button>
                    )}

                  </div>

                </Popup>

              </Marker>
            );
          })}


        {/* =================================================
            FOOD MARKERS
        ================================================= */}

        {Array.isArray(foodMarkers) &&
          foodMarkers.map((food, index) => {

            if (
              food.latitude == null ||
              food.longitude == null
            ) {
              return null;
            }

            return (
              <Marker
                key={
                  food.id ??
                  food.donation_id ??
                  `food-${index}`
                }
                position={[
                  Number(food.latitude),
                  Number(food.longitude),
                ]}
                icon={FOOD_ICON}
                eventHandlers={{
                  click: () =>
                    onMarkerClick?.(food),
                }}
              >

                <Popup>

                  <div className="mapview__popup mapview__popup--food">

                    <strong>
                      {food.name || 'Food'}
                    </strong>

                    {food.quantity != null && (
                      <span>
                        {food.quantity}{' '}
                        {food.unit || 'kg'}
                      </span>
                    )}

                    {food.distanceKm != null && (
                      <span>
                        {Number(
                          food.distanceKm
                        ).toFixed(1)} km away
                      </span>
                    )}

                    {food.availableUntil && (
                      <span>
                        Available until{' '}
                        {food.availableUntil}
                      </span>
                    )}

                    {food.onView && (
                      <button
                        type="button"
                        className="mapview__popup-btn"
                        onClick={food.onView}
                      >
                        View Food
                      </button>
                    )}

                  </div>

                </Popup>

              </Marker>
            );
          })}


        {/* =================================================
            SIMPLE MARKERS
        ================================================= */}

        {Array.isArray(markers) &&
          markers.map((marker, index) => {

            if (
              marker.latitude == null ||
              marker.longitude == null
            ) {
              return null;
            }

            return (
              <Marker
                key={
                  marker.id ??
                  `marker-${index}`
                }
                position={[
                  Number(marker.latitude),
                  Number(marker.longitude),
                ]}
              />
            );
          })}


        {/* =================================================
            ROUTE
        ================================================= */}

        {routePositions &&
          routePositions.length >= 2 && (

            <Polyline
              positions={routePositions}
              pathOptions={{
                color: '#E7B75A',
                weight: 5,
                opacity: 0.9,
                dashArray: '9 7',
              }}
            />

          )}


        {/* =================================================
            MAP CONTROLLER
        ================================================= */}

        <MapController
          center={safeCenter}
          zoom={zoom}
          recenterTrigger={recenterTrigger}
        />

      </MapContainer>


      {/* ===================================================
          RECENTER BUTTON
      =================================================== */}

      {onRecenter && (

        <button
          type="button"
          className="mapview__recenter-btn"
          onClick={onRecenter}
          aria-label="Recenter map"
        >
          ⌖
        </button>

      )}

    </div>
  );
}