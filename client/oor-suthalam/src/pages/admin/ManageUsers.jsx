import { useState } from 'react';
import useResource from '../../hooks/useResource';
import { authService } from '../../services/authService';
import { formatDate } from '../../utils/format';
import Resource from '../../components/common/Resource';
import AdminIcon from '../../components/common/AdminIcon';

export default function ManageUsers() {
  const resource = useResource(authService.users);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  return (
    <>
      <div className="admin-page-heading">
        <div>
          <h1>Users</h1>
          <p>Your registered travelers and workspace administrators.</p>
        </div>
        <button
          className="admin-utility-button"
          disabled={resource.loading}
          onClick={resource.reload}
        >
          <AdminIcon name="refresh" size={16} />
          Refresh
        </button>
      </div>
      <section className="admin-card">
        <div className="admin-toolbar">
          <label className="admin-search">
            <AdminIcon name="search" size={17} />
            <input
              aria-label="Search users"
              placeholder="Search name or email…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select
            aria-label="Filter account role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="">All account types</option>
            <option value="traveler">Travelers</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
        <Resource resource={resource} empty="No registered accounts found.">
          {(users) => {
            const filtered = users.filter(
              (user) =>
                (!role || user.role === role) &&
                `${user.name} ${user.email}`
                  .toLowerCase()
                  .includes(query.trim().toLowerCase()),
            );
            return (
              <>
                <div className="admin-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Email address</th>
                        <th>Account type</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((user) => (
                        <tr key={user._id}>
                          <td>
                            <div className="admin-member">
                              <span className="admin-inquiry-avatar">
                                {user.name?.[0]?.toUpperCase() || '?'}
                              </span>
                              <strong>{user.name}</strong>
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <span className="status">
                              {user.role === 'admin' ? 'Administrator' : 'Traveler'}
                            </span>
                          </td>
                          <td>{formatDate(user.createdAt)}</td>
                        </tr>
                      ))}
                      {!filtered.length && (
                        <tr>
                          <td colSpan="4">
                            <div className="admin-empty-results">
                              <AdminIcon name="users" size={26} />
                              <h3>No matching members</h3>
                              <p>Try a different name, email, or account type.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="admin-table-meta">
                  Showing {filtered.length} of {users.length} available accounts
                </div>
              </>
            );
          }}
        </Resource>
      </section>
    </>
  );
}
