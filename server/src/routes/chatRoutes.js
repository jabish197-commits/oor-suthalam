import { travelKnowledgeService } from '../services/travelKnowledgeService.js';
import { speechService } from '../services/speechService.js';
import { id as validId } from '../validators/index.js';
import { Router, raw } from 'express';
import { transcribeAudio } from '../services/transcriptionService.js';
import Chat from '../models/ChatConversation.js';
import authenticate from '../middleware/authenticate.js';
import validateId from '../middleware/validateId.js';
import rateLimit from '../middleware/rateLimit.js';
import HttpError from '../utils/HttpError.js';
import { assistantService } from '../services/assistantService.js';
const router = Router();
router.use(authenticate);
router.param('id', validateId);
router.get('/', async (req, res) =>
  res.json(
    await Chat.find({ owner: req.user._id })
      .select('title updatedAt')
      .sort({ updatedAt: -1 })
      .limit(100),
  ),
);
router.post('/', rateLimit('chat-create', 30), async (req, res) => {
  if ((await Chat.countDocuments({ owner: req.user._id })) >= 100)
    throw new HttpError(
      409,
      'You have 100 chats. Delete an old chat before starting another.',
    );
  res.status(201).json(await Chat.create({ owner: req.user._id }));
});
router.post(
  '/transcribe',
  rateLimit('voice-transcription', 15),
  raw({ type: ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'], limit: '4mb' }),
  async (req, res) => {
    const mimeType = (req.headers['content-type'] || '').split(';')[0];
    if (
      !['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'].includes(mimeType) ||
      !Buffer.isBuffer(req.body) ||
      !req.body.length
    )
      throw new HttpError(400, 'A supported audio recording is required.');
    res.json({ text: await transcribeAudio(req.body, mimeType) });
  },
);
router.get('/:id', async (req, res) => {
  const chat = await Chat.findOne({ _id: req.params.id, owner: req.user._id });
  if (!chat) throw new HttpError(404, 'Chat not found.');
  res.json(chat);
});
router.delete('/:id', async (req, res) => {
  const result = await Chat.deleteOne({ _id: req.params.id, owner: req.user._id });
  if (!result.deletedCount) throw new HttpError(404, 'Chat not found.');
  res.json({ success: true });
});
router.post('/:id/speech', rateLimit('reply-audio', 15), async (req, res) => {
  if (!validId(req.body?.messageId))
    throw new HttpError(400, 'Choose a saved assistant reply.');
  const chat = await Chat.findOne({ _id: req.params.id, owner: req.user._id });
  if (!chat) throw new HttpError(404, 'Chat not found.');
  const message = chat.messages.find(
    (item) => String(item._id) === req.body.messageId && item.role === 'model',
  );
  if (!message) throw new HttpError(404, 'Assistant reply not found.');
  if (message.privateContext && req.body.allowLocationAudio !== true)
    throw new HttpError(
      400,
      'Confirm sharing this location-based reply with Google for audio.',
    );
  const audio = await speechService.generate(message.text);
  res.set('Cache-Control', 'no-store').type('audio/wav').send(audio);
});
router.post('/:id/messages', rateLimit('assistant', 20), async (req, res) => {
  const text = req.body?.message;
  if (typeof text !== 'string' || !text.trim() || text.length > 2000)
    throw new HttpError(400, 'Message must contain 1–2000 characters.');
  const chat = await Chat.findOne({ _id: req.params.id, owner: req.user._id });
  if (!chat) throw new HttpError(404, 'Chat not found.');
  if (chat.messages.length >= 80)
    throw new HttpError(409, 'This chat is full. Start a new conversation.');
  const next = { role: 'user', text: text.trim() };
  const replyLanguage = ['ta-IN', 'en-IN'].includes(req.body.replyLanguage)
    ? req.body.replyLanguage
    : null;
  let location;
  if (req.body.location !== undefined) {
    const value = req.body.location;
    if (
      !value ||
      !Number.isFinite(value.lat) ||
      !Number.isFinite(value.lng) ||
      Math.abs(value.lat) > 90 ||
      Math.abs(value.lng) > 180
    )
      throw new HttpError(400, 'Invalid location.');
    location = {
      lat: value.lat,
      lng: value.lng,
      ...(typeof value.label === 'string' && value.label.length <= 100
        ? { label: value.label.replace(/[<>\n\r]/g, '') }
        : {}),
    };
  }
  const grounded = await travelKnowledgeService.reply(
    [...chat.messages, next],
    replyLanguage,
    location,
  );
  const providerHistory = chat.messages.filter(
    (m, i, all) =>
      !m.privateContext && !(m.role === 'user' && all[i + 1]?.privateContext),
  );
  const answer =
    grounded?.text ||
    (await assistantService.answer([...providerHistory, next], { replyLanguage }));
  if (!chat.messages.length) chat.title = text.trim().slice(0, 80);
  chat.messages.push(next, {
    role: 'model',
    text: answer,
    cards: grounded?.cards || [],
    privateContext: grounded?.privateContext || false,
  });
  try {
    await chat.save();
  } catch (error) {
    if (error.name === 'VersionError')
      throw new HttpError(
        409,
        'This chat changed in another tab. Reopen it before sending again.',
      );
    throw error;
  }
  res.json(chat);
});
export default router;
