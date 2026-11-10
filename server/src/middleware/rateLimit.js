const buckets = new Map();
const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of buckets) if (value.until <= now) buckets.delete(key);
}, 60000);
cleanup.unref();
export default (scope, limit, windowMs = 900000) =>
  (req, res, next) => {
    const key = `${scope}:${req.ip}`;
    let bucket = buckets.get(key);
    if (!bucket || bucket.until <= Date.now()) {
      bucket = { count: 0, until: Date.now() + windowMs };
      buckets.set(key, bucket);
    }
    if (++bucket.count > limit)
      return res
        .status(429)
        .json({ success: false, message: 'Too many requests. Please try later.' });
    next();
  };
