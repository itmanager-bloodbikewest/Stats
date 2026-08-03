import { NavLink, useNavigate } from 'react-router-dom';
import { getSession, clearSession } from '../auth/session';

export default function NavBar() {
  const session = getSession();
  const navigate = useNavigate();

  function handleLogout() {
    clearSession();
    navigate('/login', { replace: true });
  }

  return (
    <nav className="navbar">
      <span className="navbar-brand">
        <img src="/icon.png" alt="" />
        Blood Bike West Stats
      </span>
      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}>
          Dashboard
        </NavLink>
        <NavLink to="/runs" className={({ isActive }) => isActive ? 'navbar-link active' : 'navbar-link'}>
          Runs
        </NavLink>
      </div>
      <div className="navbar-user">
        {session && <span className="navbar-name">{session.name}</span>}
        <button onClick={handleLogout} className="navbar-logout">Sign out</button>
      </div>
    </nav>
  );
}
