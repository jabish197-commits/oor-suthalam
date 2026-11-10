import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import Button from '../../components/common/Button';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function submit(event) {
    event.preventDefault();

    const body = Object.fromEntries(new FormData(event.currentTarget));

    setBusy(true);
    setError('');
    setMessage('');

    try {
      setUser(await authService.updateProfile(body));
      setMessage('Profile updated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <small className="eyebrow">A LITTLE ABOUT YOU</small>
        <h1>My profile.</h1>
      </div>

      <p>
        <Link className="button secondary" to="/traveler/bookings">
          My bookings & requests
        </Link>
      </p>
      <form className="panel stack" onSubmit={submit}>
        <label>
          Name
          <input
            name="name"
            required
            minLength="2"
            maxLength="100"
            defaultValue={user.name}
            autoComplete="name"
          />
        </label>

        <label>
          Email
          <input value={user.email} type="email" readOnly />
        </label>

        <p>
          Account type: <strong>{user.role}</strong>
        </p>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="success" role="status">
            {message}
          </p>
        )}

        <Button busy={busy}>Save changes</Button>
      </form>
    </>
  );
}
