import HttpError from '../utils/HttpError.js';
const safeError = (status, message) =>
  Object.assign(new HttpError(status, message), { expose: true });

export function pcmToWav(pcm, sampleRate = 24000) {
  if (
    !pcm.length ||
    pcm.length % 2 ||
    !Number.isInteger(sampleRate) ||
    sampleRate < 8000 ||
    sampleRate > 48000
  )
    throw safeError(503, 'The speech service returned an unsupported audio format.');
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}
export const speechService = {
  async generate(text) {
    if (!process.env.GEMINI_API_KEY)
      throw safeError(503, 'Configure Gemini to enable generated reply audio.');
    const model = process.env.GEMINI_TTS_MODEL || 'gemini-3.1-flash-tts-preview';
    if (!/^[a-zA-Z0-9.-]+$/.test(model))
      throw safeError(503, 'Speech model configuration is invalid.');
    if (!text || text.length > 8000)
      throw safeError(400, 'This reply cannot be converted to audio.');
    let response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': process.env.GEMINI_API_KEY,
          },
          signal: AbortSignal.timeout(45000),
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `Read the following reply aloud, naturally in its original language. Do not translate or add commentary.\n\n${text}`,
                  },
                ],
              },
            ],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
              },
            },
          }),
        },
      );
    } catch {
      throw safeError(
        503,
        'Reply audio could not connect. Your text reply is still available.',
      );
    }
    if (!response.ok)
      throw safeError(
        response.status === 429 ? 429 : 503,
        response.status === 429
          ? 'Reply audio quota reached. Try later; text chat still works.'
          : 'The speech model is unavailable. Try again later or read the text reply.',
      );
    const data = await response.json().catch(() => null);
    const audio = data?.candidates?.[0]?.content?.parts?.find(
      (part) => part.inlineData,
    )?.inlineData;
    if (!audio?.data || audio.data.length > 14000000)
      throw safeError(503, 'No playable reply audio was returned.');
    const bytes = Buffer.from(audio.data, 'base64');
    if (
      audio.mimeType?.startsWith('audio/wav') &&
      bytes.subarray(0, 4).toString() === 'RIFF'
    )
      return bytes;
    if (!audio.mimeType?.toLowerCase().startsWith('audio/l16'))
      throw safeError(503, 'The speech service returned an unsupported audio format.');
    const rate = Number(/rate=(\d+)/.exec(audio.mimeType)?.[1] || 24000);
    return pcmToWav(bytes, rate);
  },
};
