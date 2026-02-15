export function Legend() {
  return (
    <div className="legend">
      <h3>Digital Municipality Case Map</h3>

      <div className="legend-section">
        <strong>Score (1–100)</strong>
        <div className="legend-bar" />
        <div className="legend-scale">
          <span>1 · Worst</span>
          <span>50 · Mixed</span>
          <span>100 · Best</span>
        </div>
      </div>

      <div className="legend-section">
        <strong>Markers</strong>
        <div>● Single case</div>
        <div>◯ Numbered circle = cluster</div>
      </div>

      <div className="legend-section legend-hint">
        Click a marker to explore the case.
      </div>
    </div>
  );
}
