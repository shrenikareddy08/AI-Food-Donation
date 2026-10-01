import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
} from 'react-router-dom';

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  User,
  Building2,
  CheckCircle2,
  AlertCircle,
  HandHeart,
  Truck,
  ArrowLeft,
  ArrowRight,
  Crosshair,
  ShieldCheck,
  RefreshCw,
  KeyRound,
} from 'lucide-react';

import Button from '../components/Button';

import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLocationContext } from '../context/LocationContext';

import { REGISTER_IMAGE } from '../utils/mockData';


// =========================================================
// ROLES
// =========================================================

const ROLES = [
  {
    id: 'DONOR',
    label: 'Donor',
    desc: 'Share surplus food',
    icon: HandHeart,
  },
  {
    id: 'NGO',
    label: 'NGO',
    desc: 'Receive donations',
    icon: Building2,
  },
  {
    id: 'VOLUNTEER',
    label: 'Volunteer',
    desc: 'Deliver food',
    icon: Truck,
  },
];


// =========================================================
// STEPS
// =========================================================

const STEP_LABELS = [
  'Account',
  'Details',
  'Location',
  'Review',
];


// =========================================================
// COMPONENT
// =========================================================

export default function Register() {
  const navigate = useNavigate();

  const {
    register,
    requestRegistrationOtp,
    verifyRegistrationOtp,
    logout,
  } = useAuth();

  const toast = useToast();

  const {
    detectLocation,
    location,
  } = useLocationContext();


  // =======================================================
  // ROLE
  // =======================================================

  const [role, setRole] =
    useState('DONOR');


  // =======================================================
  // STEP
  // =======================================================

  const [step, setStep] =
    useState(0);


  // =======================================================
  // FORM
  // =======================================================

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',

    password: '',
    confirmPassword: '',

    location:
      location?.label ||
      'Hyderabad, Telangana',

    latitude:
      location?.latitude ??
      17.3850,

    longitude:
      location?.longitude ??
      78.4867,

    // Donor
    orgName: '',
    address: '',

    // NGO
    capacity: '',
    capacityUnit: 'meals/day',
    foodRequirements: '',

    // Volunteer
    availability: 'available',
    vehicleType: 'Bike',
    vehicleNumber: '',
  });


  // =======================================================
  // PASSWORD
  // =======================================================

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);


  // =======================================================
  // OTP STATE
  // =======================================================

  const [
    otp,
    setOtp,
  ] = useState('');

  const [
    otpSent,
    setOtpSent,
  ] = useState(false);

  const [
    otpVerified,
    setOtpVerified,
  ] = useState(false);

  const [
    otpSending,
    setOtpSending,
  ] = useState(false);

  const [
    otpVerifying,
    setOtpVerifying,
  ] = useState(false);

  const [
    developmentOtp,
    setDevelopmentOtp,
  ] = useState('');

  const [
    resendSeconds,
    setResendSeconds,
  ] = useState(0);


  // =======================================================
  // GENERAL STATE
  // =======================================================

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');


  // =======================================================
  // UPDATE FORM
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
  // OTP TIMER
  // =======================================================

  useEffect(() => {
    if (resendSeconds <= 0) {
      return undefined;
    }

    const timer =
      setInterval(() => {
        setResendSeconds(
          (value) =>
            value > 0
              ? value - 1
              : 0
        );
      }, 1000);

    return () =>
      clearInterval(timer);
  }, [resendSeconds]);


  // =======================================================
  // ROLE
  // =======================================================

  function handleRoleChange(
    newRole
  ) {
    setRole(newRole);

    setStep(0);

    setError('');

    setOtp('');

    setOtpSent(false);

    setOtpVerified(false);

    setDevelopmentOtp('');

    setResendSeconds(0);

    sessionStorage.setItem(
      'mealbridge_selected_role',
      newRole
    );
  }


  // =======================================================
  // LOCATION
  // =======================================================

  async function handleUseLocation() {
    try {
      const loc =
        await detectLocation();

      update(
        'latitude',
        loc.latitude
      );

      update(
        'longitude',
        loc.longitude
      );

      update(
        'location',
        loc.label
      );

      toast.success(
        'Location detected successfully.'
      );

    } catch (err) {
      toast.error(
        err?.message ||
        'Unable to detect location. Please enter it manually.'
      );
    }
  }


  // =======================================================
  // VALIDATE ACCOUNT
  // =======================================================

  function validateAccount() {
    if (!form.name.trim()) {
      return 'Please enter your full name.';
    }

    if (!form.email.trim()) {
      return 'Please enter your email address.';
    }

    if (
      !/^\S+@\S+\.\S+$/.test(
        form.email.trim()
      )
    ) {
      return 'Please enter a valid email address.';
    }

    if (!form.phone.trim()) {
      return 'Please enter your phone number.';
    }

    const phoneDigits =
      form.phone.replace(
        /\D/g,
        ''
      );

    if (phoneDigits.length < 10) {
      return 'Please enter a valid phone number.';
    }

    if (!form.password) {
      return 'Please enter a password.';
    }

    if (form.password.length < 8) {
      return 'Password must contain at least 8 characters.';
    }

    if (
      form.password !==
      form.confirmPassword
    ) {
      return 'Passwords do not match.';
    }

    return null;
  }


  // =======================================================
  // VALIDATE DETAILS
  // =======================================================

  function validateDetails() {
    if (role === 'DONOR') {
      if (!form.address.trim()) {
        return 'Please enter your default pickup address.';
      }

      return null;
    }


    if (role === 'NGO') {
      if (!form.orgName.trim()) {
        return 'Please enter the organization name.';
      }

      if (!form.address.trim()) {
        return 'Please enter the organization address.';
      }

      if (
        !form.capacity ||
        Number(form.capacity) <= 0
      ) {
        return 'Please enter a valid NGO capacity.';
      }

      return null;
    }


    if (role === 'VOLUNTEER') {
      if (!form.vehicleType) {
        return 'Please select a vehicle type.';
      }

      if (!form.vehicleNumber.trim()) {
        return 'Please enter your vehicle number.';
      }

      return null;
    }

    return null;
  }


  // =======================================================
  // VALIDATE LOCATION
  // =======================================================

  function validateLocation() {
    if (!form.location.trim()) {
      return 'Please enter your location.';
    }

    return null;
  }


  // =======================================================
  // VALIDATE CURRENT STEP
  // =======================================================

  function validateCurrentStep() {
    if (step === 0) {
      return validateAccount();
    }

    if (step === 1) {
      return validateDetails();
    }

    if (step === 2) {
      return validateLocation();
    }

    return null;
  }


  // =======================================================
  // SEND OTP
  // =======================================================

  async function sendOtp() {
    setOtpSending(true);

    setError('');

    try {
      const response =
        await requestRegistrationOtp(
          form.email.trim()
        );

      setOtpSent(true);

      setOtpVerified(false);

      setOtp('');

      setResendSeconds(30);


      // Development OTP returned by backend
      if (
        response?.development_otp
      ) {
        setDevelopmentOtp(
          String(
            response.development_otp
          )
        );
      } else {
        setDevelopmentOtp('');
      }


      toast.success(
        `OTP sent to ${form.email.trim()}.`
      );

    } catch (err) {
      setError(
        err?.message ||
        'Unable to send OTP.'
      );
    } finally {
      setOtpSending(false);
    }
  }


  // =======================================================
  // VERIFY OTP
  // =======================================================

  async function handleVerifyOtp() {
    const cleanOtp =
      otp.replace(
        /\D/g,
        ''
      );

    if (cleanOtp.length !== 6) {
      setError(
        'Please enter the 6-digit OTP.'
      );

      return;
    }

    setOtpVerifying(true);

    setError('');

    try {
      await verifyRegistrationOtp(
        form.email.trim(),
        cleanOtp
      );

      setOtpVerified(true);

      toast.success(
        'OTP verified successfully.'
      );

      await createAccount();

    } catch (err) {
      setOtpVerified(false);

      setError(
        err?.message ||
        'Invalid or expired OTP.'
      );
    } finally {
      setOtpVerifying(false);
    }
  }


  // =======================================================
  // CREATE ACCOUNT AFTER OTP
  // =======================================================

  async function createAccount() {
    setLoading(true);

    setError('');

    try {
      const newUser =
        await register({
          name:
            form.name.trim(),

          email:
            form.email.trim(),

          password:
            form.password,

          phone:
            form.phone.trim(),

          role,

          location:
            form.location.trim(),
        });


      const firstName =
        newUser?.name
          ?.split(' ')[0] ||
        form.name
          .trim()
          .split(' ')[0] ||
        'there';


      /*
        Registration has now been completed
        in PostgreSQL.

        We immediately clear the frontend auth
        state because the registration endpoint
        does not return a JWT.
      */

      logout();


      toast.success(
        `Account created successfully, ${firstName}! Please log in.`
      );


      navigate(
        '/login',
        {
          replace: true,

          state: {
            email:
              form.email.trim(),

            role,

            registrationSuccess:
              true,
          },
        }
      );

    } catch (err) {
      setError(
        err?.message ||
        'Registration failed. Please try again.'
      );

      setOtpVerified(false);
    } finally {
      setLoading(false);
    }
  }


  // =======================================================
  // NEXT
  // =======================================================

  async function handleNext() {
    const validation =
      validateCurrentStep();

    if (validation) {
      setError(validation);
      return;
    }

    setError('');


    if (step < 3) {
      setStep(
        (current) =>
          current + 1
      );

      return;
    }


    /*
      Review page:
      First send OTP.
    */

    if (!otpSent) {
      await sendOtp();
    }
  }


  // =======================================================
  // BACK
  // =======================================================

  function handleBack() {
    setError('');

    if (step === 3 && otpSent) {
      setOtpSent(false);
      setOtpVerified(false);
      setOtp('');
      setDevelopmentOtp('');
      setResendSeconds(0);

      return;
    }

    if (step > 0) {
      setStep(
        (current) =>
          current - 1
      );
    }
  }


  // =======================================================
  // RESEND OTP
  // =======================================================

  async function handleResendOtp() {
    if (
      resendSeconds > 0 ||
      otpSending
    ) {
      return;
    }

    await sendOtp();
  }


  // =======================================================
  // ROLE LABEL
  // =======================================================

  const selectedRole =
    useMemo(
      () =>
        ROLES.find(
          (item) =>
            item.id === role
        ),
      [role]
    );


  // =======================================================
  // RENDER
  // =======================================================

  return (
    <div className="register-page">

      {/* ===================================================
          LEFT VISUAL
      =================================================== */}

      <div className="register-visual">

        <img
          src={REGISTER_IMAGE}
          alt="Volunteers preparing food packs"
          className="register-visual__image"
        />

        <div className="register-visual__overlay">

          <h2 className="register-visual__title">
            Join the MealBridge Movement
          </h2>

          <p
            style={{
              color:
                'rgba(255,255,255,0.8)',
              fontSize:
                'var(--text-base)',
            }}
          >
            Be part of India's food-sharing
            community. Together, we can help
            surplus food reach people who need it.
          </p>

          <div className="register-visual__benefits">

            <div className="register-visual__benefit">

              <span className="register-visual__benefit-icon">
                <CheckCircle2 size={16} />
              </span>

              Connect with verified NGOs

            </div>


            <div className="register-visual__benefit">

              <span className="register-visual__benefit-icon">
                <CheckCircle2 size={16} />
              </span>

              Track donations and deliveries

            </div>


            <div className="register-visual__benefit">

              <span className="register-visual__benefit-icon">
                <CheckCircle2 size={16} />
              </span>

              Make every food donation count

            </div>

          </div>

        </div>

      </div>


      {/* ===================================================
          FORM
      =================================================== */}

      <div className="register-form-side">

        <div className="register-card">

          <h1 className="auth-card__title">
            Create Account
          </h1>

          <p className="auth-card__subtitle">
            Share Food. Bridge Needs. Create Impact.
          </p>


          {/* =================================================
              ROLE SELECTOR
          ================================================= */}

          <div className="role-selector">

            {ROLES.map(
              (item) => {

                const Icon =
                  item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={
                      `role-option ${
                        role === item.id
                          ? 'role-option--active'
                          : ''
                      }`
                    }
                    onClick={() =>
                      handleRoleChange(
                        item.id
                      )
                    }
                  >

                    <span className="role-option__icon">
                      <Icon size={22} />
                    </span>

                    <span className="role-option__label">
                      {item.label}
                    </span>

                    <span className="role-option__desc">
                      {item.desc}
                    </span>

                  </button>
                );
              }
            )}

          </div>


          {/* =================================================
              STEP INDICATOR
          ================================================= */}

          <div className="step-indicator">

            {STEP_LABELS.map(
              (label, index) => (

                <div
                  key={label}
                  style={{
                    display:
                      'contents',
                  }}
                >

                  <div
                    className={[
                      'step-indicator__item',

                      index === step
                        ? 'step-indicator__item--active'
                        : '',

                      index < step
                        ? 'step-indicator__item--done'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >

                    <span className="step-indicator__dot">

                      {index < step ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        index + 1
                      )}

                    </span>

                    <span className="step-indicator__label">
                      {label}
                    </span>

                  </div>


                  {index <
                    STEP_LABELS.length - 1 && (

                    <div
                      className={
                        `step-indicator__line ${
                          index < step
                            ? 'step-indicator__line--done'
                            : ''
                        }`
                      }
                    />

                  )}

                </div>
              )
            )}

          </div>


          {/* =================================================
              ERROR
          ================================================= */}

          {error && (

            <div className="form-error">

              <AlertCircle size={16} />

              <span>
                {error}
              </span>

            </div>

          )}


          {/* =================================================
              STEP 0 — ACCOUNT
          ================================================= */}

          {step === 0 && (

            <div className="animate-fade-in">

              {/* Name */}

              <div className="form-group">

                <label className="form-label form-label--required">
                  Full Name
                </label>

                <div
                  style={{
                    position:
                      'relative',
                  }}
                >

                  <User
                    size={18}
                    style={{
                      position:
                        'absolute',
                      left:
                        'var(--space-4)',
                      top:
                        '50%',
                      transform:
                        'translateY(-50%)',
                      color:
                        'var(--color-text-tertiary)',
                    }}
                  />

                  <input
                    className="form-input"
                    style={{
                      paddingLeft:
                        'var(--space-9)',
                    }}
                    placeholder="Enter your full name"
                    value={
                      form.name
                    }
                    onChange={(event) =>
                      update(
                        'name',
                        event.target.value
                      )
                    }
                  />

                </div>

              </div>


              {/* Email */}

              <div className="form-grid">

                <div className="form-group">

                  <label className="form-label form-label--required">
                    Email
                  </label>

                  <div
                    style={{
                      position:
                        'relative',
                    }}
                  >

                    <Mail
                      size={18}
                      style={{
                        position:
                          'absolute',
                        left:
                          'var(--space-4)',
                        top:
                          '50%',
                        transform:
                          'translateY(-50%)',
                        color:
                          'var(--color-text-tertiary)',
                      }}
                    />

                    <input
                      className="form-input"
                      style={{
                        paddingLeft:
                          'var(--space-9)',
                      }}
                      type="email"
                      placeholder="you@example.com"
                      value={
                        form.email
                      }
                      onChange={(event) =>
                        update(
                          'email',
                          event.target.value
                        )
                      }
                    />

                  </div>

                </div>


                {/* Phone */}

                <div className="form-group">

                  <label className="form-label form-label--required">
                    Phone
                  </label>

                  <div
                    style={{
                      position:
                        'relative',
                    }}
                  >

                    <Phone
                      size={18}
                      style={{
                        position:
                          'absolute',
                        left:
                          'var(--space-4)',
                        top:
                          '50%',
                        transform:
                          'translateY(-50%)',
                        color:
                          'var(--color-text-tertiary)',
                      }}
                    />

                    <input
                      className="form-input"
                      style={{
                        paddingLeft:
                          'var(--space-9)',
                      }}
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={
                        form.phone
                      }
                      onChange={(event) =>
                        update(
                          'phone',
                          event.target.value
                        )
                      }
                    />

                  </div>

                </div>

              </div>


              {/* Password */}

              <div className="form-grid">

                <div className="form-group">

                  <label className="form-label form-label--required">
                    Password
                  </label>

                  <div className="password-field">

                    <Lock
                      size={18}
                      style={{
                        position:
                          'absolute',
                        left:
                          'var(--space-4)',
                        top:
                          '50%',
                        transform:
                          'translateY(-50%)',
                        color:
                          'var(--color-text-tertiary)',
                      }}
                    />

                    <input
                      className="form-input"
                      style={{
                        paddingLeft:
                          'var(--space-9)',
                        paddingRight:
                          'var(--space-9)',
                      }}
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      placeholder="Minimum 8 characters"
                      value={
                        form.password
                      }
                      onChange={(event) =>
                        update(
                          'password',
                          event.target.value
                        )
                      }
                    />

                    <button
                      type="button"
                      className="password-field__toggle"
                      onClick={() =>
                        setShowPassword(
                          (value) =>
                            !value
                        )
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


                {/* Confirm */}

                <div className="form-group">

                  <label className="form-label form-label--required">
                    Confirm Password
                  </label>

                  <div className="password-field">

                    <Lock
                      size={18}
                      style={{
                        position:
                          'absolute',
                        left:
                          'var(--space-4)',
                        top:
                          '50%',
                        transform:
                          'translateY(-50%)',
                        color:
                          'var(--color-text-tertiary)',
                      }}
                    />

                    <input
                      className="form-input"
                      style={{
                        paddingLeft:
                          'var(--space-9)',
                      }}
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      placeholder="Re-enter password"
                      value={
                        form.confirmPassword
                      }
                      onChange={(event) =>
                        update(
                          'confirmPassword',
                          event.target.value
                        )
                      }
                    />

                  </div>

                </div>

              </div>

            </div>
          )}


          {/* =================================================
              STEP 1 — DETAILS
          ================================================= */}

          {step === 1 && (

            <div className="animate-fade-in">

              {/* DONOR */}

              {role === 'DONOR' && (
                <>
                  <div className="form-group">

                    <label className="form-label">
                      Organization / Restaurant Name
                      (Optional)
                    </label>

                    <input
                      className="form-input"
                      placeholder="e.g. Taj Banjara"
                      value={
                        form.orgName
                      }
                      onChange={(event) =>
                        update(
                          'orgName',
                          event.target.value
                        )
                      }
                    />

                  </div>


                  <div className="form-group">

                    <label className="form-label form-label--required">
                      Default Pickup Address
                    </label>

                    <textarea
                      className="form-textarea"
                      placeholder="Where should volunteers pick up food?"
                      value={
                        form.address
                      }
                      onChange={(event) =>
                        update(
                          'address',
                          event.target.value
                        )
                      }
                    />

                  </div>
                </>
              )}


              {/* NGO */}

              {role === 'NGO' && (
                <>
                  <div className="form-group">

                    <label className="form-label form-label--required">
                      Organization Name
                    </label>

                    <input
                      className="form-input"
                      placeholder="e.g. Helping Hands NGO"
                      value={
                        form.orgName
                      }
                      onChange={(event) =>
                        update(
                          'orgName',
                          event.target.value
                        )
                      }
                    />

                  </div>


                  <div className="form-group">

                    <label className="form-label form-label--required">
                      Organization Address
                    </label>

                    <textarea
                      className="form-textarea"
                      placeholder="Full address of the NGO"
                      value={
                        form.address
                      }
                      onChange={(event) =>
                        update(
                          'address',
                          event.target.value
                        )
                      }
                    />

                  </div>


                  <div className="form-grid">

                    <div className="form-group">

                      <label className="form-label form-label--required">
                        Capacity
                      </label>

                      <input
                        className="form-input"
                        type="number"
                        min="1"
                        placeholder="e.g. 120"
                        value={
                          form.capacity
                        }
                        onChange={(event) =>
                          update(
                            'capacity',
                            event.target.value
                          )
                        }
                      />

                    </div>


                    <div className="form-group">

                      <label className="form-label">
                        Capacity Unit
                      </label>

                      <select
                        className="form-select"
                        value={
                          form.capacityUnit
                        }
                        onChange={(event) =>
                          update(
                            'capacityUnit',
                            event.target.value
                          )
                        }
                      >
                        <option value="meals/day">
                          Meals / Day
                        </option>

                        <option value="kg/day">
                          Kg / Day
                        </option>

                        <option value="people/day">
                          People / Day
                        </option>
                      </select>

                    </div>

                  </div>


                  <div className="form-group">

                    <label className="form-label">
                      Food Requirements
                    </label>

                    <textarea
                      className="form-textarea"
                      placeholder="Rice, vegetables, fruits, cooked food..."
                      value={
                        form.foodRequirements
                      }
                      onChange={(event) =>
                        update(
                          'foodRequirements',
                          event.target.value
                        )
                      }
                    />

                  </div>
                </>
              )}


              {/* VOLUNTEER */}

              {role === 'VOLUNTEER' && (
                <>
                  <div className="form-group">

                    <label className="form-label form-label--required">
                      Availability
                    </label>

                    <select
                      className="form-select"
                      value={
                        form.availability
                      }
                      onChange={(event) =>
                        update(
                          'availability',
                          event.target.value
                        )
                      }
                    >

                      <option value="available">
                        Available
                      </option>

                      <option value="unavailable">
                        Unavailable
                      </option>

                      <option value="weekends">
                        Weekends Only
                      </option>

                      <option value="evenings">
                        Evenings Only
                      </option>

                    </select>

                  </div>


                  <div className="form-grid">

                    <div className="form-group">

                      <label className="form-label form-label--required">
                        Vehicle Type
                      </label>

                      <select
                        className="form-select"
                        value={
                          form.vehicleType
                        }
                        onChange={(event) =>
                          update(
                            'vehicleType',
                            event.target.value
                          )
                        }
                      >

                        <option value="Bike">
                          Bike
                        </option>

                        <option value="Scooter">
                          Scooter
                        </option>

                        <option value="Cycle">
                          Cycle
                        </option>

                        <option value="Car">
                          Car
                        </option>

                        <option value="Auto">
                          Auto Rickshaw
                        </option>

                        <option value="Van">
                          Van
                        </option>

                      </select>

                    </div>


                    <div className="form-group">

                      <label className="form-label form-label--required">
                        Vehicle Number
                      </label>

                      <input
                        className="form-input"
                        placeholder="e.g. TS 09 AB 1234"
                        value={
                          form.vehicleNumber
                        }
                        onChange={(event) =>
                          update(
                            'vehicleNumber',
                            event.target.value
                          )
                        }
                      />

                    </div>

                  </div>
                </>
              )}

            </div>
          )}


          {/* =================================================
              STEP 2 — LOCATION
          ================================================= */}

          {step === 2 && (

            <div className="animate-fade-in">

              <div className="form-group">

                <label className="form-label form-label--required">
                  Your Location
                </label>

                <p className="form-hint">
                  Your location helps MealBridge
                  find nearby organizations and
                  support delivery planning.
                </p>


                <div className="location-picker">

                  <button
                    type="button"
                    className="location-picker__btn"
                    onClick={
                      handleUseLocation
                    }
                  >

                    <Crosshair size={20} />

                    Use My Current Location

                  </button>


                  <div
                    style={{
                      position:
                        'relative',
                      marginTop:
                        '12px',
                    }}
                  >

                    <MapPin
                      size={18}
                      style={{
                        position:
                          'absolute',
                        left:
                          'var(--space-4)',
                        top:
                          'var(--space-3)',
                        color:
                          'var(--color-text-tertiary)',
                      }}
                    />

                    <input
                      className="form-input"
                      style={{
                        paddingLeft:
                          'var(--space-9)',
                      }}
                      placeholder="Enter your area, city, state"
                      value={
                        form.location
                      }
                      onChange={(event) =>
                        update(
                          'location',
                          event.target.value
                        )
                      }
                    />

                  </div>


                  <div
                    className="form-hint"
                    style={{
                      display:
                        'flex',
                      gap:
                        '20px',
                      marginTop:
                        '10px',
                    }}
                  >

                    <span>
                      Latitude:{' '}
                      {Number.isFinite(
                        Number(
                          form.latitude
                        )
                      )
                        ? Number(
                            form.latitude
                          ).toFixed(4)
                        : 'N/A'}
                    </span>

                    <span>
                      Longitude:{' '}
                      {Number.isFinite(
                        Number(
                          form.longitude
                        )
                      )
                        ? Number(
                            form.longitude
                          ).toFixed(4)
                        : 'N/A'}
                    </span>

                  </div>

                </div>

              </div>

            </div>
          )}


          {/* =================================================
              STEP 3 — REVIEW
          ================================================= */}

          {step === 3 && !otpSent && (

            <div className="animate-fade-in">

              <h3 className="register-review-title">
                Review Your Details
              </h3>


              <div className="donate-summary">

                <div className="donate-summary__row">

                  <span className="donate-summary__label">
                    Role
                  </span>

                  <span className="donate-summary__value">
                    {selectedRole?.label ||
                      role}
                  </span>

                </div>


                <div className="donate-summary__row">

                  <span className="donate-summary__label">
                    Name
                  </span>

                  <span className="donate-summary__value">
                    {form.name || '—'}
                  </span>

                </div>


                <div className="donate-summary__row">

                  <span className="donate-summary__label">
                    Email
                  </span>

                  <span className="donate-summary__value">
                    {form.email || '—'}
                  </span>

                </div>


                <div className="donate-summary__row">

                  <span className="donate-summary__label">
                    Phone
                  </span>

                  <span className="donate-summary__value">
                    {form.phone || '—'}
                  </span>

                </div>


                <div className="donate-summary__row">

                  <span className="donate-summary__label">
                    Location
                  </span>

                  <span className="donate-summary__value">
                    {form.location || '—'}
                  </span>

                </div>


                {role === 'DONOR' && (
                  <>
                    <div className="donate-summary__row">

                      <span className="donate-summary__label">
                        Pickup Address
                      </span>

                      <span className="donate-summary__value">
                        {form.address || '—'}
                      </span>

                    </div>

                    {form.orgName && (
                      <div className="donate-summary__row">

                        <span className="donate-summary__label">
                          Organization
                        </span>

                        <span className="donate-summary__value">
                          {form.orgName}
                        </span>

                      </div>
                    )}
                  </>
                )}


                {role === 'NGO' && (
                  <>
                    <div className="donate-summary__row">

                      <span className="donate-summary__label">
                        Organization
                      </span>

                      <span className="donate-summary__value">
                        {form.orgName || '—'}
                      </span>

                    </div>

                    <div className="donate-summary__row">

                      <span className="donate-summary__label">
                        Capacity
                      </span>

                      <span className="donate-summary__value">
                        {form.capacity || '—'}{' '}
                        {form.capacityUnit}
                      </span>

                    </div>

                    <div className="donate-summary__row">

                      <span className="donate-summary__label">
                        Food Requirements
                      </span>

                      <span className="donate-summary__value">
                        {form.foodRequirements || '—'}
                      </span>

                    </div>

                    <div className="donate-summary__row">

                      <span className="donate-summary__label">
                        Address
                      </span>

                      <span className="donate-summary__value">
                        {form.address || '—'}
                      </span>

                    </div>
                  </>
                )}


                {role === 'VOLUNTEER' && (
                  <>
                    <div className="donate-summary__row">

                      <span className="donate-summary__label">
                        Availability
                      </span>

                      <span className="donate-summary__value">
                        {form.availability}
                      </span>

                    </div>

                    <div className="donate-summary__row">

                      <span className="donate-summary__label">
                        Vehicle
                      </span>

                      <span className="donate-summary__value">
                        {form.vehicleType} —{' '}
                        {form.vehicleNumber}
                      </span>

                    </div>
                  </>
                )}

              </div>


              <div
                className="register-otp-intro"
              >

                <ShieldCheck size={20} />

                <span>
                  Click <strong>Create Account</strong>{' '}
                  to receive a 6-digit OTP on your
                  email. Your account will be created
                  after the OTP is verified.
                </span>

              </div>

            </div>
          )}


          {/* =================================================
              OTP
          ================================================= */}

          {step === 3 && otpSent && (

            <div className="animate-fade-in">

              <div className="register-otp-header">

                <div className="register-otp-icon">
                  <KeyRound size={27} />
                </div>

                <h3>
                  Verify Your Email
                </h3>

                <p>
                  Enter the 6-digit OTP sent to
                </p>

                <strong>
                  {form.email}
                </strong>

              </div>


              <div className="form-group">

                <label className="form-label form-label--required">
                  Verification Code
                </label>

                <input
                  className="form-input"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(event) => {

                    const value =
                      event.target.value
                        .replace(
                          /\D/g,
                          ''
                        )
                        .slice(
                          0,
                          6
                        );

                    setOtp(value);

                    setError('');
                  }}
                  style={{
                    textAlign:
                      'center',
                    fontSize:
                      '22px',
                    fontWeight:
                      750,
                    letterSpacing:
                      '6px',
                  }}
                />

              </div>


              {developmentOtp && (

                <div className="register-development-otp">

                  <span>
                    Development OTP:
                  </span>

                  <strong>
                    {developmentOtp}
                  </strong>

                </div>

              )}


              {otpVerified ? (

                <div className="register-otp-success">

                  <CheckCircle2 size={18} />

                  OTP verified successfully

                </div>

              ) : (

                <button
                  type="button"
                  onClick={
                    handleVerifyOtp
                  }
                  disabled={
                    otpVerifying ||
                    loading ||
                    otp.length !== 6
                  }
                  className="register-verify-button"
                >

                  {otpVerifying ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="register-spin"
                      />

                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={17} />

                      Verify OTP & Create Account
                    </>
                  )}

                </button>

              )}


              <div className="register-resend">

                <span>
                  Didn't receive the OTP?
                </span>

                <button
                  type="button"
                  onClick={
                    handleResendOtp
                  }
                  disabled={
                    resendSeconds > 0 ||
                    otpSending
                  }
                >

                  {resendSeconds > 0
                    ? `Resend in ${resendSeconds}s`
                    : otpSending
                      ? 'Sending...'
                      : 'Resend OTP'}

                </button>

              </div>

            </div>
          )}


          {/* =================================================
              ACTIONS
          ================================================= */}

          {!otpSent && (

            <div className="step-actions">

              {step > 0 && (

                <Button
                  variant="ghost"
                  leftIcon={ArrowLeft}
                  onClick={
                    handleBack
                  }
                >
                  Back
                </Button>

              )}


              <Button
                onClick={
                  handleNext
                }
                loading={
                  otpSending ||
                  loading
                }
                rightIcon={
                  step < 3
                    ? ArrowRight
                    : undefined
                }
                fullWidth={
                  step === 0
                }
              >

                {step < 3
                  ? 'Continue'
                  : 'Create Account'}

              </Button>

            </div>
          )}


          {otpSent && (

            <div className="step-actions">

              <Button
                variant="ghost"
                leftIcon={ArrowLeft}
                onClick={
                  handleBack
                }
                disabled={
                  otpVerifying ||
                  loading
                }
              >
                Back
              </Button>

            </div>
          )}


          {/* =================================================
              FOOTER
          ================================================= */}

          <p className="auth-card__footer">

            Already have an account?{' '}

            <Link to="/login">
              Sign in
            </Link>

          </p>

        </div>

      </div>

    </div>
  );
}