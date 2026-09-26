# CLAUDE.md

Working notes for AI assistants (and humans) on this repository. Read this first: what the project is, how it is built, which rules must not be broken, and how to verify a change. When something here gets out of date, fix this file in the same change.

## 1. What this is

**Livery** is a white-label React app: one product (a customer account with sign-in and billing) shown in the brand of each tenant. The goal is that a brand is data, not code: design tokens compiled at build time, one component library, tenants as validated configuration.

The project is being rebuilt in phases (README, _Roadmap_). **Phases 0 to 2 are done:** the portfolio's tooling, tests and CI; design tokens as W3C files with a closed contract and WCAG AA contrast as a build gate; and one component library for every brand. The tenant model (query parameters), the pages' content and the mocked API are still the MVP's; section 11 lists what the next phases replace, so do not build on those parts more than a change needs.

- Live: `https://stiutin.github.io/livery/` (GitHub Pages, base path `/livery/`)
- It is a **portfolio project**. Code quality, tests, accessibility and docs matter as much as features.
- `ARCHITECTURE.md` and `DECISIONS.md` describe the MVP and say where they no longer hold. They stay until the rebuild folds them into the README's _How it works_ and this file (house style has no ADR folder).

## 2. Toolchain

| Tool          | Version                                                                               | Notes                                                                                                |
| ------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Node.js       | 24 (`.nvmrc`), `engines` `>=22.22.3`                                                  | runs `packages/tokens/src/cli.ts` directly through type stripping                                    |
| React         | 19                                                                                    | `StrictMode` on                                                                                      |
| React Router  | 8, library mode                                                                       | imports come from `react-router`; `react-router-dom` no longer exists                                |
| TypeScript    | 6.0, strict + `noUncheckedIndexedAccess`, `noImplicitOverride`, `noImplicitReturns`   | 7.0 is not supported by `typescript-eslint` yet                                                      |
| Vite          | 8                                                                                     | base `/livery/` for builds (`BASE_PATH` overrides), `/` for the dev server                           |
| Design tokens | Design Tokens Format Module 2025.10, compiled by `@livery/tokens` (no dependencies)   | types: color (srgb, oklch), dimension, fontFamily, fontWeight, duration, number, cubicBezier, shadow |
| Tests         | Vitest 5 (node for tokens, jsdom for the app), Testing Library, Playwright 1.63       |                                                                                                      |
| Lint          | ESLint 10 (strict-type-checked + house rules + React hooks), Stylelint 17, Prettier 3 |                                                                                                      |

npm workspaces: `apps/*` and `packages/*`. Install and run everything from the root. Workspace packages are consumed from their TypeScript sources (`exports` point at `src/`); nothing is prebuilt.

## 3. Commands

```bash
npm start              # Vite dev server on :5173 (base /); saving a token file reloads the page
npm run build          # tsc -b + vite build into apps/shell/dist (base /livery/); fails on any token problem
npm run serve          # serve apps/shell/dist like GitHub Pages on :4173/livery/ (scripts/serve.mjs)
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
tenants/<id>/tokens.json   one brand each (tenant-default, tenant-alpha, tenant-beta): palette + semantic tokens
packages/tokens/
  base.tokens.json         shared by every tenant: component → semantic mappings, font, radii, shadow, duration
  src/contract.ts          the closed list of 49 semantic and component tokens, and the 21 contrast pairs
  src/parse.ts             file → flat tokens (dot paths, inherited $type), structural problems
  src/resolve.ts           aliases (whole values and inside shadows), cycles, value validation
  src/color.ts             sRGB/OKLCH conversion, compositing, WCAG luminance and contrast, CSS colours
  src/compile.ts           merge files, check the contract and contrast, emit CSS and the manifest
  src/css.ts               token → CSS custom property name and value
  src/node.ts              reads the files from disk; src/vite.ts the plugin; src/cli.ts the report
  src/virtual.d.ts         types of virtual:livery/tenants(.css), referenced from the shell's tsconfig
packages/ui/src/
  Button/ Card/ Field/ (Field + Input) Select/ Dialog/ Toast/ (ToastProvider, useToast) Table/
                           one folder per component: .tsx, .module.css, .test.tsx; index.ts is the public API
  test/setup.ts            jest-dom, cleanup, and a stand-in for the <dialog> modal API that jsdom lacks
apps/shell/
  vite.config.ts           base path, the 404.html copy (spaFallback), the tokens plugin
  src/main.tsx             tenants.css, global.css, BrowserRouter with basename = import.meta.env.BASE_URL
  src/routes/App.tsx       ThemeBoot → ToastProvider → routes
  src/routes/              App.tsx (route tree) and one folder per page, with its test
  src/components/          AppLayout (header + nav), TenantNavLink, BackToHome
  src/tenant/              TenantContext: {brandId, locale, currency}
  src/theme/               ThemeBoot, ThemeLoader (data-tenant), themeRegistry (brand → token set)
  src/services/            identityApi, billingApi: mocked adapters
  src/constants/ types/ utils/ styles/ test/
e2e/                       Playwright specs and helpers
scripts/serve.mjs          GitHub-Pages-like static server
```

