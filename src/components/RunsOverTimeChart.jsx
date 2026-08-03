import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { bucketRunsByDay, filterEntriesByRange, getPresetRange, RANGE_PRESETS } from '../utils/computedStats';

const GRANULARITIES = ['day', 'week', 'month', 'year'];

export default function RunsOverTimeChart({ entries }) {
  const [granularity, setGranularity] = useState('month');
  const [preset, setPreset] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const { start, end } = useMemo(() => {
    if (preset === 'custom') return { start: customStart || null, end: customEnd || null };
    return getPresetRange(preset);
  }, [preset, customStart, customEnd]);

  const data = useMemo(() => {
    const filtered = filterEntriesByRange(entries, start, end);
    return bucketRunsByDay(filtered, granularity);
  }, [entries, granularity, start, end]);

  function handlePresetChange(value) {
    setPreset(value);
    if (value !== 'custom') {
      const range = getPresetRange(value);
      setCustomStart(range.start || '');
      setCustomEnd(range.end || '');
    }
  }

  function handleCustomDateChange(which, value) {
    setPreset('custom');
    if (which === 'start') setCustomStart(value);
    else setCustomEnd(value);
  }

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

      <div className="filters" style={{ marginBottom: '0.75rem' }}>
        <label>
          Date range preset
          <select value={preset} onChange={e => handlePresetChange(e.target.value)}>
            {RANGE_PRESETS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </label>
        <label>
          Start date
          <input
            type="date"
            value={customStart}
            onChange={e => handleCustomDateChange('start', e.target.value)}
          />
        </label>
        <label>
          End date
          <input
            type="date"
            value={customEnd}
            onChange={e => handleCustomDateChange('end', e.target.value)}
          />
        </label>
      </div>

      {data.length === 0 ? (
        <p className="empty-note">No data for this range.</p>
      ) : (
        <ResponsiveContainer key={granularity + start + end} width="100%" height={280}>
          <LineChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            <Line type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
