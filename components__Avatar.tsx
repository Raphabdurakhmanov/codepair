export default function Avatar({ name, url, large }: { name: string; url?: string | null; large?: boolean }) {
  const cls = `avatar${large ? " avatar-lg" : ""}`;
  if (url) return <img className={cls} src={url} alt="" />;
  const initials = (name || "?")
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return <span className={cls}>{initials}</span>;
}
