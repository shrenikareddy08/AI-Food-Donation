import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';

import { apiClient } from '../services/apiClient';


// =========================================================
// CONTEXT
// =========================================================

const AuthContext = createContext(null);

const ACCESS_TOKEN_KEY =
  'mealbridge_access_token';

const USER_STORAGE_KEY =
  'mealbridge_auth_user';


// =========================================================
// HELPER
// Supports both direct API responses and
// { data: ... } responses.
// =========================================================

function unwrapResponse(response) {
  if (
    response &&
    typeof response === 'object' &&
    Object.prototype.hasOwnProperty.call(
      response,
      'data'
    )
  ) {
    return response.data;
  }

  return response;
}


// =========================================================
// ROLE DASHBOARD PATH
// =========================================================

export function getDashboardPath(role) {
  const paths = {
    DONOR: '/donor/dashboard',
    NGO: '/ngo/dashboard',
    VOLUNTEER: '/volunteer/dashboard',
    ADMIN: '/admin/dashboard',
  };

  return paths[role] || '/';
}


// =========================================================
// AUTH PROVIDER
// =========================================================

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);


  // =======================================================
  // RESTORE LOGIN SESSION
  // =======================================================

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const token =
        localStorage.getItem(
          ACCESS_TOKEN_KEY
        ) ||
        sessionStorage.getItem(
          ACCESS_TOKEN_KEY
        );

      if (!token) {
        if (mounted) {
          setLoading(false);
        }

        return;
      }

      try {
        const response =
          await apiClient.get(
            '/api/users/me'
          );

        const currentUser =
          unwrapResponse(response);

        if (!mounted) {
          return;
        }

        setUser(currentUser);

        localStorage.setItem(
          USER_STORAGE_KEY,
          JSON.stringify(currentUser)
        );
      } catch (error) {
        console.error(
          'Session restore failed:',
          error
        );

        localStorage.removeItem(
          ACCESS_TOKEN_KEY
        );

        sessionStorage.removeItem(
          ACCESS_TOKEN_KEY
        );

        localStorage.removeItem(
          USER_STORAGE_KEY
        );

        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);


  // =======================================================
  // LOGIN
  // =======================================================

  const login = useCallback(
    async (
      email,
      password,
      remember = true
    ) => {
      if (!email || !password) {
        throw new Error(
          'Email and password are required.'
        );
      }

      const formData =
        new URLSearchParams();

      formData.append(
        'username',
        email.trim()
      );

      formData.append(
        'password',
        password
      );

      const response =
        await apiClient.postForm(
          '/api/auth/login',
          formData
        );

      const tokenResponse =
        unwrapResponse(response);

      if (!tokenResponse?.access_token) {
        throw new Error(
          'Login failed. Access token was not returned.'
        );
      }

      const token =
        tokenResponse.access_token;

      localStorage.removeItem(
        ACCESS_TOKEN_KEY
      );

      sessionStorage.removeItem(
        ACCESS_TOKEN_KEY
      );

      if (remember) {
        localStorage.setItem(
          ACCESS_TOKEN_KEY,
          token
        );
      } else {
        sessionStorage.setItem(
          ACCESS_TOKEN_KEY,
          token
        );
      }

      const userResponse =
        await apiClient.get(
          '/api/users/me'
        );

      const currentUser =
        unwrapResponse(
          userResponse
        );

      setUser(currentUser);

      localStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify(currentUser)
      );

      return currentUser;
    },
    []
  );


  // =======================================================
  // REQUEST REGISTRATION OTP
  // =======================================================

  const requestRegistrationOtp =
    useCallback(
      async (email) => {
        if (!email || !email.trim()) {
          throw new Error(
            'Email is required.'
          );
        }

        const payload = {
          email: email.trim(),
          purpose: 'REGISTER',
        };

        const response =
          await apiClient.post(
            '/api/auth/request-otp',
            payload
          );

        return unwrapResponse(
          response
        );
      },
      []
    );


  // =======================================================
  // VERIFY REGISTRATION OTP
  // =======================================================

  const verifyRegistrationOtp =
    useCallback(
      async (
        email,
        otp
      ) => {
        if (!email || !email.trim()) {
          throw new Error(
            'Email is required.'
          );
        }

        if (!otp) {
          throw new Error(
            'OTP is required.'
          );
        }

        const payload = {
          email: email.trim(),
          otp: String(otp).trim(),
          purpose: 'REGISTER',
        };

        const response =
          await apiClient.post(
            '/api/auth/verify-otp',
            payload
          );

        return unwrapResponse(
          response
        );
      },
      []
    );


  // =======================================================
  // REGISTER
  // =======================================================

  const register = useCallback(
    async (registrationData) => {
      if (!registrationData) {
        throw new Error(
          'Registration details are required.'
        );
      }

      const payload = {
        name:
          registrationData.name?.trim() ||
          '',

        email:
          registrationData.email?.trim() ||
          '',

        password:
          registrationData.password || '',

        phone:
          registrationData.phone?.trim() ||
          null,

        role:
          String(
            registrationData.role || ''
          ).toUpperCase(),

        location:
          registrationData.location?.trim() ||
          null,
      };

      if (!payload.name) {
        throw new Error(
          'Name is required.'
        );
      }

      if (!payload.email) {
        throw new Error(
          'Email is required.'
        );
      }

      if (payload.password.length < 8) {
        throw new Error(
          'Password must contain at least 8 characters.'
        );
      }

      if (
        ![
          'DONOR',
          'NGO',
          'VOLUNTEER',
        ].includes(payload.role)
      ) {
        throw new Error(
          'Please select a valid registration role.'
        );
      }

      const response =
        await apiClient.post(
          '/api/auth/register',
          payload
        );

      const newUser =
        unwrapResponse(response);

      if (!newUser) {
        throw new Error(
          'Registration failed. User details were not returned.'
        );
      }

      /*
        Registration endpoint creates the account.
        It does not automatically log the user in.
      */

      setUser(newUser);

      localStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify(newUser)
      );

      return newUser;
    },
    []
  );


  // =======================================================
  // LOGOUT
  // =======================================================

  const logout = useCallback(
    () => {
      setUser(null);

      localStorage.removeItem(
        ACCESS_TOKEN_KEY
      );

      sessionStorage.removeItem(
        ACCESS_TOKEN_KEY
      );

      localStorage.removeItem(
        USER_STORAGE_KEY
      );
    },
    []
  );


  // =======================================================
  // UPDATE FRONTEND USER STATE
  // =======================================================

  const updateProfile = useCallback(
    (updates) => {
      setUser(
        (previousUser) => {
          if (!previousUser) {
            return previousUser;
          }

          const updatedUser = {
            ...previousUser,
            ...updates,
          };

          localStorage.setItem(
            USER_STORAGE_KEY,
            JSON.stringify(
              updatedUser
            )
          );

          return updatedUser;
        }
      );
    },
    []
  );


  // =======================================================
  // CONTEXT VALUE
  // =======================================================

  const value = {
    user,

    loading,

    isAuthenticated:
      Boolean(user),

    login,

    requestRegistrationOtp,

    verifyRegistrationOtp,

    register,

    logout,

    updateProfile,
  };


  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}


// =========================================================
// USE AUTH
// =========================================================

export function useAuth() {
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      'useAuth must be used within AuthProvider'
    );
  }

  return context;
}