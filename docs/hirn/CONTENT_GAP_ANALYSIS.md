# 📊 Content Gap Analysis: Was fehlt im Digital Brain?

**Datum:** 2025-11-24  
**Zweck:** Identifikation kritischer Informationslücken und Priorisierung für selbst-füllendes Digital Brain

---

## 🎯 Executive Summary

**Kernproblem:** Das Digital Brain hat eine **exzellente Struktur**, aber **keine operativen Daten**. Es ist wie ein perfekt gebautes Haus ohne Möbel.

**Kritische Erkenntnis:** Einige wenige, strategisch gewählte Datenfelder zu füllen, wird eine **Kaskade von automatisch ableitbaren Informationen** auslösen.

---

## 🔴 KRITISCH: Was fehlt absolut

### 1. **HR-Kapazitäten & Kosten** 🔴🔴🔴

**Datei:** `01_Management/E_Personal_und_HR/HR_Roster.csv`

**Was fehlt:**
- `capacity_pct` - Wie viel % arbeitet jede Person? (leer)
- `skills` - Welche Skills hat jede Person? (leer)
- `cost_rate_chf_per_hour` - Was kostet jede Person pro Stunde? (leer)
- `availability_from` - Ab wann verfügbar? (leer)
- `status` - Aktiv, Pause, etc.? (leer)

**Warum KRITISCH:**
- **Ohne Kapazitäten** → Kann keine Projekte planen
- **Ohne Kosten** → Kann kein Budget berechnen
- **Ohne Skills** → Kann keine Projektbesetzung machen
- **Ohne diese Daten** → Budget, Projekte, Fundraising können nicht realistisch geplant werden

**Impact wenn gefüllt:**
- ✅ Budget kann automatisch berechnet werden (Personalkosten = Summe aller Personen)
- ✅ Projekt-Kapazitätsplanung wird möglich
- ✅ Fundraising-Bedarf wird klar (Budget - Eigenerwirtschaftung = Fundraising-Bedarf)

**Zeitaufwand:** 1-2 Stunden (13 Personen × 5 Minuten = 65 Minuten)

---

### 2. **Budget-Zahlen (Einnahmen & Ausgaben)** 🔴🔴🔴

**Datei:** `01_Management/B_Finanzen/Finanzmodell/Jahresbudget_2025.csv`

**Was fehlt:**
- **ALLES** ist `[CHF BETRAG]` Platzhalter
- Keine einzige echte Zahl vorhanden
- 31 Zeilen × 15 Spalten = **465 Platzhalter**

**Warum KRITISCH:**
- **Ohne Budget** → Keine finanzielle Planung möglich
- **Ohne Zahlen** → Fundraising kann keine Ziele setzen
- **Ohne Einnahmen** → Kann nicht planen, was möglich ist
- **Ohne Ausgaben** → Kann nicht wissen, was gebraucht wird

**Impact wenn gefüllt:**
- ✅ Fundraising kann konkrete Ziele setzen (z.B. "Wir brauchen CHF 60'000")
- ✅ Projekte können budgetiert werden
- ✅ KPIs können finanziell validiert werden
- ✅ Strategische Entscheidungen werden datenbasiert

**Zeitaufwand:** 2-3 Stunden (aber kann schrittweise gefüllt werden)

**Priorität:** **HÖCHSTE** - Start mit:
1. **Personalkosten** (wenn HR_Roster gefüllt ist, kann das automatisch berechnet werden)
2. **Fixkosten** (Miete, Versicherungen - einmalig eintragen)
3. **Einnahmen-Ziele** (basierend auf Strategie)

---

### 3. **Operative Tracking-Daten** 🔴🔴

**Dateien:**
- `01_Management/C_Kennzahlen_und_Reporting/KPI_Tracking_Templates/01_Device_Outcome_Tracking.csv`
- `02_Device_Intake_Tracking.csv`
- `03_Teilhabe_Reintegration_Tracking.csv`
- `04_Workshop_Tracking.csv`
- `05_Finanz_Tracking.csv`

**Was fehlt:**
- **ALLES** ist 0 oder leer
- Keine historischen Daten
- Keine aktuellen Daten

**Warum KRITISCH:**
- **Ohne Tracking** → KPIs sind alle 🔴 (0%)
- **Ohne Daten** → Kann keine Trends sehen
- **Ohne Historie** → Kann keine Prognosen machen
- **Ohne Fakten** → Fundraising kann keine Impact-Storys erzählen

**Impact wenn gefüllt:**
- ✅ KPIs werden automatisch berechnet
- ✅ Reports können automatisch generiert werden
- ✅ Fundraising hat echte Zahlen für Pitches
- ✅ Strategische Entscheidungen basieren auf Fakten

