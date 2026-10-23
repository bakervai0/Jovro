/** Resolve a public asset against Vite's base path (works on Pages + dev preview). */
export function asset(path?: string): string {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  const base = import.meta.env.BASE_URL || '/';
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
