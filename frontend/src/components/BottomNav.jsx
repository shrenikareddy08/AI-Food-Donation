import { Link, useLocation } from 'react-router-dom';

import {
  LayoutDashboard,
  MapPin,
  Bell,
  User,
  PlusCircle,
  ClipboardList,
  Bike,
} from 'lucide-react';

import { cn } from '../utils/cn';
import { useAuth } from '../context/AuthContext';


const NAV_SETS = {

  DONOR: [
    {
      to: '/donor/dashboard',
      label: 'Home',
      icon: LayoutDashboard,
    },
    {
      to: '/donate',
      label: 'Donate',
      icon: PlusCircle,
    },
    {
      to: '/nearby-ngos',
      label: 'NGOs',
      icon: MapPin,
    },
    {
      to: '/notifications',
      label: 'Alerts',
      icon: Bell,
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: User,
    },
  ],

  NGO: [
    {
      to: '/ngo/dashboard',
      label: 'Home',
      icon: LayoutDashboard,
    },
    {
      to: '/ngo/available-food',
      label: 'Food',
      icon: ClipboardList,
    },
    {
      to: '/ngo/incoming-donations',
      label: 'Deliveries',
      icon: Bike,
    },
    {
      to: '/ngo/notifications',
      label: 'Alerts',
      icon: Bell,
    },
    {
      to: '/ngo/profile',
      label: 'Profile',
      icon: User,
    },
  ],

  VOLUNTEER: [
    {
      to: '/volunteer/dashboard',
      label: 'Home',
      icon: LayoutDashboard,
    },
    {
      to: '/volunteer/assignments',
      label: 'Tasks',
      icon: ClipboardList,
    },
    {
      to: '/volunteer/notifications',
      label: 'Alerts',
      icon: Bell,
    },
    {
      to: '/volunteer/profile',
      label: 'Profile',
      icon: User,
    },
  ],

  ADMIN: [],
};


export default function BottomNav() {

  const location =
    useLocation();

  const {
    user,
  } = useAuth();


  const items =
    NAV_SETS[user?.role] || [];


  if (
    !user ||
    items.length === 0
  ) {
    return null;
  }


  const isActive = (path) => {

    if (path === '/') {
      return location.pathname === '/';
    }

    return location.pathname.startsWith(
      path
    );
  };


  return (

    <nav
      className="bottom-nav"
      aria-label="Mobile navigation"
    >

      {items.map((item) => {

        const Icon =
          item.icon;

        const active =
          isActive(item.to);


        return (

          <Link
            key={item.to}
            to={item.to}
            className={cn(
              'bottom-nav__item',
              active &&
                'bottom-nav__item--active'
            )}
            aria-label={item.label}
            aria-current={
              active
                ? 'page'
                : undefined
            }
          >

            <Icon size={21} />

            <span className="bottom-nav__label">
              {item.label}
            </span>

          </Link>

        );

      })}

    </nav>
  );
}