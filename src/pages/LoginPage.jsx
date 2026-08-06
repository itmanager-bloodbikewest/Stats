import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginWithReference } from '../api/referenceAuthApi';
import { setSession } from '../auth/session';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from?.pathname || '/';

  // reset-widget.js wires up [data-bbw-reset-trigger] elements on
  // DOMContentLoaded, which happens before React renders this page — so
  // the "Forgot password?" button below needs the widget to re-scan for
  // triggers once it's actually in the DOM.
  useEffect(() => {
    window.BBWReset && window.BBWReset.attachTriggers();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const result = await loginWithReference(phone.trim(), password);
      if (result.error) {
        setError(result.error);
        return;
      }
      // Success has no `ok` field — check for the token instead.
      if (!result.token) {
        setError('Something went wrong signing in. Please try again.');
        return;
      }

      setSession({
        name: result.user.name,
        phone: result.user.phone,
        role: result.user.role,
        token: result.token,
      });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error('Login failed:', err);
      setError('Something went wrong reaching the login service. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <img src="/icon.png" alt="" />
          <h1 className="login-title">Blood Bike West Stats</h1>
        </div>

        <p className="login-subtitle">Sign in with your usual phone number and password.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-label" htmlFor="phone">Phone number</label>
          <input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            required
            className="login-input"
          />

          <label className="login-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="login-input"
          />

          <div className="login-link-row">
            <button type="button" className="login-link" data-bbw-reset-trigger>
              Forgot password?
            </button>
          </div>

          {error && <p className="login-error" role="alert">{error}</p>}

          <button type="submit" className="login-button" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
