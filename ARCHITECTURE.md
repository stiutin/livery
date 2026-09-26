# Architecture: Shell vs Theme Boundaries

> Written for the MVP this project started from. Since Phase 1, tokens are compiled from `tenants/<id>/tokens.json`, since Phase 2 every brand shares `@livery/ui`, since Phase 3 tenants are folders with their own URLs and prerendered pages, and since Phase 4 the product runs on an MSW mock API (see the README's _How it works_): the theme packages, their components and token objects, `useThemeComponents`, `ThemeBoot`, `ThemeLoader`, `themeRegistry`, the tenant query parameters, the billing form and its adapters, `tenant-empty`, `tokens.css` and the ambient declarations described below no longer exist. What still holds will fold into the README and `CLAUDE.md`.

## Overview

```
monorepo/
├── apps/shell        # shell application (routing, business logic, API)
├── themes/theme-tenant-alpha  # primary visual package (tokens + branded components)
└── themes/theme-tenant-beta   # additional visual package showing multi-brand scale
```

The packages are intentionally kept separate. The shell owns all runtime behaviour; the theme owns all visual identity. Swapping a theme must never require touching a page component.

---

## apps/shell

### Responsibilities

| Concern                 | Location                                 |
| ----------------------- | ---------------------------------------- |
| Routing                 | `src/routes/App.tsx`                     |
| Layout / persistent nav | `src/components/AppLayout/AppLayout.tsx` |
| Feature pages           | `src/routes/`                            |
| Tenant context          | `src/tenant/`                            |
| API adapters            | `src/services/`                          |
| Theme loading boundary  | `src/theme/`                             |

### Pages

| Route              | Component      | Notes                                                           |
| ------------------ | -------------- | --------------------------------------------------------------- |
| `/`                | `HomePage`     | Tenant selector, branded-component demo                         |
| `/auth/login`      | `LoginPage`    | Email + password, `react-hook-form` validation                  |
| `/account/billing` | `BillingPage`  | Amount form, full loading/error/empty/success states            |
| `/theme/preview`   | `ThemePreview` | Live colour swatches and component preview for the active brand |

### Tenant system

`TenantContext` carries `{ brandId, locale, currency }`. Values come from URL query params (`?brand=…&locale=…&currency=…`), which means:

- The full tenant state is always shareable via URL.
- `ThemeBoot` reads the params once on mount and provides a memoised context value.
- Navigation links preserve the current `?search` string so the tenant survives page transitions.

### Theme loading boundary

```
URL params
  → ThemeBoot            reads brand/locale/currency
    → TenantProvider     provides context
    → ThemeLoader        applies CSS variable tokens to <html>
    → themeRegistry      maps brandId → { themeConfig, themeModule }
      → useThemeComponents  returns branded React components to pages
```

**Rule: shell app code never imports `tokens.css` or raw CSS from a theme package.**  
Pages receive components via `useThemeComponents()`. Token values are applied once by `ThemeLoader`.

### API adapters

`identityApi` and `billingApi` live in `src/services/`. Pages call them through the adapter interface only - no fetch/HTTP details inside page components. Swapping to a real backend means replacing the adapter file, not touching any page.

### Adding a new tenant

1. Create a new theme package (e.g. `themes/theme-tenant-beta`).
2. Add an entry to `themeRegistry.ts` mapping the new `brandId` to its config and components.
3. Add the new brand to the `<select>` options in `HomePage`.

No page code changes required.

---

## themes/theme-tenant-beta

Mirrors the `theme-tenant-alpha` structure exactly (same file names, same exports) with different token values — teal primary colour instead of violet. Its presence demonstrates that adding a second brand requires no changes to shell code, only a new package entry in `themeRegistry.ts`.

---

## themes/theme-tenant-alpha

### Responsibilities

- Own CSS variable token values (`tokens.css`, `theme.config.ts`).
- Export branded React components that consume those tokens via `var(--token-name)`.
- **No business logic, no API calls, no routing.** Components are purely presentational.

### Exports

```ts
// tokens
export default themeConfig; // { name, tokens: Record<string, string> }
export {themeConfig};

// components
export {BrandButton};
export {BrandCard};
```

The shell imports only from this surface. It never imports `tokens.css` directly.

### Token contract

| Token             | Purpose                                 |
| ----------------- | --------------------------------------- |
| `--brand-primary` | Primary action colour (buttons, header) |
| `--brand-accent`  | Hover/focus highlight colour            |
| `--card-bg`       | Card background                         |
| `--card-border`   | Card border                             |
| `--text`          | Body text colour                        |

---

## Theme switch mechanics

1. User changes the `brand` param (via the HomePage selector or URL).
2. `ThemeBoot` detects the new `brandId` via `useLocation().search`.
3. `themeRegistry.resolveThemeForBrand(brandId)` returns the matching `ResolvedTheme`.
4. `ThemeLoader` writes the new token values as inline CSS properties on `<html>`.
5. `useThemeComponents()` returns the matching branded components.
6. All CSS variables cascade instantly - buttons, cards, inputs, the header - without re-mounting any feature component.
