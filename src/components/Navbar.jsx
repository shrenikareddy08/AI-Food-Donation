import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Bell,
  Menu,
  X,
  LogOut,
  CalendarDays,
  Clock3,
  Bot,
  Sparkles,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/cn';
import { apiClient } from '../services/apiClient';
import Logo from './Logo';
import Button from './Button';
import LocationHeader from './LocationHeader';
import BottomNav from './BottomNav';
import AiAssistantModal from './AiAssistantModal';
import { useNow } from '../hooks/useNow';
import {
  formatDay,
  formatDateShort,
  formatTime,
} from '../utils/formatDate';


const ROLE_NAVIGATION = {
  DONOR: [
    {
      to: '/donor/dashboard',
      label: 'Home',
    },
    {
      to: '/donor/donations',
      label: 'My Donations',
    },
    {
      to: '/donate',
      label: 'Create Donation',
    },
    {
      to: '/nearby-ngos',
      label: 'Nearby NGOs',
    },
    {
      to: '/events',
      label: 'Surplus Events',
    },
    {
      to: '/search',
      label: 'Find Food',
    },
  ],

  NGO: [
    {
      to: '/ngo/dashboard',
      label: 'Home',
    },
    {
      to: '/ngo/available-food',
      label: 'Donation Requests',
    },
    {
      to: '/ngo/incoming-donations',
      label: 'Deliveries',
    },
    {
      to: '/search',
      label: 'Find Food',
    },
  ],

  VOLUNTEER: [
    {
      to: '/volunteer/dashboard',
      label: 'Home',
    },
    {
      to: '/volunteer/assignments',
      label: 'Delivery Requests',
    },
  ],

  ADMIN: [
    {
      to: '/admin/dashboard',
      label: 'Dashboard',
    },
    {
      to: '/admin/users',
      label: 'Users',
    },
    {
      to: '/admin/ngos',
      label: 'NGOs',
    },
    {
      to: '/admin/volunteers',
      label: 'Volunteers',
    },
    {
      to: '/admin/donations',
      label: 'Donations',
    },
    {
      to: '/admin/deliveries',
      label: 'Deliveries',
    },
    {
      to: '/admin/audit-logs',
      label: 'Audit Logs',
    },
  ],
};


const ROLE_NOTIFICATIONS = {
  DONOR: '/notifications',
  NGO: '/ngo/notifications',
  VOLUNTEER: '/volunteer/notifications',
  ADMIN: '/admin/notifications',
};


const ROLE_PROFILE = {
  DONOR: '/profile',
  NGO: '/ngo/profile',
  VOLUNTEER: '/volunteer/profile',
  ADMIN: '/admin/profile',
};


