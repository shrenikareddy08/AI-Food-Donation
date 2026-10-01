import { useEffect, useState } from 'react';
import { User, Mail, Phone, Shield, LogOut, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';


export default function AdminProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState(user || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        setLoading(true);

        /*
         * Use the currently logged-in user from AuthContext.
         * If your backend provides an admin profile endpoint,
         * it can be connected here later.
         */
        if (!cancelled) {
          setProfile(user || null);
        }
      } catch (error) {
        console.error('Failed to load admin profile:', error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div
        style={{
          padding: 'var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
        }}
      >
        <Loader2 size={20} />
        Loading profile...
      </div>
    );
  }

  const name =
    profile?.name ||
    profile?.full_name ||
    profile?.username ||
    'Admin';

  const email = profile?.email || '—';
  const phone = profile?.phone || profile?.mobile || '—';
  const role = String(profile?.role || 'ADMIN').toUpperCase();

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-header__title">
          Admin Profile
        </h1>

        <p className="admin-page-header__subtitle">
          View your admin account information
        </p>
      </div>

      <div
        style={{
          maxWidth: '700px',
        }}
      >
        {/* Profile header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-4)',
            padding: 'var(--space-6)',
            marginBottom: 'var(--space-4)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div
            className="admin-avatar admin-avatar--neutral"
            style={{
              width: '64px',
              height: '64px',
              fontSize: 'var(--text-xl)',
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>

          <div>
            <h2
              style={{
                margin: 0,
                marginBottom: 'var(--space-1)',
              }}
            >
              {name}
            </h2>

            <span
              className="status-badge status-badge--warning status-badge--sm"
            >
              ADMIN
            </span>
          </div>
        </div>

        {/* Account details */}
        <div
          style={{
            padding: 'var(--space-5)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 'var(--space-4)',
            }}
          >
            Account Information
          </h3>

          <div className="detail-rows">
            <div className="detail-row">
              <span className="detail-row__label">
                <User size={16} /> Name
              </span>

              <span className="detail-row__value">
                {name}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                <Mail size={16} /> Email
              </span>

              <span className="detail-row__value">
                {email}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                <Phone size={16} /> Phone
              </span>

              <span className="detail-row__value">
                {phone}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-row__label">
                <Shield size={16} /> Role
              </span>

              <span className="detail-row__value">
                {role}
              </span>
            </div>
          </div>

          <div
            style={{
              marginTop: 'var(--space-5)',
              paddingTop: 'var(--space-4)',
              borderTop:
                '1px solid var(--color-border)',
            }}
          >
            <Button
              variant="danger"
              leftIcon={LogOut}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}