// Short-lived signed links to objects in Cloudflare R2.
//
// The Debrief audio lives in the acqlerate-media bucket (uploaded by
// scripts/r2-upload.sh). /api/audio still decides who may listen; once it
// has, it answers with a redirect to one of these links and the bytes come
// straight from R2 instead of through this server's metered egress.
//
// Signing is local HMAC math — no network call to Cloudflare happens here.
// The link is plain HTTPS that anyone holding it can use until it expires,
// which is why the expiry has to outlast a listening session (see the TTL in
// routes.ts) and why the key behind it should be read-only.
//
// All four variables must be set. If any is missing r2Configured() is false
// and callers serve from local disk as before, which keeps local dev working
// without R2 and gives production an off switch: remove R2_BUCKET and
// redeploy.
import { AwsClient } from "aws4fetch";

let client: AwsClient | null = null;

export function r2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET,
  );
}

/** The R2 origin links point at, for the CSP; null when R2 isn't configured. */
export function r2Origin(): string | null {
  return r2Configured() ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : null;
}

/**
 * A GET link to `key` that works for `ttlSeconds`. Keys come from the fixed
 * filename maps in routes.ts (letters, digits, hyphens, one slash), so no
 * path encoding is needed.
 */
export async function signedR2Url(key: string, ttlSeconds: number): Promise<string> {
  if (!r2Configured()) throw new Error("R2 is not configured");
  client ??= new AwsClient({
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    service: "s3",
    region: "auto",
  });
  const url = new URL(`${r2Origin()}/${process.env.R2_BUCKET}/${key}`);
  url.searchParams.set("X-Amz-Expires", String(ttlSeconds));
  const signed = await client.sign(url, { method: "GET", aws: { signQuery: true } });
  return signed.url;
}
