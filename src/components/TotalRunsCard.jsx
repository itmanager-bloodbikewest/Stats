import { forwardRef } from 'react';
import ChartCard from './ChartCard';

const TotalRunsCard = forwardRef(function TotalRunsCard(
  { count, selectable, selected, onToggleSelect },
  ref
) {
  return (
    <ChartCard
      ref={ref}
      title="Total runs in period"
      expandable={false}
      selectable={selectable}
      selected={selected}
      onToggleSelect={onToggleSelect}
    >
      <div className="stat-figure">{count}</div>
    </ChartCard>
  );
});

export default TotalRunsCard;
