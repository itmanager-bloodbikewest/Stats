import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, ResponsiveContainer } from 'recharts';
import { topN } from '../utils/computedStats';
import ChartCard from './ChartCard';

export default function TopNBarChart({ title, entries, n = 10, color = 'var(--accent)' }) {
  const { top, restCount, restTotal } = topN(entries, n);
  const data = top.map(e => ({ name: e.key || '(blank)', value: e.value }));

  return (
    <ChartCard title={title}>
      {data.length === 0 ? (
        <p className="empty-note">No data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={Math.max(120, data.length * 34)}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 36, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
            <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 12, fill: 'var(--text)' }} />
            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]}>
              <LabelList dataKey="value" position="right" style={{ fill: 'var(--text)', fontSize: 11 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
      {restCount > 0 && (
        <p className="chart-footnote">+{restCount} more ({restTotal} run{restTotal === 1 ? '' : 's'})</p>
      )}
    </ChartCard>
  );
}
