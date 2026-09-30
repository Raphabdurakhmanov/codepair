"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="empty" style={{ marginTop: 48 }}>
      <h2>Ошибка / Error / Xato</h2>
      <p className="small">{error.message}</p>
      <button className="btn" onClick={reset}>↻</button>
    </div>
  );
}
