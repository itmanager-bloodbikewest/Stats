import { useState, forwardRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { topN } from '../utils/computedStats';
import ChartCard from './ChartCard';

const PIE_COLORS = [
  'var(--accent)', 'var(--green)', 'var(--orange)', 'var(--red)',
  'var(--purple)', 'var(--accent-text)', 'var(--muted)', 'var(--border-hi)',
];

const PieChartCard = forwardRef(function PieChartCard(
  { title, entries, n = 8, selectable, selected, onToggleSelect },
  ref
) {
  const [expanded, setExpanded] = useState(false);
  const { top, restCount, restTotal } = topN(entries, n);
  const data = top.map(e => ({ name: e.key || '(blank)', value: e.value }));
  if (restCount > 0) data.push({ name: `Other (${restCount})`, value: restTotal });

  return (
    <ChartCard
      ref={ref}
      title={title}
      expanded={expanded}
      onToggleExpand={() => setExpanded(e => !e)}
      selectable={selectable}
      selected={selected}
      onToggleSelect={onToggleSelect}
    >
      {data.length === 0 ? (
        <p className="empty-note">No data yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="35%"
              cy="50%"
              outerRadius={90}
              label={({ value, percent }) => `${value} (${Math.round(percent * 100)}%)`}
              labelLine={{ stroke: 'var(--muted)' }}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }} />
            <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: 12, color: 'var(--text)' }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartCard>
  );
});

export default PieChartCard;
