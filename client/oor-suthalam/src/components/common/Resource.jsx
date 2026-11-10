import Loader from './Loader';

export default function Resource({
  resource,
  children,
  empty = 'Nothing here yet.',
  allowEmpty = false,
}) {
  if (resource.loading) return <Loader />;

  if (resource.error) {
    return (
      <div className="notice error" role="alert">
        <p>{resource.error}</p>
        <button type="button" onClick={resource.reload}>
          Try again
        </button>
      </div>
    );
  }

  if (!allowEmpty && Array.isArray(resource.data) && resource.data.length === 0) {
    return <div className="empty-state">{empty}</div>;
  }

  return children(resource.data);
}
