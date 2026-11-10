export function distanceKm(from, to) {
  if (
    !Number.isFinite(from?.lat) ||
    !Number.isFinite(from?.lng) ||
    !Number.isFinite(to?.lat) ||
    !Number.isFinite(to?.lng)
  )
    return null;
  const rad = (n) => (n * Math.PI) / 180;
  const a =
    Math.sin(rad(to.lat - from.lat) / 2) ** 2 +
    Math.cos(rad(from.lat)) *
      Math.cos(rad(to.lat)) *
      Math.sin(rad(to.lng - from.lng) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}
