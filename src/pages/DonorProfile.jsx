import { useEffect, useState } from 'react';
import {
  User,
  Mail,
  MapPin,
  ShieldCheck,
  HeartHandshake,
  Package,
  Bell,
  LogOut,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  Clock3,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/apiClient';
import { useLocationContext } from '../context/LocationContext';
import { useNow } from '../hooks/useNow';

import {
  formatDay,
  formatTime,
} from '../utils/formatDate';

import '../styles/donor-profile.css';


export default function DonorProfile() {
  const navigate = useNavigate();

  const {
    user,
    logout,
  } = useAuth();

  const {
    location,
  } = useLocationContext();

  const now = useNow();

  const [
    profile,
    setProfile,
  ] = useState(user || null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');


  // =========================================================
  // LOAD CURRENT USER
  // =========================================================

  async function loadProfile(
    isRefresh = false
  ) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const response =
        await apiClient.get('/api/users/me');

      setProfile(response);

    } catch (err) {
      console.error(
        'Failed to load donor profile:',
        err
      );

      /*
        Keep AuthContext user information as
        a fallback so the page can still render.
      */

      if (user) {
        setProfile(user);
      }

      setError(
        err?.message ||
        'Unable to load your profile.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadProfile();
  }, []);


  // =========================================================
  // LOGOUT
  // =========================================================

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate('/');
    }
  }


  // =========================================================
  // VALUES
  // =========================================================

  const name =
    profile?.name ||
    profile?.full_name ||
    profile?.fullName ||
    profile?.username ||
    'Donor';

  const email =
    profile?.email ||
    'Email not available';

  const role =
    String(
      profile?.role ||
      'DONOR'
    ).toUpperCase();

  const address =
    profile?.address ||
    profile?.location ||
    location?.label ||
    'Location not available';

  const city =
    profile?.city ||
    location?.city ||
    '';

  const state =
    profile?.state ||
    location?.state ||
    '';

  const joinedDate =
    profile?.created_at ||
    profile?.createdAt ||
    null;


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="container donor-profile-page">

        <div className="donor-profile-state">

          <RefreshCw
            size={28}
            className="donor-profile-spin"
          />

          <h2>
            Loading your profile
          </h2>

          <p>
            Getting your MealBridge account details.
          </p>

        </div>

      </div>
    );
  }


  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="container donor-profile-page">

      {/* =====================================================
          TOP BAR
      ===================================================== */}

      <div className="donor-profile-topbar">

        <button
          type="button"
          className="donor-profile-back"
          onClick={() =>
            navigate(
              '/donor/dashboard'
            )
          }
        >
          <ArrowLeft size={18} />
          Dashboard
        </button>


        <div className="donor-profile-time">

          <Clock3 size={16} />

          <span>
            {formatDay(now)}
          </span>

          <strong>
            {formatTime(now)}
          </strong>

        </div>

      </div>


      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="donor-profile-hero">

        <div className="donor-profile-avatar">
          {name
            .charAt(0)
            .toUpperCase()}
        </div>


        <div className="donor-profile-hero-content">

          <span className="donor-profile-eyebrow">
            MEALBRIDGE ACCOUNT
          </span>

          <h1>
            Your Profile
          </h1>

          <p>
            Manage your donor account information and
            see your MealBridge participation details.
          </p>

        </div>


        <button
          type="button"
          className="donor-profile-refresh"
          onClick={() =>
            loadProfile(true)
          }
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? 'donor-profile-spin'
                : ''
            }
          />

          {refreshing
            ? 'Refreshing...'
            : 'Refresh'}
        </button>

      </section>


      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="donor-profile-warning">

          <ShieldCheck size={18} />

          <span>
            {error}
          </span>

        </div>
      )}


      {/* =====================================================
          MAIN GRID
      ===================================================== */}

      <div className="donor-profile-grid">


        {/* ===================================================
            PERSONAL INFORMATION
        =================================================== */}

        <section className="donor-profile-card">

          <div className="donor-profile-card-heading">

            <div>
              <span>
                ACCOUNT INFORMATION
              </span>

              <h2>
                Personal details
              </h2>
            </div>

            <div className="donor-profile-heading-icon">
              <User size={20} />
            </div>

          </div>


          <div className="donor-profile-info-list">

            {/* NAME */}

            <div className="donor-profile-info-row">

              <div className="donor-profile-info-icon">
                <User size={18} />
              </div>

              <div>

                <span>
                  FULL NAME
                </span>

                <strong>
                  {name}
                </strong>

              </div>

            </div>


            {/* EMAIL */}

            <div className="donor-profile-info-row">

              <div className="donor-profile-info-icon">
                <Mail size={18} />
              </div>

              <div>

                <span>
                  EMAIL ADDRESS
                </span>

                <strong>
                  {email}
                </strong>

              </div>

            </div>


            {/* ROLE */}

            <div className="donor-profile-info-row">

              <div className="donor-profile-info-icon">
                <ShieldCheck size={18} />
              </div>

              <div>

                <span>
                  ACCOUNT ROLE
                </span>

                <strong>
                  {role === 'DONOR'
                    ? 'Food Donor'
                    : role}
                </strong>

              </div>

              <div className="donor-profile-verified">
                <CheckCircle2 size={14} />
                Active
              </div>

            </div>


            {/* LOCATION */}

            <div className="donor-profile-info-row">

              <div className="donor-profile-info-icon">
                <MapPin size={18} />
              </div>

              <div>

                <span>
                  LOCATION
                </span>

                <strong>
                  {address}
                </strong>

                {(city || state) && (
                  <small>
                    {[city, state]
                      .filter(Boolean)
                      .join(', ')}
                  </small>
                )}

              </div>

            </div>

          </div>

        </section>


        {/* ===================================================
            DONOR STATUS
        =================================================== */}

        <section className="donor-profile-card">

          <div className="donor-profile-card-heading">

            <div>
              <span>
                DONOR STATUS
              </span>

              <h2>
                Your participation
              </h2>
            </div>

            <div className="donor-profile-heading-icon">
              <HeartHandshake size={20} />
            </div>

          </div>


          <div className="donor-profile-status-box">

            <div className="donor-profile-status-icon">
              <CheckCircle2 size={25} />
            </div>

            <div>

              <strong>
                Donor account active
              </strong>

              <span>
                You can create and manage food donations
                through MealBridge.
              </span>

            </div>

          </div>


          <div className="donor-profile-actions">

            <button
              type="button"
              onClick={() =>
                navigate('/donor/donations')
              }
            >
              <Package size={17} />
              My Donations
            </button>


            <button
              type="button"
              onClick={() =>
                navigate('/notifications')
              }
            >
              <Bell size={17} />
              Notifications
            </button>

          </div>

        </section>


        {/* ===================================================
            LOCATION
        =================================================== */}

        <section className="donor-profile-card">

          <div className="donor-profile-card-heading">

            <div>
              <span>
                CURRENT LOCATION
              </span>

              <h2>
                Location details
              </h2>
            </div>

            <div className="donor-profile-heading-icon donor-profile-heading-icon--green">
              <MapPin size={20} />
            </div>

          </div>


          <div className="donor-profile-location-box">

            <div className="donor-profile-location-icon">
              <MapPin size={22} />
            </div>

            <div>

              <strong>
                {address}
              </strong>

              {location?.latitude != null &&
                location?.longitude != null && (
                  <span>
                    {Number(
                      location.latitude
                    ).toFixed(5)}
                    ,{' '}
                    {Number(
                      location.longitude
                    ).toFixed(5)}
                  </span>
                )}

            </div>

          </div>


          <p className="donor-profile-helper">
            This location is used to show nearby verified
            NGOs and help with donation pickup planning.
          </p>

        </section>


        {/* ===================================================
            ACCOUNT INFORMATION
        =================================================== */}

        <section className="donor-profile-card">

          <div className="donor-profile-card-heading">

            <div>
              <span>
                ACCOUNT
              </span>

              <h2>
                Account details
              </h2>
            </div>

            <div className="donor-profile-heading-icon">
              <ShieldCheck size={20} />
            </div>

          </div>


          <div className="donor-profile-account-list">

            <div>
              <span>
                Account type
              </span>

              <strong>
                Donor
              </strong>
            </div>

            <div>
              <span>
                Account status
              </span>

              <strong className="donor-profile-active">
                Active
              </strong>
            </div>

            <div>
              <span>
                Member since
              </span>

              <strong>
                {joinedDate
                  ? new Date(
                      joinedDate
                    ).toLocaleDateString(
                      'en-IN',
                      {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      }
                    )
                  : 'Available in account'}
              </strong>
            </div>

          </div>

        </section>


        {/* ===================================================
            LOGOUT
        =================================================== */}

        <section className="donor-profile-logout-card">

          <div>

            <strong>
              Sign out of MealBridge
            </strong>

            <span>
              You can log in again whenever you want
              to manage your donations.
            </span>

          </div>


          <button
            type="button"
            onClick={handleLogout}
          >
            <LogOut size={17} />
            Logout
          </button>

        </section>

      </div>


      {/* =====================================================
          FOOT NOTE
      ===================================================== */}

      <div className="donor-profile-footer-note">

        <ShieldCheck size={16} />

        <span>
          Your donor account is protected by MealBridge
          authentication and role-based access.
        </span>

      </div>

    </div>
  );
}