## 5. Architecture

- **Token layers.** A tenant's files have three top-level groups. `primitive` is free-form and never emitted. `semantic` and `component` are closed: `CONTRACT` in `contract.ts` lists each token with its type, and a missing, unknown or mistyped token is a problem. The base file maps every component token to a semantic one; a tenant may override any token, since later files replace earlier ones token by token.
- **Compilation.** `compileTenant` parses each file, merges them, resolves aliases, then checks the contract and the contrast pairs. It never throws: every problem is collected with its file and path. An alias to another emitted token becomes `var(--…)`, so the cascade keeps component → semantic; an alias to a primitive is inlined. CSS names drop the layer: `semantic.color.text.default` → `--color-text-default`.
- **Contrast.** `CONTRAST_PAIRS` lists what the app draws on what. Ratios follow WCAG 2.2; a translucent foreground is composited over its background first, and backgrounds must be opaque. Text needs 4.5:1, control borders and focus rings 3:1. A failure names where each colour of the pair is finally written.
- **Delivery.** The Vite plugin compiles all tenants in `buildStart` and fails the build on any problem. It serves `virtual:livery/tenants.css` (the default tenant's block first, on `:root` and its `[data-tenant]`, then one block per tenant) and `virtual:livery/tenants` (the manifest: every token's name, CSS and resolved value). In the dev server a token file change invalidates both and reloads the page.
- **Tenant state is the URL.** `ThemeBoot` reads `?brand`, `?locale` and `?currency`, falls back to `DEFAULT_TENANT` for unknown values, and provides a memoised context. Links keep `location.search`, so the tenant survives navigation.
- **Brands.** `themeRegistry.ts` maps each brand to a token set (a folder in `tenants/`); `ThemeLoader` sets `<html data-tenant>` in a layout effect. Nothing else differs between brands.
- **Component library.** `@livery/ui` components use CSS Modules and read only semantic and component custom properties. States are CSS (`:hover:not(:disabled)`, `:focus-visible`, `:disabled`, `[aria-invalid]`, `[aria-busy]`), variants are `data-variant` attributes. `Field` takes a render function and hands the control its `id`, `aria-describedby` (hint, then error) and `aria-invalid`; its error has `role="alert"`. `Dialog` wraps the native `<dialog>` (`showModal`, `close`, the `close` event) and treats a click on the element itself as a click on the backdrop. `ToastProvider` owns one always-present region (`role="status"`, polite); `useToast()` lives in its own file so Fast Refresh keeps working. `Table` is generic over its row type.
- **API adapters** return typed results; pages hold no network code. `BillingPage` is a discriminated-union state machine (`idle | loading | error | empty | success`).
- **Base path.** Builds are made for `BASE_PATH` (default `/livery/`; CI passes `/<repository>/`). The router's basename is `import.meta.env.BASE_URL`, and the build copies `index.html` to `404.html`, so GitHub Pages boots the app on any deep link (with status 404; prerendering is on the roadmap).

## 6. Invariants - do not break

1. **No literal colours, radii or durations in app or library CSS.** Use the semantic or component custom properties; if one is missing, add it to the contract (recipe below), never a one-off value.
2. **Components never read primitives.** Only semantic and component tokens are emitted; keep it that way.
3. **Every contrast pair passes for every tenant.** Do not lower a minimum or drop a pair to make a brand build; change the brand's colours.
4. **The default tenant's CSS block comes first.** `:root` and `[data-tenant]` have equal specificity; the order is what lets a tenant override the default.
5. **Pages build UI from `@livery/ui`.** No page-level buttons, inputs or dialogs; if a component is missing, add it to the library with its tests.
6. **Links keep the tenant.** Internal navigation carries `location.search` (`TenantNavLink`, `BackToHome`, `navigate(\`…${search}\`)`).
7. **No absolute URLs in app code.** The router adds the base path; assets go through Vite. A hard-coded `/…` breaks under `/livery/`.
8. **Build and serve with the same `BASE_PATH`.** `scripts/serve.mjs` refuses a build made for another base.
9. **Promises are handled.** `navigate()` and `handleSubmit()` return promises; event handlers wrap them in a block with `void` (lint-enforced).
10. **`tenant-empty` exists only for the billing mock's empty state.** It uses the default token set; the product phase removes it.
11. **Component states stay in CSS.** No hover or focus state in React; focus rings use `:focus-visible` and the focus token.

