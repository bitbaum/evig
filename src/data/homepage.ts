/**
 * Homepage data
 *
 * Single Source of Truth for homepage content
 * Following dev guide: docs/development/DEV_GUIDE.md
 */

import { Laptop, Code, HardDrive, Globe, LucideIcon } from "lucide-react";

/**
 * Value proposition for the homepage
 */
export interface ValueProp {
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
}

/**
 * Testimonial for the homepage
 */
export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  type: "linux" | "vintage" | "recovery" | "web";
}

/**
 * Value propositions displayed on the homepage
 * Describes main services/offerings
 */
export const VALUE_PROPS: ValueProp[] = [
  {
    name: "Vintage-Computer",
    description:
      "Reparieren und Aufbauen von Retro-Computern für Gaming und Sammler. Seltene Hardware, die noch funktioniert.",
    icon: Laptop,
    href: "/projects/vintage-computers",
  },
  {
    name: "Gebrauchte Laptops mit Linux",
    description:
      "Alte Laptops schneller gemacht: Linux-Installation, kostenlose Software, professioneller Support.",
    icon: Code,
    href: "/services/linux-open-source",
  },
  {
    name: "Datenrettung",
    description:
      "Wiederherstellung von Daten aus beschädigten Geräten und alten Speichermedien (Disketten, ZIP, etc.).",
    icon: HardDrive,
    href: "/services",
  },
  {
    name: "Webentwicklung",
    description:
      "Moderne Websites und Apps mit Open-Source-Technologien. Next.js, Headless CMS, E-Commerce.",
    icon: Globe,
    href: "/services/web-design-development",
  },
];

/**
 * Customer testimonials displayed on the homepage
 */
export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Mein Laptop von 2012 war langsam und Windows-Lizenzen teuer. revamp-it hat Linux installiert – er läuft jetzt schneller als je zuvor. Alle Programme sind kostenlos und werden unterstützt.",
    author: "Maria K.",
    role: "Zürich",
    type: "linux",
  },
  {
    quote:
      "Ich wollte einen Retro-Gaming PC bauen. revamp-it hat mir ein funktionierendes Vintage-System mit Original-Komponenten zusammengestellt. Klassische Spiele laufen perfekt.",
    author: "Thomas R.",
    role: "Basel",
    type: "vintage",
  },
  {
    quote:
      "Meine externe Festplatte war kaputt – alle meine Fotos und Dokumente schienen verloren. revamp-it hat die Daten wiederhergestellt. Sehr dankbar!",
    author: "Sandra M.",
    role: "Luzern",
    type: "recovery",
  },
  {
    quote:
      "Wir brauchten eine Website für unser Projekt. revamp-it hat mit Open-Source-Technologien eine moderne, schnelle Website gebaut. Die kostenlose Erstberatung war sehr hilfreich.",
    author: "Projekt-Team",
    role: "Zürich",
    type: "web",
  },
];
