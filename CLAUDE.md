# CLAUDE.md

Working notes for AI assistants (and humans) on this repository. Read this first: what the project is, how it is built, which rules must not be broken, and how to verify a change. When something here gets out of date, fix this file in the same change.

## 1. What this is

**Livery** is a white-label React app: one product (a customer account with sign-in, invoices and card payments) shown in three brands, Harbour (light, the default), Onyx (dark) and Meadow (bright, card payments off). The goal is that a brand is data, not code: design tokens compiled at build time, one component library, tenants as validated configuration.

The project is being rebuilt in phases (README, _Roadmap_). **Phases 0 to 5 are done:** tooling, tests and CI; design tokens with a closed contract and WCAG AA as a build gate; one component library; tenants as folders with their own URLs and prerendered pages; the product on a mocked API; and English, German and Spanish on every tenant page. Section 11 lists what later phases address.

- Live: `https://stiutin.github.io/livery/` (GitHub Pages, base path `/livery/`)
- It is a **portfolio project**. Code quality, tests, accessibility and docs matter as much as features.
- `ARCHITECTURE.md` and `DECISIONS.md` describe the MVP and say where they no longer hold. They stay until the rebuild folds them into the README's _How it works_ and this file (house style has no ADR folder).

## 2. Toolchain

| Tool          | Version                                                                               | Notes                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Node.js       | 24 (`.nvmrc`), `engines` `>=22.22.3`                                                  | runs `packages/tokens/src/cli.ts` directly through type stripping                                                    |
| React         | 19                                                                                    | `StrictMode` on                                                                                                      |
| React Router  | 8, framework mode, `ssr: false` with `prerender`                                      | `react-router dev` / `react-router build`; config in `react-router.config.ts`, routes in `src/routes.ts`, no typegen |
| TypeScript    | 6.0, strict + `noUncheckedIndexedAccess`, `noImplicitOverride`, `noImplicitReturns`   | 7.0 is not supported by `typescript-eslint` yet                                                                      |
| Vite          | 8                                                                                     | base `/livery/` everywhere, dev included (`BASE_PATH` overrides); shared settings in `livery.config.ts`              |
| Design tokens | Design Tokens Format Module 2025.10, compiled by `@livery/tokens` (no dependencies)   | types: color (srgb, oklch), dimension, fontFamily, fontWeight, duration, number, cubicBezier, shadow                 |
| Tests         | Vitest 5 (node for tokens, jsdom for the app), Testing Library, Playwright 1.63       |                                                                                                                      |
| Lint          | ESLint 10 (strict-type-checked + house rules + React hooks), Stylelint 17, Prettier 3 |                                                                                                                      |

npm workspaces: `apps/*` and `packages/*`. Install and run everything from the root. Workspace packages are consumed from their TypeScript sources (`exports` point at `src/`); nothing is prebuilt.

## 3. Commands

```bash
npm start              # react-router dev on http://localhost:5173/livery/; saving a tenant file reloads the page
npm run build          # tsc -b + react-router build: prerenders every page into apps/shell/build/client; fails on any tenant problem
npm run serve          # serve apps/shell/build/client like GitHub Pages on :4173/livery/ (scripts/serve.mjs)
npm test               # Vitest: packages/tokens, packages/ui, then the shell
npm run tokens         # contrast summary per tenant and every problem; `-- --all` lists every pair
npm run e2e            # build, then Playwright on desktop + Pixel 7; `npm run e2e:install` once
npm run e2e:run        # the tests only, against the existing build
npm run lint           # ESLint + Stylelint (src CSS only)
npm run typecheck      # the shell, the e2e suite and both packages
npm run check          # format:check + lint + typecheck + test  ← before finishing
```

**Definition of done:** `npm run check` and `npm run e2e` are green; new behaviour has tests at the lowest sensible level; the README and this file are still accurate; no new lint suppressions without a comment explaining why.

## 4. Repository map

