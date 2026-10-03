// ─── Sign in with Apple — identity token verification ──────────────────────
//
// The app signs in natively (ASAuthorization via @capacitor-community/apple-sign-in)
// and hands us the identity token Apple issued. That token is a signed JWT, so
// all the server has to do is check the signature against Apple's published
// public keys and confirm the claims.
//
// This is deliberately the *native* flow, which is why there is no Services ID,
// no .p8 key and no client secret anywhere in here. Those belong to the web
// flow, where you exchange an authorization code at Apple's token endpoint. For
// a native sign-in the identity token is already proof, and its `aud` is the
// app's bundle identifier rather than a Services ID.
//
// What we verify, and why each one matters:
//   iss  must be https://appleid.apple.com   — the token came from Apple
//   aud  must be our bundle id               — it was issued for OUR app, not
//                                              some other app the user also
//                                              signed into. Without this check
//                                              any Apple developer could mint a
//                                              token their users accepted and
//                                              replay it here.
//   exp  must be in the future               — jose enforces this
//   sub  the stable per-app user id          — what we store as apple_id
//
// Apple rotates its signing keys, so the key set is fetched from Apple and
// cached by jose rather than pinned.

import { createRemoteJWKSet, jwtVerify } from "jose";

const APPLE_ISSUER = "https://appleid.apple.com";

// Bundle id of the iOS app — see capacitor.config.ts appId and the Xcode
// PRODUCT_BUNDLE_IDENTIFIER. Overridable so a future TestFlight-only or
// Android web flow build can point at its own audience without a code change.
const APPLE_AUDIENCE = process.env.APPLE_BUNDLE_ID || "com.acqlerate.app";

// jose caches the key set and refetches only when it sees an unknown key id,
// so this is one network call every few days, not one per sign-in.
const appleKeys = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

export interface AppleIdentity {
  /** Apple's stable, per-app user identifier. Never reused, never changes. */
  appleId: string;
  /** May be a @privaterelay.appleid.com forwarder when the user hid their address. */
  email: string | null;
  /** True when the address above is one of Apple's relay forwarders. */
  isPrivateEmail: boolean;
}

/**
 * Verifies an Apple identity token and returns the identity inside it.
 * Throws if the token is not genuine, not ours, or expired — callers should
 * treat any throw as "reject the sign-in" and not inspect the reason.
 */
export async function verifyAppleIdentityToken(identityToken: string): Promise<AppleIdentity> {
  return verifyWithKeySet(identityToken, appleKeys);
}

/**
 * The verification itself, with the key source as a parameter so the claim
 * checks can be tested against a locally minted key rather than Apple's.
 * Not for general use — call verifyAppleIdentityToken.
 */
export async function verifyWithKeySet(
  identityToken: string,
  keySet: Parameters<typeof jwtVerify>[1],
  audience: string = APPLE_AUDIENCE,
): Promise<AppleIdentity> {
  const { payload } = await jwtVerify(identityToken, keySet, {
    issuer: APPLE_ISSUER,
    audience,
  });

  const appleId = typeof payload.sub === "string" ? payload.sub : "";
  if (!appleId) throw new Error("Apple token carried no subject");

  const email = typeof payload.email === "string" ? payload.email : null;
  // Apple sends these as the strings "true"/"false" rather than booleans.
  // Apple's relay addresses: @privaterelay.appleid.com, plus
  // @private.icloud.com for new ones from late 2026 (Apple news, 24 Aug 2026).
  const isPrivateEmail =
    payload.is_private_email === true || payload.is_private_email === "true"
    || /@(privaterelay\.appleid\.com|private\.icloud\.com)$/i.test(email ?? "");

  return { appleId, email, isPrivateEmail };
}

// ─── Revoking Sign in with Apple on account deletion ───────────────────────
//
// App Store Guideline 5.1.1(v): "Apps that support Sign in with Apple should
// use the Sign in with Apple REST API to revoke user tokens" when the account
// is deleted. Revoking needs a token Apple issued to OUR server, which means
// exchanging the one-time authorization code from the sign-in sheet at
// Apple's token endpoint. That exchange needs a client secret signed with a
// Sign in with Apple key (.p8) from the developer account.
//
// Dormant until these Railway variables are set (Apple Developer account >
// Certificates, Identifiers & Profiles > Keys > + > Sign in with Apple):
//   APPLE_TEAM_ID       10-character Team ID (top right of the developer site)
//   APPLE_KEY_ID        the key's 10-character Key ID
//   APPLE_PRIVATE_KEY   the .p8 file's contents (newlines may be written as \n)
// Without them sign-in still works exactly as before; deletion just can't
// revoke, and the founder email says so.

import { SignJWT, importPKCS8 } from "jose";

export function appleRevokeConfigured(): boolean {
  return !!(process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY);
}

async function appleClientSecret(): Promise<string> {
  const pem = String(process.env.APPLE_PRIVATE_KEY).replace(/\\n/g, "\n");
  const key = await importPKCS8(pem, "ES256");
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: String(process.env.APPLE_KEY_ID) })
    .setIssuer(String(process.env.APPLE_TEAM_ID))
    .setSubject(APPLE_AUDIENCE)
    .setAudience(APPLE_ISSUER)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(key);
}

/**
 * Trades the sign-in sheet's one-time authorization code for a refresh token
 * we can revoke later. Returns null if not configured or Apple says no.
 * Never throws: sign-in must not depend on it.
 */
export async function exchangeAppleAuthorizationCode(code: string): Promise<string | null> {
  if (!code || !appleRevokeConfigured()) return null;
  try {
    const body = new URLSearchParams({
      client_id: APPLE_AUDIENCE,
      client_secret: await appleClientSecret(),
      code,
      grant_type: "authorization_code",
    });
    const res = await fetch(`${APPLE_ISSUER}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || typeof data.refresh_token !== "string") {
      console.warn("[apple-auth] code exchange failed:", res.status, data?.error ?? "");
      return null;
    }
    return data.refresh_token;
  } catch (err: any) {
    console.warn("[apple-auth] code exchange error:", err?.message ?? err);
    return null;
  }
}

/** Revokes a refresh token at Apple. True on success. Never throws. */
export async function revokeAppleToken(refreshToken: string): Promise<boolean> {
  if (!refreshToken || !appleRevokeConfigured()) return false;
  try {
    const body = new URLSearchParams({
      client_id: APPLE_AUDIENCE,
      client_secret: await appleClientSecret(),
      token: refreshToken,
      token_type_hint: "refresh_token",
    });
    const res = await fetch(`${APPLE_ISSUER}/auth/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) console.warn("[apple-auth] revoke failed:", res.status);
    return res.ok;
  } catch (err: any) {
    console.warn("[apple-auth] revoke error:", err?.message ?? err);
    return false;
  }
}
