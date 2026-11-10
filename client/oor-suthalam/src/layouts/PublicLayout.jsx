import '../assets/assistant.css';
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import '../assets/traveler.css';
import MobileNavigation from '../components/common/MobileNavigation';
import '../assets/mobile-app.css';

export default function PublicLayout() {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const isAssistant = pathname === '/assistant';
  const isAuth = ['/login', '/register'].includes(pathname);
  if (loading) return <Loader />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return (
    <div
      className={`travel-site ${isAuth ? 'mobile-auth' : 'mobile-app'}${isAssistant ? ' assistant-mode' : ''}`}
    >
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Outlet />
      </main>
      {!isAssistant && <Footer />}
      {!isAuth && <MobileNavigation />}
      {!isAuth && pathname !== '/assistant' && (
        <Link className="travel-assistant-launcher" to="/assistant">
          Travel assistant
        </Link>
      )}
    </div>
  );
}
