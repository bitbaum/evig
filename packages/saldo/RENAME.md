# Renaming the product

The product name **Saldo** is easy to change — one command:

```bash
node packages/saldo/scripts/rename.mjs "New Name"
# optional second arg = the npm package name (default: <new-name>-engine)
node packages/saldo/scripts/rename.mjs "Klarzeit" klarzeit
```

It reads the current name from the SSOT (so it's re-runnable) and updates every
place the brand name is read:

| What | Where |
|------|-------|
| Package display name | `packages/saldo/src/brand.ts` (`BRAND.name`) |
| npm package name | `packages/saldo/package.json` |
| Import alias | `tsconfig.json`, `jest.config.js`, `src/lib/team/saldo.ts` |
| README | `packages/saldo/README.md` |
| Landing site | `public/saldo/index.html` (`PRODUCT.name`) |
| Projects card | `src/app/[locale]/projects/data.ts` (`brandName`) + the locale titles |

After running it: `cd packages/saldo && npm run build` (if you'll publish), then
commit. On the next deploy the site, the Projects card, and the package all show
the new name.

## What it does NOT touch (on purpose)

- **The word "saldo" = "balance"** — the accounting term used all through the
  engine (`computeTimeSaldo`, `saldoMinutes`, the `SALDO` column,
  `Zeitsaldo`/`Feriensaldo`). That is the domain vocabulary, not the brand, and
  renaming it would break the API. The script only changes the isolated brand
  strings.
- **The URL `/saldo`** and the folder names (`public/saldo`, `src/app/saldo`,
  `packages/saldo`) — a stable technical route. If you also want `/newname`,
  rename those folders and update the two references by hand:

  ```bash
  git mv public/saldo public/newname
  git mv src/app/saldo src/app/newname
  # then in src/app/[locale]/projects/data.ts change externalHref: '/newname'
  # and in src/proxy.ts add 'newname' to the matcher (or replace 'saldo')
  ```
