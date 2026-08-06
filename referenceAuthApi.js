// Calls into the shared Reference Auth Service — the single source of
// truth for individual-password auth across every BBW app (Hub, Rota,
// Command Centre, and now Stats). Stats has no auth logic of its own.
//
// Uses flat GET query params (phone, password, token, etc.) rather than
// a wrapped `data` JSON param — matches both handleRequest's own parsing
// (`params.phone || body.phone`) and the shared reset-widget.js, which
// calls this same service the same way.

const REFERENCE_AUTH_URL = import.meta.env.VITE_REFERENCE_AUTH_URL;

async function referenceAuthApi(action, params) {
  const url = new URL(REFERENCE_AUTH_URL);
  url.searchParams.set('action', action);
  Object.entries(params || {}).forEach(([k, v]) => url.searchParams.set(k, v));

  // 30s timeout — matches the equivalent auth calls in App Depot / Command
  // Centre / Rota. Without this, a slow or unresponsive request just hangs
  // "Checking session…" forever with no fallback, since fetch() has no
  // default timeout of its own.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(url.toString(), { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error('Network error contacting auth service (' + res.status + ')');
    return res.json();
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('Request timed out — check your connection');
    throw err;
  }
}

// Success: { token, user: { name, email, phone, role } } — NOTE no `ok`
// field on success, this is intentional on the service's side. Check
// `.error` for failure, `.token` for success.
export function loginWithReference(phone, password) {
  return referenceAuthApi('loginWithReference', { phone, password });
}

// { ok: true, user: {...} } or { ok: false, error }.
export function validateToken(token) {
  return referenceAuthApi('validateToken', { token });
}

// Always { ok: true }, even if the token was already invalid/missing.
export function logout(token) {
  return referenceAuthApi('logout', { token });
}
