import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  Loader2,
  Mail,
} from 'lucide-react';

import Card from '../components/Card';
import Button from '../components/Button';
import { apiClient } from '../services/apiClient';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('LOADING'); // LOADING | SUCCESS | EXPIRED | INVALID | ALREADY_VERIFIED
  const [orgName, setOrgName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token || !token.trim()) {
      setStatus('INVALID');
      setErrorMessage('Invalid verification link. Please request a new verification email.');
      return;
    }

    let isMounted = true;

    async function verifyToken() {
      try {
        setStatus('LOADING');
        // Call verification endpoint
        const res = await apiClient.get(`/api/ngo/email/verify?token=${encodeURIComponent(token.trim())}`);
        if (!isMounted) return;

        if (res?.status === 'ALREADY_VERIFIED') {
          setStatus('ALREADY_VERIFIED');
          setOrgName(res?.organization_name || '');
        } else {
          setStatus('SUCCESS');
          setOrgName(res?.organization_name || '');
        }
      } catch (err) {
        if (!isMounted) return;
        const msg = String(err?.message || err?.detail || '');
        if (msg.toLowerCase().includes('expired')) {
          setStatus('EXPIRED');
          setErrorMessage('This verification link has expired. Please request a new verification email.');
        } else if (msg.toLowerCase().includes('already verified')) {
          setStatus('ALREADY_VERIFIED');
        } else {
          setStatus('INVALID');
          setErrorMessage('Invalid verification link. Please request a new verification email.');
        }
      }
    }

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '520px' }}>
        <Card>
          <div
            style={{
              padding: 'var(--space-8)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {/* LOADING STATE */}
            {status === 'LOADING' && (
              <>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'var(--color-surface-secondary, #f1f5f9)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 'var(--space-4)',
                    color: 'var(--color-primary-600, #16a34a)',
                  }}
                >
                  <Loader2 size={32} className="animate-spin" />
                </div>
                <h2 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-xl)' }}>
                  Verifying your email...
                </h2>
                <p style={{ margin: 0, color: 'var(--color-text-secondary, #64748b)' }}>
                  Please wait while we validate your organization verification link.
                </p>
              </>
            )}

            {/* SUCCESS STATE */}
            {status === 'SUCCESS' && (
              <>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 'var(--space-4)',
                    color: '#16a34a',
                  }}
                >
                  <CheckCircle size={36} />
                </div>
                <h2 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-xl)', color: '#15803d' }}>
                  ✓ Email Verified Successfully
                </h2>
                <p
                  style={{
                    margin: '0 0 var(--space-6) 0',
                    color: 'var(--color-text-secondary, #64748b)',
                    lineHeight: 1.5,
                  }}
                >
                  Your organization email has been verified.
                  {orgName ? ` Welcome aboard, ${orgName}!` : ''}
                </p>
                <Button
                  variant="primary"
                  fullWidth
                  rightIcon={ArrowRight}
                  onClick={() => navigate('/ngo/dashboard')}
                >
                  Continue to MealBridge
                </Button>
              </>
            )}

            {/* ALREADY VERIFIED STATE */}
            {status === 'ALREADY_VERIFIED' && (
              <>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 'var(--space-4)',
                    color: '#16a34a',
                  }}
                >
                  <CheckCircle size={36} />
                </div>
                <h2 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-xl)' }}>
                  Email is already verified.
                </h2>
                <p
                  style={{
                    margin: '0 0 var(--space-6) 0',
                    color: 'var(--color-text-secondary, #64748b)',
                    lineHeight: 1.5,
                  }}
                >
                  Your organization email address has already been verified and is active.
                </p>
                <Button
                  variant="primary"
                  fullWidth
                  rightIcon={ArrowRight}
                  onClick={() => navigate('/ngo/dashboard')}
                >
                  Continue to MealBridge
                </Button>
              </>
            )}

            {/* EXPIRED STATE */}
            {status === 'EXPIRED' && (
              <>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: '#fef3c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 'var(--space-4)',
                    color: '#d97706',
                  }}
                >
                  <Clock size={36} />
                </div>
                <h2 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-xl)', color: '#b45309' }}>
                  Verification Link Expired
                </h2>
                <p
                  style={{
                    margin: '0 0 var(--space-6) 0',
                    color: 'var(--color-text-secondary, #64748b)',
                    lineHeight: 1.5,
                  }}
                >
                  {errorMessage || 'This verification link has expired. Please request a new verification email.'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%' }}>
                  <Button
                    variant="primary"
                    fullWidth
                    leftIcon={Mail}
                    onClick={() => navigate('/ngo/profile')}
                  >
                    Resend Verification Email
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => navigate('/login')}
                  >
                    Go to Login
                  </Button>
                </div>
              </>
            )}

            {/* INVALID STATE */}
            {status === 'INVALID' && (
              <>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: '#fee2e2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 'var(--space-4)',
                    color: '#dc2626',
                  }}
                >
                  <AlertCircle size={36} />
                </div>
                <h2 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-xl)', color: '#b91c1c' }}>
                  Invalid Verification Link
                </h2>
                <p
                  style={{
                    margin: '0 0 var(--space-6) 0',
                    color: 'var(--color-text-secondary, #64748b)',
                    lineHeight: 1.5,
                  }}
                >
                  {errorMessage || 'Invalid verification link. Please request a new verification email.'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', width: '100%' }}>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => navigate('/ngo/profile')}
                  >
                    Go to Organization Profile
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => navigate('/login')}
                  >
                    Return to Login
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