```
tenants/<id>/tenant.json   settings: name, locale, currency, features ({payments}), optional `tokens` (borrow a look)
tenants/<id>/tokens.json   the look: palette + semantic tokens, and overrides such as radii or a dark font stack
tenants/tenant.schema.json the tenant.json rules for editors; the build checks the same rules in tenant.ts
packages/tokens/
  base.tokens.json         shared by every tenant: component → semantic mappings, font, radii, shadow, duration
  src/contract.ts          the closed list of 49 semantic and component tokens, and the 21 contrast pairs
  src/parse.ts             file → flat tokens (dot paths, inherited $type), structural problems
  src/resolve.ts           aliases (whole values and inside shadows), cycles, value validation
  src/color.ts             sRGB/OKLCH conversion, compositing, WCAG luminance and contrast, CSS colours
  src/compile.ts           merge files, check the contract and contrast, emit CSS and the manifest
  src/css.ts               token → CSS custom property name and value
  src/tenant.ts            tenant.json validation
  src/node.ts              reads every tenant folder, compiles token sets, validates settings; src/cli.ts the report
  src/vite.ts              virtual:livery/tenants (list, default, loadTenant) and virtual:livery/tenant/<id> (one chunk each)
  src/virtual.d.ts         types of virtual:livery/tenants, referenced from the shell's tsconfig
packages/ui/src/
  Button/ Card/ Field/ (Field + Input) Select/ Dialog/ Toast/ (ToastProvider, useToast) Table/
                           one folder per component: .tsx, .module.css, .test.tsx; index.ts is the public API
  test/setup.ts            jest-dom, cleanup, and a stand-in for the <dialog> modal API that jsdom lacks
apps/shell/
  livery.config.ts         base path, repository root, tenant options: shared by Vite, Vitest and React Router
  react-router.config.ts   ssr: false, basename, the prerender list, buildEnd (Pages-shaped output)
  vite.config.ts           reactRouter() + liveryTokens(); vitest.config.ts uses liveryTokens() only
  src/routes.ts            / (landing), /:tenant (redirect to its default language), /:tenant/:lang (layout, id
                           "tenant") with its pages, * (404)
  src/tenantPaths.ts       TENANT_PAGES and prerenderPaths(tenants, languages): keep in step with routes.ts
  src/root.tsx             the document: loader (default tenant), Layout (<html lang data-tenant>, inline token
                           <style>), ToastProvider, ErrorBoundary (404 and errors)
  src/routes/              landing, tenant (loader → TenantProvider → AppLayout), not-found (clientLoader),
                           one folder per page with its test
  src/components/          AppLayout (header + nav), TenantNavLink, BackToHome
  src/tenant/              TenantContext {brandId, name, locale (for formatting), currency, features}; usePaths()
                           (page(p) → /<tenant>/<lang>/p, inLanguage(l) → this page in l)
  src/i18n/                languages (LANGUAGES, defaultLanguage, formattingLocale), messages/{en,de,es}.json
                           (ICU), messages.ts (MessageKey, loadMessages), I18nProvider + useI18n (t, rich), errors
  src/api/                 types (money in minor units), client (fetch under BASE_URL/api/<tenant>/, starts the
                           mocks), useApi (keyed request state with reload)
  src/mocks/               handlers (MSW: session, account, invoices, payments, confirm; TEST_CARDS, WRONG_PASSWORD),
                           db (customers derived from the email; paid invoices in sessionStorage), start (lazy worker)
  src/payment/             machine (the payment reducer), card (Luhn, expiry, CVC; shared with the mock API)
  src/session/             SessionProvider (useSyncExternalStore over sessionStorage), useSession, RequireSession
  src/test/                setup (MSW Node server, dialog stand-in, resets), render (renderPage, sessionFor)
  src/constants/ types/ utils/ styles/ test/
e2e/                       Playwright specs and helpers
scripts/serve.mjs          GitHub-Pages-like static server
```

## 5. Architecture

