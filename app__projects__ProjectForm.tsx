"use client";

import { useState } from "react";
import ChipGroup, { type ChipOption } from "@/components/ChipGroup";

export interface ProjectFormValues {
  id?: string;
  title: string;
  description: string;
  tech: string[];
  interests: string[];
  needed_roles: string[];
  deadline: string;
  chat_link: string;
  repo_url: string;
  result_url: string;
  status?: string;
}

export interface ProjectFormText {
  title: string;
  titlePh: string;
  description: string;
  descPh: string;
  tech: string;
  interests: string;
  neededRoles: string;
  deadline: string;
  chatLink: string;
  chatLinkPh: string;
  repoUrl: string;
  resultUrl: string;
  submit: string;
  status: string;
  optional: string;
  ai: { title: string; hint: string; placeholder: string; button: string; working: string; applied: string; fallback: string; tooShort: string };
  error: string;
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export default function ProjectForm({
  action,
  initial,
  text,
  roleOptions,
  skillOptions,
  interestOptions,
  statusOptions,
  locale,
}: {
  action: (fd: FormData) => Promise<void>;
  initial: ProjectFormValues;
  text: ProjectFormText;
  roleOptions: ChipOption[];
  skillOptions: ChipOption[];
  interestOptions: ChipOption[];
  statusOptions?: ChipOption[];
  locale: string;
}) {
  const [v, setV] = useState<ProjectFormValues>(initial);
  const [idea, setIdea] = useState("");
  const [aiState, setAiState] = useState<"idle" | "busy" | "done" | "fallback" | "error" | "short">("idle");
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof ProjectFormValues>(k: K, val: ProjectFormValues[K]) => setV((p) => ({ ...p, [k]: val }));

  async function runAI() {
    if (idea.trim().length < 15) return setAiState("short");
    setAiState("busy");
    try {
      const res = await fetch("/api/ai/team-builder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea, locale }),
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as {
        title: string;
        description: string;
        needed_roles: string[];
        tech: string[];
        interests: string[];
        source: "ai" | "fallback";
      };
      setV((p) => ({
        ...p,
        title: p.title || data.title,
        description: p.description || data.description,
        needed_roles: data.needed_roles,
        tech: data.tech,
        interests: data.interests,
      }));
      setAiState(data.source === "ai" ? "done" : "fallback");
    } catch {
      setAiState("error");
    }
  }

  return (
    <div className="stack">
      {!initial.id && (
        <div className="card notice">
          <h3>✨ {text.ai.title}</h3>
          <p className="small">{text.ai.hint}</p>
          <textarea value={idea} onChange={(e) => setIdea(e.target.value)} placeholder={text.ai.placeholder} maxLength={2000} />
          <div className="row" style={{ marginTop: 8 }}>
            <button type="button" className="btn btn-primary" onClick={runAI} disabled={aiState === "busy"}>
              {aiState === "busy" ? text.ai.working : text.ai.button}
            </button>
            {aiState === "done" && <span className="small">{text.ai.applied}</span>}
            {aiState === "fallback" && <span className="small">{text.ai.applied} {text.ai.fallback}</span>}
            {aiState === "short" && <span className="small">{text.ai.tooShort}</span>}
            {aiState === "error" && <span className="small">{text.error}</span>}
          </div>
        </div>
      )}

      <form action={action} className="card form" onSubmit={() => setSubmitting(true)}>
        {initial.id && <input type="hidden" name="id" value={initial.id} />}

        <label className="field">
          <span className="label">{text.title}</span>
          <input type="text" name="title" required minLength={3} maxLength={120} value={v.title} onChange={(e) => set("title", e.target.value)} placeholder={text.titlePh} />
        </label>

        <label className="field">
          <span className="label">{text.description}</span>
          <textarea name="description" maxLength={4000} value={v.description} onChange={(e) => set("description", e.target.value)} placeholder={text.descPh} />
        </label>

        <fieldset>
          <legend className="label">{text.neededRoles}</legend>
          <ChipGroup name="needed_roles" options={roleOptions} selected={v.needed_roles} onToggle={(id) => set("needed_roles", toggle(v.needed_roles, id))} />
        </fieldset>

        <fieldset>
          <legend className="label">{text.tech}</legend>
          <ChipGroup name="tech" options={skillOptions} selected={v.tech} onToggle={(id) => set("tech", toggle(v.tech, id))} />
        </fieldset>

        <fieldset>
          <legend className="label">{text.interests}</legend>
          <ChipGroup name="interests" options={interestOptions} selected={v.interests} onToggle={(id) => set("interests", toggle(v.interests, id))} />
        </fieldset>

        <div className="form-row">
          <label className="field">
            <span className="label">{text.deadline}</span>
            <input type="date" name="deadline" value={v.deadline} onChange={(e) => set("deadline", e.target.value)} />
          </label>
          {statusOptions && (
            <label className="field">
              <span className="label">{text.status}</span>
              <select name="status" value={v.status} onChange={(e) => set("status", e.target.value)}>
                {statusOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <label className="field">
          <span className="label">
            {text.chatLink} <span className="muted small">({text.optional})</span>
          </span>
          <input type="url" name="chat_link" value={v.chat_link} onChange={(e) => set("chat_link", e.target.value)} placeholder={text.chatLinkPh} />
        </label>

        <div className="form-row">
          <label className="field">
            <span className="label">
              {text.repoUrl} <span className="muted small">({text.optional})</span>
            </span>
            <input type="url" name="repo_url" value={v.repo_url} onChange={(e) => set("repo_url", e.target.value)} placeholder="https://github.com/..." />
          </label>
          <label className="field">
            <span className="label">
              {text.resultUrl} <span className="muted small">({text.optional})</span>
            </span>
            <input type="url" name="result_url" value={v.result_url} onChange={(e) => set("result_url", e.target.value)} placeholder="https://..." />
          </label>
        </div>

        <button className="btn btn-primary btn-lg" type="submit" disabled={submitting}>
          {submitting ? "…" : text.submit}
        </button>
      </form>
    </div>
  );
}
