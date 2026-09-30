import { requireUser } from "@/lib/data";
import { getDict } from "@/lib/i18n";
import { createProject } from "@/app/actions";
import ProjectForm from "../ProjectForm";
import { projectFormProps } from "../formProps";

export default async function NewProjectPage() {
  await requireUser();
  const { t, locale } = await getDict();
  return (
    <div style={{ maxWidth: 760 }}>
      <h1>{t.project.newTitle}</h1>
      <ProjectForm
        action={createProject}
        locale={locale}
        initial={{ title: "", description: "", tech: [], interests: [], needed_roles: [], deadline: "", chat_link: "", repo_url: "", result_url: "" }}
        {...projectFormProps(t, t.project.create)}
      />
    </div>
  );
}
