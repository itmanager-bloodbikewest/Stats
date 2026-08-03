// Calls into the dedicated Stats Apps Script backend. Read-only: this
// app never writes anything back to any sheet.

const STATS_API_URL = import.meta.env.VITE_STATS_API_URL;

async function callStatsApi(action, isDev) {
  const url = new URL(STATS_API_URL);
  url.searchParams.set('action', action);
  url.searchParams.set('env', isDev ? 'dev' : 'prod');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Network error contacting Stats backend (' + res.status + ')');
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

// Returns { rows: [{ metric, key, value }, ...] }.
export function getComputedStats(isDev) {
  return callStatsApi('getComputedStats', isDev);
}

// Returns { rows: [{ ...unified runs schema fields }, ...] }.
export function getRunsData(isDev) {
  return callStatsApi('getRunsData', isDev);
}
