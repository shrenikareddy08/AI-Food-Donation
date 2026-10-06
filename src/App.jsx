import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { LocationProvider } from './context/LocationContext';

import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

import {
  ProtectedRoute,
  RoleBasedRoute,
} from './components/ProtectedRoute';

// =====================================================
// PUBLIC
// =====================================================
import Home from './pages/Home';
import RoleSelection from './pages/RoleSelection';
import Login from './pages/Login';
import Register from './pages/Register';
import FindFood from './pages/FindFood';
import ComingSoon from './pages/ComingSoon';
import Events from './pages/Events';
import CreateEvent from './pages/CreateEvent';
import SemanticSearchPage from './pages/SemanticSearchPage';

// =====================================================
// DONOR
// =====================================================
import DonorDashboard from './pages/DonorDashboard';
import DonateFood from './pages/DonateFood';
import MyDonations from './pages/MyDonations';
import NearbyNGOs from './pages/NearbyNGOs';
import DonorTracking from './pages/DonorTracking';
import DonorNotifications from './pages/DonorNotifications';
import DonorProfile from './pages/DonorProfile';

// =====================================================
// NGO
// =====================================================
import NgoDashboard from './pages/ngo/NgoDashboard';
import AvailableFood from './pages/ngo/AvailableFood';
import FoodDetails from './pages/ngo/FoodDetails';
import IncomingDonations from './pages/ngo/IncomingDonations';
import NgoDeliveryDetails from './pages/ngo/NgoDeliveryDetails';
import NgoTracking from './pages/ngo/NgoTracking';
import NgoNotifications from './pages/ngo/NgoNotifications';
import NgoProfile from './pages/ngo/NgoProfile';

// =====================================================
// VOLUNTEER
// =====================================================
import VolunteerDashboard from './pages/volunteer/VolunteerDashboard';
import Assignments from './pages/volunteer/Assignments';
import AssignmentDetails from './pages/volunteer/AssignmentDetails';
import Pickup from './pages/volunteer/Pickup';
import Delivery from './pages/volunteer/Delivery';
import LiveTracking from './pages/volunteer/LiveTracking';
import VolunteerNotifications from './pages/volunteer/VolunteerNotifications';
import VolunteerProfile from './pages/volunteer/VolunteerProfile';

