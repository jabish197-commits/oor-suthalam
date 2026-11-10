import { useEffect, useState } from 'react';

export default function PlannerHelp() {
  const [open, setOpen] = useState(() => {
    try {
      return !sessionStorage.getItem('budget-help-seen');
    } catch {
      return true;
    }
  });
  useEffect(() => {
    if (!open) return;
    try {
      sessionStorage.setItem('budget-help-seen', '1');
    } catch {}
    const timer = setTimeout(() => setOpen(false), 8000);
    return () => clearTimeout(timer);
  }, [open]);
  return (
    <div className="planner-help">
      <button
        type="button"
        className="planner-help-toggle"
        aria-label="How budget estimates work"
        aria-expanded={open}
        aria-controls="planner-help-tip"
        onClick={() => setOpen(!open)}
      >
        i
      </button>
      {open && (
        <aside id="planner-help-tip" className="planner-help-tip" role="status">
          <button
            type="button"
            aria-label="Dismiss budget tip"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
          <strong>A quick budget tip</strong>
          <p>
            Enter your budget to get a suggested destination and trip length. Defaults are
            one traveler from Chennai, using public transport and shared rooms.
            Personalise these if needed.
          </p>
        </aside>
      )}
    </div>
  );
}
