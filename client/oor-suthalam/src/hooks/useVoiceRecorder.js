import { useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

// Record only after a user click. Cancel discards audio without uploading it.
export default function useVoiceRecorder({ onTranscript, onError }) {
  const [starting, setStarting] = useState(false);
  const pending = useRef(false);
  const request = useRef(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const recorder = useRef(null);
  const stream = useRef(null);
  const timer = useRef(null);
  const cancelled = useRef(false);
  const active = useRef(true);
  const consent = useRef(false);
  const callbacks = useRef({ onTranscript, onError });
  callbacks.current = { onTranscript, onError };
  const supported = Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);
  function release() {
    clearTimeout(timer.current);
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
  }
  function cancel() {
    cancelled.current = true;
    request.current?.abort();
    pending.current = false;
    if (recorder.current?.state === 'recording') recorder.current.stop();
    release();
    if (active.current) {
      setRecording(false);
      setTranscribing(false);
      setStarting(false);
    }
  }
  function stop() {
    if (recorder.current?.state === 'recording') recorder.current.stop();
  }
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      cancel();
    };
  }, []);
  async function start() {
    if (!supported || pending.current || recording || transcribing) return;
    if (!consent.current) {
      if (
        !window.confirm(
          'Record up to 30 seconds? When you stop, the recording is sent to Google Gemini for transcription. Cancel recording to discard it without sending.',
        )
      )
        return;
      consent.current = true;
    }
    cancelled.current = false;
    pending.current = true;
    setStarting(true);
    try {
      const source = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!active.current || cancelled.current) {
        source.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = source;
      const mimeType = [
        'audio/webm;codecs=opus',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ].find((type) => MediaRecorder.isTypeSupported(type));
      if (!mimeType) throw new Error('unsupported-format');
      const mic = new MediaRecorder(source, { mimeType });
      recorder.current = mic;
      const chunks = [];
      mic.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      mic.onstop = async () => {
        release();
        if (!active.current) return;
        setRecording(false);
        if (cancelled.current) return;
        const audio = new Blob(chunks, { type: mimeType.split(';')[0] });
        if (!audio.size || audio.size > 4 * 1024 * 1024) {
          callbacks.current.onError(
            'Recording is empty or too large. Record a short message up to 30 seconds.',
          );
          return;
        }
        setTranscribing(true);
        const controller = new AbortController();
        request.current = controller;
        try {
          const { text } = await api('/chats/transcribe', {
            method: 'POST',
            body: audio,
            signal: controller.signal,
          });
          if (active.current && !controller.signal.aborted)
            callbacks.current.onTranscript(text);
        } catch (error) {
          if (active.current && !controller.signal.aborted)
            callbacks.current.onError(error.message);
        } finally {
          if (active.current) setTranscribing(false);
        }
      };
      mic.onerror = () => {
        cancel();
        callbacks.current.onError('Recording stopped unexpectedly. Please try again.');
      };
      mic.start();
      setRecording(true);
      pending.current = false;
      setStarting(false);
      timer.current = setTimeout(stop, 30000);
    } catch (error) {
      pending.current = false;
      if (active.current) setStarting(false);
      release();
      if (!active.current) return;
      callbacks.current.onError(
        error.name === 'NotAllowedError'
          ? 'Microphone access was denied. Allow it for this site or type your message.'
          : 'Microphone recording is unavailable. Check your microphone or use Chrome / Edge.',
      );
    }
  }
  return { starting, recording, transcribing, supported, start, stop, cancel };
}
