import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginWithReference, getUserRole } from '../api/ccApi';
import { setSession } from '../auth/session';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from?.pathname || '/';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const loginResult = await loginWithReference(phone.trim(), password);
      if (loginResult.error) {
        setError(loginResult.error);
        return;
      }

      const roleResult = await getUserRole(phone.trim());
      if (!roleResult.found) {
        setError('Logged in, but could not find your role. Please contact your IT manager.');
        return;
      }

      setSession({ name: roleResult.name, phone: phone.trim(), role: roleResult.role });
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

          {error && <p className="login-error" role="alert">{error}</p>}

          <button type="submit" className="login-button" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
