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

// Keeps only entries whose date key falls within [start, end] inclusive.
// start/end are yyyy-MM-dd strings; either can be blank/null to mean
// "no lower/upper bound". String comparison works directly since the
// format is zero-padded and lexicographically sortable.
export function filterEntriesByRange(entries, start, end) {
  if (!start && !end) return entries;
  return entries.filter(({ key }) => {
    if (start && key < start) return false;
    if (end && key > end) return false;
    return true;
  });
}

function toDateKey(d) {
  return d.toISOString().slice(0, 10);
}

// Computes { start, end } (yyyy-MM-dd) for a named preset, relative to
// the real current date. Returns { start: null, end: null } for 'all'.
export function getPresetRange(preset) {
  const today = new Date();
  const todayKey = toDateKey(today);

  switch (preset) {
    case 'last7': {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { start: toDateKey(start), end: todayKey };
    }
    case 'last30': {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { start: toDateKey(start), end: todayKey };
    }
    case 'last90': {
      const start = new Date(today);
      start.setDate(start.getDate() - 89);
      return { start: toDateKey(start), end: todayKey };
    }
    case 'thisMonth': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { start: toDateKey(start), end: todayKey };
    }
    case 'lastMonth': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { start: toDateKey(start), end: toDateKey(end) };
    }
    case 'thisYear': {
      const start = new Date(today.getFullYear(), 0, 1);
      return { start: toDateKey(start), end: todayKey };
    }
    case 'lastYear': {
      const start = new Date(today.getFullYear() - 1, 0, 1);
      const end = new Date(today.getFullYear() - 1, 11, 31);
      return { start: toDateKey(start), end: toDateKey(end) };
    }
    case 'all':
    default:
      return { start: null, end: null };
  }
}

export const RANGE_PRESETS = [
  { value: 'all', label: 'All time' },
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'last90', label: 'Last 90 days' },
  { value: 'thisMonth', label: 'This month' },
  { value: 'lastMonth', label: 'Last month' },
  { value: 'thisYear', label: 'This year' },
  { value: 'lastYear', label: 'Last year' },
  { value: 'custom', label: 'Custom range' },
];

// -------------------------------------------------------------------------
// Client-side aggregation for the dashboard.
//
// The dashboard used to read pre-aggregated totals from ComputedStats, but
// those totals have no date left in them once computed server-side, so a
// date-range control couldn't filter them. Instead, the dashboard now
// fetches the raw RunsData / ShiftHistory / ShiftGaps rows (same data the
// drill-down table uses) and aggregates + filters them here, client-side,
// driven by one shared range control.
// -------------------------------------------------------------------------

// Normalizes a date-ish value (Date object, plain "yyyy-MM-dd" string,
// "dd/MM/yyyy" string, or a Sheets-corrupted ISO timestamp like
// "2017-03-30T23:00:00.000Z") into a "yyyy-MM-dd" string, using Ireland's
// calendar date rather than a raw UTC slice — that matters specifically
// for the corrupted-ISO case, where a naive UTC slice would be off by a
// day for a meaningful chunk of the year (DST). Returns '' if unparseable.
export function normalizeDateKey(value) {
  if (!value) return '';

  let d;
  if (value instanceof Date) {
    d = value;
  } else {
    const str = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str.slice(0, 10);

    const ddmmyyyy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (ddmmyyyy) {
      return ddmmyyyy[3] + '-' + ddmmyyyy[2].padStart(2, '0') + '-' + ddmmyyyy[1].padStart(2, '0');
    }

    d = new Date(str);
    if (isNaN(d.getTime())) return '';
  }

  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Dublin' }).format(d);
}

// Keeps only rows whose date (extracted via getDateValue) falls within
// [start, end] inclusive. start/end are "yyyy-MM-dd" strings or null.
export function filterByDateRange(rows, getDateValue, start, end) {
  if (!start && !end) return rows;
  return rows.filter(row => {
    const key = normalizeDateKey(getDateValue(row));
    if (!key) return false;
    if (start && key < start) return false;
    if (end && key > end) return false;
    return true;
  });
}

function incrementCount(map, key) {
  if (!key) return;
  map[key] = (map[key] || 0) + 1;
}

function splitNames(value) {
  if (!value) return [];
  return String(value).split(',').map(s => s.trim()).filter(Boolean); // comma-separated, per agreed format
}

function toEntries(map) {
  return Object.entries(map).map(([key, value]) => ({ key, value }));
}

// Mirrors the backend's computeRunsMetrics, but client-side so it can run
// against an already date-filtered subset of RunsData.
export function computeRunsBreakdowns(runsRows) {
  const byItem = {}, byOrigin = {}, byDestination = {}, byVehicle = {},
    byController = {}, byRider = {}, byMeetGroup = {};

  runsRows.forEach(r => {
    if (r.itemsTransported) incrementCount(byItem, String(r.itemsTransported).trim());
    if (r.originHospital) incrementCount(byOrigin, String(r.originHospital).trim());
    if (r.destinationHospital) incrementCount(byDestination, String(r.destinationHospital).trim());
    if (r.vehicleUsed) incrementCount(byVehicle, String(r.vehicleUsed).trim());
    if (r.controllerName) incrementCount(byController, String(r.controllerName).trim());
    if (r.meetOtherGroup) incrementCount(byMeetGroup, String(r.meetOtherGroup).trim());

    splitNames(r.riders).forEach(name => incrementCount(byRider, name));
    splitNames(r.rider2).forEach(name => incrementCount(byRider, name)); // rider2 counts too, per agreed scope
  });

  return {
    byItem: toEntries(byItem),
    byOrigin: toEntries(byOrigin),
    byDestination: toEntries(byDestination),
    byVehicle: toEntries(byVehicle),
    byController: toEntries(byController),
    byRider: toEntries(byRider),
    byMeetGroup: toEntries(byMeetGroup),
  };
}

export function computeShiftsByRider(shiftHistoryRows) {
  const byRider = {};
  shiftHistoryRows.forEach(r => {
    if (r.Role === 'rider' && r.Name) incrementCount(byRider, String(r.Name).trim());
  });
  return toEntries(byRider);
}

export function computeCoverageGapEntries(shiftGapRows) {
  return shiftGapRows
    .filter(r => r.Date && r.ShiftTime)
    .map(r => ({ key: [normalizeDateKey(r.Date), r.ShiftTime].join('|'), value: 1 }));
}
