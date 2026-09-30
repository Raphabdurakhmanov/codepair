// Public GitHub data as an extra experience signal (no OAuth scopes needed).

export interface GithubSummary {
  username: string;
  publicRepos: number;
  languages: string[]; // most used first (by number of own, non-fork repos)
}

export async function fetchGithubSummary(username: string): Promise<GithubSummary | null> {
  const clean = username.trim().replace(/^@/, "");
  if (!/^[a-zA-Z0-9-]{1,39}$/.test(clean)) return null;

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "codepair-mvp",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const userRes = await fetch(`https://api.github.com/users/${clean}`, { headers, cache: "no-store" });
  if (!userRes.ok) return null;
  const user = (await userRes.json()) as { login: string; public_repos: number };

  const reposRes = await fetch(`https://api.github.com/users/${clean}/repos?per_page=100&sort=pushed`, {
    headers,
    cache: "no-store",
  });
  const repos = reposRes.ok ? ((await reposRes.json()) as { language: string | null; fork: boolean }[]) : [];

  const counts = new Map<string, number>();
  for (const r of repos) {
    if (r.fork || !r.language) continue;
    counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
  }
  const languages = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([l]) => l);

  return { username: user.login, publicRepos: user.public_repos, languages };
}
