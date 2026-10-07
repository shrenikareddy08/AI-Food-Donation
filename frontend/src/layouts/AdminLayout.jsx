import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Building2,
  Bike,
  Truck,
  ScrollText,
  Bell,
  User,
  LogOut,
  Menu,
  Clock,
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { useAuth } from '../context/AuthContext';
import { useNow } from '../hooks/useNow';
import {
  formatTime,
  formatDate,
  formatDay,
} from '../utils/formatDate';
import { cn } from '../utils/cn';
import Logo from '../components/Logo';

const NAV_ITEMS = [
  {
    to: '/admin/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/admin/users',
    label: 'Users',
    icon: Users,
  },
  {
    to: '/admin/donations',
    label: 'Donations',
    icon: Package,
  },
  {
    to: '/admin/ngos',
    label: 'NGOs',
    icon: Building2,
  },
  {
    to: '/admin/volunteers',
    label: 'Volunteers',
    icon: Bike,
  },
  {
    to: '/admin/deliveries',
    label: 'Deliveries',
    icon: Truck,
  },
  {
    to: '/admin/audit-logs',
    label: 'Audit Logs',
    icon: ScrollText,
  },
];

const SECONDARY_ITEMS = [
  {
    to: '/admin/notifications',
    label: 'Notifications',
    icon: Bell,
  },
  {
    to: '/admin/profile',
    label: 'Profile',
    icon: User,
  },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuth();
  const now = useNow();

  const [mobileSidebarOpen, setMobileSidebarOpen] =
    useState(false);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="admin-sidebar__logo">
        <Logo />
      </div>

      {/* Main Navigation */}
      <nav
        className="admin-sidebar__nav"
        aria-label="Admin navigation"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'admin-sidebar__link',
                isActive(item.to) &&
                  'admin-sidebar__link--active'
              )}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="admin-sidebar__divider" />

      {/* Secondary Navigation */}
      <nav
        className="admin-sidebar__nav"
        aria-label="Secondary"
      >
        {SECONDARY_ITEMS.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'admin-sidebar__link',
                isActive(item.to) &&
                  'admin-sidebar__link--active'
              )}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {/* Logout */}
        <button
          type="button"
          className="admin-sidebar__link admin-sidebar__link--danger"
          onClick={handleLogout}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </nav>
    </>
  );

  return (
    <div className="admin-shell">

      {/* Desktop Sidebar */}
      <aside className="admin-sidebar">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      {mobileSidebarOpen && (
        <div
          className="admin-sidebar__mobile-overlay"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <aside
            className="admin-sidebar admin-sidebar--mobile"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Area */}
      <div className="admin-main">

        {/* Header */}
        <header className="admin-header">

          <div className="admin-header__left">

            {/* Mobile Menu */}
            <button
              type="button"
              className="admin-header__menu-btn"
              onClick={() =>
                setMobileSidebarOpen(true)
              }
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            <div>
              <h1 className="admin-header__title">
                MealBridge Admin
              </h1>

              <div className="admin-header__datetime">
                <Clock size={13} />

                <span>
                  {formatDay(now)}, {formatDate(now)}
                </span>

                <span className="admin-header__time">
                  {formatTime(now)}
                </span>
              </div>
            </div>

          </div>

          {/* Header Right */}
          <div className="admin-header__right">

            {/* Notifications */}
            <Link
              to="/admin/notifications"
              className="admin-header__bell"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="admin-header__bell-dot" />
            </Link>

            {/* Admin Profile */}
            <Link
              to="/admin/profile"
              className="admin-header__avatar"
              aria-label="Admin Profile"
            >
              {user?.name
                ?.charAt(0)
                .toUpperCase()}
            </Link>

          </div>
        </header>

        {/* Page Content */}
        <div className="admin-content">
          <Outlet />
        </div>

      </div>
    </div>
  );
}