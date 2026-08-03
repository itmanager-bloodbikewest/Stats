import { useState, useEffect } from 'react';
import { getPresetRange, RANGE_PRESETS } from '../utils/computedStats';

// Manages its own preset/custom-date state, and calls onRangeChange({start,
// end}) any time the effective range changes — start/end are "yyyy-MM-dd"
// strings or null (null on both = no filtering / "All time").
export default function DateRangeControl({ onRangeChange }) {
  const [preset, setPreset] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    if (preset === 'custom') {
      onRangeChange({ start: customStart || null, end: customEnd || null });
    } else {
      onRangeChange(getPresetRange(preset));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, customStart, customEnd]);

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
    <div className="card">
      <div className="filters">
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
    </div>
  );
}
