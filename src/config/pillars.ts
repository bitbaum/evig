/**
 * The evig pillars — SINGLE SOURCE OF TRUTH for what this organisation does.
 *
 * One thesis: **AI and robotics should reach everyone, not only whoever can
 * afford them.** These five are the routes to it, and each one points at a
 * surface that already serves it — a pillar is a claim with an address, never
 * a placeholder for work that does not exist.
 *
 *   hardware    → machines good enough for real work, at a price people can pay
 *   technicians → finding someone to fix it, as easily as booking a ride
 *   software    → Linux and open source, because the machine gets faster
 *   training    → retraining for a labour market that AI is rewriting
 *   adoption    → helping organisations actually put AI and robotics to work
 *
 * Why this replaced the old homepage bands: the two sections here before
 * ("Wir geben Geräten ein zweites Leben" and "Drei Schritte. Ein Kreislauf.")
 * told the circular-IT story of the organisation evig came from. That story is
 * still true — a machine kept in use is a machine nobody had to build twice —
 * but it is the *consequence*, not the reason. Someone landing here needs to
 * learn what evig can do for them, not how our recycling works.
 *
 * ── Divisions vs pillars ──────────────────────────────────────────────────
 * `EVIG_DIVISIONS` is how the org is *named* (evig computers / repairs / ai).
 * Pillars are what it *does*. They overlap on purpose and deliberately are not
 * derived from each other: `technicians` and `hardware` map onto divisions,
 * while `training` and `adoption` have no division and never should — inventing
 * `evig academy` to make the two lists match is exactly the kind of brand
 * proliferation that got `architecture` and `health` deleted.
 *
 * ── To add or change a pillar ─────────────────────────────────────────────
 *   1. Edit the entry below (structure only: id, href, icon).
 *   2. Add its strings under `pillars.items.<id>.{title,body,cta}` in
 *      messages/de.json, then translate. Structure lives HERE, strings in
 *      messages — paired by the stable `id`, never by array index.
 *   3. The section heading's count is ICU-driven from this array's length. Do
 *      not type a number into a message: the divisions subtitle did exactly
 *      that and shipped "from the device to the building" to production for
 *      hours after the building division was deleted.
 */

import { Cpu, GraduationCap, Terminal, Wrench, Factory, type LucideIcon } from 'lucide-react';
import { ROUTES } from '@/config/routes';

export type PillarId = 'hardware' | 'technicians' | 'software' | 'training' | 'adoption';

export interface Pillar {
  /** URL-safe id AND the stable i18n key under `pillars.items.<id>`. */
  id: PillarId;
  /** Where the reader acts on this pillar. Every pillar has one — no dead ends. */
  href: string;
  icon: LucideIcon;
}

export const EVIG_PILLARS: readonly Pillar[] = [
  {
    id: 'hardware',
    href: ROUTES.public.marketplace,
    icon: Cpu,
  },
  {
    id: 'technicians',
    href: ROUTES.public.itHilfe,
    icon: Wrench,
  },
  {
    id: 'software',
    href: '/services/linux-open-source',
    icon: Terminal,
  },
  {
    id: 'training',
    href: ROUTES.public.workshops,
    icon: GraduationCap,
  },
  {
    // No page of its own yet, and it would be dishonest to build a service page
    // for work we have not scoped with anyone. The conversation IS the entry
    // point until there is something real to describe.
    id: 'adoption',
    href: ROUTES.public.contact,
    icon: Factory,
  },
];
