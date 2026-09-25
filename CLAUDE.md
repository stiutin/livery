# CLAUDE.md

Working notes for AI assistants (and humans) on this repository. Read this first: what the project is, how it is built, which rules must not be broken, and how to verify a change. When something here gets out of date, fix this file in the same change.

## 1. What this is

**Livery** is a white-label React app: one product (a customer account with sign-in and billing) shown in the brand of each tenant. The goal is that a brand is data, not code: design tokens compiled at build time, one component library, tenants as validated configuration.

The project is being rebuilt in phases (README, _Roadmap_). **Phase 0 is done:** the code is still the original MVP, now on the portfolio's tooling, tests and CI. Much of what sections 5 and 11 describe is what the next phases replace; do not build on it more than a change needs.

- Live: `https://stiutin.github.io/livery/` (GitHub Pages, base path `/livery/`)
- It is a **portfolio project**. Code quality, tests, accessibility and docs matter as much as features.
- `ARCHITECTURE.md` and `DECISIONS.md` come from the MVP. They stay until the rebuild folds them into the README's _How it works_ and this file (house style has no ADR folder).

## 2. Toolchain

| Tool         | Version                                                                               | Notes                                                                      |
| ------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Node.js      | 24 (`.nvmrc`), `engines` `>=22.22.3`                                                  |                                                                            |
| React        | 19                                                                                    | `StrictMode` on                                                            |
| React Router | 8, library mode                                                                       | imports come from `react-router`; `react-router-dom` no longer exists      |
| TypeScript   | 6.0, strict + `noUncheckedIndexedAccess`, `noImplicitOverride`, `noImplicitReturns`   | 7.0 is not supported by `typescript-eslint` yet                            |
| Vite         | 8                                                                                     | base `/livery/` for builds (`BASE_PATH` overrides), `/` for the dev server |
| Tests        | Vitest 5 (jsdom), Testing Library, Playwright 1.63                                    |                                                                            |
| Lint         | ESLint 10 (strict-type-checked + house rules + React hooks), Stylelint 17, Prettier 3 |                                                                            |

npm workspaces: `apps/*` and `themes/*`. Install and run everything from the root.

## 3. Commands

```bash
npm start              # Vite dev server on :5173 (base /)
npm run build          # themes (tsc), then the shell: tsc -b + vite build into apps/shell/dist (base /livery/)
npm run serve          # serve apps/shell/dist like GitHub Pages on :4173/livery/ (scripts/serve.mjs)
npm test               # Vitest unit tests (apps/shell/src/**/*.test.tsx)
npm run e2e            # build, then Playwright on desktop + Pixel 7; `npm run e2e:install` once
npm run e2e:run        # the tests only, against the existing build
npm run lint           # ESLint + Stylelint (src CSS only)
npm run typecheck      # the shell, the e2e suite and both themes
npm run check          # format:check + lint + typecheck + test  ← before finishing
```

**Definition of done:** `npm run check` and `npm run e2e` are green; new behaviour has tests at the lowest sensible level; the README and this file are still accurate; no new lint suppressions without a comment explaining why.

## 4. Repository map

```
apps/shell/
  index.html               title, description, #root, noscript
  vite.config.ts           base path, the 404.html copy (spaFallback), theme aliases to their sources
  src/main.tsx             BrowserRouter with basename = import.meta.env.BASE_URL
  src/routes/              App.tsx (route tree) and one folder per page, with its test
  src/components/          AppLayout (header + nav), TenantNavLink, BackToHome
  src/tenant/              TenantContext: {brandId, locale, currency}
  src/theme/               ThemeBoot, ThemeLoader, themeRegistry, fallback components, ambient .d.ts for themes
  src/services/            identityApi, billingApi: mocked adapters
  src/constants/ types/ utils/ styles/ test/
themes/theme-tenant-alpha/ tokens (theme.config.ts + tokens.css), BrandButton, BrandCard
themes/theme-tenant-beta/  the same exports with other values
e2e/                       Playwright specs and helpers
scripts/serve.mjs          GitHub-Pages-like static server
```

## 5. Architecture (as of Phase 0)

- **Tenant state is the URL.** `ThemeBoot` reads `?brand`, `?locale` and `?currency`, falls back to `DEFAULT_TENANT` for unknown values, and provides a memoised context. Links keep `location.search`, so the tenant survives navigation.
- **Theme boundary.** `themeRegistry.ts` is the only file that knows which brands exist. `ThemeLoader` writes the tokens to `<html>` in an effect; pages get `BrandButton`/`BrandCard` from `useThemeComponents()` and never import a theme package.
- **Themes in development and production** are resolved from their TypeScript sources through Vite aliases; `build:themes` only proves the packages compile on their own.
- **API adapters** return typed results; pages hold no network code. `BillingPage` is a discriminated-union state machine (`idle | loading | error | empty | success`).
- **Base path.** Builds are made for `BASE_PATH` (default `/livery/`; CI passes `/<repository>/`). The router's basename is `import.meta.env.BASE_URL`, and the build copies `index.html` to `404.html`, so GitHub Pages boots the app on any deep link (with status 404; prerendering is on the roadmap).

