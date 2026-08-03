export default function TotalRunsCard({ count }) {
  return (
    <div className="card">
      <h2>Total runs in period</h2>
      <div className="stat-figure">{count}</div>
    </div>
  );
}
