import { useEffect, useMemo, useState } from 'react';

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import { donationService } from '../services/donationService';
import { ngoService } from '../services/ngoService';

import { useLocationContext } from '../context/LocationContext';
import { useToast } from '../context/ToastContext';

import '../styles/donate-flow.css';


const STEPS = [
  'Food Details',
  'Pickup Location',
  'Choose NGO',
  'Review',
];


const FOOD_TYPES = [
  'Cooked Food',
  'Rice',
  'Vegetables',
  'Fruits',
  'Bakery Items',
  'Packaged Food',
  'Other',
];


function normalizeNgo(item) {
  if (!item) {
    return null;
  }

  return {
    id:
      item.ngo_id ??
      item.id ??
      null,

    name:
      item.organization_name ??
      item.name ??
      'NGO',

    address:
      item.address ??
      'Address not available',

    requirements:
      item.food_requirements ??
      item.requirements ??
      '',

    capacity:
      item.capacity ??
      null,

    verificationStatus:
      String(
        item.verification_status ??
        item.status ??
        ''
      ).toUpperCase(),

    latitude:
      item.latitude ??
      null,

    longitude:
      item.longitude ??
      null,

    distanceKm:
      item.distance_km ??
      item.distanceKm ??
      null,
  };
}


function getDistance(
  lat1,
  lon1,
  lat2,
  lon2
) {
  if (
    lat1 == null ||
    lon1 == null ||
    lat2 == null ||
    lon2 == null
  ) {
    return null;
  }

  const earthRadius = 6371;

  const dLat =
    (
      Number(lat2) -
      Number(lat1)
    ) *
    Math.PI /
    180;

  const dLon =
    (
      Number(lon2) -
      Number(lon1)
    ) *
    Math.PI /
    180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(
      Number(lat1) *
      Math.PI /
      180
    ) *
    Math.cos(
      Number(lat2) *
      Math.PI /
      180
    ) *
    Math.sin(dLon / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
}


function formatDistance(distance) {
  if (
    distance == null ||
    Number.isNaN(Number(distance))
  ) {
    return 'Distance unavailable';
  }

  const number =
    Number(distance);

  if (number < 1) {
    return `${Math.round(number * 1000)} m away`;
  }

  return `${number.toFixed(1)} km away`;
}


export default function DonateFood() {
  const navigate = useNavigate();
  const toast = useToast();

  const {
    location,
  } = useLocationContext();


  const [
    step,
    setStep,
  ] = useState(0);


  const [
    loading,
    setLoading,
  ] = useState(false);


  const [
    loadingNgos,
    setLoadingNgos,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState('');


  const [
    ngos,
    setNgos,
  ] = useState([]);


  const [
    matchMode,
    setMatchMode,
  ] = useState('smart');


  const [
    selectedNgo,
    setSelectedNgo,
  ] = useState(null);


  const [
    submittedDonation,
    setSubmittedDonation,
  ] = useState(null);


  const [
    form,
    setForm,
  ] = useState({
    foodName: '',
    foodType: 'Cooked Food',
    quantity: '',
    unit: 'kg',

    expiryTime: '',
    pickupTime: '',

    pickupAddress:
      location?.label ||
      '',

    notes: '',

    latitude:
      location?.latitude ??
      null,

    longitude:
      location?.longitude ??
      null,
  });


  // =======================================================
  // UPDATE LOCATION INTO FORM
  // =======================================================

  useEffect(() => {
    if (
      location?.latitude != null &&
      location?.longitude != null
    ) {
      setForm(
        (previous) => ({
          ...previous,

          latitude:
            location.latitude,

          longitude:
            location.longitude,

          pickupAddress:
            previous.pickupAddress ||
            location.label ||
            '',
        })
      );
    }
  }, [
    location?.latitude,
    location?.longitude,
    location?.label,
  ]);


  // =======================================================
  // UPDATE FIELD
  // =======================================================

  function update(
    field,
    value
  ) {
    setForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );

    setError('');
  }


  // =======================================================
  // LOAD NGOS
  // =======================================================

  async function loadNearbyNGOs() {
    if (
      form.latitude == null ||
      form.longitude == null
    ) {
      setNgos([]);
      return;
    }

    setLoadingNgos(true);

    try {
      const response =
        await ngoService.getNearby({
          latitude:
            Number(form.latitude),

          longitude:
            Number(form.longitude),

          radiusKm: 50,
        });


      const rawList =
        Array.isArray(response)
          ? response
          : Array.isArray(
              response?.data
            )
              ? response.data
              : [];


      const normalized =
        rawList
          .map(normalizeNgo)
          .filter(
            (ngo) =>
              ngo &&
              ngo.id
          )
          .filter(
            (ngo) =>
              ngo.verificationStatus ===
              'VERIFIED'
          )
          .map(
            (ngo) => ({
              ...ngo,

              distanceKm:
                ngo.distanceKm ??
                getDistance(
                  form.latitude,
                  form.longitude,
                  ngo.latitude,
                  ngo.longitude
                ),
            })
          )
          .filter(
            (ngo) =>
              ngo.distanceKm == null ||
              ngo.distanceKm <= 50
          )
          .sort(
            (a, b) =>
              (
                a.distanceKm ??
                Infinity
              ) -
              (
                b.distanceKm ??
                Infinity
              )
          );


      setNgos(normalized);

    } catch (err) {
      console.error(
        'Failed to load NGOs:',
        err
      );

      setNgos([]);

      setError(
        err?.message ||
        'Unable to load nearby NGOs.'
      );
    } finally {
      setLoadingNgos(false);
    }
  }


  // =======================================================
  // LOAD NGOs WHEN ENTERING STEP 3
  // =======================================================

  useEffect(() => {
    if (step === 2) {
      loadNearbyNGOs();
    }
  }, [step]);


  // =======================================================
  // VALIDATE FOOD DETAILS
  // =======================================================

  function validateFoodDetails() {
    if (!form.foodName.trim()) {
      return 'Please enter the food name.';
    }

    if (
      !form.quantity ||
      Number(form.quantity) <= 0
    ) {
      return 'Please enter a valid quantity.';
    }

    if (!form.expiryTime) {
      return 'Please enter the expiry time.';
    }

    return null;
  }


  // =======================================================
  // VALIDATE PICKUP
  // =======================================================

  function validatePickup() {
    if (
      !form.pickupAddress.trim()
    ) {
      return 'Please enter the pickup location.';
    }

    if (
      form.latitude == null ||
      form.longitude == null
    ) {
      return 'Please select or detect a pickup location.';
    }

    if (!form.pickupTime) {
      return 'Please select the pickup time.';
    }

    return null;
  }


  // =======================================================
  // NEXT STEP
  // =======================================================

  function handleNext() {
    setError('');

    if (step === 0) {
      const validation =
        validateFoodDetails();

      if (validation) {
        setError(validation);
        return;
      }
    }


    if (step === 1) {
      const validation =
        validatePickup();

      if (validation) {
        setError(validation);
        return;
      }
    }


    if (step === 2) {
      if (
        matchMode === 'manual' &&
        !selectedNgo
      ) {
        setError(
          'Please select an NGO or choose Smart Match.'
        );

        return;
      }
    }


    if (step < 3) {
      setStep(
        (current) =>
          current + 1
      );
    }
  }


  // =======================================================
  // BACK
  // =======================================================

  function handleBack() {
    setError('');

    if (step === 0) {
      navigate(
        '/donor/dashboard'
      );

      return;
    }

    setStep(
      (current) =>
        current - 1
    );
  }


  // =======================================================
  // BUILD BACKEND PAYLOAD
  // =======================================================

  function buildDonationPayload() {
    return {
      food_name:
        form.foodName.trim(),

      food_type:
        form.foodType,

      quantity:
        Number(form.quantity),

      unit:
        form.unit,

      expiry_time:
        new Date(
          form.expiryTime
        ).toISOString(),

      pickup_time:
        new Date(
          form.pickupTime
        ).toISOString(),

      pickup_address:
        form.pickupAddress.trim(),

      latitude:
        Number(form.latitude),

      longitude:
        Number(form.longitude),

      notes:
        form.notes.trim() ||
        null,

    };
  }


  // =======================================================
  // SUBMIT DONATION
  // =======================================================

  async function handleSubmit() {
    setLoading(true);

    setError('');

    try {
      const payload =
        buildDonationPayload();


      console.log(
        'Submitting donation:',
        payload
      );


      /*
        IMPORTANT:
        This call creates the actual PostgreSQL
        donation record through FastAPI.
      */

      const response =
        await donationService.create(
          payload
        );


      console.log(
        'Donation created:',
        response
      );


      const createdDonation =
        response?.data ??
        response;


      if (
        !createdDonation
      ) {
        throw new Error(
          'The donation was not returned by the server.'
        );
      }


      setSubmittedDonation(
        createdDonation
      );


      /*
        Save the donor's NGO choice only as
        frontend preference for the next screen.
      */

      try {
        sessionStorage.setItem(
          `mealbridge_donation_${createdDonation.donation_id ?? createdDonation.id}`,
          JSON.stringify({
            matchMode,
            selectedNgo,
          })
        );
      } catch {
        // Ignore storage errors.
      }


      toast.success(
        'Donation posted successfully.'
      );


      /*
        IMPORTANT:
        Go directly to tracking only after the
        backend successfully creates the donation.
      */

      const donationId =
        createdDonation.donation_id ??
        createdDonation.id;


      if (!donationId) {
        throw new Error(
          'Donation was created but no donation ID was returned.'
        );
      }


      navigate(
        `/donor/tracking/${donationId}`,
        {
          replace: true,

          state: {
            donation:
              createdDonation,

            preference: {
              matchMode,
              selectedNgo,
            },
          },
        }
      );

    } catch (err) {
      console.error(
        'Donation submission failed:',
        err
      );

      const backendMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message;


      setError(
        backendMessage ||
        'Unable to post your donation. Please try again.'
      );

    } finally {
      setLoading(false);
    }
  }


  // =======================================================
  // REVIEW
  // =======================================================

  const ngoTitle =
    matchMode === 'smart'
      ? 'MealBridge Smart Match'
      : selectedNgo?.name ||
        'No NGO selected';


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="donate-flow-page">

      <div className="container">


        {/* =================================================
            TOP
        ================================================= */}

        <div className="donate-flow-top">

          <button
            type="button"
            className="donate-flow-back"
            onClick={
              handleBack
            }
          >
            <ArrowLeft size={18} />
            Back
          </button>


          <div>

            <span className="donate-flow-eyebrow">
              FOOD DONATION
            </span>

            <h1>
              Donate Food
            </h1>

            <p>
              Share surplus food with a verified
              organization that can put it to use.
            </p>

          </div>

        </div>


        {/* =================================================
            STEPS
        ================================================= */}

        <div className="donate-flow-steps">

          {STEPS.map(
            (label, index) => {

              const done =
                index < step;

              const active =
                index === step;

              return (
                <div
                  key={label}
                  className="donate-flow-step-wrap"
                >

                  <div
                    className={
                      `donate-flow-step ${
                        active
                          ? 'donate-flow-step--active'
                          : ''
                      } ${
                        done
                          ? 'donate-flow-step--done'
                          : ''
                      }`
                    }
                  >

                    <span>
                      {done ? (
                        <Check size={14} />
                      ) : (
                        index + 1
                      )}
                    </span>

                    {label}

                  </div>

                  {index <
                    STEPS.length - 1 && (
                    <div
                      className={
                        done
                          ? 'donate-flow-step-line donate-flow-step-line--done'
                          : 'donate-flow-step-line'
                      }
                    />
                  )}

                </div>
              );
            }
          )}

        </div>


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="donate-flow-error">

            <span>
              {error}
            </span>

          </div>
        )}


        {/* =================================================
            STEP 1
        ================================================= */}

        {step === 0 && (
          <section className="donate-flow-card">

            <div className="donate-flow-card-title">

              <div>
                <span>
                  STEP 1
                </span>

                <h2>
                  Food Details
                </h2>

                <p>
                  Tell us what food is available.
                </p>
              </div>

              <div className="donate-flow-card-icon">
                <Package size={21} />
              </div>

            </div>


            <div className="donate-flow-form-grid">

              <div className="donate-flow-field donate-flow-field--full">

                <label>
                  Food Name *
                </label>

                <input
                  value={form.foodName}
                  onChange={(event) =>
                    update(
                      'foodName',
                      event.target.value
                    )
                  }
                  placeholder="e.g. Fresh Meals"
                />

              </div>


              <div className="donate-flow-field">

                <label>
                  Food Type *
                </label>

                <select
                  value={form.foodType}
                  onChange={(event) =>
                    update(
                      'foodType',
                      event.target.value
                    )
                  }
                >

                  {FOOD_TYPES.map(
                    (type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type}
                      </option>
                    )
                  )}

                </select>

              </div>


              <div className="donate-flow-field">

                <label>
                  Quantity *
                </label>

                <div className="donate-flow-quantity">

                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={form.quantity}
                    onChange={(event) =>
                      update(
                        'quantity',
                        event.target.value
                      )
                    }
                    placeholder="20"
                  />

                  <select
                    value={form.unit}
                    onChange={(event) =>
                      update(
                        'unit',
                        event.target.value
                      )
                    }
                  >
                    <option value="kg">
                      kg
                    </option>

                    <option value="meals">
                      meals
                    </option>

                    <option value="packets">
                      packets
                    </option>
                  </select>

                </div>

              </div>


              <div className="donate-flow-field">

                <label>
                  Expiry Time *
                </label>

                <input
                  type="datetime-local"
                  value={
                    form.expiryTime
                  }
                  onChange={(event) =>
                    update(
                      'expiryTime',
                      event.target.value
                    )
                  }
                />

              </div>


              <div className="donate-flow-field">

                <label>
                  Notes
                </label>

                <input
                  value={form.notes}
                  onChange={(event) =>
                    update(
                      'notes',
                      event.target.value
                    )
                  }
                  placeholder="Optional food information"
                />

              </div>

            </div>


            <div className="donate-flow-actions">

              <button
                type="button"
                className="donate-flow-primary"
                onClick={
                  handleNext
                }
              >
                Continue
                <ArrowRight size={17} />
              </button>

            </div>

          </section>
        )}


        {/* =================================================
            STEP 2
        ================================================= */}

        {step === 1 && (
          <section className="donate-flow-card">

            <div className="donate-flow-card-title">

              <div>
                <span>
                  STEP 2
                </span>

                <h2>
                  Pickup Location
                </h2>

                <p>
                  Tell volunteers where the food can
                  be collected.
                </p>
              </div>

              <div className="donate-flow-card-icon donate-flow-card-icon--green">
                <MapPin size={21} />
              </div>

            </div>


            <div className="donate-flow-location-box">

              <div className="donate-flow-field">

                <label>
                  Pickup Address *
                </label>

                <input
                  value={
                    form.pickupAddress
                  }
                  onChange={(event) =>
                    update(
                      'pickupAddress',
                      event.target.value
                    )
                  }
                  placeholder="Enter pickup address"
                />

              </div>


              <div className="donate-flow-coordinates">

                <div>
                  <span>
                    Latitude
                  </span>

                  <strong>
                    {form.latitude != null
                      ? Number(
                          form.latitude
                        ).toFixed(6)
                      : 'Not selected'}
                  </strong>
                </div>


                <div>
                  <span>
                    Longitude
                  </span>

                  <strong>
                    {form.longitude != null
                      ? Number(
                          form.longitude
                        ).toFixed(6)
                      : 'Not selected'}
                  </strong>
                </div>

              </div>

            </div>


            <div className="donate-flow-field">

              <label>
                Pickup Time *
              </label>

              <input
                type="datetime-local"
                value={
                  form.pickupTime
                }
                onChange={(event) =>
                  update(
                    'pickupTime',
                    event.target.value
                  )
                }
              />

            </div>


            <div className="donate-flow-location-note">

              <MapPin size={17} />

              <span>
                This location will be used to find
                nearby verified NGOs.
              </span>

            </div>


            <div className="donate-flow-actions">

              <button
                type="button"
                className="donate-flow-secondary"
                onClick={
                  handleBack
                }
              >
                <ArrowLeft size={17} />
                Back
              </button>


              <button
                type="button"
                className="donate-flow-primary"
                onClick={
                  handleNext
                }
              >
                Continue
                <ArrowRight size={17} />
              </button>

            </div>

          </section>
        )}


        {/* =================================================
            STEP 3
        ================================================= */}

        {step === 2 && (
          <section className="donate-flow-card">

            <div className="donate-flow-card-title">

              <div>
                <span>
                  STEP 3
                </span>

                <h2>
                  Who should receive this donation?
                </h2>

                <p>
                  Choose an NGO yourself or let
                  MealBridge help find one.
                </p>
              </div>

              <div className="donate-flow-card-icon">
                <Building2 size={21} />
              </div>

            </div>


            {/* MATCH MODE */}

            <div className="donate-flow-match-options">

              <button
                type="button"
                className={
                  matchMode === 'smart'
                    ? 'donate-flow-match-option donate-flow-match-option--active'
                    : 'donate-flow-match-option'
                }
                onClick={() =>
                  setMatchMode('smart')
                }
              >

                <div className="donate-flow-radio">

                  {matchMode === 'smart' && (
                    <span />
                  )}

                </div>


                <div>

                  <strong>
                    <Sparkles size={16} />
                    Let MealBridge find the best NGO
                  </strong>

                  <span>
                    Uses location, food requirements,
                    quantity and NGO capacity.
                  </span>

                </div>

              </button>


              <button
                type="button"
                className={
                  matchMode === 'manual'
                    ? 'donate-flow-match-option donate-flow-match-option--active'
                    : 'donate-flow-match-option'
                }
                onClick={() =>
                  setMatchMode('manual')
                }
              >

                <div className="donate-flow-radio">

                  {matchMode === 'manual' && (
                    <span />
                  )}

                </div>


                <div>

                  <strong>
                    <MapPin size={16} />
                    Choose an NGO myself
                  </strong>

                  <span>
                    Select a verified NGO from the
                    nearby organizations.
                  </span>

                </div>

              </button>

            </div>


            {/* NGO LIST */}

            {matchMode === 'manual' && (

              <div className="donate-flow-ngo-section">

                <div className="donate-flow-ngo-heading">

                  <div>

                    <strong>
                      Nearby verified NGOs
                    </strong>

                    <span>
                      Select one organization to
                      receive your donation.
                    </span>

                  </div>

                  <button
                    type="button"
                    onClick={
                      loadNearbyNGOs
                    }
                    disabled={
                      loadingNgos
                    }
                  >
                    <RefreshCw
                      size={15}
                      className={
                        loadingNgos
                          ? 'donate-flow-spin'
                          : ''
                      }
                    />
                    Refresh
                  </button>

                </div>


                {loadingNgos ? (

                  <div className="donate-flow-loading">

                    <RefreshCw
                      size={25}
                      className="donate-flow-spin"
                    />

                    Finding verified NGOs...

                  </div>

                ) : ngos.length === 0 ? (

                  <div className="donate-flow-empty-ngo">

                    <Building2 size={28} />

                    <strong>
                      No verified NGOs found nearby
                    </strong>

                    <span>
                      Try updating your pickup location.
                    </span>

                  </div>

                ) : (

                  <div className="donate-flow-ngo-list">

                    {ngos.map(
                      (ngo) => (

                        <button
                          key={ngo.id}
                          type="button"
                          className={
                            Number(
                              selectedNgo?.id
                            ) ===
                            Number(
                              ngo.id
                            )
                              ? 'donate-flow-ngo-card donate-flow-ngo-card--selected'
                              : 'donate-flow-ngo-card'
                          }
                          onClick={() =>
                            setSelectedNgo(
                              ngo
                            )
                          }
                        >

                          <div className="donate-flow-ngo-icon">
                            <Building2 size={21} />
                          </div>


                          <div className="donate-flow-ngo-content">

                            <div className="donate-flow-ngo-top">

                              <strong>
                                {ngo.name}
                              </strong>

                              <CheckCircle2
                                size={16}
                              />

                            </div>


                            <span className="donate-flow-ngo-distance">

                              {formatDistance(
                                ngo.distanceKm
                              )}

                            </span>


                            <span>
                              {ngo.address}
                            </span>


                            {ngo.requirements && (
                              <small>
                                Needs: {ngo.requirements}
                              </small>
                            )}


                            {ngo.capacity != null && (
                              <small>
                                Capacity:{' '}
                                {ngo.capacity} kg
                              </small>
                            )}

                          </div>


                          <div className="donate-flow-ngo-select">

                            {Number(
                              selectedNgo?.id
                            ) ===
                            Number(
                              ngo.id
                            ) ? (
                              <Check size={17} />
                            ) : null}

                          </div>

                        </button>

                      )
                    )}

                  </div>

                )}

              </div>
            )}


            {matchMode === 'smart' && (

              <div className="donate-flow-smart-box">

                <Sparkles size={21} />

                <div>

                  <strong>
                    Smart Match enabled
                  </strong>

                  <span>
                    MealBridge will use your donation
                    details to identify a suitable
                    verified NGO.
                  </span>

                </div>

              </div>

            )}


            <div className="donate-flow-actions">

              <button
                type="button"
                className="donate-flow-secondary"
                onClick={
                  handleBack
                }
              >
                <ArrowLeft size={17} />
                Back
              </button>


              <button
                type="button"
                className="donate-flow-primary"
                onClick={
                  handleNext
                }
              >
                Review Donation
                <ArrowRight size={17} />
              </button>

            </div>

          </section>
        )}


        {/* =================================================
            STEP 4 REVIEW
        ================================================= */}

        {step === 3 && (

          <section className="donate-flow-card">

            <div className="donate-flow-card-title">

              <div>
                <span>
                  STEP 4
                </span>

                <h2>
                  Review Donation
                </h2>

                <p>
                  Check everything before posting.
                </p>
              </div>

              <div className="donate-flow-card-icon">
                <ShieldCheck size={21} />
              </div>

            </div>


            <div className="donate-flow-review">

              <div className="donate-flow-review-row">

                <span>
                  Food
                </span>

                <strong>
                  {form.foodName}
                </strong>

              </div>


              <div className="donate-flow-review-row">

                <span>
                  Type
                </span>

                <strong>
                  {form.foodType}
                </strong>

              </div>


              <div className="donate-flow-review-row">

                <span>
                  Quantity
                </span>

                <strong>
                  {form.quantity} {form.unit}
                </strong>

              </div>


              <div className="donate-flow-review-row">

                <span>
                  Pickup
                </span>

                <strong>
                  {form.pickupAddress}
                </strong>

              </div>


              <div className="donate-flow-review-row">

                <span>
                  Pickup Time
                </span>

                <strong>
                  {form.pickupTime
                    ? new Date(
                        form.pickupTime
                      ).toLocaleString(
                        'en-IN'
                      )
                    : '—'}
                </strong>

              </div>


              <div className="donate-flow-review-row">

                <span>
                  Expiry
                </span>

                <strong>
                  {form.expiryTime
                    ? new Date(
                        form.expiryTime
                      ).toLocaleString(
                        'en-IN'
                      )
                    : '—'}
                </strong>

              </div>


              <div className="donate-flow-review-row">

                <span>
                  Recipient
                </span>

                <strong>
                  {ngoTitle}
                </strong>

              </div>

            </div>


            <div className="donate-flow-review-note">

              <CheckCircle2 size={20} />

              <div>

                <strong>
                  Ready to post
                </strong>

                <span>
                  Clicking “Submit Donation” will
                  create a POSTED donation in MealBridge.
                </span>

              </div>

            </div>


            <div className="donate-flow-actions">

              <button
                type="button"
                className="donate-flow-secondary"
                onClick={
                  handleBack
                }
                disabled={
                  loading
                }
              >
                <ArrowLeft size={17} />
                Back
              </button>


              <button
                type="button"
                className="donate-flow-primary donate-flow-submit"
                onClick={
                  handleSubmit
                }
                disabled={
                  loading
                }
              >

                {loading ? (
                  <>
                    <RefreshCw
                      size={17}
                      className="donate-flow-spin"
                    />
                    Posting...
                  </>
                ) : (
                  <>
                    Submit Donation
                    <Check size={17} />
                  </>
                )}

              </button>

            </div>

          </section>
        )}

      </div>

    </div>
  );
}