## 6. Invariants - do not break

1. **Pages never import from a theme package or its CSS.** Components come from `useThemeComponents()`, tokens from `ThemeLoader`.
2. **Links keep the tenant.** Internal navigation carries `location.search` (`TenantNavLink`, `BackToHome`, `navigate(\`…${search}\`)`).
3. **No absolute URLs in app code.** The router adds the base path; assets go through Vite. A hard-coded `/…` breaks under `/livery/`.
4. **Build and serve with the same `BASE_PATH`.** `scripts/serve.mjs` refuses a build made for another base.
5. **Promises are handled.** `navigate()` and `handleSubmit()` return promises; event handlers wrap them in a block with `void` (lint-enforced).
6. **`tenant-empty` exists only for the billing mock's empty state.** Do not give it other meaning; the product phase removes it.

## 7. Testing guide

- **Unit** (Vitest, jsdom, globals, `@testing-library/jest-dom`): pages are rendered inside a `MemoryRouter`; the adapters are stubbed with `vi.spyOn`. Use role and label queries.
- **End-to-end** (`e2e/`): against the production build served by `scripts/serve.mjs`, on `desktop` and `mobile` (Pixel 7). `trackErrors(page)` collects page and console errors, ignoring the deliberate 404 of deep links served through `404.html`. `brandToken(page, name)` reads a token from `<html>`; poll it (`expect.poll`), since tokens are applied in an effect.
- `CHROMIUM_PATH=/path/to/chrome` points Playwright at a specific browser (sandboxes).

## 8. Recipes

- **Add a tenant (MVP way, until Phase 1):** a theme package mirroring `theme-tenant-beta`, an alias in `vite.config.ts`, an ambient `.d.ts` in `src/theme/`, and an entry in `SUPPORTED_BRANDS` and `THEME_REGISTRY`.
- **Add a page:** a route in `routes/App.tsx` under `AppLayout`, a `TenantNavLink` in the header if it belongs there, a unit test, and an end-to-end scenario for the flow.

## 9. CI/CD

The jobs are _Lint and types_, _Unit tests_, _Build_ (uploads `apps/shell/dist`), _End-to-end (Playwright)_ against that build, and _Deploy to GitHub Pages_, which publishes the same artifact from `master`. `BASE_PATH` is set once at the top of the workflow from the repository name. One-time setup is listed in the workflow header.

## 10. Troubleshooting

| Symptom                                                         | Cause / fix                                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `npm run serve` refuses to start                                | no build, or a build for another base path: `npm run build` with the same `BASE_PATH` |
| E2E hits the wrong app                                          | another project's server is on port 4173 (`reuseExistingServer`); stop it             |
| Playwright: "Executable doesn't exist"                          | `npm run e2e:install`, or `CHROMIUM_PATH=/path/to/chrome`                             |
| The live site shows a blank page after renaming the repository  | the build's base path is the old name; re-run the workflow, which reads the new name  |
| Deploy rejected: "branch not allowed to deploy to github-pages" | Settings → Environments → github-pages → allow `master`                               |

## 11. Known limitations

These are what the roadmap phases replace:

- Each theme forks `BrandButton` and `BrandCard`; hover and focus are JavaScript state with inline styles, and focus shows on mouse clicks too (no `:focus-visible`).
- Tokens are applied in an effect, so every brand first paints in the fallback colours.
- Nothing checks contrast: white on alpha's hover colour is about 2.4:1 and on beta's about 1.9:1 (AA needs 4.5:1).
- The token contract is `Record<string, string>`: alpha has 14 tokens, beta 5. Values are duplicated between `tokens.css` and `theme.config.ts`, and the themes' types between the packages and ambient `.d.ts` files.
- The initial bundle is about 97 kB gzipped; React Router 8 added about 15 kB over 6. Per-tenant chunks come with the tenant model.

## House style (identical in every repository of this portfolio)

