import PlannerHelp from '../../components/trips/PlannerHelp';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { tripService } from '../../services/tripService';
import { today, money } from '../../utils/format';
import useResource from '../../hooks/useResource';
import { destinationService } from '../../services/destinationService';
import Button from '../../components/common/Button';
import '../../assets/budget-planner.css';
const towns = [
  'Chennai',
  'Mamallapuram',
  'Kanchipuram',
  'Ooty',
  'Coonoor',
  'Kotagiri',
  'Kodaikanal',
  'Yercaud',
  'Yelagiri',
  'Kolli Hills',
  'Valparai',
  'Pollachi',
  'Madurai',
  'Thanjavur',
  'Tiruchirappalli',
  'Chettinad',
  'Rameswaram',
  'Tiruchendur',
  'Kanyakumari',
  'Pichavaram',
  'Tharangambadi',
  'Courtallam',
  'Hogenakkal',
  'Kumbakonam',
  'Tiruvannamalai',
  'Vellore',
];
const labels = {
  transport: 'Return travel allowance',
  stay: 'Shared rooms',
  food: 'Meals',
  localTransport: 'Local transport',
  sightseeing: 'Sightseeing allowance',
  contingency: 'Contingency (10%)',
};
export default function TripPlanner() {
  const destinations = useResource(destinationService.list);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [result, setResult] = useState(null),
    [search, setSearch] = useState(null),
    [date, setDate] = useState(today());
  async function find(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const input = {
      origin: values.origin,
      budget: Number(values.budget),
      ...(values.days ? { days: Number(values.days) } : {}),
      travelers: Number(values.travelers || 1),
      preference: values.preference,
      style: values.style,
      hiddenOnly: values.hiddenOnly === 'true',
      ...(values.destination ? { destination: values.destination } : {}),
    };
    setBusy(true);
    setError('');
    setResult(null);
    try {
      const data = await api('/trips/recommendations', { method: 'POST', body: input });
      setSearch(input);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function save(plan) {
    setBusy(true);
    setError('');
    try {
      const trip = await tripService.create({
        ...search,
        days: plan.days,
        destination: plan.destination._id,
        title: `${plan.destination.name} escape`,
        startDate: date,
      });
      navigate(`/traveler/trips/${trip._id}`);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="budget-planner">
      <div className="page-heading">
        <small className="eyebrow">TAMIL NADU · YOUR BUDGET, YOUR JOURNEY</small>
        <h1>Budget Planner</h1>
        <p>
          Tell us what you can spend. Discover short trips that fit, with every cost laid
          out.
        </p>
      </div>
      <form
        className="panel stack"
        onSubmit={find}
        onChange={() => {
          setResult(null);
          setError('');
        }}
      >
        <label className="budget-main-input">
          Your total budget (₹)
          <input
            name="budget"
            type="number"
            min="1"
            max="100000000"
            required
            placeholder="Enter your budget"
            defaultValue={params.get('budget') || ''}
          />
        </label>
        <Button busy={busy}>Suggest my trip</Button>
        <details className="budget-personalise">
          <summary>Personalise (optional)</summary>
          <div className="form-grid">
            <label>
              Starting town
              <select name="origin" defaultValue="Chennai">
                {towns.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Travelers
              <input name="travelers" type="number" min="1" max="20" defaultValue="1" />
            </label>
            <label>
              Destination
              <select name="destination" defaultValue={params.get('destination') || ''}>
                <option value="">Suggest a place for me</option>
                {destinations.data?.map((place) => (
                  <option key={place._id} value={place._id}>
                    {place.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Days
              <select name="days" defaultValue="">
                <option value="">Suggest the duration</option>
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'day' : 'days'}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Your kind of place
              <select name="preference">
                <option value="Any">Surprise me</option>
                <option value="Nature">Hills & nature</option>
                <option value="Coast">Coast</option>
                <option value="Heritage">Heritage & temples</option>
                <option value="City">City</option>
              </select>
            </label>
            <label>
              Travel style
              <select name="style">
                <option value="budget">Simple & economical</option>
                <option value="comfortable">More comfortable</option>
              </select>
            </label>
          </div>
          <label>
            Places
            <select name="hiddenOnly">
              <option value="false">All places</option>
              <option value="true">Quieter places</option>
            </select>
          </label>
        </details>
        <PlannerHelp />
      </form>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {result && (
        <section className="budget-results" aria-live="polite">
          <p className="budget-assumptions">
            Based on {result.assumptions?.travelers || search.travelers} traveler(s),
            starting from {result.assumptions?.origin || search.origin}. Change these
            under Personalise.
          </p>
          <div className="section-heading">
            <div>
              <h2>
                {result.plans.length
                  ? 'Your budget-friendly shortlist'
                  : 'Let’s adjust the plan'}
              </h2>
              <p>
                {result.plans.length
                  ? 'Nearby options first. All totals stay within your group budget.'
                  : 'No suitable plan fits these choices. Try fewer days, a nearer starting town, another category or a higher budget.'}
              </p>
            </div>
          </div>
          {!result.plans.length && result.minimumBudget && (
            <p className="notice">
              The lowest estimate for these choices is {money(result.minimumBudget)}. This
              is an estimate, not a booking price.
            </p>
          )}
          {result.plans.length > 0 && (
            <label className="budget-date">
              Departure date
              <input
                type="date"
                min={today()}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>
          )}
          <div className="budget-options">
            {result.plans.map((plan) => (
              <article className="panel stack budget-option" key={plan.destination._id}>
                {(plan.destination.image ||
                  plan.destination.gallery?.find((photo) => photo.image)?.image) && (
                  <img
                    className="budget-option-photo"
                    src={
                      plan.destination.image ||
                      plan.destination.gallery.find((photo) => photo.image).image
                    }
                    alt={plan.destination.name}
                    loading="lazy"
                  />
                )}
                <small className="eyebrow">
                  {plan.destination.hiddenGem
                    ? 'QUIETER DISCOVERY'
                    : plan.destination.category}
                </small>
                <h3>{plan.destination.name}</h3>
                <p>
                  {plan.destination.region} · {plan.days} days · {search.travelers}{' '}
                  travelers
                </p>
                <strong className="budget-total">
                  {money(plan.estimatedCost)} <small>whole group</small>
                </strong>
                <p className="success">{money(plan.remaining)} left in your budget</p>
                <p>
                  Approx. {plan.distanceKm} km each way · {plan.travelHours} hours travel
                  each way. Road conditions and actual routes may differ.
                </p>
                <dl>
                  {Object.entries(plan.costs).map(([key, value]) => (
                    <div className="summary-row" key={key}>
                      <dt>{labels[key]}</dt>
                      <dd>{money(value)}</dd>
                    </div>
                  ))}
                </dl>
                <details>
                  <summary>What you could explore</summary>
                  <ul>
                    {plan.destination.activities.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                  <p>{plan.destination.accessNote}</p>
                </details>
                <Button
                  busy={busy}
                  onClick={() => save(plan)}
                  disabled={!date || date < today()}
                >
                  Save this trip
                </Button>
              </article>
            ))}
          </div>
          <details className="budget-estimate-details">
            <summary>How estimates work</summary>
            <p>{result.estimateNote}</p>
          </details>
        </section>
      )}
    </section>
  );
}
