import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loginRedirect } from '../../utils/loginRedirect.js';
import Button from '../../components/common/Button';
import '../../assets/login.css';
import LoginVideo from '../../components/common/LoginVideo';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();

    const credentials = Object.fromEntries(new FormData(event.currentTarget));

    setBusy(true);
    setError('');

    try {
      const user = await login(credentials);

      navigate(loginRedirect(user.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="auth-page login-page">
      <LoginVideo />

      <div className="auth-intro">
        <small className="eyebrow">YOUR NEXT CHAPTER</small>
        <h1>
          A new journey
          <br />
          <em>starts here.</em>
        </h1>
        <p>Your saved places and adventures are waiting for you.</p>
      </div>

      <form className="panel stack" onSubmit={submit}>
        <div className="login-form-heading">
          <span aria-hidden="true">↗</span>
          <h2>Welcome back</h2>
          <p>Sign in to plan your next escape.</p>
        </div>

        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            required
            maxLength="72"
            autoComplete="current-password"
          />
        </label>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <Button busy={busy}>Sign in</Button>

        <p>
          New here?{' '}
          <Link className="underlined" to="/register" state={location.state}>
            Create an account
          </Link>
        </p>
      </form>
    </section>
  );
}
