import useResource from '../../hooks/useResource';
import { destinationService } from '../../services/destinationService';

export default function NavJourney() {
  const { data } = useResource(destinationService.list);
  const stops = (data || []).slice(0, 3);
  return (
    <div className="nav-journey" aria-hidden="true">
      {stops.map((place, index) => (
        <span
          className="nav-journey-stop"
          key={place._id}
          style={{ left: `${10 + index * 40}%` }}
        >
          <span>{place.name}</span>
          <i />
        </span>
      ))}
      <div className="nav-journey-bus">
        <svg width="42" height="20" viewBox="0 0 84 40" fill="none">
          <path d="M7 5h59c5 0 8 3 10 7l4 10v9H4V10c0-3 1-5 3-5Z" fill="currentColor" />
          <path
            d="M10 9h13v12H10zm17 0h13v12H27zm17 0h13v12H44zm17 0h7l6 12H61Z"
            fill="#f6eee0"
          />
          <path d="M7 26h68" stroke="#f6eee0" strokeWidth="2" />
          <circle cx="19" cy="31" r="7" fill="#37352f" />
          <circle cx="65" cy="31" r="7" fill="#37352f" />
          <circle cx="19" cy="31" r="3" fill="#ded1bc" />
          <circle cx="65" cy="31" r="3" fill="#ded1bc" />
        </svg>
      </div>
    </div>
  );
}
