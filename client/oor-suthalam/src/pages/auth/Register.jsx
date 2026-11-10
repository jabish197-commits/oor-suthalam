import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import TravelAnimation from '../../components/common/TravelAnimation';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();

    const details = Object.fromEntries(new FormData(event.currentTarget));

    setBusy(true);
    setError('');

    try {
      await register(details);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page">
      <TravelAnimation />
      <div className="auth-intro">
        <small className="eyebrow">LET’S GET GOING</small>
        <h1>
          Your story. <em>A new setting.</em>
        </h1>
        <p>Save the places that call you. Plan the days you’ll remember.</p>
      </div>

      <form className="panel stack" onSubmit={submit}>
        <h2>Create an account</h2>

        <label>
          Your name
          <input name="name" required minLength="2" maxLength="100" autoComplete="name" />
        </label>

        <label>
          Email
          <input
            name="email"
            type="email"
            required
            maxLength="254"
            autoComplete="email"
          />
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            required
            minLength="10"
            maxLength="72"
            autoComplete="new-password"
          />
          <small>Use 10–72 characters.</small>
        </label>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <Button busy={busy}>Create my account </Button>

        <p>
          Already exploring?{' '}
          <Link className="underlined" to="/login" state={location.state}>
            Login
          </Link>
        </p>
      </form>
    </section>
  );
}
