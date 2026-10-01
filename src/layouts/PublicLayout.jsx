import { Outlet, useLocation } from 'react-router-dom';

import Navbar from '../components/Navbar';


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

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}