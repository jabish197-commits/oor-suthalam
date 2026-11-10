import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/common/Loader';
import { loginRedirect } from '../utils/loginRedirect';

// Wait for the cookie session before deciding whether to show an auth form.
export default function GuestRoute() {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;
  if (user) {
    return <Navigate to={loginRedirect(user.role)} replace />;
  }

  return <Outlet />;
}
