export default function SearchFilters({
  query,
  category,
  discovery,
  onQueryChange,
  onCategoryChange,
  onDiscoveryChange,
  onLocate,
  onClearLocation,
  locating,
  nearby,
}) {
  return (
    <div className="destination-filterbar">
      <label className="destination-search">
        <input
          aria-label="Search a destination"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search a destination"
        />
      </label>
      <select
        className="destination-category"
        aria-label="Category"
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        <option value="">All</option>
        <option value="Nature">Nature</option>
        <option value="Heritage">Heritage</option>
        <option value="Coast">Coast</option>
        <option value="City">City</option>
      </select>
      <details className="destination-options">
        <summary>Options</summary>
        <div>
          <label>
            Places
            <select value={discovery} onChange={(e) => onDiscoveryChange(e.target.value)}>
              <option value="">All places</option>
              <option value="true">Quieter places</option>
            </select>
          </label>
          <button
            type="button"
            className="button secondary"
            disabled={locating}
            onClick={onLocate}
          >
            {locating
              ? 'Finding location…'
              : nearby
                ? 'Refresh location'
                : 'Nearest to me'}
          </button>
          {nearby && (
            <button type="button" className="text-button" onClick={onClearLocation}>
              Clear location
            </button>
          )}
          <small>Location is used only after you choose Nearest to me.</small>
        </div>
      </details>
    </div>
  );
}
