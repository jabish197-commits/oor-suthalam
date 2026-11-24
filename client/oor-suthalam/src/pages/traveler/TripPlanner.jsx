import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { tripService } from '../../services/tripService';
import { today, money } from '../../utils/format';
import useResource from '../../hooks/useResource';
import { destinationService } from '../../services/destinationService';
import Button from '../../components/common/Button';
import { plannerAssistantDraft } from '../../utils/plannerAssistantDraft';
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

function PlanPhoto({ destination }) {
  const photos = [
    ...new Set(
      [
        destination.image,
        ...(destination.gallery || []).map((photo) => photo.image),
      ].filter(Boolean),
    ),
  ];
  const [photoIndex, setPhotoIndex] = useState(0);
  if (!photos[photoIndex]) return null;
  return (
    <img
      className="budget-option-photo"
      src={photos[photoIndex]}
      alt={destination.name}
      loading="lazy"
      onError={() => setPhotoIndex((current) => current + 1)}
    />
  );
}

export default function TripPlanner() {
  const destinations = useResource(destinationService.list);
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [plannerInput, setPlannerInput] = useState(() => ({
    budget: params.get('budget') || '',
    origin: 'Chennai',
    travelers: '1',
    days: '',
    destination: params.get('destination') || '',
    preference: 'Any',
    style: 'budget',
    hiddenOnly: 'false',
    ...location.state?.plannerInput,
  }));
  const resultsHeading = useRef(null);
  const errorAlert = useRef(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [result, setResult] = useState(null),
    [search, setSearch] = useState(null),
    [date, setDate] = useState(today());
  useEffect(() => {
    if (error) {
      errorAlert.current?.focus({ preventScroll: true });
      errorAlert.current?.scrollIntoView({ block: 'start' });
    } else if (result) {
      resultsHeading.current?.focus({ preventScroll: true });
      resultsHeading.current?.scrollIntoView({ block: 'start' });
    }
  }, [result, error]);
  function updateInput(name, value) {
    setPlannerInput((current) => ({ ...current, [name]: value }));
    setResult(null);
    setError('');
  }
  function changeInput(event) {
    updateInput(event.target.name, event.target.value);
  }
  function openAssistant() {
    const destinationName = destinations.data?.find(
      (place) => place._id === plannerInput.destination,
    )?.name;
    navigate('/assistant', {
      state: {
        plannerDraft: plannerAssistantDraft(plannerInput, destinationName),
        plannerInput,
      },
    });
  }
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
        <small className="eyebrow">TAMIL NADU & KERALA</small>
        <h1>Plan your trip</h1>
        <p>
          Set your group budget and starting town. Compare up to three short trips that
          fit.
        </p>
        <div className="planner-assistant-entry">
          <button
            type="button"
            className="planner-assistant-action"
            onClick={openAssistant}
            disabled={busy}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
            </svg>
            Plan with travel assistant
          </button>
          <small>Your choices open as a draft. Review it before sending.</small>
        </div>
      </div>
      <form className="panel stack budget-planner-form" onSubmit={find}>
        <fieldset className="budget-step" disabled={busy}>
          <legend>
            <span aria-hidden="true">1</span> Set your budget
          </legend>
          <label className="budget-main-input">
            Total group budget (₹)
            <input
              name="budget"
              type="number"
              inputMode="numeric"
              min="1"
              max="100000000"
              required
              placeholder="For example, 10000"
              aria-describedby="budget-basis"
              value={plannerInput.budget}
              onChange={changeInput}
            />
          </label>
          <p className="budget-field-help" id="budget-basis">
            For everyone and all days combined — not per person or per day.
          </p>
          <div
            className="budget-presets"
            role="group"
            aria-label="Quick total group budgets"
          >
            {[5000, 10000, 20000].map((amount) => (
              <button
                type="button"
                key={amount}
                aria-pressed={Number(plannerInput.budget) === amount}
                onClick={() => updateInput('budget', String(amount))}
              >
                {money(amount)}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="budget-step" disabled={busy}>
          <legend>
            <span aria-hidden="true">2</span> Add your trip details
          </legend>
          <div className="form-grid">
            <label>
              Starting town
              <select
                name="origin"
                value={plannerInput.origin}
                onChange={changeInput}
                aria-describedby="budget-origin-help"
              >
                {towns.map((town) => (
                  <option key={town}>{town}</option>
                ))}
              </select>
              <small id="budget-origin-help">Used to estimate return travel.</small>
            </label>
            <label>
              Number of travelers
              <input
                name="travelers"
                type="number"
                inputMode="numeric"
                min="1"
                max="20"
                step="1"
                required
                value={plannerInput.travelers}
                onChange={changeInput}
              />
              <small>Include everyone sharing the budget.</small>
            </label>
            <label>
              Trip length
              <select
                name="days"
                value={plannerInput.days}
                onChange={changeInput}
                aria-describedby="budget-days-help"
              >
                <option value="">Suggest 1–4 days</option>
                {[1, 2, 3, 4].map((days) => (
                  <option key={days} value={days}>
                    {days} {days === 1 ? 'day' : 'days'}
                  </option>
                ))}
              </select>
              <small id="budget-days-help">
                Choose a duration or let your budget guide it.
              </small>
            </label>
          </div>
        </fieldset>
        <details className="budget-personalise">
          <summary>
            More preferences <span>(optional)</span>
          </summary>
          <fieldset className="budget-preference-fields" disabled={busy}>
            <div className="form-grid">
              <label>
                Destination
                <select
                  name="destination"
                  value={plannerInput.destination}
                  onChange={changeInput}
                >
                  <option value="">Suggest a destination</option>
                  {destinations.data?.map((place) => (
                    <option key={place._id} value={place._id}>
                      {place.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Your kind of place
                <select
                  name="preference"
                  value={plannerInput.preference}
                  onChange={changeInput}
                >
                  <option value="Any">Any type</option>
                  <option value="Nature">Hills & nature</option>
                  <option value="Coast">Coast</option>
                  <option value="Heritage">Heritage & temples</option>
                  <option value="City">City</option>
                </select>
              </label>
              <label>
                Travel style
                <select name="style" value={plannerInput.style} onChange={changeInput}>
                  <option value="budget">Simple & economical</option>
                  <option value="comfortable">More comfortable</option>
                </select>
              </label>
            </div>
            <label>
              Places
              <select
                name="hiddenOnly"
                value={plannerInput.hiddenOnly}
                onChange={changeInput}
              >
                <option value="false">All places</option>
                <option value="true">Quieter places</option>
              </select>
            </label>
          </fieldset>
        </details>
        {destinations.error && (
          <p className="budget-field-help">
            The destination list could not load. You can still ask us to suggest a place,
            or reload this page to choose one.
          </p>
        )}
        <div className="budget-submit">
          <div className="budget-choice-summary" aria-live="polite" aria-atomic="true">
            <strong>
              {Number(plannerInput.budget) > 0
                ? `${money(Number(plannerInput.budget))} total group budget`
                : 'Choose your total group budget'}
            </strong>
            <span>
              {Number(plannerInput.travelers) > 0
                ? `${plannerInput.travelers} ${Number(plannerInput.travelers) === 1 ? 'traveler' : 'travelers'}`
                : 'Set your group size'}
              {' · '}
              {plannerInput.days
                ? `${plannerInput.days} ${plannerInput.days === '1' ? 'day' : 'days'}`
                : 'Suggest 1–4 days'}
              {' · '}From {plannerInput.origin}
            </span>
          </div>
          <Button disabled={busy} aria-busy={busy}>
            {busy ? 'Finding trips…' : 'Find trips within my budget'}
          </Button>
          <p>Planning estimates only. Nothing is booked or charged.</p>
        </div>
      </form>
      {error && (
        <div
          className="notice error"
          role="alert"
          ref={errorAlert}
          tabIndex="-1"
          style={{ scrollMarginTop: 100 }}
        >
          <strong>We couldn’t complete that step.</strong>
          <p>{error}</p>
          <p>Your choices are still above. Adjust them if needed, then try again.</p>
        </div>
      )}
      {result && (
        <section className="budget-results" aria-live="polite">
          <div className="budget-assumptions">
            <strong>{money(search.budget)} group budget</strong>
            <span>
              {search.travelers} {search.travelers === 1 ? 'traveler' : 'travelers'} ·
              From {search.origin} ·{' '}
              {search.days
                ? `${search.days} ${search.days === 1 ? 'day' : 'days'}`
                : 'Duration suggested from your budget'}
            </span>
          </div>
          <div className="section-heading">
            <div>
              <h2 ref={resultsHeading} tabIndex="-1">
                {result.plans.length
                  ? 'Your budget-friendly shortlist'
                  : 'Let’s adjust the plan'}
              </h2>
              <p>
                {result.plans.length
                  ? 'Compare the full group totals below. Choose a date, then save a trip to see its itinerary.'
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
              <small>Used when you save the itinerary. No reservation is made.</small>
            </label>
          )}
          <div className="budget-options">
            {result.plans.map((plan) => (
              <article className="panel stack budget-option" key={plan.destination._id}>
                <PlanPhoto destination={plan.destination} />
                <small className="eyebrow">
                  {plan.destination.hiddenGem
                    ? 'QUIETER DISCOVERY'
                    : plan.destination.category}
                </small>
                <h3>{plan.destination.name}</h3>
                <p>
                  {plan.destination.region} · {plan.days}{' '}
                  {plan.days === 1 ? 'day' : 'days'} · {search.travelers}{' '}
                  {search.travelers === 1 ? 'traveler' : 'travelers'}
                </p>
                <strong className="budget-total">
                  {money(plan.estimatedCost)} <small>estimated group total</small>
                </strong>
                <p className="budget-per-person">
                  About{' '}
                  {money(Math.round(plan.estimatedCost / search.travelers / plan.days))}{' '}
                  per person / day, averaged across the trip.
                </p>
                <p className="success">{money(plan.remaining)} left in your budget</p>
                <p>
                  Approx. {plan.distanceKm} km each way · {plan.travelHours} hours travel
                  each way. Road conditions and actual routes may differ.
                </p>
                <details className="budget-cost-details">
                  <summary>View group cost breakdown</summary>
                  <dl>
                    {Object.entries(plan.costs).map(([key, value]) => (
                      <div className="summary-row" key={key}>
                        <dt>{labels[key] || key}</dt>
                        <dd>{money(value)}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
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
                  Save {plan.destination.name} trip
                </Button>
              </article>
            ))}
          </div>
          <details className="budget-estimate-details" open={!result.plans.length}>
            <summary>How estimates work</summary>
            <p>{result.estimateNote}</p>
          </details>
        </section>
      )}
    </section>
  );
}
