import { Link } from 'react-router-dom';

export default function About() {
  return (
    <section className="page prose">
      <small className="eyebrow">OUR STORY</small>

      <h1>A little closer to somewhere new.</h1>

      <p className="lead">
        Oor Suthalam is an invitation to explore—to leave the everyday behind for a while
        and discover what’s around the next bend.
      </p>

      <p>
        Discover destinations across Tamil Nadu & Kerala, save the places you love, and turn your
        free days into a thoughtful itinerary.
      </p>

      <h2>Good plans have room to change.</h2>

      <p>
        Our trip planner includes daily activities, budget estimates, and indoor Plan B
        alternatives. Package bookings are requests that require admin confirmation.
      </p>

      <Link className="button" to="/destinations">
        Start exploring
      </Link>
    </section>
  );
}
