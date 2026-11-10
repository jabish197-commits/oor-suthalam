import '../../assets/tamil-nadu-home.css';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useResource from '../../hooks/useResource';
import { destinationService } from '../../services/destinationService';
import Resource from '../../components/common/Resource';
import DestinationCard from '../../components/destinations/DestinationCard';
import ScenicHero from '../../components/common/ScenicHero';
import useScrollReveal from '../../hooks/useScrollReveal';

export default function Home() {
  const destinations = useResource(destinationService.list);
  const revealRoot = useScrollReveal([destinations.data]);
  const navigate = useNavigate();
  const [query, setQuery] = useState(''),
    [category, setCategory] = useState('');
  function search(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (category) params.set('category', category);
    navigate(`/destinations${params.size ? '?' + params : ''}`);
  }
  const featuredNames = [
    'Chennai',
    'Kanyakumari',
    'Ooty',
    'Madurai',
    'Rameswaram',
    'Kodaikanal',
  ];
  return (
    <div ref={revealRoot} className="explore-home cinematic-home refined-home">
      <ScenicHero />
      <form id="find-escape" className="trip-finder" onSubmit={search}>
        <label>
          <span>Destination</span>
          <input
            aria-label="Search a destination"
            placeholder="Where would you like to go?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          <span>Travel style</span>
          <select
            aria-label="Choose a travel category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Any travel style</option>
            <option value="Nature">Hills & nature</option>
            <option value="Coast">Coastal escapes</option>
            <option value="Heritage">Culture & heritage</option>
            <option value="City">City breaks</option>
          </select>
        </label>
        <button className="button">Search destinations</button>
      </form>
      <section className="explore-section">
        <div className="section-heading">
          <div>
            <h2>Discover Tamil Nadu & Kerala</h2>
            <p>Choose your next stop.</p>
          </div>
          <div className="home-discovery-links">
            <Link to="/destinations">All places</Link>
            <Link to="/destinations?hidden=true">Quieter discoveries</Link>
          </div>
        </div>
        <Resource resource={destinations} empty="New destinations will appear here soon.">
          {(data) => (
            <div className="card-grid">
              {featuredNames
                .map((name) => data.find((place) => place.name === name))
                .filter(Boolean)
                .map((place) => (
                  <DestinationCard key={place._id} destination={place} />
                ))}
            </div>
          )}
        </Resource>
      </section>
    </div>
  );
}
