#!/bin/bash
# Denní běh sazeb na Macu (zdarma, bez GitHub Actions).
#
# Každý běh:
#   1. v oddělené čisté kopii repozitáře stáhne aktuální main (nic nerozdělaného se nepřepíše),
#   2. přečte sazby z webů bank (collect-rates.mjs),
#   3. zapíše je do hypotecnikalkulacka/index.html (apply-to-html.mjs),
#   4. pokud se stránka změnila, commitne a pushne do main (GitHub Pages web sám nasadí).
#
# Použití:  run-daily.sh [--no-push]
# Kopie pro běh: RATES_RUNNER_DIR (výchozí ~/.marek-rates/repo), vytvoří se při prvním běhu.
set -uo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"

REMOTE="https://github.com/marekmarek-web/osobni-web-finance.git"
DIR="${RATES_RUNNER_DIR:-$HOME/.marek-rates/repo}"
PUSH=1; [ "${1:-}" = "--no-push" ] && PUSH=0

notify() { osascript -e "display notification \"$1\" with title \"Sazby marek-marek.cz\"" >/dev/null 2>&1 || true; }
fail() { echo "CHYBA: $1"; notify "$1"; exit 1; }

mkdir -p "$(dirname "$DIR")"
[ -d "$DIR/.git" ] || git clone --depth 1 "$REMOTE" "$DIR" || fail "klonování repozitáře selhalo"
cd "$DIR" || fail "chybí pracovní kopie"

git fetch --depth 1 origin main || fail "stažení main selhalo"
git checkout -q -B main FETCH_HEAD && git reset -q --hard FETCH_HEAD && git clean -fdq -e scripts/rates/node_modules || fail "příprava čisté kopie selhala"

[ -d scripts/rates/node_modules ] || (cd scripts/rates && npm install --no-audit --no-fund --no-package-lock) || fail "instalace Playwrightu selhala"

node scripts/rates/collect-rates.mjs; COLLECT=$?
node scripts/rates/apply-to-html.mjs; APPLY=$?
# apply: 0 = vše ověřeno, 2 = některý řádek nešel ověřit (zůstal se starým datem), jiné = chyba
[ "$APPLY" -le 2 ] || fail "zápis sazeb do stránky selhal (kód $APPLY)"

if git diff --quiet -- hypotecnikalkulacka/index.html scripts/rates/rates-snapshot.json; then
  echo "Beze změny."
else
  git add hypotecnikalkulacka/index.html scripts/rates/rates-snapshot.json
  git -c user.name="Marek Marek" -c user.email="marekmarek@Marek--MacBook-Pro.local" \
    commit -q -m "chore(rates): denní aktualizace sazeb $(date +%F)" || fail "commit selhal"
  if [ "$PUSH" = 1 ]; then
    git push origin HEAD:main || { git fetch --depth 1 origin main && git rebase FETCH_HEAD && git push origin HEAD:main; } || fail "push do main selhal"
    echo "Pushnuto."
  else
    echo "(--no-push) commit hotov, nepushnuto."
  fi
fi

[ "$COLLECT" -eq 0 ] && [ "$APPLY" -eq 0 ] || notify "Některé sazby se nepodařilo ověřit, zůstaly se starým datem."
exit 0
