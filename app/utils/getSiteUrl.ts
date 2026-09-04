/**
 * getSiteUrl — public origin of THIS site (not the CMS), for canonical/OG/JSON-LD
 * URLs, the sitemap and robots.
 *
 * The live deployment used to publish `http://localhost:3000` in all 140 sitemap
 * entries and in the `Sitemap:` line of robots.txt. Two things caused it: the
 * code read only `NEXT_PUBLIC_SITE_URL`, and `.env` — where the project keeps
 * `NEXT_PUBLIC_VERCEL_URL` — is gitignored, so nothing carried an origin into
 * the build at all.
 *
 * Hence the chain below ends with the variables Vercel injects itself: with them
 * the origin is right even when no dashboard variable is configured.
 *
 * Resolution order:
 * 1. `NEXT_PUBLIC_SITE_URL` — the explicit canonical origin; set this in prod.
 * 2. `NEXT_PUBLIC_VERCEL_URL` — project-level fallback kept in `.env*`.
 * 3. `VERCEL_PROJECT_PRODUCTION_URL` — injected by Vercel, host only.
 * 4. `VERCEL_URL` — injected per deployment (preview hosts included), host only.
 * 5. `http://localhost:3000` — local development only.
 *
 * @returns Origin without a trailing slash, always with a scheme.
 */
export const getSiteUrl = (): string => {
  const candidate =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  if (!candidate) {
    return 'http://localhost:3000';
  }

  /** The `.env` stores the value quoted; Vercel's variables carry a bare host. */
  const cleaned = candidate.trim().replace(/^["']|["']$/g, '');
  const withScheme = /^https?:\/\//.test(cleaned) ? cleaned : `https://${cleaned}`;

  return withScheme.replace(/\/+$/, '');
};
