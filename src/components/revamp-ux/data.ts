/**
 * Data constants for Revamp-UX components
 * @fileoverview Centralized data to separate content from logic
 */

import { FeatureDetails } from './types'

export const FEATURE_DETAILS: FeatureDetails = {
  'Direkte Nutzer-Feedback-Sammlung': {
    wordpress: 'WordPress bietet Kommentare nur für Blog-Posts. Für allgemeines Website-Feedback sind separate Plugins wie Contact Form 7 nötig. Nutzer müssen zuerst das richtige Formular finden.',
    strapi: 'Strapi ist ein Headless CMS ohne Frontend. Feedback-Sammlung erfordert separate Frontend-Entwicklung und API-Integration. Nicht für Endnutzer gedacht.',
    contentful: 'Contentful fokussiert auf Content-Erstellung und hat Kommentare nur für den Editor-Workflow. Keine direkte Nutzer-Feedback-Sammlung.',
    revamp: 'Revamp-UX integriert Feedback-Sammlung direkt in jede Website-Seite. Ein Klick genügt - keine Suche nach Kontaktformularen.'
  },
  'Technische Voraussetzungen': {
    wordpress: 'WordPress-Installation, Hosting, Theme-Setup und Plugin-Konfiguration erforderlich. Regelmässige Updates und Sicherheit nötig.',
    strapi: 'Erfordert Node.js, Datenbank-Setup, API-Entwicklung und separates Frontend. Hohe technische Kompetenz für Deployment und Wartung.',
    contentful: 'Benötigt API-Schlüssel, Frontend-Framework und Hosting. Content-Modelle müssen definiert werden. Mittel bis fortgeschrittene Kenntnisse.',
    revamp: 'Einfache Integration durch Script-Tag oder NPM-Paket. Keine Server-Setup, Datenbank oder API-Konfiguration nötig.'
  },
  'Feedback-Kontext-Erfassung': {
    wordpress: 'Kommentare sind post-spezifisch, haben aber keinen Kontext über die genaue Stelle oder Nutzer-Interaktion.',
    strapi: 'Keine integrierte Feedback-Funktionalität. Kontext müsste manuell über Custom-Felder erfasst werden.',
    contentful: 'Erfasst nur Content-Änderungen im Editor-Workflow. Keine Erfassung von Nutzer-Verhalten oder Seitenkontext.',
    revamp: 'Automatisch erfasst: Seiten-URL, Element-Position, Nutzer-Browser, Zeitstempel und Nutzerangaben für vollständigen Kontext.'
  },
  'Feedback-Verarbeitung': {
    wordpress: 'Manuelle Moderation, Kategorisierung und Weiterleitung an zuständige Personen. Keine automatische Priorisierung.',
    strapi: 'Feedback muss über Custom-API-Endpunkte verarbeitet werden. Keine integrierte Moderation oder Kategorisierung.',
    contentful: 'Verarbeitet nur strukturierte Editor-Änderungen. Keine Verarbeitung von freiem Nutzer-Feedback.',
    revamp: 'AI-gestützte automatische Kategorisierung, Priorisierung und strukturierte Weiterleitung an Entwickler mit Lösungsvorschlägen.'
  },
  'Echtzeit-Nutzer-Interaktion': {
    wordpress: 'Grundlegende Kommentare möglich, aber für komplexe Interaktionen sind zusätzliche Plugins nötig.',
    strapi: 'Benötigt separate Frontend-Anwendung für jegliche Nutzer-Interaktion. Keine direkte Website-Integration.',
    contentful: 'Headless-Architektur erfordert separate Frontend-Entwicklung. Keine direkte Nutzer-Interaktion möglich.',
    revamp: 'Direkte Integration in jede Website. Nutzer können sofort Feedback geben, ohne die Seite zu verlassen.'
  }
}