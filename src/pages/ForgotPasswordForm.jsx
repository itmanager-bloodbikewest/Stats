import { useState } from 'react';
import { sendResetCode, verifyResetCode, setNewPassword } from '../api/ccApi';

// step: 'request' -> 'verify' -> 'reset' -> 'done'
export default function ForgotPasswordForm({ onBackToLogin }) {
  const [step, setStep] = useState('request');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPasswordValue] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSendCode(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await sendResetCode(phone.trim());
      if (result.error) {
        setError(result.error);
        return;
      }
      // Always proceeds to the code-entry step, even if the phone wasn't
      // found — sendResetCode never reveals that, by design.
      setStep('verify');
    } catch {
      setError('Something went wrong sending the reset code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const result = await verifyResetCode(phone.trim(), code.trim());
      if (result.error) {
        setError(result.error);
        return;
      }
      setResetToken(result.resetToken);
      setStep('reset');
    } catch {
      setError('Something went wrong verifying the code. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSetPassword(e) {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await setNewPassword(phone.trim(), resetToken, newPassword);
      if (result.error) {
        setError(result.error);
        return;
      }
      setStep('done');
    } catch {
      setError('Something went wrong setting your new password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 'done') {
    return (
      <div className="login-form">
        <p>Your password has been reset. You can now sign in with your new password.</p>
        <button type="button" className="login-button" onClick={onBackToLogin}>
          Back to sign in
        </button>
      </div>
    );
  }

  if (step === 'reset') {
    return (
      <form onSubmit={handleSetPassword} className="login-form">
        <p className="login-subtitle" style={{ margin: 0 }}>Choose a new password.</p>

        <label className="login-label" htmlFor="newPassword">New password</label>
        <input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={e => setNewPasswordValue(e.target.value)}
          required
          className="login-input"
        />

        <label className="login-label" htmlFor="confirmPassword">Confirm new password</label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          className="login-input"
        />

        {error && <p className="login-error" role="alert">{error}</p>}

        <button type="submit" className="login-button" disabled={submitting}>
          {submitting ? 'Saving…' : 'Set new password'}
        </button>
      </form>
    );
  }

  if (step === 'verify') {
    return (
      <form onSubmit={handleVerifyCode} className="login-form">
        <p className="login-subtitle" style={{ margin: 0 }}>
          Enter the 6-digit code we emailed you. It expires in 10 minutes.
        </p>

        <label className="login-label" htmlFor="code">Reset code</label>
        <input
          id="code"
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={e => setCode(e.target.value)}
          required
          className="login-input"
        />

        {error && <p className="login-error" role="alert">{error}</p>}

        <button type="submit" className="login-button" disabled={submitting}>
          {submitting ? 'Checking…' : 'Verify code'}
        </button>
        <button type="button" className="button-secondary" style={{ marginTop: '0.5rem' }} onClick={onBackToLogin}>
          Cancel
        </button>
      </form>
    );
  }

  // step === 'request'
  return (
    <form onSubmit={handleSendCode} className="login-form">
      <p className="login-subtitle" style={{ margin: 0 }}>
        Enter your phone number and we'll email you a reset code.
      </p>

      <label className="login-label" htmlFor="resetPhone">Phone number</label>
      <input
        id="resetPhone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        required
        className="login-input"
      />

      {error && <p className="login-error" role="alert">{error}</p>}

      <button type="submit" className="login-button" disabled={submitting}>
        {submitting ? 'Sending…' : 'Send reset code'}
      </button>
      <button type="button" className="button-secondary" style={{ marginTop: '0.5rem' }} onClick={onBackToLogin}>
        Cancel
      </button>
    </form>
  );
}