- **Token layers.** A tenant's files have three top-level groups. `primitive` is free-form and never emitted. `semantic` and `component` are closed: `CONTRACT` in `contract.ts` lists each token with its type, and a missing, unknown or mistyped token is a problem. The base file maps every component token to a semantic one; a tenant may override any token, since later files replace earlier ones token by token.
- **Compilation.** `compileTenant` parses each file, merges them, resolves aliases, then checks the contract and the contrast pairs. It never throws: every problem is collected with its file and path. An alias to another emitted token becomes `var(--…)`, so the cascade keeps component → semantic; an alias to a primitive is inlined. CSS names drop the layer: `semantic.color.text.default` → `--color-text-default`.
- **Contrast.** `CONTRAST_PAIRS` lists what the app draws on what. Ratios follow WCAG 2.2; a translucent foreground is composited over its background first, and backgrounds must be opaque. Text needs 4.5:1, control borders and focus rings 3:1. A failure names where each colour of the pair is finally written.
- **Delivery.** The Vite plugin compiles every token set and validates every tenant.json in `buildStart`, failing the build on any problem. `virtual:livery/tenants` exports the tenant list (id and name), the default tenant and `loadTenant(id)`, which dynamically imports `virtual:livery/tenant/<id>`: that tenant's settings, its token set's CSS (`tokenSetToCss`: every custom property on `:root`) and its tokens. In the dev server a tenant file change invalidates these modules in every environment and reloads the page.
- **Routing and prerendering.** `react-router build` renders `prerenderPaths()` (the landing page and every `TENANT_PAGES` entry of every tenant) to HTML and `.data` files. The tenant route's `loader` runs only then; client navigations fetch the `.data` file. Root `Layout` reads the tenant from `useRouteLoaderData('tenant')`, else the root loader's default tenant, and writes `lang`, `data-tenant` and the inline `<style id="tenant-tokens">`, so HTML is branded before hydration.
- **Output for GitHub Pages.** `buildEnd` in `react-router.config.ts` renames React Router's top-level `index.html` (the client-rendered fallback for URLs that were not prerendered) to `404.html`, moves the prerendered files out of the `livery/` basename folder, and turns every nested `x/index.html` into `x.html`, because Pages redirects a directory URL to its trailing slash.
- **404s.** An unknown page of a known tenant matches the `*` route, whose `clientLoader` throws a 404. An unknown tenant arrives in `404.html` with no loader data for `/:tenant`; the root `ErrorBoundary` treats any error under an unknown first segment as not found. Pages itself answers both with status 404.
- **Tenant context.** The tenant route puts `{brandId, name, locale, currency}` in `TenantContext`; pages read it with `useTenant()` and build links as `/${brandId}/…`. Pages and components never look at the URL for the tenant.
- **Localisation.** `/:tenant/:lang`'s loader validates the language and returns the tenant, the language, the formatting locale (`formattingLocale`: the tenant's locale in its own language, the language's usual one otherwise) and that language's catalogue, loaded through `import.meta.glob` so each language is its own chunk. `I18nProvider` compiles each message once with `IntlMessageFormat`; `t(key, values)` returns text, `rich(key, values)` renders tags such as `<b>` and `<link>` with the functions passed for them. `/:tenant` redirects to `defaultLanguage(tenant.locale)`; the build shortens React Router's redirect page to an immediate refresh. Root `Layout` sets `<html lang>` and writes `hreflang` links to the page in the other languages. Paths drop a trailing slash before links are built, because prerendering requests pages with one and the browser has none.
- **Component library.** `@livery/ui` components use CSS Modules and read only semantic and component custom properties. States are CSS (`:hover:not(:disabled)`, `:focus-visible`, `:disabled`, `[aria-invalid]`, `[aria-busy]`), variants are `data-variant` attributes. `Field` takes a render function and hands the control its `id`, `aria-describedby` (hint, then error) and `aria-invalid`; its error has `role="alert"`. `Dialog` wraps the native `<dialog>` (`showModal`, `close`, the `close` event) and treats a click on the element itself as a click on the backdrop. `ToastProvider` owns one always-present region (`role="status"`, polite); `useToast()` lives in its own file so Fast Refresh keeps working. `Table` is generic over its row type.
- **Mock API.** `api/client.ts` calls `${BASE_URL}api/<tenant>/…` with the session token; before the first call it awaits `startMocks()`, which imports MSW and the handlers and registers `mockServiceWorker.js` with the base path as its scope. In tests (`MODE === 'test'`) it does nothing, because `src/test/setup.ts` runs the same handlers with `msw/node`. Tokens are base64 JSON `{tenant, email}` and only valid for their tenant.
- **Payments.** `PaymentDialog` (lazy, only rendered when `features.payments` is on) keeps its state in `paymentReducer`: `closed → editing → submitting → (succeeded | confirming → submitting | editing with an error)`. Events a state does not expect return the same state. Card checks in `payment/card.ts` run in the form and in the mock API alike.
- **Sessions.** Per tenant, in sessionStorage (`livery:session:<tenant>`). `SessionProvider` uses `useSyncExternalStore` with a server snapshot of `undefined`, so prerendered HTML and hydration agree; `RequireSession` shows a status while `undefined`, redirects to `login?next=` when `null`. The login page follows `next` only within its own tenant.
- **Base path.** Everything is built and served for `BASE_PATH` (default `/livery/`; CI passes `/<repository>/`): Vite's `base` and React Router's `basename` both come from `livery.config.ts`.

