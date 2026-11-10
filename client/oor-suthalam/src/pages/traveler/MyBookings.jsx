import BookingList from '../../components/bookings/BookingList';

export default function MyBookings() {
  return (
    <>
      <div className="page-heading">
        <small className="eyebrow">YOUR GETAWAYS</small>
        <h1>My bookings.</h1>
        <p>See the package requests you sent, check quotes and confirmation, or request a package change.</p>
      </div>

      <BookingList />
    </>
  );
}
