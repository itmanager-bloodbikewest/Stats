import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getSession, setSession, clearSession } from './session';
import { validateToken } from '../api/referenceAuthApi';

// Real server-side check via the Reference Auth Service's validateToken —
// not just "does a cookie exist". Redirects to login if there's no
// session, or if the token turns out to be invalid/expired server-side.
export default function RequireAuth({ children }) {
  const location = useLocation();
  const session = getSession();
  const [status, setStatus] = useState(session ? 'checking' : 'none');

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    validateToken(session.token)
      .then(res => {
        if (cancelled) return;
        if (res.ok) {
          // Refresh local name/role in case they changed server-side,
          // keeping the same token.
          setSession({ name: res.user.name, phone: res.user.phone, role: res.user.role, token: session.token });
          setStatus('valid');
        } else {
          clearSession();
          setStatus('invalid');
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearSession();
          setStatus('invalid');
        }
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!session || status === 'invalid') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (status === 'checking') {
    return (
      <div className="page">
        <p className="empty-note">Checking session…</p>
      </div>
    );
  }

  return children;
}
