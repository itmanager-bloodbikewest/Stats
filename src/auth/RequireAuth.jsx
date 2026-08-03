import { Navigate, useLocation } from 'react-router-dom';
import { getSession } from './session';

export default function RequireAuth({ children }) {
  const session = getSession();
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