**Zeitaufwand:** 
- **Einmalig:** 1-2 Stunden Setup (Prozess definieren)
- **Laufend:** 15-30 Minuten/Woche (Daten eintragen)

**Priorität:** **HOCH** - Aber kann schrittweise starten:
1. **Diese Woche:** Letzten Monat rückwirkend eintragen (wenn möglich)
2. **Ab jetzt:** Wöchentlich aktualisieren

---

### 4. **Projekt-Details** 🔴

**Datei:** `01_Management/J_Projekte/Project_Portfolio.csv`

**Was fehlt:**
- `sponsor` - Wer ist Sponsor? (alle [TBD])
- `start_date` - Wann startet es? (leer)
- `end_date` - Wann endet es? (leer)
- `owner` - Wer ist verantwortlich? (leer)
- `staffing` - Wer arbeitet daran? (leer)
- `budget_chf` - Was kostet es? (leer)

**Warum KRITISCH:**
- **Ohne Details** → Projekte können nicht geplant werden
- **Ohne Owner** → Keine Verantwortlichkeit
- **Ohne Budget** → Kann nicht budgetieren
- **Ohne Staffing** → Kann nicht planen, wer Zeit hat

**Impact wenn gefüllt:**
- ✅ Projekt-Kapazitätsplanung wird möglich
- ✅ Budget-Allokation wird klar
- ✅ Ressourcen-Konflikte werden sichtbar

**Zeitaufwand:** 30 Minuten (2 Projekte × 15 Minuten)

---

### 5. **Fundraising-Pipeline Details** 🔴

**Datei:** `01_Management/B_Finanzen/Finanzmodell/Fundraising_Pipeline.csv`

**Was fehlt:**
- `[NAME]` - Namen der Geldgeber (alle Platzhalter)
- `[CHF BETRAG]` - Beträge (alle Platzhalter)
- `[DATUM]` - Deadlines (alle Platzhalter)
- `[X]%` - Wahrscheinlichkeiten (alle Platzhalter)

**Warum KRITISCH:**
- **Ohne Namen** → Kann nicht tracken, wer kontaktiert wurde
- **Ohne Beträge** → Kann nicht planen, wie viel kommt
- **Ohne Deadlines** → Kann nicht priorisieren
- **Ohne Wahrscheinlichkeiten** → Kann nicht gewichten

**Impact wenn gefüllt:**
- ✅ Fundraising kann priorisiert werden
- ✅ Budget kann gewichtet werden (Wahrscheinlichkeit × Betrag)
- ✅ Deadlines werden nicht verpasst

**Zeitaufwand:** 2-3 Stunden (25 Einträge × 5-7 Minuten)

**Priorität:** **MITTEL** - Kann schrittweise gefüllt werden:
1. **Zuerst:** Zugesprochene Grants (100% Wahrscheinlichkeit)
2. **Dann:** Aktive Bewerbungen
3. **Zuletzt:** Recherche-Phase

---

## 🟡 WICHTIG: Was fehlt für vollständiges Bild

### 6. **Owner-Zuordnungen** 🟡

**Betroffen:**
- `00_INDEX.md` Dateien haben `owner: [TBD]`
- Projekte haben keine Owner
- Fundraising hat keine Verantwortlichen

**Warum wichtig:**
- **Ohne Owner** → Keine Verantwortlichkeit
- **Ohne Owner** → Kann nicht fragen, wer zuständig ist

**Zeitaufwand:** 15 Minuten (alle `00_INDEX.md` durchgehen)

---

### 7. **Prozess-Dokumentation** 🟡

**Status:**
- ✅ Intake-Prozess dokumentiert (AS-IS und TO-BE)
- ⚠️ Refurbishment-Prozess teilweise dokumentiert
- ❌ Lager-Prozess fehlt
- ❌ Qualitätskontrolle-Prozess fehlt

**Warum wichtig:**
- **Ohne Prozesse** → Neue Leute wissen nicht, wie es läuft
- **Ohne Prozesse** → Kann nicht optimieren

**Zeitaufwand:** 2-3 Stunden pro Prozess

---

### 8. **Historische Daten** 🟡

**Was fehlt:**
- Keine Daten aus 2024 (falls vorhanden)
- Keine Baseline für Vergleiche
- Keine Trends

**Warum wichtig:**
- **Ohne Historie** → Kann keine Trends sehen
- **Ohne Baseline** → Kann nicht messen, ob besser wird

**Zeitaufwand:** 2-3 Stunden (wenn Daten verfügbar)

---

