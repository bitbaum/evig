/**
 * @vitest-environment node
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { CONTACT, ORG } from '@/config/org';

/**
 * The address we tell users to write to must reach a mailbox, and must come
 * from ORG config rather than being typed into a message.
 *
 * It was `hallo@evig.ch`. evig.ch is not registered — no MX, no A record — so
 * every message a would-be buyer sent bounced. That mattered because it is the
 * ONLY route to a human: online payment is deliberately unset until go-live
 * (`.env.selfhost.local.example`: "leave unset until go-live"), the checkout
 * wall tells people to "kontaktiere evig", and `CONTACT.phone` is empty. A
 * catalogue of 200+ live listings with a dead-end call to action.
 *
 * Two rules, both cheap to check:
 *   1. Do not publish an address on a domain that is not set up yet.
 *   2. Do not type a contact address inline — it drifts from config, which is
 *      how a password-reset failure ended up naming kontakt@revamp-it.ch.
 */

// Domains evig does not (yet) receive mail on. Remove an entry the same day
// the domain is registered AND its mail is authenticated — not before.
const UNREACHABLE_DOMAINS = ['evig.ch'];

const SRC = join(process.cwd(), 'src');
const MESSAGES = join(process.cwd(), 'messages');

/**
 * Files that legitimately name a non-CONTACT address:
 *  - org.ts itself defines it
 *  - staff identity / logins are Layer B and really are @revamp-it.ch until the
 *    infra cutover (see .claude/CLAUDE.md)
 *  - form placeholders showing the STAFF address format are accurate
 */
const ALLOW = [
  /src\/config\/org\.ts$/,
  /src\/lib\/permissions\.ts$/,
  /src\/config\/e2e-test-accounts\.ts$/,
  /src\/config\/blog-authors\.ts$/,
  /src\/lib\/marketplace\/publish-revampit-listing\.ts$/,
  /src\/lib\/ai\/config\/prompts\//,
  /src\/components\/admin\/teams\//,
  /src\/app\/einladung\//,
  /__tests__/,
];

function files(dir: string, exts: RegExp): string[] {
  if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory()) return [];
  return readdirSync(dir).flatMap((e) => {
    const full = join(dir, e);
    if (statSync(full).isDirectory()) return files(full, exts);
    return exts.test(e) ? [full] : [];
  });
}

describe('the published contact address is reachable', () => {
  it('is not on a domain that receives no mail', () => {
    const domain = CONTACT.email.split('@')[1];
    expect(UNREACHABLE_DOMAINS).not.toContain(domain);
  });

  it('supportEmail falls back to the same reachable address', () => {
    const domain = CONTACT.supportEmail.split('@')[1];
    expect(UNREACHABLE_DOMAINS).not.toContain(domain);
  });

  it('ORG.emailDomain stays the brand domain (it is not the contact mailbox)', () => {
    // Deliberate: emailDomain drives staff-email detection and the default
    // sender. It is NOT where users write to — do not repoint it at gmail.
    expect(ORG.emailDomain).toBe('evig.ch');
  });

  it('no user-facing message hardcodes an org contact address', () => {
    const offenders: string[] = [];
    for (const file of [...files(SRC, /\.tsx?$/), ...files(MESSAGES, /\.json$/)]) {
      const rel = relative(process.cwd(), file);
      if (ALLOW.some((rx) => rx.test(rel))) continue;
      let src = readFileSync(file, 'utf8');
      // Strip comments in TS/TSX: prose EXPLAINING this rule legitimately names
      // the old address, and a gate that trips on its own documentation just
      // teaches people to delete the documentation. JSON has no comments.
      if (/\.tsx?$/.test(file)) {
        src = src
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .split('\n')
          .filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'))
          .join('\n');
      }
      // An org address written as a literal, not interpolated from CONTACT.
      const hits = src.match(/[a-z0-9._-]+@(evig\.ch|revamp-it\.ch|revampit\.ch)/gi);
      if (hits) offenders.push(`${rel}: ${[...new Set(hits)].join(', ')}`);
    }
    expect(offenders).toEqual([]);
  });

  it('scans a meaningful number of files (guards an always-green sweep)', () => {
    expect(files(SRC, /\.tsx?$/).length).toBeGreaterThan(500);
    expect(files(MESSAGES, /\.json$/).length).toBeGreaterThan(3);
  });
});
