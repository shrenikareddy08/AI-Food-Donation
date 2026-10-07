import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  KeyRound,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Home,
} from 'lucide-react';

import Card from '../components/Card';
import Button from '../components/Button';
import { apiClient } from '../services/apiClient';

export default function VerifyPhone() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('PHONE'); // 'PHONE' | 'OTP' | 'VERIFIED'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return undefined;

    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  function handlePhoneChange(e) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(raw);
    setError('');
  }

  function handleOtpChange(e) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(raw);
    setError('');
  }

  async function handleSendOtp(e) {
    if (e) e.preventDefault();

    const clean = phoneNumber.trim();
    if (clean.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!['6', '7', '8', '9'].includes(clean[0])) {
      setError('Indian mobile numbers must begin with 6, 7, 8, or 9.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        phone: clean,
      };

      await apiClient.post('/api/phone/send-otp', payload);
      setStep('OTP');
      setResendCooldown(30);
      setOtp('');
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to send OTP. Please try again later.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    if (e) e.preventDefault();

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        phone: phoneNumber.trim(),
        otp: cleanOtp,
      };

      const res = await apiClient.post('/api/phone/verify-otp', payload);
      if (res?.verified) {
        setStep('VERIFIED');
      } else {
        setError(res?.message || 'Invalid OTP');
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Invalid OTP. Please check the code and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleChangePhoneNumber() {
    setStep('PHONE');
    setOtp('');
    setError('');
  }

  function handleReset() {
    setPhoneNumber('');
    setOtp('');
    setStep('PHONE');
    setError('');
    setResendCooldown(0);
  }

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
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <Card>
          <div
            style={{
              padding: 'var(--space-8)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header Icon */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background:
                    step === 'VERIFIED'
                      ? 'rgba(22, 163, 74, 0.12)'
                      : 'var(--color-bg-secondary, #f1f5f9)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color:
                    step === 'VERIFIED'
                      ? 'var(--color-primary, #16a34a)'
                      : 'var(--color-primary, #16a34a)',
                  marginBottom: 'var(--space-3)',
                }}
              >
                {step === 'VERIFIED' ? (
                  <CheckCircle size={32} />
                ) : step === 'OTP' ? (
                  <KeyRound size={28} />
                ) : (
                  <Phone size={28} />
                )}
              </div>

              <h2
                style={{
                  margin: '0 0 var(--space-2) 0',
                  fontSize: '22px',
                  fontWeight: 700,
                  color: 'var(--color-text-primary)',
                }}
              >
                {step === 'VERIFIED'
                  ? 'Phone Number Verified'
                  : step === 'OTP'
                  ? 'Verify Phone Number'
                  : 'Phone Verification'}
              </h2>

              <p
                style={{
                  margin: 0,
                  fontSize: '14px',
                  color: 'var(--color-text-secondary, #64748b)',
                  lineHeight: 1.5,
                }}
              >
                {step === 'VERIFIED'
                  ? 'Your mobile number has been successfully verified.'
                  : step === 'OTP'
                  ? 'Enter the 6-digit OTP sent to your phone.'
                  : 'Enter your 10-digit mobile number to receive a verification OTP.'}
              </p>
            </div>

            {/* Error Message Box */}
            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md, 8px)',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#dc2626',
                  fontSize: '13.5px',
                  marginBottom: 'var(--space-4)',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: PHONE INPUT */}
            {step === 'PHONE' && (
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label
                    className="form-label form-label--required"
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      marginBottom: 'var(--space-2)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    Phone Number
                  </label>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 'var(--radius-md, 8px)',
                      border: '1px solid var(--color-border, #e2e8f0)',
                      backgroundColor: 'var(--color-bg-surface, #fff)',
                      overflow: 'hidden',
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <span
                      style={{
                        padding: '10px 14px',
                        background: 'var(--color-bg-secondary, #f8fafc)',
                        borderRight: '1px solid var(--color-border, #e2e8f0)',
                        fontSize: '14px',
                        fontWeight: 650,
                        color: 'var(--color-text-secondary, #475569)',
                        userSelect: 'none',
                      }}
                    >
                      +91
                    </span>

                    <input
                      type="tel"
                      inputMode="numeric"
                      autoFocus
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      style={{
                        flex: 1,
                        border: 'none',
                        outline: 'none',
                        padding: '10px 14px',
                        fontSize: '15px',
                        fontWeight: 550,
                        letterSpacing: '1px',
                        backgroundColor: 'transparent',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12.5px',
                    color: 'var(--color-text-tertiary, #94a3b8)',
                  }}
                >
                  <ShieldCheck size={16} />
                  <span>A 6-digit OTP valid for 5 minutes will be sent via SMS.</span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  disabled={loading || phoneNumber.length !== 10}
                  fullWidth
                  style={{ marginTop: 'var(--space-2)' }}
                >
                  Send OTP
                </Button>
              </form>
            )}

            {/* STEP 2: OTP INPUT */}
            {step === 'OTP' && (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                {/* OTP Sent Info Banner */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md, 8px)',
                    backgroundColor: 'rgba(22, 163, 74, 0.08)',
                    border: '1px solid rgba(22, 163, 74, 0.2)',
                    fontSize: '13px',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)' }}>OTP sent to </span>
                    <strong style={{ color: 'var(--color-text-primary)' }}>+91 {phoneNumber}</strong>
                  </div>

                  <button
                    type="button"
                    onClick={handleChangePhoneNumber}
                    disabled={loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-primary, #16a34a)',
                      cursor: 'pointer',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                  >
                    Change
                  </button>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label
                    className="form-label form-label--required"
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 600,
                      marginBottom: 'var(--space-2)',
                      color: 'var(--color-text-secondary)',
                      textAlign: 'center',
                    }}
                  >
                    Enter 6-Digit OTP
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    maxLength={6}
                    placeholder="— — — — — —"
                    value={otp}
                    onChange={handleOtpChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      fontSize: '24px',
                      fontWeight: 700,
                      letterSpacing: '8px',
                      textAlign: 'center',
                      borderRadius: 'var(--radius-md, 8px)',
                      border: '1px solid var(--color-border, #e2e8f0)',
                      backgroundColor: 'var(--color-bg-surface, #fff)',
                      color: 'var(--color-text-primary)',
                      outline: 'none',
                    }}
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  disabled={loading || otp.length !== 6}
                  fullWidth
                >
                  Verify OTP
                </Button>

                {/* Resend Cooldown Controls */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'var(--space-2)',
                    fontSize: '13px',
                  }}
                >
                  <button
                    type="button"
                    onClick={handleChangePhoneNumber}
                    disabled={loading}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-text-secondary, #64748b)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      padding: 0,
                    }}
                  >
                    <ArrowLeft size={15} />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={resendCooldown > 0 || loading}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'none',
                      border: 'none',
                      color:
                        resendCooldown > 0
                          ? 'var(--color-text-tertiary, #94a3b8)'
                          : 'var(--color-primary, #16a34a)',
                      cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      fontSize: '13px',
                      padding: 0,
                    }}
                  >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    <span>
                      {resendCooldown > 0
                        ? `Resend OTP in ${resendCooldown}s`
                        : 'Resend OTP'}
                    </span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: VERIFIED STATE */}
            {step === 'VERIFIED' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                }}
              >
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-lg, 12px)',
                    backgroundColor: 'rgba(22, 163, 74, 0.08)',
                    border: '1px solid rgba(22, 163, 74, 0.25)',
                    width: '100%',
                    textAlign: 'center',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#15803d',
                    }}
                  >
                    ✓ Phone number verified successfully
                  </p>
                  <p
                    style={{
                      margin: '6px 0 0 0',
                      fontSize: '14px',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    +91 {phoneNumber}
                  </p>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    gap: 'var(--space-3)',
                    marginTop: 'var(--space-2)',
                  }}
                >
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    fullWidth
                  >
                    Verify Another Phone Number
                  </Button>

                  <Link to="/" style={{ textDecoration: 'none', width: '100%' }}>
                    <Button variant="ghost" fullWidth leftIcon={Home}>
                      Return to Home
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
