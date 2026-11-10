const BASE_URL = (import.meta.env?.VITE_API_URL || '/api').replace(/\/$/, '');

export async function api(path, options = {}) {
  const { method = 'GET', body, signal, responseType = 'json' } = options;

  let response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      credentials: 'include',
      signal,
      headers:
        body === undefined
          ? {}
          : { 'Content-Type': body instanceof Blob ? body.type : 'application/json' },
      ...(body === undefined
        ? {}
        : { body: body instanceof Blob ? body : JSON.stringify(body) }),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Cannot reach the server. Please try again.');
  }

  if (response.ok && responseType === 'blob') {
    if (!response.headers.get('content-type')?.startsWith('audio/'))
      throw new Error('The server did not return playable audio.');
    return response.blob();
  }

  let data;
  let invalidJson = false;
  try {
    data = await response.json();
  } catch {
    invalidJson = true;
  }

  if (!response.ok) {
    const error = new Error(data?.message || 'Request failed.');
    error.status = response.status;
    throw error;
  }

  if (invalidJson) {
    throw new Error('The server returned an unexpected response.');
  }

  return data;
}
