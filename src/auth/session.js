// Shared SSO session, matching the bbw_session cookie used by Command
// Centre and Rota. Only { name, phone, role } are stored — never put
// large data (e.g. full rosters) in this cookie; each app fetches its
// own data separately. See project notes: storing large arrays here
// silently exceeds the ~4KB cookie limit in Chrome.

const COOKIE_NAME = 'bbw_session';
const COOKIE_DOMAIN = '.bloodbikewest.ie';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

// True when running on dev.stats.bloodbikewest.ie (or any dev.* host),
// false on stats.bloodbikewest.ie or local dev. Matches the convention
// used across all three other apps.
export function isDevEnv() {
  return window.location.hostname.startsWith('dev.');
}

export function setSession({ name, phone, role }) {
  const value = encodeURIComponent(JSON.stringify({ name, phone, role }));
  // NOTE: the `domain` attribute only takes effect when actually served
  // from a *.bloodbikewest.ie host — on localhost during development the
  // browser ignores it and the cookie is simply host-only, which is fine
  // for local testing.
  document.cookie =
    `${COOKIE_NAME}=${value}; domain=${COOKIE_DOMAIN}; path=/; ` +
    `max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function getSession() {
  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith(COOKIE_NAME + '='));
  if (!match) return null;

  try {
    const raw = match.slice(COOKIE_NAME.length + 1);
    const parsed = JSON.parse(decodeURIComponent(raw));
    if (!parsed || !parsed.phone) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession() {
  document.cookie = `${COOKIE_NAME}=; domain=${COOKIE_DOMAIN}; path=/; max-age=0`;
}
