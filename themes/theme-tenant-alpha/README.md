# theme-tenant-alpha

Theme package for tenant alpha.

Exports:

- `tokens.css` (owned by theme)
- `theme.config.ts` (token values as JS)
- `BrandButton`, `BrandCard`

Shell should load tokens via `theme.config` (boundary), not by importing `tokens.css` directly.
