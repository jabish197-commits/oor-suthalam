import { NavLink, Outlet } from 'react-router-dom';

const links = [
  ['/traveler', 'Overview'],
  ['/traveler/plan', 'Plan a trip'],
  ['/traveler/bookings', 'My bookings'],
  ['/partners', 'Partner workspace'],
  ['/traveler/saved', 'Saved places'],
  ['/traveler/profile', 'Profile'],
];

export default function TravelerLayout() {
  return (
    <div className="workspace">
      <aside className="sidebar">
        <small className="eyebrow">YOUR TRAVEL NOTEBOOK</small>
        <h2>Away we go.</h2>

        <nav aria-label="Traveler navigation">
          {links.map(([path, label]) => (
            <NavLink end key={path} to={path}>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <section className="workspace-content">
        <Outlet />
      </section>
    </div>
  );
}
