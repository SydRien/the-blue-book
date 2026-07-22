export function truncateText(value: string, max: number): string {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length <= max) {
    return trimmed;
  }
  return `${trimmed.slice(0, Math.max(0, max - 1))}…`;
}

export function buildProjectContextSection(project: {
  title: string;
  description: string;
}): string {
  const title = truncateText(project.title || "Untitled project", 80);
  const description = truncateText(project.description || "", 200);
  const lines = [`Project: ${title}`];
  if (description) {
    lines.push(`About: ${description}`);
  }
  return lines.join("\n");
}
