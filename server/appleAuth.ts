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
  const isPrivateEmail =
    payload.is_private_email === true || payload.is_private_email === "true";

  return { appleId, email, isPrivateEmail };
}
