import { Outlet, useLocation } from 'react-router-dom';

import Navbar from '../components/Navbar';
import { cn } from '../utils/cn';


const MINIMAL_ROUTES = [
  '/',
  '/select-role',
  '/login',
  '/register',
];


export default function PublicLayout() {
  const location = useLocation();

  const showNavbar = !MINIMAL_ROUTES.includes(
    location.pathname
  );

  return (
    <div className="app-shell">
      {showNavbar && <Navbar />}

      <main className={cn('app-main', !showNavbar && 'app-main--minimal')}>
        <Outlet />
      </main>
    </div>
  );
}