import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty" style={{ marginTop: 48 }}>
      <h1>404</h1>
      <Link href="/dashboard">← CodePair</Link>
    </div>
  );
}
