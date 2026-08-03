import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { bucketRunsByDay } from '../utils/computedStats';

const GRANULARITIES = ['day', 'week', 'month', 'year'];

export default function RunsOverTimeChart({ entries }) {
  const [granularity, setGranularity] = useState('month');
  const data = useMemo(() => bucketRunsByDay(entries, granularity), [entries, granularity]);

  return (
    <div className="card card-wide">
      <div className="card-header-row">
        <h2>Total runs over time</h2>
        <div className="granularity-toggle">
          {GRANULARITIES.map(g => (
            <button
              key={g}
              type="button"
              className={g === granularity ? 'toggle-btn active' : 'toggle-btn'}
              onClick={() => setGranularity(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </div>
      {data.length === 0 ? (
        <p className="empty-note">No data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