These six repositories are written as one body of work: [cosmos-stories](https://github.com/stiutin/cosmos-stories), [larder](https://github.com/stiutin/larder), [livery](https://github.com/stiutin/livery), [pixi-neon-district](https://github.com/stiutin/pixi-neon-district), [threejs-solar-system](https://github.com/stiutin/threejs-solar-system) and [threejs-icosphere](https://github.com/stiutin/threejs-icosphere). Keep them alike. When a convention changes, change it everywhere.

**Shared files.** `LICENSE` (MIT, Serge Tiutin), `.editorconfig`, `.gitattributes`, `.nvmrc` (`24`), `.prettierrc`, `.prettierignore`, `.gitignore`, `.vscode/`, `.github/dependabot.yml` and the issue and PR templates are identical across the repositories, apart from a clearly marked `# Project` block at the end of the ignore files.

**Formatting.** Prettier: 120 columns, single quotes, no spaces inside braces (`{a, b}`), trailing commas where ES5 allows them, always parenthesised arrow parameters. `npm run format` fixes everything, and `npm run format:check` runs in CI. ESLint does not format.

**Linting.** `eslint.config.mjs` with `defineConfig`, and two shared blocks:

- `HOUSE_RULES`: sorted imports and exports (`simple-import-sort`), no unused imports, `curly: all`, arrow bodies only where needed, no `console` except `warn` and `error`;
- `HOUSE_TS_RULES` in TypeScript projects: explicit `public`/`protected`/`private` on every class member (never on constructors), `T[]` rather than `Array<T>`, and unused variables allowed only as `_`.

`eslint-config-prettier` comes last. Each project adds its own strictness on top: `typescript-eslint` strict-type-checked in cosmos-stories, livery and pixi-neon-district (livery adds the React hooks and Fast Refresh rules), Larder's own rule set (magic numbers, naming, member ordering, RxJS) in larder. Styles are linted by Stylelint with properties in alphabetical order; `-webkit-backdrop-filter` and `-webkit-user-select` stay, for Safari.

**`package.json`.** The field order is name, version, description, license, author, repository, homepage, keywords, private, type, engines, workspaces (in monorepos), scripts, dependencies, devDependencies. Dependencies are sorted, and `engines.node` is `>=22.22.3`. Scripts use the same names everywhere:

| Script                                       | Meaning                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------- |
| `start`                                      | dev server                                                                |
| `build`                                      | production build                                                          |
| `serve`                                      | serve the production build like GitHub Pages does                         |
| `test` / `test:watch`                        | unit tests (where the project has them)                                   |
| `e2e` / `e2e:run` / `e2e:ui` / `e2e:install` | Playwright: build and test / test only / UI mode / download Chromium      |
| `screenshots`                                | regenerate `.github/screenshots/*.png` for the README                     |
| `lint` / `lint:fix`                          | ESLint and Stylelint                                                      |
| `typecheck`                                  | TypeScript (TypeScript projects)                                          |
| `format` / `format:check`                    | Prettier                                                                  |
| `check`                                      | everything CI checks before building: formatting, lint, types, unit tests |

**TypeScript.** Every TypeScript project has `strict` plus `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch` and `noUncheckedIndexedAccess`. Projects may add more (cosmos-stories: `noPropertyAccessFromIndexSignature`; pixi-neon-district: `exactOptionalPropertyTypes`, unused locals and parameters).

**Dependencies.** The latest versions, with deliberate exceptions noted in each CLAUDE.md. In particular, TypeScript stays on 6.0 because `typescript-eslint` and Angular 22 do not support 7.0 yet.

**Tests.** Every project has Playwright tests against its production build, on a desktop and a Pixel 7 viewport, served the way GitHub Pages serves it. `CHROMIUM_PATH` points Playwright and the screenshot scripts at a specific browser binary (useful in sandboxes). Projects with logic worth isolating also have Vitest unit tests.

**CI.** `.github/workflows/ci.yml` with the same job names: _Lint and types_, _Unit tests_, _Build_, _End-to-end (Playwright)_, _Lighthouse_ (Angular projects), _Deploy to GitHub Pages_. It runs on `ubuntu-24.04`, reads the Node version from `.nvmrc`, and uses the same action versions everywhere. Deploys go from `master` only, and only after the gates pass. The header of the workflow lists the one-time repository settings; the `github-pages` environment must allow `master`.

**Documentation.** The README follows one outline: title, one line, a paragraph, **Open the live demo**, screenshots, then _Features_, _Tech stack_, _How it works_, _Testing_ (a table), _Project structure_, _Running locally_, _Deployment_, _Roadmap_, _License_, _Author_. The voice is calm and specific, in British English, with no badges and no marketing adjectives. Explain _why_ in prose. There is no CHANGELOG and no ADR folder: decisions live in _How it works_ and in this file. `.github/social-preview.png` (1280×640) is the repository's social preview, and every project uses the same design.

**Scripts and tooling.** Node scripts are `.mjs`. TypeScript scripts run through Node's type stripping, and are used only when they share code with the app (cosmos-stories). Scripts have a header comment with usage examples.
