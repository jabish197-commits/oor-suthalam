export default function Button({
  children,
  busy = false,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <button {...props} className={`button ${className}`} disabled={busy || disabled}>
      {busy ? 'Please wait…' : children}
    </button>
  );
}
