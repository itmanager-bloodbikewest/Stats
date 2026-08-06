// Calls into Command Centre's existing Apps Script backend, used only
// for login. Stats has no auth logic of its own — it reuses Command
// Centre's already-built loginWithReference (reads the shared
// USER_REFERENCE sheet) and getUserRole (reads Riders/Controllers/Admins)
// so there's a single source of truth for credentials, not a third copy
// of the auth logic.
//
// Apps Script web apps read parameters from the query string / form
// fields (e.parameter), not a JSON request body, so requests are sent
// as GET with the payload JSON-encoded into a `data` param — matching
// the pattern already used elsewhere (e.g. docket photo upload).

const CC_API_URL = import.meta.env.VITE_CC_API_URL;

async function callCcApi(action, payload) {
  const url = new URL(CC_API_URL);
  url.searchParams.set('action', action);
  url.searchParams.set('data', JSON.stringify(payload));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Network error contacting Command Centre (' + res.status + ')');
  return res.json();
}

// Returns { ok, token, user: { phone } } on success, or { error } on failure.
export function loginWithReference(phone, password) {
  return callCcApi('loginWithReference', { phone, password });
}

// Returns { found, role, name, isController, isRider, isAdmin, ... }.
export function getUserRole(phone) {
  return callCcApi('getUserRole', { phone });
}

// Password reset — 3 steps, matching Command Centre's own flow exactly:
//   1. sendResetCode({phone})                       -> { ok } (always ok, never reveals if phone exists)
//   2. verifyResetCode({phone, code})                -> { ok, resetToken } or { error }
//   3. updateReference({phone, resetToken, newPassword}) -> { ok } or { error }
export function sendResetCode(phone) {
  return callCcApi('sendResetCode', { phone });
}

export function verifyResetCode(phone, code) {
  return callCcApi('verifyResetCode', { phone, code });
}

export function setNewPassword(phone, resetToken, newPassword) {
  return callCcApi('updateReference', { phone, resetToken, newPassword });
}
