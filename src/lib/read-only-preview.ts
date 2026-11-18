/** Website-only guard; research jobs and database permissions are unchanged. */
export function isReadOnlyPreview() {
  return ['1', 'true'].includes((process.env.MAICATRADES_READ_ONLY_PREVIEW ?? '').trim().toLowerCase());
}

export const PREVIEW_GUARD_VERSION = 'database-read-only-v1';

/**
 * Allow only GET/HEAD table reads against the configured PostgREST origin.
 * Deny mutations, RPC (including GET RPC), storage/auth admin operations and
 * redirects before the underlying fetch can send them. Never include URLs,
 * request bodies or credentials in the denial response.
 */
export function createPreviewProtectedFetch(
  underlyingFetch: typeof fetch,
  supabaseUrl: string,
  enabled: () => boolean = isReadOnlyPreview,
): typeof fetch {
  const allowedOrigin = new URL(supabaseUrl).origin;
  return async (input, init) => {
    if (!enabled()) return underlyingFetch(input, init);
    try {
      const request = input instanceof Request ? input : null;
      const url = new URL(request?.url ?? String(input));
      const method = (init?.method ?? request?.method ?? 'GET').toUpperCase();
      const path = decodeURIComponent(url.pathname);
      const allowedRead = url.origin === allowedOrigin &&
        ['GET', 'HEAD'].includes(method) &&
        /^\/rest\/v1\/[A-Za-z_][A-Za-z0-9_]*$/.test(path) &&
        path !== '/rest/v1/rpc';
      if (allowedRead) return underlyingFetch(input, {...init, redirect: 'error'});
    } catch {
      // Invalid URLs or encodings are denied, without echoing sensitive input.
    }
    return Response.json({code: 'READ_ONLY_PREVIEW', message: 'Read-only preview blocked a database operation.'}, {status: 403});
  };
}
