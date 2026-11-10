import InquiryReply from '../models/InquiryReply.js';
import { mailService, smtpConfigured } from '../services/mailService.js';
import HttpError from '../utils/HttpError.js';
import Inquiry from '../models/Inquiry.js';
export async function create(req, res) {
  await Inquiry.create(req.validated);
  req.app.get('realtime')?.to('admin-messages').emit('inquiries:updated');
  res.status(201).json({ success: true, message: 'Your inquiry has been received.' });
}
export async function list(_req, res) {
  res.json(await Inquiry.find().sort({ createdAt: -1 }).limit(200));
}

export function emailStatus(_req, res) {
  res.json({ configured: smtpConfigured() });
}
export async function replies(req, res) {
  res.json(
    await InquiryReply.find({ inquiry: req.params.id }).sort({ createdAt: 1 }).limit(100),
  );
}
export async function reply(req, res) {
  if (!smtpConfigured())
    throw new HttpError(
      503,
      'Configure Gmail SMTP in server/.env before sending replies.',
    );
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) throw new HttpError(404, 'Message not found.');
  const { requestId, subject, message } = req.validated;
  const previous = await InquiryReply.findOne({ requestId });
  if (previous) {
    if (String(previous.inquiry) !== req.params.id)
      throw new HttpError(409, 'Reply identifier already used.');
    return res.json({ status: previous.status });
  }
  let record;
  try {
    record = await InquiryReply.create({
      inquiry: inquiry._id,
      admin: req.user._id,
      requestId,
      subject,
      message,
    });
  } catch (error) {
    if (error.code === 11000)
      throw new HttpError(
        409,
        'This reply is already being processed. Refresh reply history before sending again.',
      );
    throw error;
  }
  let status;
  try {
    const result = await mailService.sendReply({ to: inquiry.email, subject, message });
    status = result.accepted?.length ? 'accepted' : 'failed';
  } catch (error) {
    status = ['EAUTH', 'EENVELOPE', 'ECONNECTION', 'EDNS'].includes(error.code)
      ? 'failed'
      : 'unknown';
  }
  await InquiryReply.updateOne({ _id: record._id }, { $set: { status } });
  req.app.get('realtime')?.to('admin-messages').emit('inquiries:updated');
  res.json({ status });
}

export async function markRead(req,res) {
 const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, {$set:{readAt:new Date()}}, {new:true});
 if(!inquiry) throw new HttpError(404,'Message not found.');
 req.app.get('realtime')?.to('admin-messages').emit('inquiries:updated');
 res.json(inquiry);
}
