// Shown instantly while a page loads its data.
export default function Loading() {
  return (
    <div className="stack" aria-busy="true">
      <div className="two-col">
        <div className="skeleton" style={{ height: 320 }} />
        <div className="skeleton" style={{ height: 320 }} />
      </div>
      <div className="grid">
        <div className="skeleton" style={{ height: 180 }} />
        <div className="skeleton" style={{ height: 180 }} />
        <div className="skeleton" style={{ height: 180 }} />
      </div>
    </div>
  );
}
