import { useState } from 'react';
import {
  Link,
  useNavigate,
  useLocation,
} from 'react-router-dom';

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  UserRound,
  Building2,
  Bike,
  ShieldCheck,
} from 'lucide-react';

import Button from '../components/Button';
import { useAuth, getDashboardPath } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';


const ROLE_INFO = {
  DONOR: {
    label: 'Donor',
    icon: UserRound,
    description: 'Share surplus food with people in need.',
    image: '/images/login-donor.jpg',
    heading: 'Turn surplus food into nourishing meals',
    subheading: 'Every meal shared bridges the gap between surplus and hunger.',
    stats: '12,450+ meals rescued so far',
  },
  NGO: {
    label: 'NGO',
    icon: Building2,
    description: 'Receive and manage food donations.',
    image: '/images/login-ngo.jpg',
    heading: 'Connecting surplus food with communities in need',
    subheading: 'Real-time food alerts, automated matching, and streamlined delivery for your community.',
    stats: '47+ active NGOs partnering with us',
  },
  VOLUNTEER: {
    label: 'Volunteer',
    icon: Bike,
    description: 'Pick up and deliver food.',
    image: '/images/login-volunteer.jpg',
    heading: 'Every delivery brings hope and vital nutrition',
    subheading: 'Join our rapid response food redistribution network on wheels.',
    stats: '890+ successful rescue rides',
  },
  ADMIN: {
    label: 'Admin',
    icon: ShieldCheck,
    description: 'Manage the MealBridge platform.',
    image: '/images/login-admin.jpg',
    heading: 'Intelligent food rescue logistics & platform control',
    subheading: 'Real-time dispatch coordination, analytics, and ecosystem oversight.',
    stats: '100% audited and secure redistribution',
  },
};


