# Livery

A white-label React app where a brand is data: design tokens, one component library, many tenants.

An airline's livery is the paint on the aircraft: the same plane in a different company's colours. Livery does the same for a web product. A customer account (sign-in, billing, invoices) is built once, and each tenant brings its own colours, type and tone. The project is being rebuilt in phases, listed in the roadmap below; today it is the starting point for that work: a shell app, two theme packages and the tenant switch between them, now on the portfolio's tooling, tests and CI.

**[Open the live demo](https://stiutin.github.io/livery/)**

## Features

- Three tenants and a fallback brand, switched live without a reload
- The tenant, locale and currency live in the URL, so any state can be shared or bookmarked
- Links carry the tenant across pages, and deep links open the right page with the right brand
- Sign-in with per-field validation that is announced to screen readers
- Invoice creation with explicit loading, error, empty and success states
- Currency and number formatting through `Intl`, for four locales and three currencies
- A theme preview page with the active brand's colour swatches
- Storybook for the branded components of the first theme
- Deployed to GitHub Pages from CI after every green push

## Tech stack

[React 19](https://react.dev/), [React Router 8](https://reactrouter.com/), [react-hook-form](https://react-hook-form.com/), TypeScript (strict), [Vite](https://vite.dev/), CSS Modules, npm workspaces, [Storybook](https://storybook.js.org/).
Tested with [Vitest](https://vitest.dev/), [Testing Library](https://testing-library.com/) and [Playwright](https://playwright.dev/).

## How it works

The shell app owns routing, the tenant context and the API adapters; a theme package owns token values and branded components. `ThemeBoot` reads `?brand`, `?locale` and `?currency`, `themeRegistry.ts` maps the brand to its theme, `ThemeLoader` writes the tokens to `<html>` as CSS custom properties, and pages get their components from `useThemeComponents()`, never from a theme package directly. The API is mocked behind two adapters, so pages contain no network code.

This design has limits that the roadmap addresses: each theme forks its components, the tokens are applied after the first paint, and nothing checks a brand's colour contrast. The current boundaries are described in [ARCHITECTURE.md](ARCHITECTURE.md) and the reasoning behind them in [DECISIONS.md](DECISIONS.md); both will fold into this section as the rebuild lands.

GitHub Pages serves the site under `/livery/`. Production builds use that base path, the router gets it as its basename, and `404.html` is a copy of `index.html`, so a deep link such as `/livery/account/billing?brand=tenant-beta` boots the app and the router takes over.

## Testing

| Layer      | Tool                    | What it covers                                                                                              |
| ---------- | ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| Unit       | Vitest, Testing Library | the home, sign-in and billing pages: validation, every billing state, tenant parameters - 17 tests          |
| End-to-end | Playwright              | the production build on desktop and a Pixel 7: tenant switching, deep links, sign-in, billing - 7 scenarios |

The end-to-end tests run against the production build, served by `scripts/serve.mjs` the way GitHub Pages serves it: under `/livery/`, with `404.html` for unknown paths.

## Project structure

```
apps/shell/                 the app: routes, layout, tenant context, theme boundary, mocked API adapters
themes/theme-tenant-alpha/  violet brand: tokens and branded components, with Storybook
themes/theme-tenant-beta/   teal brand: the same exports with different values
e2e/                        Playwright tests
scripts/                    a server that behaves like GitHub Pages
```

## Running locally

Requires Node 22.22.3 or newer (see `.nvmrc`).

```
git clone https://github.com/stiutin/livery.git
cd livery
npm ci
npm start
```

Open http://localhost:5173/?brand=tenant-alpha, or pick a tenant on the home page. The API is mocked: any email and a password of six characters or more signs in, and the password `fail` shows the error. In billing, amounts over 1,000,000 are declined, and the `tenant-empty` brand returns no invoice.

Other scripts:

```
npm run build          # production build into apps/shell/dist, for /livery/
npm run serve          # serve that build like GitHub Pages, on http://localhost:4173/livery/
npm test               # unit tests
npm run e2e            # build, then Playwright (run `npm run e2e:install` once)
npm run storybook      # the first theme's components, on http://localhost:6006
npm run lint           # ESLint and Stylelint
npm run typecheck      # TypeScript for the app, the themes and the end-to-end suite
npm run check          # formatting, lint, types and unit tests, as in CI
```

## Deployment

Pushing to `master` runs formatting, lint, type checks, unit tests and the end-to-end suite. Only when they pass does the deploy job publish the same build the tests ran against to GitHub Pages. The build's base path comes from the repository name, so a fork deploys under its own name.

## Roadmap

- [x] The portfolio's tooling, strict TypeScript, Playwright, CI and deployment
- [ ] Design tokens as data in the W3C format, compiled at build time, with WCAG AA contrast as a build gate
- [ ] One accessible component library for every tenant, instead of a fork per theme
- [ ] Tenants as validated configuration, tenant-based routes, and every page prerendered in its own brand
- [ ] The product: sign-in, account, invoices and payment, with a mocked API and per-tenant features
- [ ] English, Ukrainian and German
- [ ] Studio: create a brand in the browser, check its contrast live, export or share it
- [ ] End-to-end, accessibility and visual regression tests for every tenant
- [ ] Dark mode inside every brand
- [ ] Importing tokens from Figma (Tokens Studio format)
- [ ] Publishing the `ui` and `tokens` packages to npm

## License

Released under the [MIT License](LICENSE).

## Author

**Serge Tiutin** - [github.com/stiutin](https://github.com/stiutin)