export default function Navbar() {

  const {
    user,
    isAuthenticated,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  const location = useLocation();

  const now = useNow(1000);

  const [scrolled, setScrolled] =
    useState(false);

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [aiModalOpen, setAiModalOpen] =
    useState(false);

  const [unreadCount, setUnreadCount] =
    useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const res = await apiClient.get('/api/notifications/unread-count');
        if (isMounted && typeof res?.unread_count === 'number') {
          setUnreadCount(res.unread_count);
        }
      } catch {
        try {
          const list = await apiClient.get('/api/notifications/me');
          if (isMounted && Array.isArray(list)) {
            setUnreadCount(list.filter((n) => !n.is_read).length);
          }
        } catch (_) {}
      }
    };

    fetchUnread();
    const timer = setInterval(fetchUnread, 12000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [isAuthenticated, location.pathname]);


  useEffect(() => {

    const handleScroll = () => {
      setScrolled(
        window.scrollY > 8
      );
    };

    window.addEventListener(
      'scroll',
      handleScroll
    );

    return () => {
      window.removeEventListener(
        'scroll',
        handleScroll
      );
    };

  }, []);


  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);


  const handleLogout = () => {

    logout();

    navigate('/');
  };


  const role =
    user?.role || null;

  const navigationItems =
    ROLE_NAVIGATION[role] || [];


  const notificationPath =
    ROLE_NOTIFICATIONS[role] ||
    '/notifications';


  const profilePath =
    ROLE_PROFILE[role] ||
    '/profile';


  const isActive = (path) => {

    if (path === '/') {
      return location.pathname === '/';
    }

    return location.pathname.startsWith(
      path
    );
  };


  return (
    <>
      <header
        className={cn(
          'navbar',
          scrolled &&
            'navbar--scrolled'
        )}
      >

        <div className="navbar__inner">

          <Logo />


          {/* =================================================
              DESKTOP NAVIGATION
          ================================================= */}

          <nav
            className="navbar__links"
            aria-label="Application navigation"
          >

            {isAuthenticated ? (

              navigationItems.map((item) => (

                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'navbar__link',
                    isActive(item.to) &&
                      'navbar__link--active'
                  )}
                >
                  {item.label}
                </Link>

              ))

            ) : (

              <>
                <Link
                  to="/"
                  className={cn(
                    'navbar__link',
                    location.pathname === '/' &&
                      'navbar__link--active'
                  )}
                >
                  Home
                </Link>

                <Link
                  to="/about"
                  className="navbar__link"
                >
                  How It Works
                </Link>
              </>

            )}

          </nav>


          {/* =================================================
              RIGHT SIDE
          ================================================= */}

          <div className="navbar__actions">

            {isAuthenticated && (

              <LocationHeader
                compact
                className="navbar__location"
              />

            )}


            {isAuthenticated && (

              <div
                className="navbar__datetime"
                title={`${formatDay(now)}, ${formatDateShort(now)}`}
              >

                <div className="navbar__datetime-item">

                  <CalendarDays size={14} />

                  <span>
                    {formatDay(now)}, {formatDateShort(now)}
                  </span>

                </div>

                <div className="navbar__datetime-item">

                  <Clock3 size={14} />

                  <span>
                    {formatTime(now)}
                  </span>

                </div>

              </div>

            )}


            <button
              type="button"
              onClick={() => setAiModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #86efac',
                color: '#15803d',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                marginRight: '8px'
              }}
            >
              <Sparkles size={14} /> MealBridge Assistant
            </button>

            {isAuthenticated ? (

              <>

                <Link
                  to={notificationPath}
                  className="navbar__bell"
                  aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
                  style={{ position: 'relative' }}
                >

                  <Bell size={20} />

                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        background: '#ef4444',
                        color: '#ffffff',
                        fontSize: '10px',
                        fontWeight: '700',
                        minWidth: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 3px',
                        lineHeight: 1,
                      }}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}

                </Link>


                <Link
                  to={profilePath}
                  className="navbar__avatar"
                  aria-label="Profile"
                >
                  {user?.name
                    ?.charAt(0)
                    .toUpperCase()}
                </Link>


                <button
                  type="button"
                  className="navbar__logout"
                  onClick={handleLogout}
                  aria-label="Logout"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>

              </>

            ) : (

              <>

                <Link
                  to="/login"
                  className="navbar__link"
                >
                  Login
                </Link>

                <Button
                  size="sm"
                  onClick={() =>
                    navigate('/select-role')
                  }
                >
                  Get Started
                </Button>

              </>

            )}


            <button
              type="button"
              className="navbar__menu-btn"
              onClick={() =>
                setMobileOpen(
                  (previous) =>
                    !previous
                )
              }
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >

              {mobileOpen ? (
                <X size={24} />
              ) : (
                <Menu size={24} />
              )}

            </button>

          </div>

        </div>


        {/* ===================================================
            MOBILE MENU
        =================================================== */}

        {mobileOpen && (

          <div className="navbar__mobile animate-fade-in-down">

            {isAuthenticated && (

              <div className="navbar__mobile-location">

                <LocationHeader />

              </div>

            )}


            {isAuthenticated && (

              <div className="navbar__mobile-datetime">

                <CalendarDays size={14} />

                <span>
                  {formatDay(now)}, {formatDateShort(now)}
                </span>

                <Clock3 size={14} />

                <span>
                  {formatTime(now)}
                </span>

              </div>

            )}


            <nav className="navbar__mobile-links">

              {isAuthenticated ? (

                <>

                  {navigationItems.map(
                    (item) => (

                      <Link
                        key={item.to}
                        to={item.to}
                        className={cn(
                          'navbar__mobile-link',
                          isActive(item.to) &&
                            'navbar__mobile-link--active'
                        )}
                      >
                        {item.label}
                      </Link>

                    )
                  )}


                  <Link
                    to={notificationPath}
                    className="navbar__mobile-link"
                  >
                    Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}
                  </Link>


                  <Link
                    to={profilePath}
                    className="navbar__mobile-link"
                  >
                    Profile
                  </Link>


                  <button
                    type="button"
                    className="navbar__mobile-link navbar__mobile-link--danger"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>

                </>

              ) : (

                <>

                  <Link
                    to="/"
                    className="navbar__mobile-link"
                  >
                    Home
                  </Link>

                  <Link
                    to="/about"
                    className="navbar__mobile-link"
                  >
                    How It Works
                  </Link>

                  <Link
                    to="/login"
                    className="navbar__mobile-link"
                  >
                    Login
                  </Link>

                  <Link
                    to="/select-role"
                    className="navbar__mobile-link navbar__mobile-link--cta"
                  >
                    Get Started
                  </Link>

                </>

              )}

            </nav>

          </div>

        )}

      </header>

      <BottomNav />
      <AiAssistantModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />
    </>
  );
}