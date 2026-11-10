import '../assets/place-gallery.css';
import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminIcon from '../components/common/AdminIcon';
import '../assets/admin.css';
import { AdminMessagesProvider, useAdminMessages } from '../context/AdminMessagesContext';

const links = [
  ['/admin', 'Overview', 'overview'],
  ['/admin/assistant', 'Admin assistant', 'overview'],
  ['/admin/destinations', 'Destinations', 'destination'],
  ['/admin/packages', 'Packages', 'package'],
  ['/admin/galleries', 'Place galleries', 'destination'],
  ['/admin/appearance', 'Homepage video', 'overview'],
  ['/admin/messages', 'Messages', 'mail'],
  ['/admin/bookings', 'Bookings', 'booking'],
  ['/admin/changes', 'Package changes', 'booking'],
  ['/admin/partners', 'Travel partners', 'users'],
  ['/admin/users', 'Users', 'users'],
];

export default function AdminLayout() {
  return (
    <AdminMessagesProvider>
      <AdminWorkspace />
    </AdminMessagesProvider>
  );
}
function AdminWorkspace() {
  const { unread } = useAdminMessages();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const current = links.find(([path]) => path === location.pathname)?.[1] || 'Workspace';
  const initials = (user?.name || 'Admin')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const close = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', close);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', close);
    };
  }, [menuOpen]);

  async function signOut() {
    setBusy(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`admin-shell${menuOpen ? ' admin-menu-open' : ''}`}>
      <a className="skip-link" href="#admin-main">
        Skip to dashboard
      </a>
      {menuOpen && (
        <button
          className="admin-scrim"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <aside className="admin-sidebar" id="admin-navigation">
        <button
          className="admin-mobile-close"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        >
          <AdminIcon name="close" size={18} />
        </button>
        <Link className="admin-brand" to="/admin">
          <img src="/logo.png" alt="" />
          <span>
            Oor Suthalam<small>ADMINISTRATION</small>
          </span>
        </Link>
        <nav aria-label="Admin navigation">
          {links.map(([path, label, icon]) => (
            <NavLink end={path === '/admin'} key={path} to={path}>
              <AdminIcon name={icon} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <button className="admin-signout" onClick={signOut} disabled={busy}>
            <AdminIcon name="logout" size={18} />
            {busy ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </aside>
      <div className="admin-stage">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            <button
              className="admin-menu-toggle"
              aria-label="Toggle admin navigation"
              aria-expanded={menuOpen}
              aria-controls="admin-navigation"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <AdminIcon name="menu" />
            </button>
            <span>Workspace</span>
            <span>/</span>
            <strong>{current}</strong>
          </div>
          <div className="admin-topbar-right">
            <Link
              className={`admin-message-shortcut${location.pathname === '/admin/messages' ? ' is-active' : ''}`}
              title="Messages inbox"
              to="/admin/messages"
              aria-label="Open messages"
            >
              <AdminIcon name="mail" />
              <span>Messages</span>
              {unread > 0 && <span className="admin-count-badge">{unread}</span>}
            </Link>

            <div className="admin-profile">
              <span className="admin-avatar">{initials}</span>
              <span>
                <strong>{user?.name || 'Administrator'}</strong>
                <small>Administrator</small>
              </span>
            </div>
          </div>
        </header>
        <main className="admin-content" id="admin-main">
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
