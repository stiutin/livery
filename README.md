# Livery

A white-label React app where a brand is data: design tokens, one component library, many tenants.

An airline's livery is the paint on the aircraft: the same plane in a different company's colours. Livery does the same for a web product. A customer account (sign-in, billing, invoices) is built once, and each tenant brings its own colours, type and tone. The project is being rebuilt in phases, listed in the roadmap below; every brand is a folder with a settings file and a token file checked for contrast at build time, every screen comes from one component library, and every page is prerendered in its tenant's colours.

**[Open the live demo](https://stiutin.github.io/livery/)**

## Features

- Four tenants, each at its own address (`/tenant-alpha/…`), described by a settings file and a token file
- Each brand is a design token file in the W3C format: colours, type, radii and timing, nothing in code
- The build fails if a brand's text or controls fall below WCAG AA contrast, and says which colour to change
- Every page of every tenant is prerendered in that tenant's colours, so it is branded before any script runs, and readable without JavaScript
- Unknown tenants and pages answer with a real 404
- Sign-in with per-field validation that is announced to screen readers
- Invoice creation with explicit loading, error, empty and success states
- Money formatted through `Intl` in each tenant's own locale and currency
- One accessible component library for every brand: buttons, fields, selects, cards, a dialog, notifications and tables
- A theme preview that shows every component in the active brand, with its compiled colours
- Deployed to GitHub Pages from CI after every green push

## Tech stack

[React 19](https://react.dev/), [React Router 8](https://reactrouter.com/) in framework mode with prerendering, [react-hook-form](https://react-hook-form.com/), TypeScript (strict), [Vite](https://vite.dev/), CSS Modules, [W3C Design Tokens](https://www.designtokens.org/tr/2025.10/format/), npm workspaces.
Tested with [Vitest](https://vitest.dev/), [Testing Library](https://testing-library.com/) and [Playwright](https://playwright.dev/).

## How it works

**Brands are token files.** Each tenant is `tenants/<id>/tokens.json`, written in the [Design Tokens Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/), on top of a shared `packages/tokens/base.tokens.json`. Tokens sit in three layers. _Primitives_ are the raw palette, free-form and never emitted. _Semantic_ tokens say what a value is for: the page, a surface, muted text, the brand colour, the focus ring. _Component_ tokens say what a button or an input uses, and the base file maps them to semantic ones, so a tenant usually writes only its palette and its semantic colours. Only the semantic and component layers become CSS custom properties, which keeps components away from raw palette values.

**The contract is closed.** Every tenant defines the same 49 semantic and component tokens with the same types. A missing token, an unknown one (usually a typo) or a colour where a dimension belongs is an error, because a component library can only be shared if every brand answers the same questions.

**Contrast is a build gate.** The contract also lists which colour sits on which: body text on the page, the button label on the button, the button label on its hover colour, and so on. `@livery/tokens` measures 21 such pairs per tenant with the WCAG 2.2 formula, compositing translucent colours first, and requires 4.5:1 for text and 3:1 for control borders and focus rings. A failure stops `vite build` and names where each colour is written, since that is where the fix goes. The original themes failed it: white on the violet theme's cyan hover colour was 2.4:1.

**A tenant is a folder.** Next to its `tokens.json`, each tenant has a `tenant.json`: its name, its locale, its currency, and optionally another tenant whose tokens it borrows (the billing demo tenant wears the default look). The build validates it like the tokens, and `tenants/tenant.schema.json` gives editors the same rules. The folder name is the tenant's id and the first segment of its URLs, so adding a brand is adding a folder: no code, no registry.

**Every page is prerendered in its own brand.** The app uses React Router in framework mode with `ssr: false`: there is no server, but at build time every page of every tenant is rendered to HTML. The `/:tenant` route's loader loads the tenant through a dynamic import, one module per tenant, and the document inlines that tenant's compiled tokens as a `<style>` on `:root`. So the first frame is already in the tenant's colours, with or without JavaScript, and no page carries another tenant's tokens. Client-side navigation fetches the next page's prerendered data file instead of running the loader.

**Built for GitHub Pages.** Pages has no routing, so the build output is shaped for it. Pages would redirect `/livery/tenant-alpha/auth/login` to a trailing slash if the file were `auth/login/index.html`, so each page is written as `auth/login.html`. For any other address Pages returns `404.html` with status 404; that file is the client-rendered shell React Router builds for URLs it did not prerender, and it shows a not-found page in the default look. An unknown page of a known tenant reaches the same page through a catch-all route.

**One component library, no forks.** The MVP gave every brand its own copy of the button and the card, with hover and focus kept in JavaScript state. `@livery/ui` replaces them with one set of components for all brands: Button, Field with Input, Select, Card, Dialog, Toast and Table. They read only semantic and component custom properties, so a brand changes them without a line of code, and Stylelint rejects any literal colour in their CSS or the app's. States are CSS: `:hover`, `:focus-visible`, `:disabled` and ARIA attributes, so focus rings appear for the keyboard and not for the mouse.

Accessibility is built in rather than left to each page. `Field` gives its control an id, ties the label to it, and describes it with the hint and the error, which is announced as it appears and marks the control invalid. `Button` defaults to `type="button"` and becomes busy and disabled while loading. `Dialog` uses the native `<dialog>`, so the browser traps focus, makes the page inert, closes on Escape and returns focus; the component only keeps `open` in sync and turns every way of closing into `onClose`. `Toast` keeps its live region in the page from the start, so screen readers announce what appears, pauses while the pointer or focus is inside, and never times out an error. `Table` scrolls inside a focusable region named after its caption instead of widening the page.

The shell owns routing, the tenant context and the API adapters; the API is mocked behind two adapters, so pages contain no network code. [ARCHITECTURE.md](ARCHITECTURE.md) and [DECISIONS.md](DECISIONS.md) describe the MVP this started from and will fold into this section.

The whole site lives under `/livery/`, in development too, so local URLs match the live ones.

## Testing

| Layer      | Tool                    | What it covers                                                                                                                                                                              |
| ---------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit       | Vitest                  | the token compiler and tenant settings: parsing, aliases, colour maths, the contract, contrast, CSS, tenant.json, a real Vite build per tenant chunk and one that must fail - 36 tests      |
| Unit       | Vitest, Testing Library | the components: names, descriptions, states, the dialog's ways of closing, toast timing - 16 tests                                                                                          |
| Unit       | Vitest, Testing Library | the home, sign-in and billing pages: validation, every billing state, links under the tenant's path - 16 tests                                                                              |
| End-to-end | Playwright              | the production build on desktop and a Pixel 7: prerendered tokens, pages without JavaScript, tenant links, 404s, sign-in, billing, the dialog, notifications, keyboard focus - 17 scenarios |

The end-to-end tests run against the production build, served by `scripts/serve.mjs` the way GitHub Pages serves it: under `/livery/`, with `404.html` for unknown paths.

## Project structure

```
apps/shell/                 the app: React Router routes, the document, tenant context, mocked API adapters
packages/tokens/            the token compiler, the contract, the base token file, the Vite plugin and a CLI
packages/ui/                the component library, styled only by tokens
tenants/<id>/                one tenant each: tenant.json (settings) and tokens.json (its look)
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

Open http://localhost:5173/livery/ and pick a tenant. The API is mocked: any email and a password of six characters or more signs in, and the password `fail` shows the error. In billing, amounts over 1,000,000 are declined, and the `tenant-empty` tenant returns no invoice.

Other scripts:

```
npm run build          # prerender every page into apps/shell/build/client, for /livery/
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
- [x] Tenants as validated configuration, tenant-based routes, and every page prerendered in its own brand
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
