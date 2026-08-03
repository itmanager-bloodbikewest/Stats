import { useEffect, useState } from 'react';
import { getComputedStats } from '../api/statsApi';
import { isDevEnv } from '../auth/session';
import { groupByMetric } from '../utils/computedStats';
import RunsOverTimeChart from '../components/RunsOverTimeChart';
import TopNBarChart from '../components/TopNBarChart';
import CoverageGapsCard from '../components/CoverageGapsCard';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getComputedStats(isDevEnv())
      .then(data => { if (!cancelled) setMetrics(groupByMetric(data.rows)); })
      .catch(err => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <div className="page">
        <h1>Dashboard</h1>
        <p className="login-error">Could not load dashboard data: {error}</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="page">
        <h1>Dashboard</h1>
        <p className="empty-note">Loading…</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <div className="grid">
        <RunsOverTimeChart entries={metrics.runs_by_day || []} />
        <TopNBarChart title="Runs by item transported" entries={metrics.runs_by_item || []} />
        <TopNBarChart title="Runs by origin hospital" entries={metrics.runs_by_origin || []} />
        <TopNBarChart title="Runs by destination hospital" entries={metrics.runs_by_destination || []} />
        <TopNBarChart title="Runs by vehicle" entries={metrics.runs_by_vehicle || []} />
        <TopNBarChart title="Runs by controller" entries={metrics.runs_by_controller || []} />
        <TopNBarChart title="Runs by rider" entries={metrics.runs_by_rider || []} />
        <TopNBarChart title="Meet with other group" entries={metrics.runs_by_meetgroup || []} />
        <TopNBarChart title="Shifts by rider" entries={metrics.shifts_by_rider || []} color="var(--green)" />
        <CoverageGapsCard entries={metrics.coverage_gap || []} />
      </div>
    </div>
  );
}
