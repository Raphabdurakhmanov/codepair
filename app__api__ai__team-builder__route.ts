import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildTeamPlan } from "@/lib/ai";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { idea?: string; locale?: string };
  const idea = String(body.idea ?? "").trim();
  if (idea.length < 15) return NextResponse.json({ error: "too short" }, { status: 400 });

  const plan = await buildTeamPlan(idea.slice(0, 2000), String(body.locale ?? "ru"));
  return NextResponse.json(plan);
}
