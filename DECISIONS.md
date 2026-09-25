# Decisions

## 1. Vite + React + TypeScript (not Next.js)

Next.js would add SSR complexity that a white-label shell doesn't need in the MVP. Vite gives instant HMR, a tiny config surface, and easy workspace resolution. TypeScript strict mode (`noUnusedLocals`, `noUnusedParameters`) catches dead code early.

## 2. npm workspaces monorepo

A single repo with three workspace members:

- `apps/shell`
- `themes/theme-tenant-alpha`
- `themes/theme-tenant-beta`

This lets the shell depend on theme packages via `"theme-tenant-alpha": "*"` without a registry, while keeping them separately releasable. Adding further brands requires no monorepo restructuring.

## 3. Tenant state in URL query params

`?brand=tenant-alpha&locale=en-GB&currency=GBP`

Alternatives considered: React state, localStorage, cookies. URL params win because:

- State is fully shareable and bookmarkable.
- Tenant context survives hard refreshes with no hydration step.
- No hidden state - QA and support can reproduce exact environments by pasting a URL.

Navigation links carry the current `?search` string forward so the tenant is never dropped on route transitions.

## 4. Theme boundary enforced via `themeRegistry`

The shell never imports `tokens.css` or any raw CSS file from a theme package. Instead:

- `themeRegistry.ts` is the single place that knows which brands exist. It maps `brandId → { themeConfig, themeModule }`.
- `ThemeLoader` applies token values as `document.documentElement.style.setProperty()` calls.
- Pages receive branded components via `useThemeComponents()` - they never import from theme packages directly.

Adding a third brand is one object entry in `themeRegistry.ts`.

## 5. API adapters isolated from pages

`identityApi` and `billingApi` expose a typed function interface. Page components call those functions and handle `{ ok }` / `{ invoiceId, amount }` responses. No `fetch`, `axios`, or URL strings appear in page code. Swapping to a real backend is a single-file change per adapter.

## 6. react-hook-form for the login form

`LoginPage` uses `react-hook-form` (`mode: "onTouched"`). This provides:

- Per-field inline errors shown after the field is interacted with.
- `isSubmitting` state for the submit button - no extra `useState`.
- Native `aria-invalid` + `aria-describedby` wiring makes errors accessible.

`BillingPage` keeps its own state machine (`idle / loading / error / empty / success`) because the billing flow is more about the async result than form field validity - the discriminated union makes all states explicit and exhaustive.

## 7. BrandButton / BrandCard use inline styles + JS event handlers for interaction states

Theme components cannot ship external CSS files that the shell would need to load. Styled-components or Emotion would add a runtime dependency to the theme package. Instead, components track `hovered` and `focused` state via React event handlers and derive `background` / `box-shadow` from CSS variable tokens inline. This keeps the theme package dependency-free (React peer dep only).

## 8. Fallback theme lives in the shell, not a package

The fallback `BrandButton` / `BrandCard` in `themeFallback.ts` mirror the theme-package components exactly. They use the same CSS variables, so the fallback appearance is controlled entirely by the token defaults in `global.css`. No extra package needed for the generic brand.

`tenant-default` and `tenant-empty` both resolve to the shell fallback theme: `tenant-default` is the baseline experience, while `tenant-empty` is used to demonstrate an empty invoice response from `billingApi`.

## 9. Extra theme package for scalability

In addition to the requested `theme-tenant-alpha`, this repo includes `theme-tenant-beta` to show how the architecture scales once a second brand is added. The shell can resolve multiple brands through the same `themeRegistry` boundary with no runtime changes to page components.

## 10. Static theme imports in `themeRegistry` (MVP trade-off)

`themeRegistry.ts` statically imports all theme packages at the top of the file. This means every brand's code is bundled together at build time, regardless of which tenant is active at runtime.

**Why accepted for MVP:** it avoids async complexity (no `React.lazy`, no dynamic `import()`), keeps the registry synchronous, and the total bundle impact is small when themes are lightweight (components + token objects only).

**Scale limit:** with 10+ brands, each with heavier component sets, a dynamic registry would be needed:

```ts
const THEME_REGISTRY: Record<BrandId, () => Promise<ResolvedTheme>> = {
  'tenant-alpha': () => import('theme-tenant-alpha').then(m => ({ ... })),
}
```

This is the only change required — page components and the theme boundary contract stay the same.

## 11. AppLayout as a React Router layout route

`AppLayout` wraps all pages via `<Route element={<AppLayout />}>` and renders `<Outlet />`. This means the persistent header renders once and pages slot in without re-mounting the header on navigation. The layout reads `useTenant()` to show the active brand in the header and generates nav links that preserve the `?search` string.

## 12. Ambient module declarations for theme packages

`src/theme/theme-tenant-alpha.d.ts` (and `theme-tenant-beta.d.ts`) duplicate the exported types from the theme packages as ambient module declarations. This is a workaround for TypeScript workspace resolution: when `moduleResolution` is set to `bundler`, TypeScript resolves the package to its source entry in `src/index.ts` (no `dist/` needed during dev), but in a fresh install from a registry it would resolve to `dist/index.d.ts`. The ambient declarations make the public surface explicit and stable regardless of resolution mode, at the cost of needing to stay in sync if the theme package's exports change.
