import type { Member } from "@/lib/data";
import Avatar from "./Avatar";

/** Small overlapping avatars of a team: "(A)(B)(C) +2". */
export default function MemberStack({ members, max = 5 }: { members: Member[]; max?: number }) {
  if (members.length === 0) return null;
  const shown = members.slice(0, max);
  const names = members.map((m) => m.profile?.full_name || "—").join(", ");
  return (
    <span className="avatar-stack" title={names}>
      {shown.map((m) => (
        <Avatar key={m.user_id} name={m.profile?.full_name ?? ""} url={m.profile?.avatar_url} />
      ))}
      {members.length > max && <span className="more">+{members.length - max}</span>}
    </span>
  );
}
