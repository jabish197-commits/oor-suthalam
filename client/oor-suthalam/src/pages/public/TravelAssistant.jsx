import { locationTowns } from '../../utils/locationTowns';
import useCurrentLocation from '../../hooks/useCurrentLocation';
import useVoiceRecorder from '../../hooks/useVoiceRecorder';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import useResource from '../../hooks/useResource';
import Resource from '../../components/common/Resource';
import '../../assets/assistant.css';

export default function TravelAssistant() {
  const location = useCurrentLocation();
  const history = useResource(() => api('/chats'));
  const towns = useResource(() => api('/destinations'));
  const availableTowns = [
    ...new Map(
      [...locationTowns, ...(Array.isArray(towns.data) ? towns.data : [])]
        .filter((town) => Number.isFinite(town.lat) && Number.isFinite(town.lng))
        .map((town) => [town.name, town]),
    ).values(),
  ].sort((a, b) => a.name.localeCompare(b.name));
  const [chat, setChat] = useState(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [speaking, setSpeaking] = useState(false);
  const [voice, setVoice] = useState(false);
  const [language, setLanguage] = useState('auto');
  const [showHistory, setShowHistory] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const audio = useRef(null);
  const speechCache = useRef(new Map());
  const utterances = useRef([]);
  const audioRequest = useRef(null);
  const audioUrl = useRef(null);
  const messages = useRef(null);
  const mounted = useRef(true);
  const recorder = useVoiceRecorder({
    onTranscript: (text) => {
      setDraft(text);
      setVoice(true);
      setError('');
    },
    onError: setError,
  });
  const listening = recorder.recording;
  const voiceBusy = recorder.transcribing || recorder.starting;
  const locked = busy || voiceBusy;
  useEffect(() => {
    mounted.current = true;
    const root = document.documentElement;
    root.classList.add('assistant-active');
    const viewport = window.visualViewport;
    const baselineHeight = window.innerHeight;
    const resize = () => {
      const height = viewport?.height || window.innerHeight;
      root.style.setProperty('--assistant-viewport-height', height + 'px');
      root.style.setProperty(
        '--assistant-viewport-top',
        (viewport?.offsetTop || 0) + 'px',
      );
      const typing = document.activeElement?.matches('.assistant-input-row textarea');
      root.classList.toggle(
        'assistant-keyboard-open',
        typing && Math.max(baselineHeight, window.innerHeight) - height > 100,
      );
    };
    resize();
    viewport?.addEventListener('resize', resize);
    viewport?.addEventListener('scroll', resize);
    window.addEventListener('resize', resize);
    document.addEventListener('focusin', resize);
    document.addEventListener('focusout', resize);
    return () => {
      viewport?.removeEventListener('resize', resize);
      viewport?.removeEventListener('scroll', resize);
      window.removeEventListener('resize', resize);
      document.removeEventListener('focusin', resize);
      document.removeEventListener('focusout', resize);
      root.style.removeProperty('--assistant-viewport-height');
      root.style.removeProperty('--assistant-viewport-top');
      root.classList.remove('assistant-keyboard-open', 'assistant-active');
      mounted.current = false;
      window.speechSynthesis?.cancel();
      audioRequest.current?.abort();
      audio.current?.pause();
      if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    };
  }, []);
  useEffect(() => {
    if (messages.current) messages.current.scrollTop = messages.current.scrollHeight;
  }, [chat?.messages?.length]);
  function stopVoice() {
    audioRequest.current?.abort();
    audio.current?.pause();
    if (audioUrl.current) URL.revokeObjectURL(audioUrl.current);
    audioUrl.current = null;
    recorder.cancel();
    window.speechSynthesis?.cancel();
    utterances.current = [];
    setSpeaking(false);
  }
  async function read(message, force = false, conversationId = chat?._id) {
    if (!voice && !force) return;
    stopVoice();
    setError('');
    const text = message.text;
    const lang = /[\u0B80-\u0BFF]/.test(text) ? 'ta-IN' : 'en-IN';
    const chosen = window.speechSynthesis
      ?.getVoices()
      .find((item) => item.lang.startsWith(lang.slice(0, 2)));
    if (!chosen) {
      if (
        message.privateContext &&
        (!force ||
          !window.confirm(
            'Generate audio with Google for this location-based reply? It contains distances from your current location.',
          ))
      )
        return;
      const controller = new AbortController();
      audioRequest.current = controller;
      setSpeaking(true);
      try {
        const cacheKey = `${conversationId}:${message._id}`;
        let blob = speechCache.current.get(cacheKey);
        if (!blob)
          blob = await api(`/chats/${conversationId}/speech`, {
            method: 'POST',
            body: {
              messageId: message._id,
              ...(message.privateContext ? { allowLocationAudio: true } : {}),
            },
            responseType: 'blob',
            signal: controller.signal,
          });
        if (!mounted.current || controller.signal.aborted) return;
        speechCache.current.set(cacheKey, blob);
        if (speechCache.current.size > 5)
          speechCache.current.delete(speechCache.current.keys().next().value);
        audioUrl.current = URL.createObjectURL(blob);
        const player = new Audio(audioUrl.current);
        audio.current = player;
        player.onended = () => {
          if (audio.current !== player) return;
          if (mounted.current) setSpeaking(false);
        };
        player.onerror = () => {
          if (audio.current !== player) return;
          speechCache.current.delete(cacheKey);
          if (mounted.current) {
            setSpeaking(false);
            setError('Audio playback failed. Try Listen again.');
          }
        };
        await player.play();
      } catch (err) {
        if (mounted.current && !controller.signal.aborted) {
          setSpeaking(false);
          setError(
            err.name === 'NotAllowedError'
              ? 'Audio is ready. Tap Listen again to play it.'
              : err.message,
          );
        }
      }
      return;
    }
    const chunks = text.match(/[^.!?\n]{1,220}(?:[.!?\n]|$)|.{1,220}/g) || [text];
    setSpeaking(true);
    utterances.current = [];
    window.speechSynthesis.resume();
    chunks.forEach((chunk, index) => {
      const utterance = new SpeechSynthesisUtterance(chunk);
      utterance.lang = lang;
      if (chosen) utterance.voice = chosen;
      utterance.rate = 0.95;
      utterance.onend = () => {
        if (mounted.current && index === chunks.length - 1) setSpeaking(false);
      };
      utterance.onerror = (event) => {
        if (mounted.current) {
          setSpeaking(false);
          if (!['canceled', 'interrupted'].includes(event.error))
            setError(
              'Audio playback was blocked. Use Listen on the reply, or read the text.',
            );
        }
      };
      utterances.current.push(utterance);
      window.speechSynthesis.speak(utterance);
    });
  }
  function microphone() {
    if (listening) {
      recorder.stop();
      return;
    }
    stopVoice();
    setError('');
    recorder.start();
  }
  async function open(id) {
    stopVoice();
    setBusy(true);
    setError('');
    try {
      const result = await api(`/chats/${id}`);
      if (mounted.current) {
        setChat(result);
        setDraft('');
        setShowHistory(false);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!chat || !window.confirm('Delete this conversation and its saved messages?'))
      return;
    setBusy(true);
    setError('');
    try {
      await api(`/chats/${chat._id}`, { method: 'DELETE' });
      stopVoice();
      setChat(null);
      history.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function send(event) {
    event.preventDefault();
    if (!draft.trim() || locked || listening) return;
    stopVoice();
    setBusy(true);
    setError('');
    try {
      let active = chat;
      if (!active) {
        active = await api('/chats', { method: 'POST' });
        setChat(active);
        history.reload();
      }
      const result = await api(`/chats/${active._id}/messages`, {
        method: 'POST',
        body: {
          message: draft,
          replyLanguage: language,
          ...(location.coordinates ? { location: location.coordinates } : {}),
        },
      });
      if (mounted.current) {
        setChat(result);
        setDraft('');
        history.reload();
        read(result.messages.at(-1), false, result._id);
      }
    } catch (err) {
      if (mounted.current) setError(err.message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <section className="assistant-page">
      <aside className={`assistant-history ${showHistory ? 'is-open' : ''}`}>
        <div className="assistant-history-heading">
          <strong>Your conversations</strong>
          <button
            onClick={() => setShowHistory(false)}
            className="assistant-hide-history"
            aria-label="Close chat history"
          >
            Close
          </button>
        </div>
        <button
          className="button"
          disabled={locked || listening}
          onClick={() => {
            stopVoice();
            setChat(null);
            setDraft('');
            setError('');
            setShowHistory(false);
          }}
        >
          New chat
        </button>
        <Resource resource={history} empty="Your recent chats will appear here.">
          {(items) => (
            <nav aria-label="Recent chats">
              {items.map((item) => (
                <button
                  key={item._id}
                  disabled={busy}
                  className={chat?._id === item._id ? 'is-selected' : ''}
                  onClick={() => open(item._id)}
                >
                  <strong>{item.title}</strong>
                  <small>{new Date(item.updatedAt).toLocaleDateString()}</small>
                </button>
              ))}
            </nav>
          )}
        </Resource>
      </aside>
      <div className="assistant-workspace">
        <header>
          <div>
            <small>OOR SUTHALAM</small>
            <h1>Your travel companion</h1>
            <p className="assistant-header-caption">Plan a little. Discover more.</p>
          </div>
          <div className="assistant-header-actions">
            <button
              className="assistant-show-history"
              onClick={() => setShowHistory(!showHistory)}
            >
              Chat history
            </button>
            {chat && (
              <button disabled={busy} onClick={remove}>
                Delete chat
              </button>
            )}
          </div>
        </header>
        <div
          ref={messages}
          className="assistant-messages"
          role="log"
          aria-label="Conversation"
          aria-live="polite"
        >
          {!chat?.messages?.length && (
            <div className="assistant-welcome">
              <span aria-hidden="true">✦</span>
              <h2>Welcome to Oor Suthalam</h2>
              <p>Your AI travel companion.</p>
            </div>
          )}
          {chat?.messages?.map((item, index) => (
            <article key={item._id || index} className={`assistant-bubble ${item.role}`}>
              <strong>{item.role === 'user' ? 'You' : 'Travel assistant · AI'}</strong>
              <p>{item.text}</p>
              {item.cards?.length > 0 && (
                <details className="assistant-trip-options">
                  <summary>Explore {item.cards.length} trip options</summary>
                  <div>
                    {item.cards.map((card, i) => (
                      <Link
                        key={card._id || i}
                        to={
                          card.kind === 'plan'
                            ? `/traveler/plan?budget=${card.budget}&destination=${card.destinationId}`
                            : card.kind === 'package'
                              ? `/packages/${card.packageId}`
                              : `/destinations/${card.destinationId}`
                        }
                      >
                        <strong>{card.title}</strong>
                        <small>
                          {card.days ? card.days + ' days · ' : ''}
                          {card.estimatedCost
                            ? '₹' +
                              card.estimatedCost.toLocaleString('en-IN') +
                              ' estimate'
                            : 'View itinerary'}
                        </small>
                        <span>{card.description}</span>
                      </Link>
                    ))}
                  </div>
                </details>
              )}
              {item.role === 'model' && (
                <button
                  type="button"
                  className="assistant-listen"
                  onClick={() => read(item, true)}
                  disabled={listening || speaking}
                >
                  Listen to reply
                </button>
              )}
            </article>
          ))}
          {busy && (
            <p className="assistant-thinking" role="status">
              Preparing your travel reply…
            </p>
          )}
        </div>
        <form className="assistant-composer" onSubmit={send}>
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
          {(listening || speaking) && !showOptions && (
            <button className="assistant-stop" type="button" onClick={stopVoice}>
              Stop / cancel
            </button>
          )}
          {showOptions && (
            <div
              className="assistant-voice-options assistant-settings-panel"
              id="assistant-voice-options"
              role="region"
              aria-label="Chat settings"
            >
              <header className="assistant-settings-heading">
                <strong>Make it yours</strong>
                <button
                  type="button"
                  aria-label="Close settings"
                  onClick={() => setShowOptions(false)}
                >
                  ×
                </button>
              </header>
              <section className="assistant-settings-location">
                <label className="assistant-setting-field">
                  Starting town
                  <select
                    value={location.coordinates?.label || ''}
                    onChange={(e) => {
                      const town = availableTowns.find((p) => p.name === e.target.value);
                      if (town) location.choose(town);
                      else location.clear();
                    }}
                  >
                    <option value="">Choose your town</option>
                    {availableTowns.map((town) => (
                      <option key={town.name} value={town.name}>
                        {town.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="assistant-location-actions">
                  <button
                    type="button"
                    onClick={location.locate}
                    disabled={location.loading}
                  >
                    {location.loading ? 'Locating…' : '◎ Use current location'}
                  </button>
                  {(location.coordinates || location.loading) && (
                    <button type="button" onClick={location.clear}>
                      {location.loading ? 'Cancel' : 'Clear'}
                    </button>
                  )}
                </div>
                {location.coordinates ? (
                  <small className="assistant-location-ready">
                    ✓{' '}
                    {location.coordinates.label
                      ? location.coordinates.label + ' town centre selected'
                      : 'Current location ready'}
                    . Distances are approximate.
                  </small>
                ) : (
                  <small>Choose a town to ask about nearby places and distances.</small>
                )}
                {location.error && (
                  <small className="assistant-location-hint" role="status">
                    {location.error}
                  </small>
                )}
              </section>
              <div className="assistant-settings-preferences">
                <label className="assistant-setting-field">
                  Reply language
                  <select
                    value={language}
                    onChange={(e) => {
                      stopVoice();
                      setLanguage(e.target.value);
                    }}
                  >
                    <option value="auto">Auto · தமிழ் / English</option>
                    <option value="en-IN">English</option>
                    <option value="ta-IN">தமிழ்</option>
                  </select>
                </label>
                <label className="assistant-autoplay-setting">
                  <span>
                    Read replies aloud<small>Play answers automatically</small>
                  </span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={voice}
                    onChange={(e) => {
                      setVoice(e.target.checked);
                      if (!e.target.checked) stopVoice();
                    }}
                  />
                </label>
              </div>
              {(listening || speaking) && (
                <button type="button" onClick={stopVoice}>
                  Stop voice
                </button>
              )}
              <details className="assistant-settings-privacy">
                <summary>Privacy & voice</summary>
                <p>
                  Recordings (up to 30 seconds) go to Google for transcription and are not
                  saved by this app. Chats are saved to your account and sent to Gemini.
                  Avoid passwords and payment details.
                </p>
              </details>
              <button
                className="assistant-settings-done"
                type="button"
                onClick={() => setShowOptions(false)}
              >
                Done
              </button>
            </div>
          )}
          {(listening || voiceBusy) && (
            <p className="assistant-recording-status" role="status">
              {listening ? 'Recording your message…' : 'Transcribing…'}
            </p>
          )}
          <div className="assistant-input-row">
            <textarea
              aria-label="Your message"
              placeholder="Ask about your next trip…"
              rows={1}
              maxLength={2000}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                e.target.style.height = '44px';
                e.target.style.height = Math.min(140, e.target.scrollHeight) + 'px';
              }}
              disabled={busy}
            />
            <button
              type="button"
              className="assistant-settings-button"
              aria-label="Voice and language settings"
              aria-expanded={showOptions}
              aria-controls="assistant-voice-options"
              onClick={() => setShowOptions(!showOptions)}
              title="Settings"
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
                <circle cx="8" cy="6" r="2" fill="currentColor" />
                <circle cx="16" cy="12" r="2" fill="currentColor" />
                <circle cx="10" cy="18" r="2" fill="currentColor" />
              </svg>
            </button>
            <button
              className={listening ? 'is-listening' : ''}
              type="button"
              onClick={microphone}
              disabled={!recorder.supported || locked}
              aria-label={listening ? 'Stop microphone' : 'Start microphone'}
              title="Voice input"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <rect x="9" y="2" width="6" height="12" rx="3" />
                <path d="M5 10v2a7 7 0 0014 0v-2M12 19v3M8 22h8" />
              </svg>
            </button>
            <button className="button" disabled={locked || listening || !draft.trim()}>
              Send
            </button>
          </div>
          <small>
            {listening
              ? 'Recording · tap mic to stop and transcribe'
              : voiceBusy
                ? 'Transcribing your voice…'
                : ''}
          </small>
          <div className="assistant-bottom-menu">
            <button
              type="button"
              className="assistant-suggestions-toggle"
              aria-expanded={showSuggestions}
              aria-controls="assistant-suggestions"
              onClick={() => setShowSuggestions(!showSuggestions)}
            >
              Suggestions
            </button>
            {showSuggestions && (
              <div className="assistant-suggestions" id="assistant-suggestions">
                {[
                  'Help me plan a trip',
                  'Find quieter places in Tamil Nadu & Kerala',
                  'Help me plan within my budget',
                ].map((text) => (
                  <button
                    key={text}
                    type="button"
                    disabled={locked || listening}
                    onClick={() => {
                      setDraft(text);
                      setShowSuggestions(false);
                    }}
                  >
                    {text}
                  </button>
                ))}
                <Link to="/packages">Explore packages</Link>
              </div>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
