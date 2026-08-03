// ComputedStats rows arrive as a flat list of { metric, key, value }.
// This groups them by metric into { [metric]: [{ key, value }, ...] }
// for easy lookup per chart.
export function groupByMetric(rows) {
  const map = {};
  rows.forEach(r => {
    const metric = r.metric;
    if (!map[metric]) map[metric] = [];
    map[metric].push({ key: r.key, value: Number(r.value) || 0 });
  });
  return map;
}

// Many categorical breakdowns (e.g. runs_by_item) have long tails of
// free-text values — showing all of them makes an unreadable chart.
// Keeps the top N by value, descending, and summarises the rest.
export function topN(entries, n) {
  const sorted = [...entries].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, n);
  const rest = sorted.slice(n);
  const restTotal = rest.reduce((sum, e) => sum + e.value, 0);
  return { top, restCount: rest.length, restTotal };
}

// Rolls up daily run counts (from runs_by_day) into week/month/year
// buckets, entirely client-side, so the backend only ever needs to
// compute and store the finest granularity (see ComputedStats design).
export function bucketRunsByDay(dayEntries, granularity) {
  const buckets = {};

  dayEntries.forEach(({ key, value }) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return; // skip anything unparseable
    const d = new Date(key + 'T00:00:00');
    let bucketKey;

    if (granularity === 'day') {
      bucketKey = key;
    } else if (granularity === 'week') {
      // Monday-start week, keyed by that Monday's date.
      const isoDay = (d.getDay() + 6) % 7; // 0 = Monday
      const monday = new Date(d);
      monday.setDate(d.getDate() - isoDay);
      bucketKey = monday.toISOString().slice(0, 10);
    } else if (granularity === 'year') {
      bucketKey = key.slice(0, 4);
    } else {
      bucketKey = key.slice(0, 7); // month, yyyy-MM
    }

    buckets[bucketKey] = (buckets[bucketKey] || 0) + value;
  });

  return Object.entries(buckets)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
