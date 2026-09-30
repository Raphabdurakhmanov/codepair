// Restores the folder structure from flat file names.
// "app__projects__[id]__page.tsx" -> "app/projects/[id]/page.tsx"
// Runs automatically before `npm run dev`, `npm run build` and `npm test`.
import fs from "node:fs";
import path from "node:path";

const root = path.dirname(new URL(import.meta.url).pathname);
const special = { _gitignore: ".gitignore", "_env.example": ".env.example" };
let moved = 0;

for (const name of fs.readdirSync(root)) {
  const full = path.join(root, name);
  if (!fs.statSync(full).isFile()) continue;
  let target = null;
  if (special[name]) target = special[name];
  else if (name.includes("__")) target = name.split("__").join("/");
  if (!target) continue;
  const dest = path.join(root, target);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.renameSync(full, dest);
  moved++;
}
if (moved) console.log(`restore.mjs: restored ${moved} files into folders`);
