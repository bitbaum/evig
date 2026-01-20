# 🎯 Content Priorities: Quick Reference

**Datum:** 2025-11-24  
**Zweck:** Schnelle Übersicht - Was zuerst füllen?

---

## 🔴 KRITISCH: Diese Woche (2.5-3.5 Stunden)

### 1. HR_Roster.csv (1-2h) 🔥🔥🔥
**Datei:** `01_Management/E_Personal_und_HR/HR_Roster.csv`

**Füllen:**
- `capacity_pct` - Wie viel % arbeitet jede Person?
- `skills` - Welche Skills? (z.B. "Python|Linux|AI")
- `cost_rate_chf_per_hour` - Stundenlohn oder Monatsgehalt
- `status` - "Active", "Part-time", etc.

**Warum zuerst?**
→ Ermöglicht automatische Berechnung von:
- Personalkosten im Budget
- Projekt-Kapazitätsplanung
- Ressourcen-Allokation

---

### 2. Jahresbudget_2025.csv - Personalkosten & Fixkosten (1h) 🔥🔥🔥
**Datei:** `01_Management/B_Finanzen/Finanzmodell/Jahresbudget_2025.csv`

**Füllen:**
- Personalkosten (aus HR_Roster berechnen)
- Fixkosten (Miete, Versicherungen, etc.)

**Warum zuerst?**
→ Ermöglicht:
- Fundraising-Bedarf = Gesamtausgaben - Eigenerwirtschaftung
- Realistische Budget-Planung

---

### 3. Project_Portfolio.csv (30min) 🔥🔥
**Datei:** `01_Management/J_Projekte/Project_Portfolio.csv`

**Füllen:**
- `owner` - Wer ist verantwortlich?
- `start_date` - Wann startet es?
- `sponsor` - Wer sponsert es?

**Warum wichtig?**
→ Ermöglicht Projekt-Planung und Ressourcen-Zuordnung

---

## 🟡 WICHTIG: Nächste 2 Wochen (3-4 Stunden)

### 4. KPI Tracking Templates (2-3h einmalig, dann wöchentlich)
**Dateien:** `01_Management/C_Kennzahlen_und_Reporting/KPI_Tracking_Templates/*.csv`

**Füllen:**
- Letzten Monat rückwirkend (wenn möglich)
- Ab jetzt: Wöchentlich aktualisieren

**Warum wichtig?**
→ Ermöglicht:
- KPI-Berechnung (nicht mehr alle 🔴)
- Automatische Reports
- Impact-Storys für Fundraising

---

### 5. Fundraising_Pipeline.csv - Zugesprochene Grants (30min)
**Datei:** `01_Management/B_Finanzen/Finanzmodell/Fundraising_Pipeline.csv`

**Füllen:**
- Alle Grants mit 100% Wahrscheinlichkeit
- Namen, Beträge, Daten

**Warum wichtig?**
→ Ermöglicht Budget-Planung mit erwarteten Einnahmen

---

## 📊 Kaskaden-Effekt

```
HR_Roster gefüllt
    ↓
Personalkosten berechenbar
    ↓
Budget-Personalkosten füllbar
    ↓
Fundraising-Bedarf = Gesamtausgaben - Eigenerwirtschaftung
    ↓
Fundraising-Ziele setzbar
```

**→ Das Brain beginnt, sich selbst zu füllen!**

---

## ✅ Checklist: Diese Woche

- [ ] HR_Roster.csv: `capacity_pct` für alle 13 Personen
- [ ] HR_Roster.csv: `skills` für alle Personen
- [ ] HR_Roster.csv: `cost_rate_chf_per_hour` für alle Personen
- [ ] HR_Roster.csv: `status` für alle Personen
- [ ] Jahresbudget_2025.csv: Personalkosten eintragen
- [ ] Jahresbudget_2025.csv: Fixkosten eintragen (Miete, Versicherungen)
- [ ] Project_Portfolio.csv: `owner` für beide Projekte
- [ ] Project_Portfolio.csv: `start_date` für beide Projekte

**Zeitaufwand:** 2.5-3.5 Stunden  
**Impact:** 🔥🔥🔥 MAXIMAL

---

## 📚 Detaillierte Analyse

Siehe: `docs/CONTENT_GAP_ANALYSIS.md` für vollständige Analyse

---

**Version:** 1.0  
**Erstellt:** 2025-11-24








