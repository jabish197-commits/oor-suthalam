export default function BookingStatus({ status }) {
  return <span className={`status ${status}`}>{status}</span>;
}
