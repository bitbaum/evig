# Revamp-IT Business Documentation

**Status:** November 2025 - Planning Phase
**Version:** 1.0
**Warnung:** Diese Dokumentation enthält überwiegend Platzhalter-Daten

---

## 🎯 Über diese Dokumentation

Dieser Ordner enthält die komplette Geschäftsplanung und operative Dokumentation für **Revamp-IT**.

**Wichtiger Hinweis:** Die meisten Zahlen, Daten und Details in dieser Dokumentation sind **Platzhalter** und müssen mit echten Werten ersetzt werden. Dies ist eine Planungsdokumentation, keine operative Realität.

**🚨 Experimenteller AI-Powered Ansatz:** Dieser Ordner ist ein **digitales Gehirn und Datenbank für Menschen und AI-Agenten**. Er enthält viele Platzhalter und kann teilweise inkorrekte Informationen enthalten. Dies ist ein bewusstes Experiment, um Revamp-IT zu einer **wahrhaft AI-gestützten Organisation** zu machen. Es ist wichtig, dass alle Beteiligten wissen, dass dies **experimentell** ist und kontinuierlich weiterentwickelt wird.

---

## 🧠 Digitales Gehirn (First Principles)

Diese Repository dient als „Digital Brain“ – eine strukturierte Wissensbasis, in der wir Wahrheiten („Single Source of Truth“) einmal definieren und davon ausgehend Entscheidungen in anderen Bereichen ableiten. Jedes Teilgebiet arbeitet mit First‑Principles:

- Ziel: Was optimieren wir? (mit Metriken)
- Constraints: Rechtlich, Kapazität, Geld, Zeit
- Invarianten: Nicht verhandelbar (Privacy, FOSS‑first, PCI, etc.)
- Annahmen: Explizite Hypothesen, die wir testen
- Entscheidungen: Aktuelle Wahl + Begründung
- Abhängigkeiten: Upstream/Downstream Verknüpfungen

Konsequenz: Pro Hauptordner gibt es ein `00_INDEX.md` als Kanban‑artige Einstiegsseite mit Front‑Matter (Owner, Status, Review‑Zyklus) sowie Verweisen auf die kanonischen Datentabellen (CSV) als Quelle der Wahrheit.

Schnelleinstieg:
- Knowledge Graph: `./docs/knowledge-graph.md`
- Glossar: `./docs/glossary.md`
- Template für Indizes: `./docs/templates/First_Principles_Index_Template.md`

---

## 🌍 Was ist Revamp-IT?

**Revamp-IT gestaltet die Zukunft der IT durch nachhaltige Aufarbeitung und Recycling.**

Wir retten gebrauchte Computer vor dem Elektroschrott, indem wir sie mit Linux und Open-Source-Software wiederbeleben. Gleichzeitig schaffen wir Zugang zu bezahlbarer Technologie, fördern digitale Kompetenzen und unterstützen Menschen bei der beruflichen Wiedereingliederung.

### Unsere vier Säulen:
1. **Umweltschutz** - Reduktion von Elektroschrott
2. **Digitale Souveränität** - Förderung von Linux & Open-Source
3. **Bildung & Aufklärung** - Workshops für alle Altersgruppen
4. **Soziale Integration** - Unterstützung bei beruflicher Wiedereingliederung

---

## 📂 Ordnerstruktur

```
Revamp-Hirn/
├── 01_Management/           # Strategische & operative Dokumente
│   ├── A_Strategie_und_Governance/
│   ├── B_Finanzen/
│   ├── C_Kennzahlen_und_Reporting/
│   ├── D_Marketing_und_Kommunikation/
│   ├── E_Personal_und_HR/
│   ├── F_Rechtliches_und_Compliance/
│   └── G_Operations_und_Prozesse/
│
├── 02_Technology/           # Technische Implementierung
│   ├── A_Tech_Stack/
│   ├── B_Website_und_WebShop/
│   ├── C_AI_und_Automation/
│   └── [Weitere Tech-Bereiche]
│
└── 03_Services/             # Dienstleistungsangebote
    ├── A_Web_Development/
    ├── B_IT_Consulting/
    ├── C_Repair_Services/
    ├── D_Workshop_Training/
    └── E_Client_Projects/
```

