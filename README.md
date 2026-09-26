# Livery

A white-label React app where a brand is data: design tokens, one component library, many tenants.

An airline's livery is the paint on the aircraft: the same plane in a different company's colours. Livery does the same for a web product. A customer account (sign-in, billing, invoices) is built once, and each tenant brings its own colours, type and tone. The project is being rebuilt in phases, listed in the roadmap below; so far every brand is a token file checked for contrast at build time, and every screen is built from one component library that all brands share.

**[Open the live demo](https://stiutin.github.io/livery/)**

## Features

- Three tenants and a fallback brand, switched live without a reload
- Each brand is a design token file in the W3C format: colours, type, radii and timing, nothing in code
- The build fails if a brand's text or controls fall below WCAG AA contrast, and says which colour to change
- The tenant, locale and currency live in the URL, so any state can be shared or bookmarked
- Links carry the tenant across pages, and deep links open the right page with the right brand
- Sign-in with per-field validation that is announced to screen readers
- Invoice creation with explicit loading, error, empty and success states
- Currency and number formatting through `Intl`, for four locales and three currencies
- One accessible component library for every brand: buttons, fields, selects, cards, a dialog, notifications and tables
- A theme preview that shows every component in the active brand, with its compiled colours
- Deployed to GitHub Pages from CI after every green push

## Tech stack

[React 19](https://react.dev/), [React Router 8](https://reactrouter.com/), [react-hook-form](https://react-hook-form.com/), TypeScript (strict), [Vite](https://vite.dev/), CSS Modules, [W3C Design Tokens](https://www.designtokens.org/tr/2025.10/format/), npm workspaces.
Tested with [Vitest](https://vitest.dev/), [Testing Library](https://testing-library.com/) and [Playwright](https://playwright.dev/).

## How it works

**Brands are token files.** Each tenant is `tenants/<id>/tokens.json`, written in the [Design Tokens Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/), on top of a shared `packages/tokens/base.tokens.json`. Tokens sit in three layers. _Primitives_ are the raw palette, free-form and never emitted. _Semantic_ tokens say what a value is for: the page, a surface, muted text, the brand colour, the focus ring. _Component_ tokens say what a button or an input uses, and the base file maps them to semantic ones, so a tenant usually writes only its palette and its semantic colours. Only the semantic and component layers become CSS custom properties, which keeps components away from raw palette values.

**The contract is closed.** Every tenant defines the same 49 semantic and component tokens with the same types. A missing token, an unknown one (usually a typo) or a colour where a dimension belongs is an error, because a component library can only be shared if every brand answers the same questions.

**Contrast is a build gate.** The contract also lists which colour sits on which: body text on the page, the button label on the button, the button label on its hover colour, and so on. `@livery/tokens` measures 21 such pairs per tenant with the WCAG 2.2 formula, compositing translucent colours first, and requires 4.5:1 for text and 3:1 for control borders and focus rings. A failure stops `vite build` and names where each colour is written, since that is where the fix goes. The original themes failed it: white on the violet theme's cyan hover colour was 2.4:1.

**Compiled once, switched with an attribute.** A Vite plugin compiles every tenant into one stylesheet, `virtual:livery/tenants.css`, with a block per tenant under `[data-tenant='…']`, and the default tenant also on `:root`. `ThemeLoader` sets `<html data-tenant>` in a layout effect, so content never paints in another brand's colours, and switching brands swaps no JavaScript objects. The same plugin exposes the tokens as data (`virtual:livery/tenants`) for the theme preview. In development, saving a token file reloads the page, and a broken one shows in Vite's error overlay.

**One component library, no forks.** The MVP gave every brand its own copy of the button and the card, with hover and focus kept in JavaScript state. `@livery/ui` replaces them with one set of components for all brands: Button, Field with Input, Select, Card, Dialog, Toast and Table. They read only semantic and component custom properties, so a brand changes them without a line of code, and Stylelint rejects any literal colour in their CSS or the app's. States are CSS: `:hover`, `:focus-visible`, `:disabled` and ARIA attributes, so focus rings appear for the keyboard and not for the mouse.

Accessibility is built in rather than left to each page. `Field` gives its control an id, ties the label to it, and describes it with the hint and the error, which is announced as it appears and marks the control invalid. `Button` defaults to `type="button"` and becomes busy and disabled while loading. `Dialog` uses the native `<dialog>`, so the browser traps focus, makes the page inert, closes on Escape and returns focus; the component only keeps `open` in sync and turns every way of closing into `onClose`. `Toast` keeps its live region in the page from the start, so screen readers announce what appears, pauses while the pointer or focus is inside, and never times out an error. `Table` scrolls inside a focusable region named after its caption instead of widening the page.

The shell owns routing, the tenant context and the API adapters. `ThemeBoot` reads `?brand`, `?locale` and `?currency`, and `themeRegistry.ts` maps the brand to its token set. A tenant is now only its token file. The API is mocked behind two adapters, so pages contain no network code. [ARCHITECTURE.md](ARCHITECTURE.md) and [DECISIONS.md](DECISIONS.md) describe the MVP this started from and will fold into this section.

GitHub Pages serves the site under `/livery/`. Production builds use that base path, the router gets it as its basename, and `404.html` is a copy of `index.html`, so a deep link such as `/livery/account/billing?brand=tenant-beta` boots the app and the router takes over.

## Testing

| Layer      | Tool                    | What it covers                                                                                                                                                           |
| ---------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Unit       | Vitest                  | the token compiler: parsing, aliases, colour maths, the contract, contrast, CSS output, a real Vite build that must fail - 33 tests                                      |
| Unit       | Vitest, Testing Library | the components: names, descriptions, states, the dialog's ways of closing, toast timing - 16 tests                                                                       |
| Unit       | Vitest, Testing Library | the home, sign-in and billing pages: validation, every billing state, tenant parameters - 17 tests                                                                       |
| End-to-end | Playwright              | the production build on desktop and a Pixel 7: tenant switching, compiled tokens, deep links, sign-in, billing, the dialog, notifications, keyboard focus - 14 scenarios |

The end-to-end tests run against the production build, served by `scripts/serve.mjs` the way GitHub Pages serves it: under `/livery/`, with `404.html` for unknown paths.

## Project structure

```
apps/shell/                 the app: routes, layout, tenant context, mocked API adapters
packages/tokens/            the token compiler, the contract, the base token file, the Vite plugin and a CLI
packages/ui/                the component library, styled only by tokens
tenants/<id>/tokens.json    one brand each: tenant-default, tenant-alpha, tenant-beta
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
npm run tokens         # every tenant's contrast report (`-- --all` lists every pair)
npm run e2e            # build, then Playwright (run `npm run e2e:install` once)
npm run lint           # ESLint and Stylelint
npm run typecheck      # TypeScript for the app, both packages and the end-to-end suite
npm run check          # formatting, lint, types and unit tests, as in CI
```

## Deployment

Pushing to `master` runs formatting, lint, type checks, unit tests and the end-to-end suite. Only when they pass does the deploy job publish the same build the tests ran against to GitHub Pages. The build's base path comes from the repository name, so a fork deploys under its own name.

## Roadmap

- [x] The portfolio's tooling, strict TypeScript, Playwright, CI and deployment
- [x] Design tokens as data in the W3C format, compiled at build time, with WCAG AA contrast as a build gate
- [x] One accessible component library for every tenant, instead of a fork per theme
- [ ] Tenants as validated configuration, tenant-based routes, and every page prerendered in its own brand
- [ ] The product: sign-in, account, invoices and payment, with a mocked API and per-tenant features
- [ ] English, German and Spanish
- [ ] Studio: create a brand in the browser, check its contrast live, export or share it
- [ ] End-to-end, accessibility and visual regression tests for every tenant
- [ ] Dark mode inside every brand
- [ ] Importing tokens from Figma (Tokens Studio format)
- [ ] Publishing the `ui` and `tokens` packages to npm

## License

Released under the [MIT License](LICENSE).

## Author

**Serge Tiutin** - [github.com/stiutin](https://github.com/stiutin)
