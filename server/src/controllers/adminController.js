import User from '../models/User.js';
import Destination from '../models/Destination.js';
import Package from '../models/Package.js';
import Booking from '../models/Booking.js';
import Inquiry from '../models/Inquiry.js';

export async function overview(_req, res) {
  const [
    destinations,
    activePackages,
    travelers,
    totalInquiries,
    groups,
    recentBookings,
    recentInquiries,
  ] = await Promise.all([
    Destination.countDocuments({ active: { $ne: false }, region: /Tamil Nadu|Kerala/i }),
    Package.countDocuments({ active: true }),
    User.countDocuments({ role: 'traveler' }),
    Inquiry.countDocuments(),
    Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$total' } } },
    ]),
    Booking.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('traveler', 'name')
      .populate({
        path: 'package',
        select: 'title destination',
        populate: { path: 'destination', select: 'name' },
      }),
    Inquiry.find()
      .select('name email message createdAt')
      .sort({ createdAt: -1 })
      .limit(4),
  ]);
  const byStatus = Object.fromEntries(groups.map((group) => [group._id, group]));
  res.json({
    updatedAt: new Date().toISOString(),
    stats: {
      destinations,
      activePackages,
      travelers,
      totalInquiries,
      totalBookings: groups.reduce((total, group) => total + group.count, 0),
      pendingBookings: byStatus.pending?.count ?? 0,
      confirmedBookings: byStatus.confirmed?.count ?? 0,
      cancelledBookings: byStatus.cancelled?.count ?? 0,
      confirmedValue: byStatus.confirmed?.value ?? 0,
    },
    recentBookings,
    recentInquiries,
  });
}