## 6. Invariants - do not break

1. **No literal colours, radii or durations in app or library CSS.** Use the semantic or component custom properties; if one is missing, add it to the contract (recipe below), never a one-off value.
2. **Components never read primitives.** Only semantic and component tokens are emitted; keep it that way.
3. **Every contrast pair passes for every tenant.** Do not lower a minimum or drop a pair to make a brand build; change the brand's colours.
4. **Tenant styles are inlined, never global.** A page carries only its own tenant's token set; do not import all tenants' CSS into the client.
5. **Pages build UI from `@livery/ui`.** No page-level buttons, inputs or dialogs; if a component is missing, add it to the library with its tests.
6. **Links stay inside the tenant.** Internal links are `/${brandId}/…` (`TenantNavLink`, `BackToHome`, `navigate`); only the landing page, the header's “All tenants” and the 404 page leave it.
7. **No absolute URLs in app code.** The router adds the base path; assets go through Vite. A hard-coded `/…` breaks under `/livery/`.
8. **Build and serve with the same `BASE_PATH`.** `scripts/serve.mjs` refuses a build made for another base.
9. **Promises are handled.** `navigate()` and `handleSubmit()` return promises; event handlers wrap them in a block with `void` (lint-enforced).
10. **Loaders only on prerendered routes.** With `ssr: false`, a `loader` on a route that is not prerendered fails the build; use a `clientLoader` there. When a page is added, add it to `routes.ts` and `TENANT_PAGES` together.
11. **Component states stay in CSS.** No hover or focus state in React; focus rings use `:focus-visible` and the focus token.
12. **Money is in minor units** in the API and the mock data; only `formatMoney` divides, in the tenant's locale and currency.
13. **Mock and UI share rules.** Card checks, test cards and the refused password live in one place and are imported by the form, the mock API and the tests.
14. **Features are read from the tenant, never from the tenant id.** No `if (brandId === …)` anywhere.
15. **No UI text in code.** Every string a person reads on a tenant page is a message key in all three catalogues; links go through `usePaths()` so they keep the language.

## 7. Testing guide

- **Tokens** (`packages/tokens/src/*.test.ts`, Vitest, node): colour maths against known values, parsing and resolution problems with their exact messages, the contract and contrast on the real default tenant plus a small edit file, `tokenSetToCss`, tenant.json validation, the repository's tenants compiling clean, and real `vite build`s of a throwaway app: one per tenant chunk, one that must fail when a tenant drops below AA.
- **Components** (`packages/ui/src/**/*.test.tsx`, Vitest, jsdom): what a user or a screen reader gets. Query by role, name and description; assert attributes (`aria-busy`, `aria-invalid`, `data-variant`), not class names. Toast timing uses fake timers.
- **Shell** (Vitest, jsdom, globals, `@testing-library/jest-dom`): `renderPage()` from `src/test/render.tsx` wraps a page in a `MemoryRouter`, `TenantProvider`, `SessionProvider` and `ToastProvider`, without the framework plugin; `sessionFor(email)` signs in beforehand. The mock API runs through `msw/node`, so pages are tested against the same handlers as the browser; `onUnhandledRequest: 'error'` catches any call outside them, and every test starts with an empty mock database and session. The payment machine and card checks are tested as plain functions.
- **End-to-end** (`e2e/`): against the production build served by `scripts/serve.mjs`, on `desktop` and `mobile` (Pixel 7). `trackErrors(page)` collects page and console errors, ignoring the deliberate 404 of deep links served through `404.html`. `brandToken(page, name)` reads a custom property's computed value on `<html>`; poll it (`expect.poll`) after moving to another tenant. The prerendering scenarios read raw HTML with `request.get()` and run a page with JavaScript disabled. The notification region is always a `status`, so scope page statuses to `getByRole('main')` and toasts to the `Notifications` region. Keyboard-only scenarios skip the mobile project.
- `CHROMIUM_PATH=/path/to/chrome` points Playwright at a specific browser (sandboxes).

