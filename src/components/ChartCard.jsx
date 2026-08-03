import { useState } from 'react';

// Wraps a chart in a card whose title can be clicked to toggle the card
// between its normal grid size and a full-width ("card-wide") row —
// reused by every chart type so the expand behavior stays consistent.
export default function ChartCard({ title, children }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={expanded ? 'card card-wide' : 'card'}>
      <h2
        className="chart-title-clickable"
        onClick={() => setExpanded(e => !e)}
        title={expanded ? 'Click to collapse' : 'Click to expand'}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}
