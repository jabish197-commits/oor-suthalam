import { useState } from 'react';

export default function ItineraryDay({ day }) {
  const [showPlanB, setShowPlanB] = useState(false);

  const activities = showPlanB ? day.planB : day.activities;

  return (
    <article className="itinerary-day">
      <div className="day-number">{String(day.day).padStart(2, '0')}</div>

      <div>
        <h3>
          Day {day.day} {showPlanB && '· Plan B'}
        </h3>

        <ul>
          {(activities || []).map((activity, index) => (
            <li key={`${index}-${activity}`}>{activity}</li>
          ))}
        </ul>

        <button
          type="button"
          className="text-button"
          onClick={() => setShowPlanB((value) => !value)}
        >
          {showPlanB ? 'Show original plan' : 'Weather changed? Show Plan B'}
        </button>
      </div>
    </article>
  );
}
