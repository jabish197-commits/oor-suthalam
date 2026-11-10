import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';

export default function ProtectedRoute({ adminOnly = false }) {
  const { user, loading, sessionError } = useAuth();
  const location = useLocation();

  if (loading) return <Loader />;

  if (sessionError) {
    return (
      <section className="page">
        <p className="notice error" role="alert">
          {sessionError}
        </p>
        <button className="button" onClick={() => window.location.reload()}>
          Retry
        </button>
      </section>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/traveler" replace />;
  }

  // Also repair an already-open overview after an account is promoted to admin.
  if (user.role === 'admin' && !adminOnly) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
