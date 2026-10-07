/**
 * "Was es löst" — the homepage's answer to "what is this actually for?"
 *
 * The pillars (config/pillars.ts) say what evig DOES. This says which concrete
 * problem that answers: a situation a real person is in this week, or one a
 * whole society is stuck with, then what evig does about it today, then the
 * one page where the reader acts on it. Same material, opposite direction —
 * it starts from the reader's problem, not from our offer.
 *
 * ── Honesty rule ──────────────────────────────────────────────────────────
 * Every `solution` describes something that works on this platform today, and
 * every `href` is a page that exists (pinned by problems-we-solve.test.ts). No
 * roadmap item, no number: CO₂ is described, never quantified here — the
 * figures live on /transparenz/co2 with their sources, where the card links.
 *
 * ── To add or change a card ───────────────────────────────────────────────
 *   1. Edit the entry below (structure only: id, href, icon).
 *   2. Add `problems.items.<id>.{problem,solution,cta}` to messages/de.json,
 *      then translate. Structure lives HERE, strings in messages — paired by
 *      the stable `id`, never by array index (see the i18n SSOT rule).
 */

import {
  AppWindow,
  Bot,
  Cpu,
  GraduationCap,
  HardDrive,
  Laptop,
  Leaf,
  PackageOpen,
  RefreshCw,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { ROUTES } from '@/config/routes';

export interface ProblemWeSolve {
  /** Stable i18n key under `problems.items.<id>`. */
  id: string;
  /** The one page where the reader acts on it. Every card has one — no dead ends. */
  href: string;
  icon: LucideIcon;
}

export type ProblemScaleId = 'people' | 'society';

export interface ProblemScale {
  /** Stable i18n key under `problems.scales.<id>`. */
  id: ProblemScaleId;
  items: readonly ProblemWeSolve[];
}

export const PROBLEM_SCALES: readonly ProblemScale[] = [
  {
    id: 'people',
    items: [
      { id: 'slowLaptop', href: ROUTES.public.itHilfeCreate, icon: HardDrive },
      { id: 'whoRepairs', href: ROUTES.public.techniker, icon: Wrench },
      { id: 'schoolComputer', href: ROUTES.public.marketplace, icon: Laptop },
      { id: 'aiTooExpensive', href: ROUTES.public.abos, icon: Bot },
      { id: 'aiAtWork', href: ROUTES.public.workshops, icon: GraduationCap },
      { id: 'drawerDevice', href: ROUTES.public.marketplaceSell, icon: PackageOpen },
    ],
  },
  {
    id: 'society',
    items: [
      { id: 'eWaste', href: ROUTES.public.transparenzCo2, icon: Leaf },
      { id: 'intelligenceGap', href: ROUTES.public.ai, icon: Cpu },
      { id: 'updatesEnd', href: ROUTES.public.linuxOpenSource, icon: RefreshCw },
      { id: 'licenceCosts', href: ROUTES.public.openSourceSolutions, icon: AppWindow },
      { id: 'repairSkills', href: ROUTES.public.itHilfeBrowseRequests, icon: Users },
    ],
  },
];

/** Where the closing call to action points. */
export const PROBLEMS_CTA = {
  primary: ROUTES.public.itHilfeCreate,
  secondary: ROUTES.public.contact,
} as const;
