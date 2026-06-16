# White-label multi-tenant frontend

Monorepo demonstrating a minimal multi-tenant shell architecture with brand theming.

```
apps/player-shell          - shell app (routing, tenant context, API adapters)
themes/theme-tenant-alpha  - primary theme package (tokens + branded components)
themes/theme-tenant-beta   - additional theme package (alternative brand look)
```

## Prereqs

- Node.js 18+

## Install

```bash
npm install
```

## Run shell (dev)

```bash
npm run dev
# or directly:
npm -w apps/player-shell run dev
```

Open: http://localhost:5173

Theme packages are resolved directly from their TypeScript source via Vite aliases — no pre-build step is needed for development.

### Tenant switching

The shell reads `brand`, `locale`, and `currency` from URL query params. Use the **Tenant configuration** card on the home page, or edit the URL directly:

| Example                   | URL                                                                   |
| ------------------------- | --------------------------------------------------------------------- |
| Default (fallback theme)  | `http://localhost:5173/`                                              |
| Tenant alpha (violet)     | `http://localhost:5173/?brand=tenant-alpha`                           |
| Tenant beta (teal)        | `http://localhost:5173/?brand=tenant-beta`                            |
| Alpha, British locale     | `http://localhost:5173/?brand=tenant-alpha&locale=en-GB&currency=GBP` |
| Empty tenant (no invoice) | `http://localhost:5173/?brand=tenant-empty`                           |
| Theme preview             | `http://localhost:5173/theme/preview?brand=tenant-alpha`              |

Switching `brand` changes the header colour, button colour, and card style instantly - no page reload, no feature code changes.

### Test credentials

The API is mocked. Any email + password ≥ 6 chars will succeed. Use password `fail` to simulate an auth error.

For billing, amounts above 1,000,000 trigger a mock approval error.

## Run tests

```bash
npm -w apps/player-shell run test
```

Covers:

- `HomePage` - renders tenant settings, query string updates, navigation preserves params
- `BillingPage` - validation error, success flow, empty state, API error, reset flow
- `LoginPage` - blank submit, invalid email, short password, API success, API error, navigation

## Storybook (theme components)

```bash
npm -w themes/theme-tenant-alpha run storybook
```

Open: http://localhost:6006

Stories: `BrandButton` (Primary, Disabled, Loading, FullWidth, WithIcon) and `BrandCard` (Default, WithTitle, WithAction, NestedCards).

## Build

```bash
# Build everything (themes first, then shell)
npm run build

# Build themes only
npm run build:themes

# Build shell only (requires themes already built)
npm -w apps/player-shell run build
```

> Theme packages must be compiled (`npm run build:themes`) before a shell-only build, because the production bundle resolves from `dist/`. In dev mode this is not required — Vite resolves themes directly from source.

## Project structure

```
apps/player-shell/
├── src/
│   ├── components/
│   │   ├── AppLayout/
│   │   │   ├── AppLayout.tsx        # persistent header + nav (layout route)
│   │   │   └── AppLayout.module.css
│   │   ├── BackToHome/
│   │   │   ├── BackToHome.tsx       # back-navigation link with param preservation
│   │   │   └── BackToHome.module.css
│   │   └── TenantNavLink/
│   │       ├── TenantNavLink.tsx    # nav link that carries tenant query params
│   │       └── TenantNavLink.module.css
│   ├── constants/
│   │   └── common.const.ts          # shared app-wide constants
│   ├── routes/
│   │   ├── App.tsx                  # route tree
│   │   ├── BillingPage/
│   │   │   ├── BillingPage.tsx      # invoice creation with full state machine
│   │   │   └── BillingPage.test.tsx
│   │   ├── HomePage/
│   │   │   ├── HomePage.tsx         # tenant selector + branded component demo
│   │   │   ├── HomePage.test.tsx
│   │   │   └── HomePage.module.css
│   │   ├── LoginPage/
│   │   │   ├── LoginPage.tsx        # react-hook-form login
│   │   │   └── LoginPage.test.tsx
│   │   └── ThemePreview/
│   │       ├── ThemePreview.tsx     # live colour swatch + component preview
│   │       └── ThemePreview.module.css
│   ├── services/
│   │   ├── identityApi.ts           # mocked auth adapter
│   │   └── billingApi.ts            # mocked billing adapter
│   ├── styles/
│   │   └── global.css               # global CSS reset + base styles
│   ├── tenant/
│   │   ├── TenantContext.tsx        # provider
│   │   ├── context.ts               # createContext
│   │   └── useTenant.ts             # consumer hook
│   ├── test/
│   │   └── setup.ts                 # vitest global test setup
│   ├── theme/
│   │   ├── ThemeBoot.tsx            # reads URL params → TenantProvider + ThemeLoader
│   │   ├── ThemeLoader.tsx          # applies CSS variable tokens to <html>
│   │   ├── themeRegistry.ts         # brandId → { themeConfig, themeModule }
│   │   ├── themeContracts.ts        # ThemeModule type
│   │   ├── themeFallback.tsx        # fallback BrandButton + BrandCard
│   │   ├── themeTypes.ts            # shared theme type definitions
│   │   ├── useThemeComponents.tsx
│   │   ├── theme-tenant-alpha.d.ts  # ambient types for alpha package
│   │   ├── theme-tenant-beta.d.ts   # ambient types for beta package
│   │   └── index.ts                 # re-exports
│   ├── types/
│   │   ├── billingState.ts          # billing page state types
│   │   └── loginForm.ts             # login form field types
│   ├── utils/
│   │   └── formatters.utils.ts      # currency / locale formatters
│   └── main.tsx                     # app entry point
└── public/
    └── favicon.svg

themes/theme-tenant-alpha/src/   # violet brand
├── components/
│   ├── BrandButton.tsx              # branded button, hover/focus via JS state
│   ├── BrandButton.stories.tsx
│   ├── BrandCard.tsx                # card with brand border
│   └── BrandCard.stories.tsx
├── theme.config.ts                  # token values as JS object
├── themeTypes.ts                    # theme-local type definitions
├── tokens.css                       # same values as CSS custom properties
└── index.ts                         # package exports

themes/theme-tenant-beta/src/    # teal brand
├── components/
│   ├── BrandButton.tsx
│   └── BrandCard.tsx
├── theme.config.ts
├── themeTypes.ts
├── tokens.css
└── index.ts
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for boundary rules and [DECISIONS.md](DECISIONS.md) for rationale.