// =====================================================
// ADMIN
// =====================================================
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDonations from './pages/admin/AdminDonations';
import AdminNgos from './pages/admin/AdminNgos';
import AdminVolunteers from './pages/admin/AdminVolunteers';
import AdminDeliveries from './pages/admin/AdminDeliveries';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminProfile from './pages/admin/AdminProfile';

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>

              {/* =====================================================
                  PUBLIC + USER ROUTES
              ===================================================== */}

              <Route element={<PublicLayout />}>

                {/* =================================================
                    PUBLIC
                ================================================= */}

                <Route
                  path="/"
                  element={<Home />}
                />

                <Route
                  path="/select-role"
                  element={<RoleSelection />}
                />

                <Route
                  path="/login"
                  element={<Login />}
                />

                <Route
                  path="/register"
                  element={<Register />}
                />

                <Route
                  path="/find-food"
                  element={<FindFood />}
                />

                <Route
                  path="/search"
                  element={<SemanticSearchPage />}
                />

                <Route
                  path="/events"
                  element={
                    <ProtectedRoute>
                      <Events />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/events/create"
                  element={
                    <ProtectedRoute>
                      <CreateEvent />
                    </ProtectedRoute>
                  }
                />

                {/* =================================================
                    DONOR
                ================================================= */}

                <Route
                  path="/donor/dashboard"
                  element={
                    <RoleBasedRoute roles={['DONOR']}>
                      <DonorDashboard />
                    </RoleBasedRoute>
                  }
                />

                <Route
                  path="/donate"
                  element={
                    <RoleBasedRoute roles={['DONOR']}>
                      <DonateFood />
                    </RoleBasedRoute>
                  }
                />

                <Route
                  path="/donor/donations"
                  element={
                    <RoleBasedRoute roles={['DONOR']}>
                      <MyDonations />
                    </RoleBasedRoute>
                  }
                />

                <Route
                  path="/nearby-ngos"
                  element={
                    <RoleBasedRoute roles={['DONOR']}>
                      <NearbyNGOs />
                    </RoleBasedRoute>
                  }
                />

                <Route
                  path="/donor/tracking/:id"
                  element={
                    <RoleBasedRoute roles={['DONOR']}>
                      <DonorTracking />
                    </RoleBasedRoute>
                  }
                />

                <Route
                  path="/notifications"
                  element={
                    <RoleBasedRoute roles={['DONOR']}>
                      <DonorNotifications />
                    </RoleBasedRoute>
                  }
                />

                <Route
                  path="/profile"
                  element={
                    <RoleBasedRoute roles={['DONOR']}>
                      <DonorProfile />
                    </RoleBasedRoute>
                  }
                />

                {/* =================================================
                    NGO
                ================================================= */}

                <Route
                  path="/ngo/dashboard"
                  element={
                    <RoleBasedRoute roles={['NGO']}>
                      <NgoDashboard />
                    </RoleBasedRoute>
                  }
                />

                <Route
                  path="/ngo/available-food"
                  element={
                    <RoleBasedRoute roles={['NGO']}>
                      <AvailableFood />
                    </RoleBasedRoute>
                  }
                />

                <Route
                  path="/ngo/food/:id"
                  element={
                    <RoleBasedRoute roles={['NGO']}>
                      <FoodDetails />
                    </RoleBasedRoute>
                  }
                />

                <Route
                  path="/ngo/incoming-donations"
                  element={
                    <RoleBasedRoute roles={['NGO']}>
                      <IncomingDonations />
                    </RoleBasedRoute>
                  }
                />

                <Route
                  path="/ngo/delivery/:id"
                  element={
                    <RoleBasedRoute roles={['NGO']}>
                      <NgoDeliveryDetails />
                    </RoleBasedRoute>
                  }
                />

                <Route
                  path="/ngo/tracking/:id"
                  element={
                    <RoleBasedRoute roles={['NGO']}>
                      <NgoTracking />
                    </RoleBasedRoute>
                  }
                />

                <Route
                  path="/ngo/notifications"
                  element={
                    <RoleBasedRoute roles={['NGO']}>
                      <NgoNotifications />
                    </RoleBasedRoute>
                  }
                />

                <Route
                  path="/ngo/profile"
                  element={
                    <RoleBasedRoute roles={['NGO']}>
                      <NgoProfile />
                    </RoleBasedRoute>
                  }
                />

                {/* =================================================
                    VOLUNTEER
                ================================================= */}

                <Route
                  path="/volunteer/dashboard"
                  element={
                    <RoleBasedRoute roles={['VOLUNTEER']}>
                      <VolunteerDashboard />
                    </RoleBasedRoute>
                  }
                />

                <Route
                  path="/volunteer/assignments"
                  element={
                    <RoleBasedRoute roles={['VOLUNTEER']}>
                      <Assignments />
                    </RoleBasedRoute>
                  }
                />

                <Route
                  path="/volunteer/assignments/:id"
                  element={
                    <RoleBasedRoute roles={['VOLUNTEER']}>
                      <AssignmentDetails />
                    </RoleBasedRoute>
                  }
                />

                <Route
                  path="/volunteer/pickup/:id"
                  element={
                    <RoleBasedRoute roles={['VOLUNTEER']}>
                      <Pickup />
                    </RoleBasedRoute>
                  }
                />

                <Route
                  path="/volunteer/delivery/:id"
                  element={
                    <RoleBasedRoute roles={['VOLUNTEER']}>
                      <Delivery />
                    </RoleBasedRoute>
                  }
                />

                <Route
                  path="/volunteer/tracking/:id"
                  element={
                    <RoleBasedRoute roles={['VOLUNTEER', 'ADMIN']}>
                      <LiveTracking />
                    </RoleBasedRoute>
                  }
                />

                <Route
                  path="/volunteer/notifications"
                  element={
                    <RoleBasedRoute roles={['VOLUNTEER']}>
                      <VolunteerNotifications />
                    </RoleBasedRoute>
                  }
                />

                <Route
                  path="/volunteer/profile"
                  element={
                    <RoleBasedRoute roles={['VOLUNTEER']}>
                      <VolunteerProfile />
                    </RoleBasedRoute>
                  }
                />

                {/* =================================================
                    PUBLIC MISCELLANEOUS
                ================================================= */}

                <Route
                  path="/about"
                  element={
                    <ComingSoon title="How It Works" />
                  }
                />

                <Route
                  path="/help"
                  element={
                    <ComingSoon title="Help & Contact" />
                  }
                />

                <Route
                  path="/contact"
                  element={
                    <ComingSoon title="Contact Us" />
                  }
                />

                {/* =================================================
                    PAGE NOT FOUND
                ================================================= */}

                <Route
                  path="*"
                  element={
                    <ComingSoon title="Page Not Found" />
                  }
                />

              </Route>

              {/* =====================================================
                  ADMIN
              ===================================================== */}

              <Route
                path="/admin"
                element={
                  <RoleBasedRoute roles={['ADMIN']}>
                    <AdminLayout />
                  </RoleBasedRoute>
                }
              >

                {/* Admin Dashboard */}
                <Route
                  path="dashboard"
                  element={<AdminDashboard />}
                />

                {/* Admin Users */}
                <Route
                  path="users"
                  element={<AdminUsers />}
                />

                {/* Admin Donations */}
                <Route
                  path="donations"
                  element={<AdminDonations />}
                />

                {/* Admin NGOs */}
                <Route
                  path="ngos"
                  element={<AdminNgos />}
                />

                {/* Admin Volunteers */}
                <Route
                  path="volunteers"
                  element={<AdminVolunteers />}
                />

                {/* Admin Deliveries */}
                <Route
                  path="deliveries"
                  element={<AdminDeliveries />}
                />

                {/* Admin Audit Logs */}
                <Route
                  path="audit-logs"
                  element={<AdminAuditLogs />}
                />

                {/* Admin Notifications */}
                <Route
                  path="notifications"
                  element={<AdminNotifications />}
                />

                {/* Admin Profile */}
                <Route
                  path="profile"
                  element={<AdminProfile />}
                />

              </Route>

            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </LocationProvider>
    </AuthProvider>
  );
}