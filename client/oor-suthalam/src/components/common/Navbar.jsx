import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminIcon from './AdminIcon';
import NavJourney from './NavJourney';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setMenuOpen(false), [location.pathname, location.search]);

  async function handleLogout() {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <header
        className={`navbar ${menuOpen ? 'menu-open' : ''}`}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setMenuOpen(false);
        }}
      >
        <Link className="brand" to="/" aria-label="Oor Suthalam home">
          <img src="/logo.png" alt="Oor Suthalam" className="brand-logo" />
          <span className="nav-wordmark">
            <strong>Oor Suthalam</strong>
            <small>EXPLORE · PLAN · TRAVEL</small>
          </span>
        </Link>
        <Link
          className="mobile-header-account"
          to={user ? '/traveler/profile' : '/login'}
          aria-label={user ? 'Open your account' : 'Sign in'}
        >
          {user ? (
            user.name.slice(0, 1).toUpperCase()
          ) : (
            <AdminIcon name="users" size={20} />
          )}
        </Link>
        <button
          className="mobile-nav-toggle"
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menuOpen}
          aria-controls="travel-navigation"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {menuOpen ? (
              <path d="m6 6 12 12M6 18 18 6" />
            ) : (
              <path d="M4 7h16M4 12h10M4 17h16" />
            )}
          </svg>
        </button>
        <nav id="travel-navigation" aria-label="Main navigation">
          <div className="travel-menu-content">
            <div className="mobile-drawer-heading">
              <div>
                <small>GO SOMEWHERE GOOD.</small>
                <strong>Oor Suthalam</strong>
              </div>
              <button
                type="button"
                aria-label="Close side menu"
                onClick={() => setMenuOpen(false)}
              >
                ✕
              </button>
            </div>
            <Link className="drawer-profile" to={user ? '/traveler/profile' : '/login'}>
              <span>{user ? user.name.slice(0, 1).toUpperCase() : '✳'}</span>
              <div>
                <small>
                  {user ? 'YOUR EXPLORER ACCOUNT' : 'YOUR ADVENTURE STARTS HERE'}
                </small>
                <strong>{user ? user.name : 'Sign in to explore'}</strong>
                <p>Trips, saved places & memories</p>
              </div>
            </Link>
            <span className="drawer-section-label">DISCOVER</span>
            <NavLink to="/destinations">
              <AdminIcon name="destination" size={18} />
              Destinations
            </NavLink>
            <NavLink to="/packages">
              <AdminIcon name="package" size={18} />
              Packages
            </NavLink>
            <NavLink to="/traveler/plan">Plan trip</NavLink>
            <NavLink to="/partners">Travel partners</NavLink>
            <NavLink to="/about">
              <AdminIcon name="overview" size={18} />
              About
            </NavLink>
            <NavLink to="/contact">
              <AdminIcon name="mail" size={18} />
              Contact
            </NavLink>
            <div className="mobile-menu-account">
              <span className="drawer-section-label">YOUR JOURNEY</span>
              <NavLink to="/traveler/saved">
                <span className="drawer-heart">♡</span>Saved places{' '}
                {user?.savedPlaces?.length ? '(' + user.savedPlaces.length + ')' : ''}
              </NavLink>
              <NavLink to={user ? '/traveler/profile' : '/login'}>
                <AdminIcon name="users" size={18} />
                My account{' '}
              </NavLink>
              <NavLink to="/traveler/bookings">
                <AdminIcon name="booking" size={18} />
                My bookings{' '}
              </NavLink>
              {user?.role === 'admin' && <NavLink to="/admin">Admin workspace </NavLink>}
              {user && (
                <button type="button" onClick={handleLogout}>
                  Log out
                </button>
              )}
            </div>
          </div>
        </nav>

        <div className="nav-actions">
          {user ? (
            <>
              <Link
                className="button small"
                to={user.role === 'admin' ? '/admin' : '/traveler'}
              >
                {user.role === 'admin' ? 'Admin workspace' : 'My trips'}
              </Link>
              <button type="button" className="text-button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link className="button small" to="/register">
                Get started
              </Link>
            </>
          )}
        </div>
        <NavJourney />
      </header>
      {menuOpen && (
        <button
          type="button"
          className="mobile-drawer-scrim"
          aria-label="Close navigation overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
