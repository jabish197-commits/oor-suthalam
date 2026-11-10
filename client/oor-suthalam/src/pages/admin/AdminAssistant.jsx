import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import useVoiceRecorder from '../../hooks/useVoiceRecorder';
import Button from '../../components/common/Button';
import { formatDate } from '../../utils/format';
export default function AdminAssistant() {
  const [draft, setDraft] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [answer, setAnswer] = useState(null),
    [language, setLanguage] = useState('auto');
  const recorder = useVoiceRecorder({
    onTranscript: (text) => {
      setDraft(text);
      setError('');
    },
    onError: setError,
  });
  async function ask(event, message = draft) {
    event?.preventDefault();
    if (!message.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      setAnswer(
        await api('/admin/assistant', {
          method: 'POST',
          body: { message, replyLanguage: language },
        }),
      );
      setDraft('');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="admin-assistant">
      <div className="admin-page-heading">
        <div>
          <small className="eyebrow">READ-ONLY DATABASE ASSISTANT</small>
          <h1>Admin assistant</h1>
          <p>Ask about current bookings, pending requests and catalog totals.</p>
        </div>
      </div>
      <form className="panel stack" onSubmit={ask}>
        <label>
          Reply language
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="auto">Auto · தமிழ் / English</option>
            <option value="en-IN">English</option>
            <option value="ta-IN">தமிழ்</option>
          </select>
        </label>
        <label>
          Your question
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
            placeholder="How many bookings are pending?"
          />
        </label>
        <div className="admin-assistant-actions">
          <Button
            busy={busy}
            disabled={!draft.trim() || recorder.recording || recorder.transcribing}
          >
            Ask assistant
          </Button>
          <button
            type="button"
            className="button secondary"
            disabled={busy || !recorder.supported || recorder.transcribing}
            onClick={() => {
              if (recorder.recording) recorder.stop();
              else recorder.start();
            }}
          >
            {recorder.recording ? 'Stop recording' : 'Voice input'}
          </button>
          {(recorder.recording || recorder.transcribing) && (
            <button type="button" onClick={recorder.cancel}>
              Cancel recording
            </button>
          )}
        </div>
        {recorder.transcribing && (
          <small role="status">Transcribing your question…</small>
        )}
        <div className="admin-assistant-prompts">
          {['Show pending bookings', 'Who booked recently?', 'Show dashboard totals'].map(
            (q) => (
              <button
                key={q}
                type="button"
                disabled={busy || recorder.recording || recorder.transcribing}
                onClick={() => ask(null, q)}
              >
                {q}
              </button>
            ),
          )}
        </div>
      </form>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {answer && (
        <div className="panel stack" aria-live="polite">
          <p>{answer.text}</p>
          <div className="admin-assistant-stats">
            {Object.entries(answer.stats).map(([key, value]) => (
              <div key={key}>
                <small>
                  {
                    {
                      totalBookings: 'Bookings',
                      pending: 'Pending',
                      confirmed: 'Confirmed',
                      cancelled: 'Cancelled',
                      destinations: 'Destinations',
                      packages: 'Packages',
                    }[key]
                  }
                </small>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          {answer.bookings.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Traveler</th>
                    <th>Package</th>
                    <th>Travel date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {answer.bookings.map((booking, i) => (
                    <tr key={i}>
                      <td>{booking.traveler}</td>
                      <td>
                        {booking.package}
                        <small className="muted"> · {booking.destination}</small>
                      </td>
                      <td>{formatDate(booking.startDate)}</td>
                      <td>{booking.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No matching bookings.</p>
          )}
          <Link className="button secondary" to="/admin/bookings">
            Manage bookings
          </Link>
        </div>
      )}
    </section>
  );
}