---

## 📋 Inhaltsübersicht

### 01_Management (22+ Dokumente erstellt)
- **[Management Übersicht](./01_Management/Management_Uebersicht.md):** Zentraler Einstiegspunkt für alle Management-Dokumente.

**✅ Komplett dokumentiert:**
- Mission, Vision & Werte
- Organisationsstruktur & Rollen
- Finanzplanung & Fundraising-Strategie
- Marketing & Kommunikationsstrategie
- KPI-Framework & Tracking-Templates

**🏗️ Bereit für Inhalte:**
- Jahresberichte, Monatsreports
- Personalakten, Verträge
- Rechtsdokumente, Compliance

### 02_Technology (4 Dokumente erstellt)

**✅ Tech Stack definiert:**
- Next.js, Supabase, Medusa.js
- AI-Integration, Automation
- Performance & Security Prinzipien

**🏗️ Bereit für Implementierung:**
- Infrastructure, CI/CD, Monitoring
- Security Guidelines, Data Analytics

### 03_Services (Ordnerstruktur vorbereitet)

**🏗️ Service-Portfolio:**
- Web Development, IT Consulting
- Repair Services, Training Workshops
- Client Project Management

---

## ⚠️ Platzhalter-System

Alle unsicheren Zahlen und Daten sind mit klaren Platzhaltern markiert:

- `[X]` - Numerische Werte (z.B. CHF [X])
- `[DATUM]` - Datumsangaben
- `[NAME]` - Personennamen
- `[TBD]` - To Be Determined
- `[CHF BETRAG]` - Finanzbeträge

**Beispiel aus KPI_Dashboard.csv:**
```
KPI_Kategorie,KPI_Name,2025_Ziel,2025_Actual,Q4_2025,YTD_Status
Devices,Geräte repariert,1000,[X],[X],🔴 Unter Ziel
```

---

## 🎯 Aktuelle Ziele (Vision 2030)

- ✅ **10'000+ Geräte jährlich** vor Elektroschrott retten
- ✅ **Schweizweites Netzwerk** von Repair-Hubs aufbauen
- ✅ **500+ Menschen** pro Jahr in digitalen Skills ausbilden
- ✅ **100% finanzielle Nachhaltigkeit** erreichen
- ✅ Als **führende Organisation** für nachhaltige IT in der Schweiz anerkannt sein

---

## 🚀 Nächste Schritte

### Sofort (diese Woche)
- [ ] Platzhalter mit echten Daten füllen
- [ ] Budget-Template mit aktuellen Zahlen aktualisieren
- [ ] Fundraising-Liste priorisieren und validieren
- [ ] Erste Vorstandssitzung mit Template dokumentieren

### Kurzfristig 
- [ ] KPI-Tracking starten (erstes Device-Outcome eintragen)
- [ ] Social Media Accounts einrichten (Mastodon-Instance wählen)
- [ ] Brand Guidelines finalisieren (Logo, Farben)
- [ ] Erste Fundraising-Kontakte knüpfen

### Mittelfristig 
- [ ] Erstes Monatsreport erstellen
- [ ] Marketing-Kampagne starten
- [ ] Pitch Deck in PowerPoint umsetzen
- [ ] Finanzmodell entwickeln und validieren

---

## 👥 Zielgruppen & Nutzung

### Für Vorstand
- **Strategie:** `01_Management/A_Strategie_und_Governance/`
- **Finanzen:** `01_Management/B_Finanzen/` (besonders Fundraising)
- **Sitzungen:** `Vorstandssitzungen/Sitzungsprotokoll_Template.md`

### Für Geschäftsleitung
- **Alle Ordner** relevant
- **Besonders:** `C_Kennzahlen_und_Reporting/` für monatliches Tracking
- **Budget:** `B_Finanzen/Budget_Planung/`

