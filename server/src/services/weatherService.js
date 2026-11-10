// Open-Meteo model estimates, cached briefly; never substitute invented weather.
const cache = new Map();
export async function currentWeather(place, tamil, request = fetch) {
  const key = `${place.lat},${place.lng}`;
  let data = cache.get(key);
  if (!data || Date.now() - data.saved > 600000) {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.search = new URLSearchParams({
      latitude: place.lat,
      longitude: place.lng,
      current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      timezone: 'Asia/Kolkata',
      forecast_days: '1',
    }).toString();
    const response = await request(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw Error('Weather provider unavailable');
    const value = await response.json();
    if (
      !Number.isFinite(value.current?.temperature_2m) ||
      !Number.isFinite(value.daily?.temperature_2m_max?.[0])
    )
      throw Error('Incomplete weather data');
    data = { value, saved: Date.now() };
    cache.set(key, data);
  }
  const { current: now, daily } = data.value;
  const code = now.weather_code;
  const condition =
    code === 0
      ? ['Clear sky', 'தெளிவான வானம்']
      : code <= 3
        ? ['Cloudy', 'மேகமூட்டம்']
        : code <= 48
          ? ['Fog', 'பனிமூட்டம்']
          : code <= 67
            ? ['Rain or drizzle', 'மழை அல்லது தூறல்']
            : code <= 77
              ? ['Snow', 'பனிப்பொழிவு']
              : code <= 86
                ? ['Showers', 'மழைப்பொழிவு']
                : ['Thunderstorms', 'இடியுடன் மழை'];
  const name = place.name;
  return tamil
    ? `${name} — இன்றைய வானிலை (${daily.time[0]})\n${condition[1]} · தற்போது ${now.temperature_2m}°C\nகுறைந்த / அதிக வெப்பநிலை: ${daily.temperature_2m_min[0]}°C / ${daily.temperature_2m_max[0]}°C\nமழை வாய்ப்பு: ${daily.precipitation_probability_max[0] ?? '—'}%\nபுதுப்பிக்கப்பட்ட நேரம்: ${now.time.replace('T', ' ')} IST\nமூலம்: Open-Meteo. இது வானிலை மாதிரி மதிப்பீடு; நிலைமை மாறலாம்.`
    : `${name} — today’s weather (${daily.time[0]})\n${condition[0]} · now ${now.temperature_2m}°C\nLow / high: ${daily.temperature_2m_min[0]}°C / ${daily.temperature_2m_max[0]}°C\nRain chance: ${daily.precipitation_probability_max[0] ?? '—'}%\nUpdated: ${now.time.replace('T', ' ')} IST\nSource: Open-Meteo. Model estimate; conditions can change.`;
}
