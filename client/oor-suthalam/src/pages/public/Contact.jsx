import { useState } from 'react';
import { api } from '../../services/api';
import Button from '../../components/common/Button';

export default function Contact() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function submit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const data = await api('/inquiries', {
        method: 'POST',
        body,
      });

      setSuccess(data.message || 'Your inquiry has been received.');
      form.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page detail-grid">
      <div>
        <small className="eyebrow">SAY HELLO</small>
        <h1>Good journeys start with a chat.</h1>
        <p className="lead">
          Have a question or a destination suggestion? Leave us a message.
        </p>
      </div>

      <form className="panel stack" onSubmit={submit}>
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
          Message
          <textarea name="message" required minLength="10" maxLength="3000" rows="6" />
        </label>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {success && (
          <p className="success" role="status">
            {success}
          </p>
        )}

        <Button busy={busy}>Send inquiry </Button>
      </form>
    </section>
  );
}
