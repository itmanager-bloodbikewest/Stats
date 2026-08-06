import { forwardRef } from 'react';
import ChartCard from './ChartCard';

const CoverageGapsCard = forwardRef(function CoverageGapsCard(
  { entries, selectable, selected, onToggleSelect },
  ref
) {
  const count = entries.length;

  const recent = [...entries]
    .sort((a, b) => b.key.localeCompare(a.key))
    .slice(0, 8)
    .map(e => {
      const [date, shiftTime] = e.key.split('|');
      return { date, shiftTime };
    });

  return (
    <ChartCard
      ref={ref}
      title="Shift coverage gaps"
      expandable={false}
      selectable={selectable}
      selected={selected}
      onToggleSelect={onToggleSelect}
    >
      <div className="stat-figure">{count}</div>
      <p className="chart-footnote">rider shifts with nobody signed up</p>
      {recent.length > 0 && (
        <ul className="gap-list">
          {recent.map((g, i) => (
            <li key={i}>{g.date} — {g.shiftTime}</li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
});

export default CoverageGapsCard;