### Für Tech-Team
- **Tech Stack:** `02_Technology/A_Tech_Stack/`
- **Development:** `02_Technology/B_Website_und_WebShop/`
- **AI/Automation:** `02_Technology/C_AI_und_Automation/`

### Für Marketing-Team
- **Alle Inhalte:** `01_Management/D_Marketing_und_Kommunikation/`
- **Kampagnen-Kalender** für Jahresplanung
- **Content-Ideen-Bank** für Inspiration

---

## 📊 Status-Übersicht

| Bereich | Dokumente | Status | Priorität |
|---------|-----------|--------|-----------|
| Strategie & Governance | 4/4 | ✅ Komplett | Hoch |
| Finanzen | 9/12 | ✅ 75% | Hoch |
| Kennzahlen & Reporting | 10/13 | ✅ 77% | Hoch |
| Marketing & Kommunikation | 6/6 | ✅ Komplett | Mittel |
| Technology | 4/8 | ⚠️ 50% | Hoch |
| Services | 0/5 | 🏗️ Struktur | Niedrig |

**Gesamtfortschritt:** ~65% der Planungsdokumentation abgeschlossen

---

## 🔧 Technische Prinzipien

### Schweizer Hochdeutsch

### Open-Source First
- ✅ FOSS-Tools bevorzugt (Next.js, Supabase, Linux)
- ✅ Vendor Lock-in vermieden
- ✅ Community-driven Ansatz

### Privacy & Security
- ✅ DSGVO-konform
- ✅ Minimale Daten-Sammlung
- ✅ Transparente Privacy Policy

---

## 🤖 Regeln für KI-Agenten

Um eine konsistente und qualitativ hochwertige Dokumentation zu gewährleisten, müssen alle KI-Agenten, die an diesem Projekt arbeiten, die folgenden Regeln strikt befolgen:

1.  **First-Principles-Ansatz anwenden:** Das ist die wichtigste Regel. Handle nicht nur auf Anweisung, sondern verstehe das zugrundeliegende Ziel. Leite die beste Lösung von den Grundprinzipien des Projekts und der jeweiligen Aufgabe her.
2.  **README-getriebene Struktur:** Jeder Ordner wird durch eine `README.md`-Datei gesteuert, die seinen Zweck und Inhalt definiert. Lies IMMER die `README.md` des Ordners, bevor du Änderungen vornimmst.
3.  **Kein Eszett (ss):** Wir verwenden ausschliesslich Schweizer Hochdeutsch. Das Zeichen `ss` ist strikt verboten und wird immer durch `ss` ersetzt (z.B. `Massnahme` statt `Massnahme`).
4.  **Kontext verstehen:** Lies vor dem Schreiben oder Ändern von Dateien immer die umliegenden Dokumente (insbesondere READMEs), um Stil, Struktur und Konventionen zu verstehen.
5.  **Bestehende Struktur respektieren:** Füge neue Inhalte logisch in die bestehende Ordner- und Dokumentenstruktur ein. Erstelle keine neuen Top-Level-Ordner ohne Rücksprache.
6.  **Präzise Änderungen:** Nimm Änderungen so präzise wie möglich vor und begründe grössere Änderungen oder Refactorings.

---

## 📞 Kontakt & Support

**Revamp-IT**
Birmensdorferstrasse 379
8055 Zürich

- 📞 +41 44 586 86 86
- ✉️ empfang@revamp-it.ch
- 🌐 revampit.vercel.app

**Bei Fragen zur Dokumentation:**
- Vorstand kontaktieren
- Team-Meeting einberufen
- Issues im internen System tracken

---

## 📈 Änderungshistorie

| Datum | Version | Änderung | Autor |
|-------|---------|----------|-------|
| Nov 2025 | 1.0 | Erstversion README erstellt | AI Assistant |

**Letzte Aktualisierung:** November 2025
**Nächste Review:** Januar 2026 (nach ersten echten Daten)

---

*"Alte Computer. Neue Chancen. Bessere Zukunft."*

**Status:** Planungsphase - Platzhalter müssen durch echte Daten ersetzt werden.