## 🎯 PRIORISIERUNG: Was zuerst füllen?

### **Phase 1: Foundation (Diese Woche)** 🔴🔴🔴

**Ziel:** Basis-Daten, die alles andere ermöglichen

1. **HR_Roster.csv** - Kapazitäten & Skills
   - **Zeit:** 1-2 Stunden
   - **Impact:** 🔥🔥🔥 (ermöglicht Budget, Projekte, Planung)
   - **Ableitbar:** Personalkosten, Projekt-Kapazität

2. **Jahresbudget_2025.csv** - Personalkosten & Fixkosten
   - **Zeit:** 1 Stunde (wenn HR_Roster gefüllt)
   - **Impact:** 🔥🔥🔥 (ermöglicht Fundraising-Ziele)
   - **Ableitbar:** Fundraising-Bedarf, Projekt-Budgets

3. **Project_Portfolio.csv** - Owner & Start-Daten
   - **Zeit:** 30 Minuten
   - **Impact:** 🔥🔥 (ermöglicht Planung)
   - **Ableitbar:** Ressourcen-Bedarf

**Gesamt-Zeitaufwand:** 2.5-3.5 Stunden  
**Gesamt-Impact:** **MAXIMAL** - Ermöglicht alle weiteren Planungen

---

### **Phase 2: Operational Data (Nächste 2 Wochen)** 🔴🔴

**Ziel:** Aktuelle operative Daten für Tracking

1. **KPI Tracking Templates** - Letzten Monat rückwirkend
   - **Zeit:** 2-3 Stunden (einmalig)
   - **Impact:** 🔥🔥 (ermöglicht Reporting, KPIs)
   - **Ableitbar:** Alle KPIs, Reports

2. **Fundraising_Pipeline.csv** - Zugesprochene Grants
   - **Zeit:** 30 Minuten
   - **Impact:** 🔥🔥 (ermöglicht Budget-Planung)
   - **Ableitbar:** Erwartete Einnahmen

3. **Finanz_Tracking.csv** - Letzten Monat
   - **Zeit:** 30 Minuten
   - **Impact:** 🔥 (ermöglicht Finanz-Reporting)
   - **Ableitbar:** Revenue-Breakdown, Margen

**Gesamt-Zeitaufwand:** 3-4 Stunden  
**Gesamt-Impact:** **HOCH** - Ermöglicht Reporting & Tracking

---

### **Phase 3: Vollständigkeit (Nächster Monat)** 🟡

**Ziel:** Alle Lücken schliessen

1. **Fundraising_Pipeline.csv** - Alle Einträge
2. **Jahresbudget_2025.csv** - Alle Einnahmen-Kategorien
3. **Owner-Zuordnungen** - Alle `[TBD]` ersetzen
4. **Prozess-Dokumentation** - Fehlende Prozesse

**Gesamt-Zeitaufwand:** 5-8 Stunden  
**Gesamt-Impact:** **MITTEL** - Verbessert Vollständigkeit

---

## 💡 Strategie: "Selbst-füllendes Brain"

### **Das Konzept:**

Wenn bestimmte **Kern-Daten** gefüllt sind, können viele andere Daten **automatisch abgeleitet** werden:

```
HR_Roster (Kapazitäten + Kosten)
    ↓
Personalkosten = Summe(Alle Personen × Stunden × Rate)
    ↓
Jahresbudget (Personalkosten bekannt)
    ↓
Fundraising-Bedarf = Gesamtausgaben - Eigenerwirtschaftung
    ↓
Fundraising-Pipeline (Ziele klar)
```

### **Kaskaden-Effekt:**

1. **HR_Roster gefüllt** →
   - ✅ Personalkosten berechenbar
   - ✅ Projekt-Kapazität planbar
   - ✅ Budget-Personalkosten füllbar

2. **Budget-Personalkosten + Fixkosten gefüllt** →
   - ✅ Gesamtausgaben bekannt
   - ✅ Fundraising-Bedarf berechenbar
   - ✅ Fundraising-Ziele setzbar

3. **Tracking-Daten gefüllt** →
   - ✅ Alle KPIs berechenbar
   - ✅ Reports generierbar
   - ✅ Trends sichtbar

---

## 📋 Konkrete Action Items

### **Diese Woche (Phase 1):**

#### Tag 1-2: HR_Roster.csv füllen
- [ ] Für jede Person: `capacity_pct` eintragen (z.B. 100%, 80%, 60%)
- [ ] Für jede Person: `skills` eintragen (z.B. "Python|Linux|AI")
- [ ] Für jede Person: `cost_rate_chf_per_hour` eintragen (oder monatlich, dann umrechnen)
- [ ] Für jede Person: `status` eintragen (z.B. "Active", "Part-time")
- [ ] Für jede Person: `availability_from` eintragen (falls relevant)

