import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function DestinationMap({ destination }) {
  const container = useRef(null);
  useEffect(() => {
    const centre = [destination.lat, destination.lng];
    const map = L.map(container.current, { scrollWheelZoom: false }).setView(centre, 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    L.circleMarker(centre, {
      radius: 9,
      color: '#ffffff',
      weight: 3,
      fillColor: '#a87539',
      fillOpacity: 1,
    }).addTo(map);
    const resize = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    resize.observe(container.current);
    return () => {
      resize.disconnect();
      map.remove();
    };
  }, [destination.lat, destination.lng]);
  return (
    <div
      ref={container}
      className="destination-map-frame"
      role="region"
      aria-label={destination.name + ' location map'}
    />
  );
}


