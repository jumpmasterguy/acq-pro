/**
 * "Talk to a human" — the support line on My Account, web and app.
 *
 * Copy in Lucas's voice (see the writing-style notes): warm, a little
 * acquisitions humour, no em dashes. The mail link pre-fills where the
 * message came from, which saves a round of "what device are you on?".
 */

import { useState } from 'react';
import { Check, Copy, Mail } from 'lucide-react';
import { getPlatform, isNativeApp } from '@/lib/platform';

export const SUPPORT_EMAIL = 'hello@acqlerate.com';

function mailtoHref(): string {
  const where = isNativeApp()
    ? (getPlatform() === 'ios' ? 'the iPhone app' : 'the Android app')
    : 'the website';
  const subject = 'Hello from Acqlerate';
  const body = `\n\n\n---\nSent from ${where}`;
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function ContactUs() {
  const [copied, setCopied] = useState(false);

  // A phone with no mail app set up does nothing on a mailto tap, so the
  // address is also one tap from the clipboard.
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked: the address is on screen to read */ }
  };

  return (
    <div data-testid="contact-us">
      <p className="text-sm leading-relaxed" style={{ color: 'var(--acq-text-body)' }}>
        Something broken? Something confusing? Or did a lesson finally make EVM click and
        you need to tell someone? Write to{' '}
        <a href={mailtoHref()} className="font-semibold underline underline-offset-2" style={{ color: 'var(--acq-text-brand)' }}>
          {SUPPORT_EMAIL}
        </a>
        . A real person reads every message, and we reply faster than a funding mod gets
        signed. (Low bar, we know.) We're here for you.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={mailtoHref()}
          className="inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-bold text-white"
          style={{ background: 'var(--acq-teal)' }}
          data-testid="contact-email"
        >
          <Mail className="h-4 w-4" /> Email us
        </a>
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold"
          style={{ borderColor: 'var(--acq-border-default)', color: 'var(--acq-text-secondary)' }}
          data-testid="contact-copy"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy address'}
        </button>
      </div>
    </div>
  );
}
