/**
 * Safely parse JSON from a fetch Response.
 * @param {Response} res
 */
export async function parseApiJson(res) {
  const text = await res.text();
  if (!text.trim()) {
    return { error: res.ok ? 'Empty response from server' : `Request failed (${res.status})` };
  }
  try {
    return JSON.parse(text);
  } catch {
    return { error: 'Invalid response from server' };
  }
}
