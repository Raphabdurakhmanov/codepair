import { notFound, redirect } from "next/navigation";
import { requireUser, type Project } from "@/lib/data";
import { getDict } from "@/lib/i18n";
import { updateProject } from "@/app/actions";
import ProjectForm from "../../ProjectForm";
import { projectFormProps } from "../../formProps";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  const { t, locale } = await getDict();
  const { data } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const p = data as Project;
  if (p.owner_id !== user.id) redirect(`/projects/${id}`);

  return (
    <div style={{ maxWidth: 760 }}>
      <h1>{t.project.editTitle}</h1>
      <ProjectForm
        action={updateProject}
        locale={locale}
        initial={{
          id: p.id,
          title: p.title,
          description: p.description,
          tech: p.tech,
          interests: p.interests,
          needed_roles: p.needed_roles,
          deadline: p.deadline ?? "",
          chat_link: p.chat_link,
          repo_url: p.repo_url,
          result_url: p.result_url,
          status: p.status,
        }}
        statusOptions={(["open", "in_progress", "done"] as const).map((s) => ({ id: s, label: t.status[s] }))}
        {...projectFormProps(t, t.common.save)}
      />
    </div>
  );
}
