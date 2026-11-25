import { useState } from 'react';
import '../../assets/password-field.css';

export default function PasswordField({ id, autoComplete, minLength, hint }) {
  const [visible, setVisible] = useState(false);
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className="password-field">
      <label htmlFor={id}>Password</label>
      <div className="password-field-control">
        <input
          id={id}
          name="password"
          type={visible ? 'text' : 'password'}
          required
          minLength={minLength}
          maxLength={72}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-describedby={hintId}
        />
        <button
          type="button"
          className="password-visibility"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-controls={id}
          aria-pressed={visible}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {hint && <small id={hintId}>{hint}</small>}
    </div>
  );
}
