#!/usr/bin/env bash
#
# Lint: Detect ASCII umlaut substitutions in user-facing strings
#
# Swiss German uses "ss" instead of "ß", but umlauts (ä, ö, ü) are REQUIRED.
# This script catches common ASCII replacements like "fuer" instead of "für".
#
# Usage:
#   npm run lint:umlauts
#   ./scripts/lint-umlauts.sh [path]
#

set -euo pipefail

SEARCH_PATH="${1:-src}"
EXIT_CODE=0

# Patterns: word fragments that are almost always wrong in German string literals.
# Each pattern is "ascii_form|correct_form" for readable output.
PATTERNS=(
  'fuer|für'
  'koennen|können'
  'moeglich|möglich'
  'moechte|möchte'
  'koennte|könnte'
  'Aender|Änder'
  'aender|änder'
  'Ungueltig|Ungültig'
  'ungueltig|ungültig'
  'Gueltig|Gültig'
  'gueltig|gültig'
  'Uebernehm|Übernehm'
  'uebernehm|übernehm'
  'Passwoert|Passwört'
  'Bestaetig|Bestätig'
  'Geraet|Gerät'
  'spaeter|später'
  'Waehlen|Wählen'
  'waehlen|wählen'
  'Laenge|Länge'
  'Hoehe|Höhe'
  'Groesse|Grösse'
  'Schaetz|Schätz'
  'schaetz|schätz'
  'Ergaenz|Ergänz'
  'ergaenz|ergänz'
  'Pruef|Prüf'
  'pruef|prüf'
  'Zurueck|Zurück'
  'zurueck|zurück'
  'ausfuell|ausfüll'
  'Ausfuell|Ausfüll'
  'hinzufueg|hinzufüg'
  'Hinzufueg|Hinzufüg'
  'verfueg|verfüg'
  'Verfueg|Verfüg'
  'unterstuetz|unterstütz'
  'Unterstuetz|Unterstütz'
  'ausgewaehlt|ausgewählt'
  'Loeschen|Löschen'
  'loeschen|löschen'
  'enthaelt|enthält'
  'Enthaelt|Enthält'
  'erhaelt|erhält'
  'Erhaelt|Erhält'
  'behaelt|behält'
  'Behaelt|Behält'
  'gewaehlt|gewählt'
  'Gewaehlt|Gewählt'
  'zaehlt|zählt'
  'Zaehlt|Zählt'
  'faellt|fällt'
  'Faellt|Fällt'
  'laesst|lässt'
  'Laesst|Lässt'
  'naechst|nächst'
  'Naechst|Nächst'
  'verfuegbar|verfügbar'
  'Verfuegbar|Verfügbar'
  'uebersch|übersch'
  'Uebersch|Übersch'
  'ueberpruef|überprüf'
  'Ueberpruef|Überprüf'
  'ausfuehr|ausführ'
  'Ausfuehr|Ausführ'
  'durchfuehr|durchführ'
  'Durchfuehr|Durchführ'
  'zurueckset|zurücksetz'
  'Zurueckset|Zurücksetz'
  'genuegt|genügt'
  'Genuegt|Genügt'
)

# Exclusion patterns for false positives:
# - URLs (https://, href:)
# - Code identifiers (id:, slug:, key:, field:, sidebarGroup:)
# - Variable/property assignments with the pattern as identifier
# - Import statements
# - Comments
# - Database column names (_mm suffix)
# - new Set([...]) and similar code constructs
EXCLUDE_PIPE='grep -v "https\?://"
  | grep -v "href:"
  | grep -v "slug:"
  | grep -v "id: "
  | grep -v "sidebarGroup:"
  | grep -v "import "
  | grep -v "// "
  | grep -v "_mm"
  | grep -v "new Set("
  | grep -v "#[a-z]"'

echo "Checking for ASCII umlaut substitutions in $SEARCH_PATH..."
echo ""

for entry in "${PATTERNS[@]}"; do
  ascii="${entry%%|*}"
  correct="${entry##*|}"

  # Search .ts and .tsx files, filter out false positives
  matches=$(grep -rn --include="*.ts" --include="*.tsx" \
    "$ascii" "$SEARCH_PATH" 2>/dev/null \
    | grep -v 'node_modules' \
    | grep -v '\.next/' \
    | grep -v 'https\?://' \
    | grep -v 'href:' \
    | grep -v "slug:" \
    | grep -v "id: '" \
    | grep -v "sidebarGroup:" \
    | grep -v 'import ' \
    | grep -v '// ' \
    | grep -v '_mm' \
    | grep -v 'new Set(' \
    | grep -v "'#" \
    | grep -v 'statutenaenderung' \
    || true)

  if [ -n "$matches" ]; then
    echo "  ✗ \"$ascii\" should be \"$correct\":"
    echo "$matches" | while IFS= read -r line; do
      echo "    $line"
    done
    echo ""
    EXIT_CODE=1
  fi
done

if [ "$EXIT_CODE" -eq 0 ]; then
  echo "  ✓ No ASCII umlaut issues found."
else
  echo "---"
  echo "Fix: Replace ASCII substitutions with proper umlauts (ä, ö, ü)."
  echo "Note: Variable names, DB columns, and URL slugs may use ASCII — only fix user-facing strings."
  echo "      If a match is a false positive, it's likely a code identifier, not a user-facing string."
fi

exit $EXIT_CODE
