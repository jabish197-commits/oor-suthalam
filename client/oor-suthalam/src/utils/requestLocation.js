// A second accuracy mode can help devices whose network location is unavailable.
// Permission denial is final; do not repeatedly trigger permission prompts.
export async function requestLocation(geolocation) {
  const attempt = (enableHighAccuracy) =>
    new Promise((resolve, reject) => {
      geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy,
        timeout: 8000,
        maximumAge: 60000,
      });
    });
  try {
    return await attempt(false);
  } catch (error) {
    if (error.code === 1) throw error;
    return attempt(true);
  }
}
