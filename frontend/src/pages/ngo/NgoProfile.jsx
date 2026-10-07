import React, { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Building2,
  Package,
  Heart,
  ShieldCheck,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { apiClient } from '../../services/apiClient';

const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

export default function NgoProfile() {
  const { user } = useAuth();

  const [ngoData, setNgoData] = useState(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [hasSentOnce, setHasSentOnce] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackError, setFeedbackError] = useState('');

  const loadNgoProfile = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/api/ngos/me');
      if (data) {
        setNgoData(data);
        setEmail(data.email || user?.email || '');
      }
    } catch (err) {
      console.warn('Could not load /api/ngos/me profile:', err);
      setEmail(user?.email || 'priya@helpinghands.in');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNgoProfile();
  }, []);

  const validateEmailFormat = (val) => {
    if (!val || typeof val !== 'string') return false;
    const trimmed = val.trim();
    if (trimmed.length < 5 || trimmed.length > 150) return false;
    if (!EMAIL_REGEX.test(trimmed)) return false;
    const parts = trimmed.split('@');
    if (parts.length !== 2) return false;
    const domain = parts[1];
    if (!domain.includes('.') || domain.startsWith('.') || domain.endsWith('.')) return false;
    const tld = domain.split('.').pop();
    if (!tld || tld.length < 2) return false;
    return true;
  };

  const handleSendVerification = async () => {
    setFeedbackMessage('');
    setFeedbackError('');

    const targetEmail = email.trim();
    if (!validateEmailFormat(targetEmail)) {
      setFeedbackError('Please enter a valid organization email address.');
      return;
    }

    try {
      setSending(true);
      const res = await apiClient.post('/api/ngo/email/send-verification', {
        email: targetEmail,
      });
      setHasSentOnce(true);
      setFeedbackMessage(
        res?.message ||
          '✓ Verification email sent successfully. Please check the organization’s inbox and click the verification link.'
      );
      // Reload profile to refresh state
      await loadNgoProfile();
    } catch (err) {
      console.error('Error sending verification:', err);
      const errMsg = err?.message || err?.detail;
      setFeedbackError(
        errMsg ||
          'We could not send a verification email to this address. Please check that you entered the original working organization email and try again.'
      );
    } finally {
      setSending(false);
    }
  };

  const orgName =
    ngoData?.organization_name ||
    user?.orgName ||
    user?.name ||
    'Helping Hands NGO';

  const initials = orgName.charAt(0).toUpperCase() || 'N';
  const isVerified = Boolean(ngoData?.email_verified);

  return (
    <div
      className="container"
      style={{
        paddingTop: 'var(--space-6)',
        paddingBottom: 'var(--space-9)',
      }}
    >
      <div className="page-header">
        <h1 className="page-header__title">
          Organization Profile
        </h1>

        <p className="page-header__subtitle">
          Manage your NGO account details
        </p>
      </div>

      <div className="profile-header">
        <div className="profile-avatar">
          {initials}
        </div>

        <div className="profile-header__info">
          <span className="profile-header__role">
            NGO Account
          </span>

          <h1>{orgName}</h1>

          <span className="profile-header__verified">
            <ShieldCheck size={16} />
            Verified Organization
          </span>
        </div>
      </div>

      <div className="profile-details">
        {/* ORGANIZATION EMAIL VERIFICATION SECTION */}
        <div
          className="profile-detail-item"
          style={{
            gridColumn: '1 / -1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 'var(--space-3)',
            padding: 'var(--space-4)',
            background: 'var(--color-surface, #ffffff)',
            borderRadius: 'var(--radius-lg, 8px)',
            border: '1px solid var(--color-border, #e2e8f0)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
            }}
          >
            <span
              className="profile-detail-item__label"
              style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}
            >
              <Mail
                size={14}
                style={{
                  display: 'inline',
                  marginRight: '6px',
                }}
              />
              Organization Email
            </span>

            {isVerified ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#16a34a',
                  fontWeight: 600,
                  fontSize: 'var(--text-sm)',
                  background: '#dcfce7',
                  padding: '4px 10px',
                  borderRadius: '20px',
                }}
              >
                <CheckCircle size={14} />
                ✓ Email Verified
              </span>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#b45309',
                  fontWeight: 600,
                  fontSize: 'var(--text-sm)',
                  background: '#fef3c7',
                  padding: '4px 10px',
                  borderRadius: '20px',
                }}
              >
                <Clock size={14} />
                Email Status: Verification Pending
              </span>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              gap: 'var(--space-3)',
              width: '100%',
              maxWidth: '650px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFeedbackError('');
              }}
              placeholder="ngo@example.com"
              disabled={isVerified}
              style={{
                flex: 1,
                minWidth: '260px',
                padding: '9px 14px',
                borderRadius: 'var(--radius-md, 6px)',
                border: '1px solid var(--color-border, #cbd5e1)',
                fontSize: 'var(--text-base, 14px)',
                background: isVerified
                  ? 'var(--color-surface-secondary, #f8fafc)'
                  : '#ffffff',
                color: 'var(--color-text-primary, #0f172a)',
                outline: 'none',
              }}
            />

            {!isVerified && (
              <Button
                variant="primary"
                size="md"
                onClick={handleSendVerification}
                loading={sending}
                leftIcon={Mail}
              >
                {hasSentOnce
                  ? 'Resend Verification Email'
                  : 'Send Verification Email'}
              </Button>
            )}
          </div>

          {feedbackMessage && (
            <p
              style={{
                margin: '4px 0 0 0',
                color: '#15803d',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle size={16} />
              {feedbackMessage}
            </p>
          )}

          {feedbackError && (
            <p
              style={{
                margin: '4px 0 0 0',
                color: '#b91c1c',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <AlertCircle size={16} />
              {feedbackError}
            </p>
          )}
        </div>

        {/* PHONE */}
        <div className="profile-detail-item">
          <span className="profile-detail-item__label">
            <Phone
              size={12}
              style={{
                display: 'inline',
                marginRight: '4px',
              }}
            />
            Phone
          </span>

          <span className="profile-detail-item__value">
            {user?.phone || '+91 98123 45678'}
          </span>
        </div>

        {/* LOCATION */}
        <div className="profile-detail-item">
          <span className="profile-detail-item__label">
            <MapPin
              size={12}
              style={{
                display: 'inline',
                marginRight: '4px',
              }}
            />
            Location
          </span>

          <span className="profile-detail-item__value">
            {ngoData?.address ||
              user?.location ||
              'Jubilee Hills, Hyderabad, Telangana'}
          </span>
        </div>

        {/* ADDRESS */}
        <div className="profile-detail-item">
          <span className="profile-detail-item__label">
            <Building2
              size={12}
              style={{
                display: 'inline',
                marginRight: '4px',
              }}
            />
            Address
          </span>

          <span className="profile-detail-item__value">
            {ngoData?.address ||
              user?.address ||
              'Road No. 36, Jubilee Hills, Hyderabad'}
          </span>
        </div>

        {/* CAPACITY */}
        <div className="profile-detail-item">
          <span className="profile-detail-item__label">
            <Package
              size={12}
              style={{
                display: 'inline',
                marginRight: '4px',
              }}
            />
            Capacity
          </span>

          <span className="profile-detail-item__value">
            {ngoData?.capacity
              ? `${ngoData.capacity} ${ngoData.capacity_unit || 'meals/day'}`
              : user?.capacity
              ? `${user.capacity} ${user.capacityUnit}`
              : '200 meals/day'}
          </span>
        </div>

        {/* FOOD REQUIREMENTS */}
        <div className="profile-detail-item">
          <span className="profile-detail-item__label">
            <Heart
              size={12}
              style={{
                display: 'inline',
                marginRight: '4px',
              }}
            />
            Food Requirements
          </span>

          <span className="profile-detail-item__value">
            {ngoData?.food_requirements ||
              user?.foodRequirements ||
              'Cooked meals, Rice, Vegetables, Fruits'}
          </span>
        </div>
      </div>
    </div>
  );
}