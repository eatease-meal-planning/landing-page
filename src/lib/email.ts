import fs from "fs";
import path from "path";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderEmail(
  templateName: string,
  vars: Record<string, string>,
  escapeKeys: string[] = [],
): string {
  const file = path.join(process.cwd(), "src", "templates", templateName);
  let html = fs.readFileSync(file, "utf-8");

  for (const [key, value] of Object.entries(vars)) {
    const safe = escapeKeys.includes(key) ? escapeHtml(value) : value;
    html = html.replaceAll(`{{{${key}}}}`, safe);
    html = html.replaceAll(`{{ ${key} }}`, safe);
  }

  return html;
}