## 8. Recipes

- **Add a tenant:** a folder in `tenants/` with a `tenant.json` (name, locale, currency) and either a `tokens.json` (copy one, change the palette and semantic colours, run `npm run tokens` until every pair passes) or `"tokens": "<other tenant>"`. No code changes: the router, the prerender list and the landing page pick it up.
- **Change a brand's colour:** edit its primitive in `tenants/<id>/tokens.json`, keeping `components` (0–1) and `hex` in step; the compiler rejects a hex that does not match.
- **Add a feature flag:** add it to `FEATURES` in `packages/tokens/src/tenant.ts`, to `features` in `tenants/tenant.schema.json` and `LoadedTenant`, set it in every tenant.json, and read it with `useTenant().features`.
- **Add a page:** a route module under `src/routes/`, an entry in `routes.ts` under `:tenant` and in `TENANT_PAGES`, a link where it belongs, a unit test and an end-to-end scenario.
- **Add a message:** add the key to `messages/en.json`, `de.json` and `es.json` with the same ICU arguments (the catalogue tests fail otherwise), then use `t('key', {…})` or `rich()` for tags.
- **Add a language:** an entry in `LANGUAGES`, a catalogue in `messages/`, and the test's catalogue map; the router, the prerender list and the switcher pick it up.
- **Add a component:** a folder in `packages/ui/src/` with the component, a CSS Module that uses only custom properties, and tests; export it from `index.ts`. If it needs a value no token covers, add a component token first (next recipe).
- **Add a token to the contract:** add it to `CONTRACT` (and to `CONTRAST_PAIRS` if something is drawn on it), give it a value in `base.tokens.json` or in every tenant, then use its custom property in CSS.

## 9. CI/CD

The jobs are _Lint and types_, _Unit tests_, _Build_ (prerenders and uploads `apps/shell/build/client`), _End-to-end (Playwright)_ against that build, and _Deploy to GitHub Pages_, which publishes the same artifact from `master`. A token problem fails _Unit tests_ and _Build_. `BASE_PATH` is set once at the top of the workflow from the repository name. One-time setup is listed in the workflow header.

## 10. Troubleshooting

| Symptom                                                          | Cause / fix                                                                                              |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Build fails with "Design tokens have N problem(s)"               | each line names the tenant, the file and the token; `npm run tokens -- --all` shows every pair           |
| "hex … does not match the components"                            | a colour was edited in one place only; update `components` and `hex` together                            |
| A tenant looks like the default                                  | its tenant.json borrows another look (`tokens`), or the page was not prerendered: check `prerenderPaths` |
| "Invalid route exports found when prerendering with `ssr:false`" | a route that is not prerendered has a `loader`; make it a `clientLoader` or prerender its paths          |
| A new page is a 404 on the live site                             | it is in `routes.ts` but not in `TENANT_PAGES`, so it was never prerendered                              |
| `npm run serve` refuses to start                                 | no build, or a build for another base path: `npm run build` with the same `BASE_PATH`                    |
| E2E hits the wrong app                                           | another project's server is on port 4173 (`reuseExistingServer`); stop it                                |
| Playwright: "Executable doesn't exist"                           | `npm run e2e:install`, or `CHROMIUM_PATH=/path/to/chrome`                                                |
| The live site shows a blank page after renaming the repository   | the build's base path is the old name; re-run the workflow, which reads the new name                     |
| Deploy rejected: "branch not allowed to deploy to github-pages"  | Settings → Environments → github-pages → allow `master`                                                  |

## 11. Known limitations

These are what later phases address, or trade-offs worth knowing:

- The landing page and the 404 page are outside any tenant and only in English. Mock data such as customer names and IBANs is not translated.
- The mock API forgets pending bank confirmations on reload, and paid invoices only last for the browser session.
- The output layout assumes GitHub Pages serves `x.html` for `/x` even when a folder `x/` exists; `scripts/serve.mjs` does the same. Check the live site after the first deploy.
- Framework mode and intl-messageformat bring their own runtime: a tenant page loads about 132 kB of JavaScript (gzipped). Paint does not wait for it, since the HTML is complete; Lighthouse comes with the testing phase.
- Only the token types Livery uses are supported; gradients, borders, typography and transitions report "unsupported $type".

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
