import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const paths = {
  home: 'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  explore: 'M21 11a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM16 7l-2 6-6 2 2-6Z',
  plan: 'M5 4h14v17H5ZM8 2v4m8-4v4M5 9h14m-7 3v6m-3-3h6',
  saved: 'M12 20s-9-5.5-9-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-9 11-9 11Z',
  bookings: 'M4 6h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4Zm11 0v3m0 3v3m0 2v1',
  profile: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',
};
export default function MobileNavigation() {
  const { user } = useAuth();
  const links = [
    ['/', 'Home', 'home'],
    ['/destinations', 'Explore', 'explore'],
    ['/traveler/plan', 'Plan trip', 'plan'],
    ['/traveler/saved', 'Saved', 'saved'],
    [user ? '/traveler/profile' : '/login', user ? 'Account' : 'Sign in', 'profile'],
  ];
  return (
    <nav className="mobile-app-nav" aria-label="Mobile app navigation">
      {links.map(([path, label, icon]) => (
        <NavLink
          key={path}
          to={path}
          end={path === '/'}
          className={icon === 'plan' ? 'mobile-plan-link' : undefined}
        >
          <span>
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={paths[icon]} />
            </svg>
          </span>
          <small>
            {label}
            {icon === 'saved' && user?.savedPlaces?.length > 0
              ? ' (' + user.savedPlaces.length + ')'
              : ''}
          </small>
        </NavLink>
      ))}
    </nav>
  );
}
