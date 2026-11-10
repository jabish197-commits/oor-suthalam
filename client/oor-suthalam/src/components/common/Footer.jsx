import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div>
        <Link className="footer-brand" to="/">
          Oor Suthalam
        </Link>
        <p>Good places. Better memories.</p>
      </div>

      <div className="footer-links">
        <Link to="/destinations">Explore</Link>
        <Link to="/about">Our story</Link>
        <Link to="/contact">Say hello</Link>
        <small>© {new Date().getFullYear()} Oor Suthalam</small>
      </div>
    </footer>
  );
}
