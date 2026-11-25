import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import useVoiceRecorder from '../../hooks/useVoiceRecorder';
import { formatDate } from '../../utils/format';

function AssistantReply({ answer }) {
  return (
    <>
      <p>{answer.text}</p>
      <details className="studio-assistant-evidence">
        <summary>View supporting data</summary>
        <dl>
          {Object.entries(answer.stats || {}).map(([key, value]) => (
            <div key={key}>
              <dt>
                {{
                  totalBookings: 'Bookings',
                  pending: 'Pending',
                  confirmed: 'Confirmed',
                  cancelled: 'Cancelled',
                  destinations: 'Destinations',
                  packages: 'Packages',
                }[key] || key}
              </dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {answer.bookings?.length > 0 ? (
          <ul>
            {answer.bookings.map((booking, index) => (
              <li key={index}>
                <strong>{booking.traveler}</strong>
                <span>
                  {booking.package} · {booking.destination}
                </span>
                <small>
                  {formatDate(booking.startDate)} · {booking.status}
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <small>No matching bookings.</small>
        )}
        <Link to="/admin/bookings">Open booking management</Link>
      </details>
    </>
  );
}
export default function AdminAssistant() {
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [turns, setTurns] = useState([]);
  const [language, setLanguage] = useState('auto');
  const latest = useRef(null);
  const recorder = useVoiceRecorder({
    onTranscript: (text) => {
      setDraft(text);
      setError('');
    },
    onError: setError,
  });
  const locked = busy || recorder.recording || recorder.transcribing || recorder.starting;
  useEffect(() => {
    if (turns.length) latest.current?.scrollIntoView({ block: 'nearest' });
  }, [turns.length]);
  async function ask(event, message = draft) {
    event?.preventDefault();
    if (!message.trim() || locked) return;
    setBusy(true);
    setError('');
    setTurns((items) => [...items.slice(-18), { role: 'user', text: message.trim() }]);
    try {
      const answer = await api('/admin/assistant', {
        method: 'POST',
        body: { message: message.trim(), replyLanguage: language },
      });
      setTurns((items) => [...items, { role: 'assistant', answer }]);
      setDraft('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="studio-admin-assistant">
      <div className="admin-page-heading">
        <div>
          <span className="studio-kicker">OOR SUTHALAM · ADMIN ASSISTANT</span>
          <h1>
            A clearer picture,
            <br />
            one question away.
          </h1>
          <p>Ask about your business. Get answers from current records.</p>
        </div>
      </div>
      <div className="studio-assistant-scope">
        <span aria-hidden="true">✦</span>
        <p>
          <strong>Your read-only operations companion</strong>
          <small>
            Looks up bookings and catalog totals. It cannot change records or send
            messages.
          </small>
        </p>
      </div>
      <div
        className="studio-admin-conversation"
        role="log"
        aria-label="Admin conversation"
        aria-live="polite"
      >
        {!turns.length && (
          <div className="studio-assistant-start">
            <span>What would you like to know?</span>
            <div>
              {[
                'Show pending bookings',
                'Who booked recently?',
                'Show dashboard totals',
              ].map((question) => (
                <button
                  type="button"
                  key={question}
                  disabled={locked}
                  onClick={() => ask(null, question)}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
        {turns.map((turn, index) => (
          <article
            key={index}
            className={`studio-admin-bubble ${turn.role}`}
            aria-label={turn.role === 'user' ? 'Your question' : 'Admin assistant reply'}
          >
            {turn.role === 'user' ? (
              <p>{turn.text}</p>
            ) : (
              <>
                <span className="studio-kicker">ADMIN ASSISTANT</span>
                <AssistantReply answer={turn.answer} />
              </>
            )}
          </article>
        ))}
        {busy && (
          <p role="status" className="studio-assistant-thinking">
            Checking your current records…
          </p>
        )}
        <span ref={latest} />
      </div>
      <form className="studio-admin-composer" onSubmit={ask}>
        {error && (
          <p className="notice error" role="alert">
            {error} Your question is still below; try again.
          </p>
        )}
        <label htmlFor="admin-assistant-question">Ask your admin assistant</label>
        <textarea
          id="admin-assistant-question"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={2000}
          rows={2}
          placeholder="For example: How many bookings need my review?"
          disabled={busy}
        />
        <div className="studio-composer-tools">
          <details>
            <summary>Language & voice</summary>
            <div>
              <label>
                Reply language
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                >
                  <option value="auto">Auto · தமிழ் / English</option>
                  <option value="en-IN">English</option>
                  <option value="ta-IN">தமிழ்</option>
                </select>
              </label>
              <button
                type="button"
                disabled={
                  busy ||
                  !recorder.supported ||
                  recorder.transcribing ||
                  recorder.starting
                }
                onClick={() => (recorder.recording ? recorder.stop() : recorder.start())}
              >
                {recorder.recording ? 'Stop recording' : 'Voice input'}
              </button>
              {(recorder.recording || recorder.transcribing) && (
                <button type="button" onClick={recorder.cancel}>
                  Cancel recording
                </button>
              )}
            </div>
          </details>
          <button
            type="submit"
            className="studio-send"
            disabled={!draft.trim() || locked}
          >
            {busy ? 'Checking…' : 'Send question'}
          </button>
        </div>
        {recorder.transcribing && (
          <small role="status">Transcribing your question…</small>
        )}
      </form>
      <p className="studio-assistant-footnote">
        This conversation stays in this page session. Responses reflect records at the
        time you ask.
      </p>
    </section>
  );
}
