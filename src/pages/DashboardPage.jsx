import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { getRunsData, getShiftData } from '../api/statsApi';
import { isDevEnv } from '../auth/session';
import {
  filterByDateRange,
  computeRunsBreakdowns,
  computeShiftsByRider,
  computeCoverageGapEntries,
} from '../utils/computedStats';
import { exportCardsToPdf } from '../utils/exportPdf';
import DateRangeControl from '../components/DateRangeControl';
import TopNBarChart from '../components/TopNBarChart';
import PieChartCard from '../components/PieChartCard';
import TotalRunsCard from '../components/TotalRunsCard';
import CoverageGapsCard from '../components/CoverageGapsCard';

// Fixed display order for every selectable summary card — used both for
// rendering and for PDF export, so the PDF always follows the same
// top-to-bottom order as the dashboard regardless of the order cards
// were selected in.
const CARD_ORDER = [
  'total-runs', 'by-item', 'by-origin', 'by-destination',
  'by-vehicle', 'by-controller', 'by-meetgroup', 'by-rider',
  'shifts-by-rider', 'coverage-gaps',
];

export default function DashboardPage() {
  const [runsRows, setRunsRows] = useState(null);
  const [shiftHistoryRows, setShiftHistoryRows] = useState(null);
  const [shiftGapRows, setShiftGapRows] = useState(null);
  const [error, setError] = useState('');
  const [range, setRange] = useState({ start: null, end: null });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [pdfStatus, setPdfStatus] = useState(''); // '', 'generating', 'error'

  const cardNodes = useRef({});
  const setCardRef = useCallback(id => node => { cardNodes.current[id] = node; }, []);

  const handleRangeChange = useCallback(range => setRange(range), []);

  function toggleSelected(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(CARD_ORDER));
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function handleCreatePdf() {
    setPdfStatus('generating');
    try {
      const orderedSelected = CARD_ORDER.filter(id => selectedIds.has(id));
      const placed = await exportCardsToPdf(orderedSelected, cardNodes.current, 'bbw-stats-summary.pdf');
      setPdfStatus(placed ? '' : 'error');
    } catch (err) {
      console.error('PDF export failed:', err);
      setPdfStatus('error');
    } finally {
      setPdfStatus('');
    }
  }

  useEffect(() => {
    let cancelled = false;
    const dev = isDevEnv();

    Promise.all([getRunsData(dev), getShiftData(dev)])
      .then(([runsData, shiftData]) => {
        if (cancelled) return;
        setRunsRows(runsData.rows);
        setShiftHistoryRows(shiftData.shiftHistory);
        setShiftGapRows(shiftData.shiftGaps);
      })
      .catch(err => { if (!cancelled) setError(err.message); });

    return () => { cancelled = true; };
  }, []);

  const filteredRuns = useMemo(() => {
    if (!runsRows) return null;
    return filterByDateRange(runsRows, r => r.transportDate, range.start, range.end);
  }, [runsRows, range]);

  const breakdowns = useMemo(() => {
    if (!filteredRuns) return null;
    return computeRunsBreakdowns(filteredRuns);
  }, [filteredRuns]);

  const shiftsByRider = useMemo(() => {
    if (!shiftHistoryRows) return null;
    const filtered = filterByDateRange(shiftHistoryRows, r => r.Date, range.start, range.end);
    return computeShiftsByRider(filtered);
  }, [shiftHistoryRows, range]);

  const coverageGaps = useMemo(() => {
    if (!shiftGapRows) return null;
    const filtered = filterByDateRange(shiftGapRows, r => r.Date, range.start, range.end);
    return computeCoverageGapEntries(filtered);
  }, [shiftGapRows, range]);

  if (error) {
    return (
      <div className="page">
        <h1>Dashboard</h1>
        <p className="login-error">Could not load dashboard data: {error}</p>
      </div>
    );
  }

  const loading = !filteredRuns || !breakdowns || !shiftsByRider || !coverageGaps;

  const selectProps = id => ({
    selectable: true,
    selected: selectedIds.has(id),
    onToggleSelect: () => toggleSelected(id),
  });

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <DateRangeControl onRangeChange={handleRangeChange} />

      {!loading && (
        <div className="card pdf-toolbar">
          <span className="pdf-toolbar-count">
            {selectedIds.size} of {CARD_ORDER.length} cards selected for PDF
          </span>
          <button type="button" className="button-secondary" onClick={selectAll}>Select all</button>
          <button type="button" className="button-secondary" onClick={clearSelection}>Clear</button>
          <button
            type="button"
            className="login-button"
            style={{ marginTop: 0 }}
            disabled={selectedIds.size === 0 || pdfStatus === 'generating'}
            onClick={handleCreatePdf}
          >
            {pdfStatus === 'generating' ? 'Creating PDF…' : 'Create PDF'}
          </button>
        </div>
      )}
      {pdfStatus === 'error' && (
        <p className="login-error">Something went wrong creating the PDF. Please try again.</p>
      )}

      {loading ? (
        <p className="empty-note">Loading…</p>
      ) : (
        <div className="grid">
          <TotalRunsCard ref={setCardRef('total-runs')} count={filteredRuns.length} {...selectProps('total-runs')} />
          <TopNBarChart ref={setCardRef('by-item')} title="Runs by item transported" entries={breakdowns.byItem} {...selectProps('by-item')} />
          <TopNBarChart ref={setCardRef('by-origin')} title="Runs by origin hospital" entries={breakdowns.byOrigin} {...selectProps('by-origin')} />
          <TopNBarChart ref={setCardRef('by-destination')} title="Runs by destination hospital" entries={breakdowns.byDestination} {...selectProps('by-destination')} />
          <PieChartCard ref={setCardRef('by-vehicle')} title="Runs by vehicle" entries={breakdowns.byVehicle} {...selectProps('by-vehicle')} />
          <PieChartCard ref={setCardRef('by-controller')} title="Runs by controller" entries={breakdowns.byController} {...selectProps('by-controller')} />
          <PieChartCard ref={setCardRef('by-meetgroup')} title="Meet with other group" entries={breakdowns.byMeetGroup} {...selectProps('by-meetgroup')} />
          <TopNBarChart ref={setCardRef('by-rider')} title="Runs by rider" entries={breakdowns.byRider} {...selectProps('by-rider')} />

          <div className="shift-row card-wide">
            <TopNBarChart ref={setCardRef('shifts-by-rider')} title="Shifts by rider" entries={shiftsByRider} color="var(--green)" {...selectProps('shifts-by-rider')} />
            <CoverageGapsCard ref={setCardRef('coverage-gaps')} entries={coverageGaps} {...selectProps('coverage-gaps')} />
          </div>
        </div>
      )}
    </div>
  );
}
