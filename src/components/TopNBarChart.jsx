import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { topN } from '../utils/computedStats';

export default function TopNBarChart({ title, entries, n = 10, color = 'var(--accent)' }) {
  const { top, restCount, restTotal } = topN(entries, n);
  const data = top.map(e => ({ name: e.key || '(blank)', value: e.value }));

  return (
    <div className="card">
      <h2>{title}</h2>
      {data.length === 0 ? (
        <p className="empty-note">No data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(120, data.length * 34)}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
      {restCount > 0 && (
        <p className="chart-footnote">+{restCount} more ({restTotal} run{restTotal === 1 ? '' : 's'})</p>
      )}
    </div>
  );
}