export default function Login() {

  const navigate = useNavigate();

  const location = useLocation();

  const toast = useToast();


  const {
    login,
    logout,
  } = useAuth();


  const selectedRole =
    location.state?.role ||
    sessionStorage.getItem(
      'mealbridge_selected_role'
    ) ||
    'DONOR';


  const from =
    location.state?.from?.pathname ||
    null;


  const roleInfo =
    selectedRole
      ? ROLE_INFO[selectedRole]
      : null;


  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [remember, setRemember] =
    useState(true);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState('');


  // =======================================================
  // LOGIN
  // =======================================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    setError('');


    if (!selectedRole) {

      setError(
        'Please select your role before logging in.'
      );

      return;
    }


    if (!email.trim() || !password) {

      setError(
        'Please enter your email and password.'
      );

      return;
    }


    setLoading(true);


    try {

      const user =
        await login(
          email,
          password,
          remember
        );


      // Make sure backend role matches
      // the role selected by the user
      if (user.role !== selectedRole) {

        logout();

        throw new Error(
          `This account is registered as ${user.role}, not ${selectedRole}. Please select the correct role.`
        );
      }


      // Clear selected role after successful login
      sessionStorage.removeItem(
        'mealbridge_selected_role'
      );


      toast.success(
        `Welcome back, ${user.name.split(' ')[0]}!`
      );


      const destination =
        from ||
        getDashboardPath(user.role);


      navigate(
        destination,
        { replace: true }
      );


    } catch (err) {

      setError(
        err.message ||
        'Login failed. Please check your credentials.'
      );

    } finally {

      setLoading(false);
    }
  };


  // =======================================================
  // NO ROLE SELECTED
  // =======================================================

  if (!selectedRole || !roleInfo) {

    return (

      <div className="auth-page">

        <div className="auth-form-side">

          <div className="auth-card">

            <button
              type="button"
              onClick={() =>
                navigate('/select-role')
              }
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '24px',
                color: 'var(--color-text-secondary)',
              }}
            >
              <ArrowLeft size={17} />
              Select Role
            </button>


            <h1 className="auth-card__title">
              Select your role first
            </h1>


            <p className="auth-card__subtitle">
              Choose how you want to use MealBridge.
            </p>


            <Button
              type="button"
              fullWidth
              size="lg"
              onClick={() =>
                navigate('/select-role')
              }
            >
              Choose Role
            </Button>

          </div>

        </div>

      </div>
    );
  }


  const RoleIcon =
    roleInfo.icon;


  return (

    <div className="auth-page">

      {/* =================================================
          ROLE-SPECIFIC VISUAL SIDE
      ================================================= */}
      <div className="auth-visual">
        <img
          src={roleInfo.image}
          alt={roleInfo.label}
          className="auth-visual__image"
        />
        <div className="auth-visual__overlay">
          <div className="auth-visual__badge">
            <RoleIcon size={15} />
            {roleInfo.label} Portal
          </div>
          <h2 className="auth-visual__quote">
            {roleInfo.heading}
          </h2>
          <p className="auth-visual__author">
            {roleInfo.subheading}
          </p>
        </div>
      </div>

      {/* =================================================
          LOGIN FORM
      ================================================= */}

      <div className="auth-form-side">

        <div className="auth-card">

          <button
            type="button"
            onClick={() =>
              navigate('/select-role')
            }
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '22px',
              color: 'var(--color-text-secondary)',
            }}
          >
            <ArrowLeft size={17} />
            Change role
          </button>


          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '14px',
              padding: '7px 12px',
              borderRadius: '999px',
              background:
                'var(--color-primary-50)',
              color:
                'var(--color-primary-700)',
              fontSize: 'var(--text-sm)',
              fontWeight: 700,
            }}
          >
            <RoleIcon size={16} />
            {roleInfo.label}
          </div>


          <h1 className="auth-card__title">
            Welcome Back
          </h1>


          <p className="auth-card__subtitle">
            Sign in to continue to MealBridge
          </p>


          {error && (

            <div
              className="form-error"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3)',
                background:
                  'var(--color-error-50)',
                borderRadius:
                  'var(--radius-lg)',
                marginBottom:
                  'var(--space-5)',
              }}
            >

              <AlertCircle size={16} />

              <span>{error}</span>

            </div>
          )}


          <form onSubmit={handleSubmit}>

            {/* EMAIL */}

            <div className="form-group">

              <label
                className="form-label form-label--required"
                htmlFor="email"
              >
                Email
              </label>


              <div
                style={{
                  position: 'relative',
                }}
              >

                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: 'var(--space-4)',
                    top: '50%',
                    transform:
                      'translateY(-50%)',
                    color:
                      'var(--color-text-tertiary)',
                  }}
                />


                <input
                  id="email"
                  type="email"
                  className="form-input"
                  style={{
                    paddingLeft:
                      'var(--space-9)',
                  }}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  autoComplete="email"
                />

              </div>

            </div>


            {/* PASSWORD */}

            <div className="form-group">

              <label
                className="form-label form-label--required"
                htmlFor="password"
              >
                Password
              </label>


              <div className="password-field">

                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: 'var(--space-4)',
                    top: '50%',
                    transform:
                      'translateY(-50%)',
                    color:
                      'var(--color-text-tertiary)',
                  }}
                />


                <input
                  id="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  className="form-input"
                  style={{
                    paddingLeft:
                      'var(--space-9)',
                    paddingRight:
                      'var(--space-9)',
                  }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  autoComplete="current-password"
                />


                <button
                  type="button"
                  className="password-field__toggle"
                  onClick={() =>
                    setShowPassword(
                      (previous) =>
                        !previous
                    )
                  }
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                >

                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}

                </button>

              </div>

            </div>


            {/* OPTIONS */}

            <div className="form-row">

              <label className="form-check">

                <input
                  type="checkbox"
                  className="form-check__input"
                  checked={remember}
                  onChange={(event) =>
                    setRemember(
                      event.target.checked
                    )
                  }
                />

                <span className="form-check__label">
                  Remember me
                </span>

              </label>


              <Link
                to="/help"
                className="form-link"
              >
                Forgot password?
              </Link>

            </div>


            {/* LOGIN */}

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={loading}
            >
              {loading
                ? 'Signing in...'
                : `Sign In as ${roleInfo.label}`}
            </Button>

          </form>


          {/* REGISTER */}

          {selectedRole !== 'ADMIN' && (

            <p className="auth-card__footer">

              Don't have an account?{' '}

              <Link
                to="/register"
                state={{
                  role: selectedRole,
                }}
              >
                Create one
              </Link>

            </p>
          )}

        </div>

      </div>

    </div>
  );
}