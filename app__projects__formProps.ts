import { INTERESTS, ROLE_GROUPS, SKILLS } from "@/lib/catalog";
import type { Dict } from "@/lib/i18n";
import type { ProjectFormText } from "./ProjectForm";

export function projectFormProps(t: Dict, submit: string) {
  const text: ProjectFormText = {
    title: t.project.title,
    titlePh: t.project.titlePh,
    description: t.project.description,
    descPh: t.project.descPh,
    tech: t.project.tech,
    interests: t.project.interests,
    neededRoles: t.project.neededRoles,
    deadline: t.project.deadline,
    chatLink: t.project.chatLink,
    chatLinkPh: t.project.chatLinkPh,
    repoUrl: t.project.repoUrl,
    resultUrl: t.project.resultUrl,
    submit,
    status: t.project.status,
    optional: t.common.optional,
    ai: t.ai,
    error: t.common.error,
  };
  return {
    text,
    roleGroups: ROLE_GROUPS.map((g) => ({ id: g.id, label: t.roleGroups[g.id], options: g.roles.map((id) => ({ id, label: t.roles[id] ?? id })) })),
    skillOptions: SKILLS,
    interestOptions: INTERESTS.map((id) => ({ id, label: t.interests[id] })),
  };
}
