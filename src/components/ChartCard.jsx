// Presentational shell for a dashboard card: title (optionally clickable
// to expand/collapse to full width), an optional PDF-selection checkbox,
// and a forwarded ref so the card's DOM node can be captured for PDF
// export. Expand state and selection state are owned by the parent card
// component (TopNBarChart, PieChartCard, etc.) rather than here, so each
// chart can react to its own expanded state (e.g. showing more data).
import { forwardRef } from 'react';

const ChartCard = forwardRef(function ChartCard(
  { title, expandable = true, expanded, onToggleExpand, selectable = false, selected, onToggleSelect, children },
  ref
) {
  return (
    <div ref={ref} className={expanded ? 'card card-wide' : 'card'}>
      {selectable && (
        <label className="card-select" title="Include in PDF export">
          <input type="checkbox" checked={!!selected} onChange={onToggleSelect} />
        </label>
      )}
      {expandable ? (
        <h2
          className="chart-title-clickable"
          onClick={onToggleExpand}
          title={expanded ? 'Click to collapse' : 'Click to expand'}
        >
          {title}
        </h2>
      ) : (
        <h2>{title}</h2>
      )}
      {children}
    </div>
  );
});

export default ChartCard;