**Fragen zu klären:**
- Was ist die aktuelle Kapazität jeder Person?
- Was sind die Skills jeder Person?
- Was kostet jede Person (Stundenlohn oder Monatsgehalt)?

#### Tag 3: Jahresbudget_2025.csv - Personalkosten
- [ ] Personalkosten aus HR_Roster berechnen
- [ ] In Jahresbudget eintragen
- [ ] Fixkosten eintragen (Miete, Versicherungen, etc.)

**Fragen zu klären:**
- Was sind die monatlichen Fixkosten?
- Was sind die Versicherungskosten?
- Was sind die Mietkosten?

#### Tag 4: Project_Portfolio.csv
- [ ] Für jedes Projekt: `owner` eintragen
- [ ] Für jedes Projekt: `start_date` eintragen
- [ ] Für jedes Projekt: `sponsor` eintragen (falls bekannt)

---

### **Nächste Woche (Phase 2):**

#### Tracking-Daten starten
- [ ] Letzten Monat rückwirkend eintragen (wenn möglich)
- [ ] Prozess definieren: Wer trägt wann was ein?
- [ ] Wöchentliche Updates einrichten

#### Fundraising-Pipeline - Zugesprochene
- [ ] Alle Grants mit 100% Wahrscheinlichkeit eintragen
- [ ] Namen, Beträge, Daten eintragen

---

## 🎯 Erfolgs-Metriken

### **Nach Phase 1 (diese Woche):**
- ✅ HR_Roster zu 100% gefüllt
- ✅ Jahresbudget Personalkosten gefüllt
- ✅ Jahresbudget Fixkosten gefüllt
- ✅ Fundraising-Bedarf berechenbar
- ✅ Projekt-Owner zugeordnet

### **Nach Phase 2 (nächste 2 Wochen):**
- ✅ Tracking-Daten laufen
- ✅ KPIs werden berechnet (nicht mehr alle 🔴)
- ✅ Fundraising-Pipeline zu 50% gefüllt
- ✅ Erste Reports generierbar

### **Nach Phase 3 (nächster Monat):**
- ✅ Alle Platzhalter ersetzt
- ✅ Alle Owner zugeordnet
- ✅ Vollständige Prozess-Dokumentation
- ✅ Historische Daten (falls verfügbar)

---

## 💬 FAQ

**Q: Warum HR_Roster zuerst?**  
A: Weil Personalkosten der grösste Budget-Posten sind (50%). Ohne diese Daten kann kein Budget berechnet werden.

**Q: Warum nicht alles auf einmal?**  
A: Weil das überwältigend ist. Schrittweise füllen zeigt schnelle Wins und motiviert.

**Q: Was, wenn ich nicht alle Daten habe?**  
A: Fülle, was du hast. Teilweise gefüllt ist besser als gar nicht gefüllt. Markiere Ungewissheiten mit `[ESTIMATE]` oder `[TBD]`.

**Q: Wie oft aktualisieren?**  
A: 
- **HR_Roster:** Monatlich (Kapazitäten können sich ändern)
- **Budget:** Quartalsweise (oder bei grossen Änderungen)
- **Tracking:** Wöchentlich (operativ)
- **Fundraising:** Wöchentlich (Deadlines, Status)

---

## 📊 Zusammenfassung

**Kritische Lücken:**
1. 🔴 HR-Kapazitäten & Kosten (1-2h)
2. 🔴 Budget-Zahlen (1-2h)
3. 🔴 Operative Tracking-Daten (2-3h einmalig, dann wöchentlich)
4. 🔴 Projekt-Details (30min)
5. 🔴 Fundraising-Pipeline (2-3h)

**Priorität:**
- **Phase 1 (diese Woche):** HR + Budget + Projekte = **2.5-3.5 Stunden**
- **Phase 2 (nächste 2 Wochen):** Tracking + Fundraising = **3-4 Stunden**
- **Phase 3 (nächster Monat):** Vollständigkeit = **5-8 Stunden**

**Gesamt:** ~10-15 Stunden für vollständiges, selbst-füllendes Digital Brain

**Impact:** Nach Phase 1 können bereits Budget, Fundraising-Ziele und Projekt-Planung gemacht werden. Das Brain beginnt, sich selbst zu füllen.

---

**Version:** 1.0  
**Erstellt:** 2025-11-24  
**Nächste Review:** Nach Phase 1 Completion

*"Ein paar strategische Daten füllen → Kaskade von automatisch ableitbaren Informationen"*








