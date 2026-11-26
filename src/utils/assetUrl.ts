/**
 * Resolves public asset URLs safely across both root deployments (localhost, Vercel)
 * and subpath deployments (GitHub Pages /AI-immersion/).
 */
export function assetUrl(path: string): string {
  const clean = path.replace(/^\/+/, '');
  const base = import.meta.env.BASE_URL || '/';
  return `${base.endsWith('/') ? base : `${base}/`}${clean}`;
}
