import { randomUUID } from 'node:crypto';
import HttpError from '../utils/HttpError.js';

// Both package and flight requests use an explicit total for the whole party.
export function quoteHandlers(Model, { booking = false } = {}) {
  return {
    async offer(req, res) {
      const expiresAt = new Date(req.validated.expiresAt);
      if (expiresAt <= new Date())
        throw new HttpError(400, 'Quote expiry must be in the future.');
      const quote = {
        ...req.validated,
        expiresAt,
        version: randomUUID(),
        currency: 'INR',
        issuedAt: new Date(),
        status: 'offered',
      };
      const result = await Model.findOneAndUpdate(
        {
          _id: req.params.id,
          status: { $in: booking ? ['pending'] : ['pending', 'reviewed'] },
          'changeRequest.status': { $ne: 'pending' },
        },
        { $set: { quote } },
        { returnDocument: 'after', runValidators: true },
      );
      if (!result)
        throw new HttpError(
          409,
          'Request unavailable, confirmed, cancelled or awaiting a package change.',
        );
      res.json(result);
    },
    async respond(req, res) {
      if (req.user.role === 'admin')
        throw new HttpError(403, 'Only the traveler can respond to a quote.');
      const updates = {
        'quote.status': req.validated.decision,
        'quote.respondedAt': new Date(),
      };
      const filter = {
        _id: req.params.id,
        traveler: req.user._id,
        status: { $in: booking ? ['pending'] : ['pending', 'reviewed'] },
        'quote.version': req.validated.version,
        'quote.status': 'offered',
        'quote.expiresAt': { $gt: new Date() },
        'changeRequest.status': { $ne: 'pending' },
      };
      // The accepted amount is copied from the stored quote, never the browser.
      const current = await Model.findOne(filter);
      if (!current)
        throw new HttpError(
          409,
          'Quote expired, changed or already answered. Refresh the request.',
        );
      if (booking && req.validated.decision === 'accepted')
        updates.total = current.quote.total;
      const result = await Model.findOneAndUpdate(
        filter,
        { $set: updates },
        { returnDocument: 'after', runValidators: true },
      );
      if (!result)
        throw new HttpError(
          409,
          'Quote changed while responding. Refresh and try again.',
        );
      res.json(result);
    },
  };
}