## 7. Testing guide

- **Tokens** (`packages/tokens/src/*.test.ts`, Vitest, node): colour maths against known values, parsing and resolution problems with their exact messages, the contract and contrast on the real default tenant plus a small edit file, CSS order, the repository's tenants compiling clean, and a real `vite build` of a throwaway app that must fail when a tenant drops below AA.
- **Components** (`packages/ui/src/**/*.test.tsx`, Vitest, jsdom): what a user or a screen reader gets. Query by role, name and description; assert attributes (`aria-busy`, `aria-invalid`, `data-variant`), not class names. Toast timing uses fake timers.
- **Shell** (Vitest, jsdom, globals, `@testing-library/jest-dom`): pages are rendered inside a `MemoryRouter`; the adapters are stubbed with `vi.spyOn`. Use role and label queries. The tokens plugin runs here too, so a broken tenant fails these tests as well.
- **End-to-end** (`e2e/`): against the production build served by `scripts/serve.mjs`, on `desktop` and `mobile` (Pixel 7). `trackErrors(page)` collects page and console errors, ignoring the deliberate 404 of deep links served through `404.html`. `brandToken(page, name)` reads a custom property's computed value on `<html>`; poll it (`expect.poll`) after a tenant change. The notification region is always a `status`, so scope page statuses to `getByRole('main')` and toasts to the `Notifications` region. Keyboard-only scenarios skip the mobile project.
- `CHROMIUM_PATH=/path/to/chrome` points Playwright at a specific browser (sandboxes).

## 8. Recipes

- **Add a tenant:** copy a folder in `tenants/`, change its palette and semantic colours, run `npm run tokens` until every pair passes, then add the brand to `SUPPORTED_BRANDS` and `TOKEN_SETS` (until Phase 3 makes tenants configuration).
- **Change a brand's colour:** edit its primitive in `tenants/<id>/tokens.json`, keeping `components` (0–1) and `hex` in step; the compiler rejects a hex that does not match.
- **Add a component:** a folder in `packages/ui/src/` with the component, a CSS Module that uses only custom properties, and tests; export it from `index.ts`. If it needs a value no token covers, add a component token first (next recipe).
- **Add a token to the contract:** add it to `CONTRACT` (and to `CONTRAST_PAIRS` if something is drawn on it), give it a value in `base.tokens.json` or in every tenant, then use its custom property in CSS.

## 9. CI/CD

The jobs are _Lint and types_, _Unit tests_, _Build_ (uploads `apps/shell/dist`), _End-to-end (Playwright)_ against that build, and _Deploy to GitHub Pages_, which publishes the same artifact from `master`. A token problem fails _Unit tests_ and _Build_. `BASE_PATH` is set once at the top of the workflow from the repository name. One-time setup is listed in the workflow header.

## 10. Troubleshooting

| Symptom                                                         | Cause / fix                                                                                      |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Build fails with "Design tokens have N problem(s)"              | each line names the tenant, the file and the token; `npm run tokens -- --all` shows every pair   |
| "hex … does not match the components"                           | a colour was edited in one place only; update `components` and `hex` together                    |
| A tenant looks like the default                                 | its `[data-tenant]` block is missing or comes before `:root`; check `virtual:livery/tenants.css` |
| `npm run serve` refuses to start                                | no build, or a build for another base path: `npm run build` with the same `BASE_PATH`            |
| E2E hits the wrong app                                          | another project's server is on port 4173 (`reuseExistingServer`); stop it                        |
| Playwright: "Executable doesn't exist"                          | `npm run e2e:install`, or `CHROMIUM_PATH=/path/to/chrome`                                        |
| The live site shows a blank page after renaming the repository  | the build's base path is the old name; re-run the workflow, which reads the new name             |
| Deploy rejected: "branch not allowed to deploy to github-pages" | Settings → Environments → github-pages → allow `master`                                          |

## 11. Known limitations

These are what the roadmap phases replace:

- Before the JavaScript runs, the page has the default tenant's colours; prerendering each tenant fixes it (Phase 3).
- Beta's card lost its teal shadow: the contract has no card shadow, and adding one for a single brand was not worth it.
- The token manifest (about 1 kB gzipped) is in the main bundle, for the theme preview only. The initial bundle is about 98 kB gzipped; React Router 8 added about 15 kB over 6. Per-tenant chunks come with the tenant model.
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
