import { useEffect, useState, useMemo, useCallback } from 'react';
import { getRunsData, getShiftData } from '../api/statsApi';
import { isDevEnv } from '../auth/session';
import {
  filterByDateRange,
  computeRunsBreakdowns,
  computeShiftsByRider,
  computeCoverageGapEntries,
} from '../utils/computedStats';
import DateRangeControl from '../components/DateRangeControl';
import TopNBarChart from '../components/TopNBarChart';
import PieChartCard from '../components/PieChartCard';
import TotalRunsCard from '../components/TotalRunsCard';
import CoverageGapsCard from '../components/CoverageGapsCard';

export default function DashboardPage() {
  const [runsRows, setRunsRows] = useState(null);
  const [shiftHistoryRows, setShiftHistoryRows] = useState(null);
  const [shiftGapRows, setShiftGapRows] = useState(null);
  const [error, setError] = useState('');
  const [range, setRange] = useState({ start: null, end: null });

  const handleRangeChange = useCallback(range => setRange(range), []);

  useEffect(() => {
    let cancelled = false;
    const dev = isDevEnv();

    Promise.all([getRunsData(dev), getShiftData(dev)])
      .then(([runsData, shiftData]) => {
        if (cancelled) return;
        setRunsRows(runsData.rows);
        setShiftHistoryRows(shiftData.shiftHistory);
        setShiftGapRows(shiftData.shiftGaps);
      })
      .catch(err => { if (!cancelled) setError(err.message); });

    return () => { cancelled = true; };
  }, []);

  const filteredRuns = useMemo(() => {
    if (!runsRows) return null;
    return filterByDateRange(runsRows, r => r.transportDate, range.start, range.end);
  }, [runsRows, range]);

  const breakdowns = useMemo(() => {
    if (!filteredRuns) return null;
    return computeRunsBreakdowns(filteredRuns);
  }, [filteredRuns]);

  const shiftsByRider = useMemo(() => {
    if (!shiftHistoryRows) return null;
    const filtered = filterByDateRange(shiftHistoryRows, r => r.Date, range.start, range.end);
    return computeShiftsByRider(filtered);
  }, [shiftHistoryRows, range]);

  const coverageGaps = useMemo(() => {
    if (!shiftGapRows) return null;
    const filtered = filterByDateRange(shiftGapRows, r => r.Date, range.start, range.end);
    return computeCoverageGapEntries(filtered);
  }, [shiftGapRows, range]);

  if (error) {
    return (
      <div className="page">
        <h1>Dashboard</h1>
        <p className="login-error">Could not load dashboard data: {error}</p>
      </div>
    );
  }

  const loading = !filteredRuns || !breakdowns || !shiftsByRider || !coverageGaps;

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <DateRangeControl onRangeChange={handleRangeChange} />

      {loading ? (
        <p className="empty-note">Loading…</p>
      ) : (
        <div className="grid">
          <TotalRunsCard count={filteredRuns.length} />
          <TopNBarChart title="Runs by item transported" entries={breakdowns.byItem} />
          <TopNBarChart title="Runs by origin hospital" entries={breakdowns.byOrigin} />
          <TopNBarChart title="Runs by destination hospital" entries={breakdowns.byDestination} />
          <PieChartCard title="Runs by vehicle" entries={breakdowns.byVehicle} />
          <PieChartCard title="Runs by controller" entries={breakdowns.byController} />
          <PieChartCard title="Meet with other group" entries={breakdowns.byMeetGroup} />
          <TopNBarChart title="Runs by rider" entries={breakdowns.byRider} />

          <div className="shift-row card-wide">
            <TopNBarChart title="Shifts by rider" entries={shiftsByRider} color="var(--green)" />
            <CoverageGapsCard entries={coverageGaps} />
          </div>
        </div>
      )}
    </div>
  );
}
