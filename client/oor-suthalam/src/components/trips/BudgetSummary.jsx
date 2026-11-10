// client/src/components/trips/BudgetSummary.jsx
import { money } from '../../utils/format';

export default function BudgetSummary({ budget, estimatedCost, costs, estimateNote }) {
  if (!estimatedCost)
    return (
      <aside className="panel stack">
        <h3>Travel budget</h3>
        <p>
          Your budget: <strong>{money(budget)}</strong>
        </p>
        <p>
          A destination cost estimate is not available yet. Request a quote; airfare,
          accommodation and entry fees are not included in a zero-value estimate.
        </p>
      </aside>
    );
  const difference = budget - estimatedCost;

  return (
    <aside className="panel stack">
      <small className="eyebrow">YOUR TRAVEL BUDGET</small>
      <h3>A little clarity goes far.</h3>

      <div className="summary-row">
        <span>Your budget</span>
        <strong>{money(budget)}</strong>
      </div>

      <div className="summary-row">
        <span>Estimated cost</span>
        <strong>{money(estimatedCost)}</strong>
      </div>

      {costs && (
        <dl>
          {Object.entries(costs)
            .filter(([, v]) => typeof v === 'number')
            .map(([key, value]) => (
              <div className="summary-row" key={key}>
                <dt>
                  {{
                    transport: 'Return travel',
                    stay: 'Shared rooms',
                    food: 'Meals',
                    localTransport: 'Local transport',
                    sightseeing: 'Sightseeing',
                    contingency: 'Contingency',
                  }[key] || key}
                </dt>
                <dd>{money(value)}</dd>
              </div>
            ))}
        </dl>
      )}
      <hr />

      <p className={difference >= 0 ? 'success' : 'error'}>
        {difference >= 0
          ? `${money(difference)} remaining`
          : `${money(Math.abs(difference))} over budget`}
      </p>

      <small>
        {estimateNote ||
          'Planning estimate only. Actual prices and transport costs may vary.'}
      </small>
    </aside>
  );
}
