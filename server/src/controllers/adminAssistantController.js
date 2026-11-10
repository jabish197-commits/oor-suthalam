import Booking from '../models/Booking.js';
import Destination from '../models/Destination.js';
import Package from '../models/Package.js';
import HttpError from '../utils/HttpError.js';
// Read-only queries. No customer data or admin questions are sent to an AI provider.
export async function adminAssistant(req, res) {
  const message = req.body?.message;
  if (typeof message !== 'string' || !message.trim() || message.length > 2000)
    throw new HttpError(400, 'Enter a question up to 2000 characters.');
  const tamil =
    req.body.replyLanguage === 'ta-IN' ||
    (!['ta-IN', 'en-IN'].includes(req.body.replyLanguage) &&
      /[\u0B80-\u0BFF]/.test(message));
  const status = /pending|நிலுவை|பெண்டிங்/i.test(message)
    ? 'pending'
    : /cancel|ரத்து/i.test(message)
      ? 'cancelled'
      : /confirm|உறுதி/i.test(message)
        ? 'confirmed'
        : null;
  const [groups, destinations, packages, bookings] = await Promise.all([
    Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Destination.countDocuments({ active: { $ne: false }, region: /Tamil Nadu|Kerala/i }),
    Package.countDocuments({ active: true, travelType: { $ne: 'flight' } }),
    Booking.find(status ? { status } : {})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('traveler', 'name')
      .populate({
        path: 'package',
        select: 'title destination',
        populate: { path: 'destination', select: 'name' },
      }),
  ]);
  const counts = Object.fromEntries(groups.map((group) => [group._id, group.count]));
  const stats = {
    totalBookings: groups.reduce((n, g) => n + g.count, 0),
    pending: counts.pending || 0,
    confirmed: counts.confirmed || 0,
    cancelled: counts.cancelled || 0,
    destinations,
    packages,
  };
  const text = tamil
    ? `தற்போதைய database விவரம்: மொத்தம் ${stats.totalBookings} bookings. நிலுவை ${stats.pending}, உறுதி ${stats.confirmed}, ரத்து ${stats.cancelled}. ${destinations} இடங்கள் மற்றும் ${packages} packages உள்ளன. ${status ? 'நீங்கள் கேட்ட நிலையின்' : 'சமீபத்திய'} அதிகபட்சம் 10 bookings கீழே உள்ளன. இது படித்து காட்டும் உதவி மட்டுமே; எந்த booking-யும் மாற்றப்படவில்லை.`
    : `Current database: ${stats.totalBookings} bookings — ${stats.pending} pending, ${stats.confirmed} confirmed and ${stats.cancelled} cancelled. ${destinations} destinations and ${packages} active packages. Showing up to 10 ${status || 'latest'} bookings below. This assistant is read-only; no booking was changed.`;
  res
    .set('Cache-Control', 'no-store')
    .json({
      text,
      stats,
      updatedAt: new Date(),
      bookings: bookings.map((b) => ({
        traveler: b.traveler?.name || 'Unavailable account',
        package: b.package?.title || 'Archived package',
        destination: b.package?.destination?.name || '',
        startDate: b.startDate,
        travelers: b.travelers,
        status: b.status,
      })),
    });
}
