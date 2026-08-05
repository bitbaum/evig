# evig — Gründungsunterlagen

Draft founding documents for **evig** as a Swiss `Verein` with seat in Zürich.

| File | What it is |
|---|---|
| `STATUTEN.md` | The statutes — drafted for tax exemption on first submission |
| `GRUENDUNGSPROTOKOLL.md` | Minutes template for the founding assembly |

> ⚠️ **Drafts, not legal advice.** Have a Treuhandstelle or a lawyer review them
> before the founding assembly. Two items still need confirming — see
> [Open items](#open-items).

---

## The strategy these documents encode

**A gemeinnütziger Verein that runs its marketplaces as a means to its purpose,
with the commercial arm designed to be spun out into a GmbH later.**

Why gemeinnützig rather than a commercial Verein:

- What tax exemption costs is the right to **extract** profit. A Verein cannot
  distribute profit to anyone regardless of tax status — so that freedom cannot
  be used. The exemption is close to free.
- A commercial Verein runs a `kaufmännisches Gewerbe`, which makes
  **Handelsregister entry mandatory** (Art. 61 Abs. 2 ZGB, Art. 90 HRegV).
  Gemeinnützig keeps registration optional.
- Grants are the channel that brings money in. Most Swiss foundations require
  recognised gemeinnützigkeit.
- Tax: 0% versus roughly 4.25% federal (Art. 71 DBG) plus 4% ZH simple rate
  (§ 76 StG) before Steuerfuss multipliers.

**The marketplaces are compatible.** Trading is permitted where it is
`von untergeordneter Bedeutung` and `höchstens Mittel zum Zweck`
(ESTV-Kreisschreiben Nr. 12). A marketplace that makes quality refurbished
hardware reachable *is* the purpose executing, not a side business funding it.
Revamp-IT ran exactly this model as a registered gemeinnütziger Verein; Caritas,
HEKS and the SRK all run retail operations while gemeinnützig.

The distinction to hold on to: **given or subsidised is charitable; sold at
market to maximise margin is commercial.** Keep the Zweck idealistic in every
public statement, and be as effective as you like in execution.

---

## Founding checklist

1. **Find at least one co-founder with settled status (B / C / Swiss).**
   This single step resolves four separate problems: bank KYC, Handelsregister
   identity, Rechtsdomizil, and board independence for any future compensation
   decision. It is the practical bottleneck, not a formality.
2. Fill in `STATUTEN.md` and `GRUENDUNGSPROTOKOLL.md`.
3. Hold the founding assembly (minimum **two** founders).
4. Sign **in original handwriting**: statutes by a board member; minutes by the
   chair *and* the minute-taker. Election acceptance may be recorded in the
   minutes itself — no separate declarations needed.
5. Open the bank account (see below).
6. Run the first financial year. **Keep the commercial activity as its own cost
   centre from the first invoice** — a self-contained Betrieb can later be
   transferred to a GmbH as a restructuring rather than a taxable asset sale.
7. At year end: apply for tax exemption with statutes, founding minutes, the
   first Jahresrechnung and an activity description.

**Skip the Handelsregister for now.** Entry is voluntary unless the Verein runs a
kaufmännisches Gewerbe, is revisionspflichtig (Art. 69b ZGB: 2 of CHF 10m balance
sheet / CHF 20m turnover / 50 FTE, two years running), or collects assets abroad
above CHF 100k.

---

## Bank account

A Verein can open an account **without** Handelsregister entry. Bring:

- current statutes
- signed founding minutes (most banks: not older than 12 months)
- list of signatories
- official ID for each board member

Candidates: **Alternative Bank Schweiz** (mission fit), ZKB, Raiffeisen. Apply to
two in parallel.

**Nothing ever flows through a private account.** evig's money belongs to evig as
a separate legal person. This is a precondition for grants and for the tax
exemption, not a formality.

---

## Honesty boundary

Until the Steueramt's Verfügung actually exists:

- no `Spendenbescheinigungen`
- no claim of recognised gemeinnützigkeit
- no UID

`src/config/org.ts` → `ORG.legalForm` is the SSOT for this claim and currently
reads `in Gründung`. It stays that way until the Verfügung arrives.

---

## Tripwires to watch

| Trigger | Consequence |
|---|---|
| Profit > CHF 5,000 | Federal profit tax (Art. 71 DBG). Mitgliederbeiträge are not profit (Art. 66 Abs. 1 DBG) |
| Profit > CHF 10,000 / capital > CHF 100,000 | ZH cantonal + municipal tax (§ 76 Abs. 2, § 82 Abs. 2 StG) |
| Turnover > CHF 250,000 | MWST registration — the raised threshold for gemeinnützige Institutionen (Art. 10 Abs. 2 lit. c MWSTG); CHF 100,000 otherwise |
| Turnover > CHF 500,000 | Full double-entry accounting (OR 957) |
| `kaufmännisches Gewerbe` | Handelsregister entry becomes mandatory — qualitative, no threshold |

When trading starts to dominate, that is the signal to spin out the GmbH. Art. 4
of the statutes already permits holding the participation without amendment.

---

## Open items

1. **Is the Zurich `Branchenregelung` still in force?** It restricts work permits
   for Ausweis-N holders to listed sectors. Software and NPO management are not
   among them; `Entsorgung / Abfallwirtschaft` is. Source is an AWA factsheet
   dated 01.01.2017 and the office was reorganised in 2023 — verify before
   relying on it. → Amt für Wirtschaft, `ab@vd.zh.ch`, +41 43 259 49 49.
2. **Does the Handelsregister accept an Ausweis N under Art. 24a HRegV?** SEM
   states the N `ist kein Nachweis für die Identität des Inhabers/der Inhaberin`.
   → Ask the Handelsregisteramt Kanton Zürich before filing anything.

Free advice: Rechtsberatungsstelle für Asylsuchende / Freiplatzaktion Zürich
(asylum side); vitamin B (Verein mechanics).

---

## Sources

- Merkblätter Handelsregisteramt Kanton Zürich — Neueintragung / Eintragungspflicht eines Vereins
- ESTV Kreisschreiben Nr. 12 vom 08.07.1994 (Steuerbefreiung)
- Kanton Zürich, ZStB 61.1 — Steuerbefreiung wegen Gemeinnützigkeit (Praxis ab 01.02.2024)
- Art. 60–79 ZGB · Art. 66, 71 DBG · § 61, 76, 82 StG ZH · Art. 10 MWSTG · OR 957
