import { useId } from 'react';

function FlightPath({ routeId, mobile = false }) {
  return (
    <svg
      className={mobile ? 'travel-flight-mobile' : 'travel-flight-desktop'}
      viewBox="0 0 640 160"
      fill="none"
      focusable="false"
    >
      <path
        id={routeId}
        className="travel-route"
        d={
          mobile
            ? 'M 232 98 C 340 112, 480 78, 590 45'
            : 'M 25 112 C 135 14, 210 152, 330 78 S 505 132, 615 30'
        }
      />
      <circle
        className="travel-stop"
        cx={mobile ? 232 : 25}
        cy={mobile ? 98 : 112}
        r="5"
      />
      <circle
        className="travel-stop travel-stop-end"
        cx={mobile ? 590 : 615}
        cy={mobile ? 45 : 30}
        r="5"
      />
      <g className="travel-airplane">
        <animate
          attributeName="opacity"
          values="0;1;1;0"
          keyTimes="0;0.08;0.84;1"
          dur="18s"
          repeatCount="indefinite"
        />
        <animateMotion dur="18s" repeatCount="indefinite" rotate="auto">
          <mpath href={`#${routeId}`} />
        </animateMotion>
        <image
          href="/images/travel-plane-realistic.png"
          x="-38"
          y="-38"
          width="76"
          height="76"
          preserveAspectRatio="xMidYMid meet"
        />
      </g>
    </svg>
  );
}

// Separate mobile route keeps the aircraft over the wordmark and away from the traveler.
export default function TravelAnimation() {
  const routeId = `travel-route-${useId().replace(/:/g, '')}`;

  return (
    <div className="travel-animation" aria-hidden="true">
      <FlightPath routeId={`${routeId}-desktop`} />
      <FlightPath routeId={`${routeId}-mobile`} mobile />
    </div>
  );
}
