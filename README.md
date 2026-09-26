# Livery

A white-label React app where a brand is data: design tokens, one component library, many tenants.

An airline's livery is the paint on the aircraft: the same plane in a different company's colours. Livery does the same for a web product. A customer account (sign-in, an account overview, invoices and card payments) is built once, and three brands wear it: Harbour, light and minimal; Onyx, dark and premium; Meadow, bright and rounded. Each brand is a folder with a settings file and a token file, checked for contrast at build time; every screen comes from one component library; every page is prerendered in its brand's colours. The project is being rebuilt in phases, listed in the roadmap below.

**[Open the live demo](https://stiutin.github.io/livery/)**

## Features

- Three brands, each at its own address (`/harbour/…`, `/onyx/…`, `/meadow/…`), described by a settings file and a token file
- Every tenant page in English, German and Spanish, with each brand opening in its own default language
- Each brand is a design token file in the W3C format: colours, type, radii and timing, nothing in code
- The build fails if a brand's text or controls fall below WCAG AA contrast, and says which colour to change
- Every page of every tenant is prerendered in that tenant's colours, so it is branded before any script runs, and readable without JavaScript
- Unknown tenants and pages answer with a real 404
- A customer account: sign-in, an account overview with the balance due, and the invoices in a table
- Card payments as a finite state machine, including a declined card and a confirmation by the bank (3-D Secure)
- Feature flags per tenant: Meadow has card payments off and shows bank-transfer details instead
- A mocked API that runs in the browser (MSW), so the live demo works without a server
- Plurals, dates and money written the way each language writes them: ICU MessageFormat and `Intl`
- One accessible component library for every brand: buttons, fields, selects, cards, a dialog, notifications and tables
- A theme preview that shows every component in the active brand, with its compiled colours
- Livery Studio: make a brand from one colour, see the real pages in it, check its contrast live, share it as a link and export it as a tenant that builds with no code changes
- Deployed to GitHub Pages from CI after every green push

## Tech stack

[React 19](https://react.dev/), [React Router 8](https://reactrouter.com/) in framework mode with prerendering, [react-hook-form](https://react-hook-form.com/), TypeScript (strict), [Vite](https://vite.dev/), CSS Modules, [W3C Design Tokens](https://www.designtokens.org/tr/2025.10/format/), npm workspaces.
Tested with [Vitest](https://vitest.dev/), [Testing Library](https://testing-library.com/) and [Playwright](https://playwright.dev/).

## How it works

**Brands are token files.** Each tenant is `tenants/<id>/tokens.json`, written in the [Design Tokens Format Module 2025.10](https://www.designtokens.org/tr/2025.10/format/), on top of a shared `packages/tokens/base.tokens.json`. Tokens sit in three layers. _Primitives_ are the raw palette, free-form and never emitted. _Semantic_ tokens say what a value is for: the page, a surface, muted text, the brand colour, the focus ring. _Component_ tokens say what a button or an input uses, and the base file maps them to semantic ones, so a tenant usually writes only its palette and its semantic colours. Only the semantic and component layers become CSS custom properties, which keeps components away from raw palette values.

**The contract is closed.** Every tenant defines the same 50 semantic and component tokens with the same types. A missing token, an unknown one (usually a typo) or a colour where a dimension belongs is an error, because a component library can only be shared if every brand answers the same questions.

**Contrast is a build gate.** The contract also lists which colour sits on which: body text on the page, the button label on the button, the button label on its hover colour, and so on. `@livery/tokens` measures 21 such pairs per tenant with the WCAG 2.2 formula, compositing translucent colours first, and requires 4.5:1 for text and 3:1 for control borders and focus rings. A failure stops `vite build` and names where each colour is written, since that is where the fix goes. The original themes failed it: white on the violet theme's cyan hover colour was 2.4:1.

**A tenant is a folder.** Next to its `tokens.json`, each tenant has a `tenant.json`: its name, its locale, its currency, its feature flags, and optionally another tenant whose tokens it borrows. The build validates it like the tokens, and `tenants/tenant.schema.json` gives editors the same rules. The folder name is the tenant's id and the first segment of its URLs, so adding a brand is adding a folder: no code, no registry.

**Every page is prerendered in its own brand.** The app uses React Router in framework mode with `ssr: false`: there is no server, but at build time every page of every tenant is rendered to HTML. The `/:tenant` route's loader loads the tenant through a dynamic import, one module per tenant, and the document inlines that tenant's compiled tokens as a `<style>` on `:root`. So the first frame is already in the tenant's colours, with or without JavaScript, and no page carries another tenant's tokens. Client-side navigation fetches the next page's prerendered data file instead of running the loader.

**Built for GitHub Pages.** Pages has no routing, so the build output is shaped for it. Pages would redirect `/livery/onyx/en/invoices` to a trailing slash if the file were `onyx/en/invoices/index.html`, so each page is written as `onyx/en/invoices.html`. For any other address Pages returns `404.html` with status 404; that file is the client-rendered shell React Router builds for URLs it did not prerender, and it shows a not-found page in the default look. An unknown page of a known tenant reaches the same page through a catch-all route.

**One component library, no forks.** The MVP gave every brand its own copy of the button and the card, with hover and focus kept in JavaScript state. `@livery/ui` replaces them with one set of components for all brands: Button, Field with Input, Select, Card, Dialog, Toast and Table. They read only semantic and component custom properties, so a brand changes them without a line of code, and Stylelint rejects any literal colour in their CSS or the app's. States are CSS: `:hover`, `:focus-visible`, `:disabled` and ARIA attributes, so focus rings appear for the keyboard and not for the mouse.

Accessibility is built in rather than left to each page. `Field` gives its control an id, ties the label to it, and describes it with the hint and the error, which is announced as it appears and marks the control invalid. `Button` defaults to `type="button"` and becomes busy and disabled while loading. `Dialog` uses the native `<dialog>`, so the browser traps focus, makes the page inert, closes on Escape and returns focus; the component only keeps `open` in sync and turns every way of closing into `onClose`. `Toast` keeps its live region in the page from the start, so screen readers announce what appears, pauses while the pointer or focus is inside, and never times out an error. `Table` scrolls inside a focusable region named after its caption instead of widening the page.

**One product, three brands.** Harbour, Onyx and Meadow run the same pages. Onyx shows that the contract holds for a dark brand too: its tokens flip the surfaces and text, gold on near-black passes every contrast pair, and no component knows it is dark. Meadow's rounder shapes are radius tokens and a pill-shaped button token. What differs in behaviour comes from `features` in tenant.json: with `payments` off, Meadow's invoices show bank-transfer details, and the payment dialog, loaded lazily, is never downloaded.

**A mocked API, in the browser.** There is no backend. [MSW](https://mswjs.io/) answers `/livery/api/<tenant>/…` from a service worker in the browser, and the same handlers answer Node's fetch in the unit tests. The worker starts the first time a page calls the API, so the landing page and the theme preview never load it. Any email signs in; the customer and their invoices are made up from the address, so the same address always gets the same account, and one starting with `new` gets none. Paid invoices are remembered for the browser session.

**Payment is a state machine.** The payment dialog has five states: closed, editing, submitting, confirming (the bank asks the customer to approve) and succeeded. Card data, button clicks and API answers are events, and a reducer decides what each state does with each event; anything a state does not expect is ignored. So a second click cannot pay twice, the dialog cannot be closed while the bank is working, and a late answer cannot reopen a closed dialog. A declined card returns to the form with the reason.

**Sessions and prerendering agree.** A prerendered page cannot know who is signed in, so the session is read through `useSyncExternalStore` with a server snapshot of "not known yet": the HTML and the first client render match, and the stored session appears right after hydration. Pages that need it show a short "checking" state, then either the content or a redirect to the login page, which returns to the page afterwards.

**Three languages, prerendered.** Every tenant page lives at `/<tenant>/<language>/…`, in English, German and Spanish, and all of them are prerendered: 3 brands, 3 languages and 5 pages make 45 HTML files, each with `<html lang>` and `hreflang` links to the other two. A brand's bare address, such as `/meadow`, redirects at once to its default language, which is the language of the locale in its tenant.json (German for Meadow). Messages are [ICU MessageFormat](https://formatjs.github.io/docs/intl-messageformat/): "4 invoices, 2 to pay" and "1 Rechnung, 1 offen" come from the same plural rules the browser uses, and tags such as `<link>` inside a message become React elements. Each language's catalogue is loaded by the tenant route at build time, so a page carries only its own language. Numbers and dates follow the tenant's locale in its own language and the language's usual one otherwise: Harbour's pounds read £43.50 in English and 43,50 GBP in Spanish. The mock API answers with error codes, and the page names them in its language. Unit tests hold every catalogue to the English keys and to the same arguments.

**Studio makes brands with the build's own checks.** [Livery Studio](https://stiutin.github.io/livery/studio) starts from one colour. It converts it to OKLCH and builds tonal scales from it: every step keeps the hue, takes its lightness from a fixed ladder and a share of the chroma, and is fitted into sRGB by lowering chroma only, so the steps look evenly spaced whatever the hue. It then maps the scales onto the contract for a light or a dark brand, picks white or near-black text for the brand colour, moves the hover colour away from that text, and chooses the first steps that give links 4.5:1 and focus rings 3:1. Font, corner radius, pill buttons and density are tokens too; density is a number every component multiplies its padding by. The result goes through `compileTenant` and `parseTenantConfig`, the functions the build runs, so the contrast table in Studio is the build's own verdict, and a brand with a problem cannot be exported. The preview renders the product's real pages in the new tokens, scoped to the preview's element and on a router of its own. Every setting lives in the URL hash, so the address is always a share link. Export gives the two files of a tenant folder; a test puts brands from all round the colour wheel into a copy of `tenants/` and builds them, and an end-to-end test does the same with files downloaded from the page.

The shell owns routing, the tenant context and the API client. [ARCHITECTURE.md](ARCHITECTURE.md) and [DECISIONS.md](DECISIONS.md) describe the MVP this started from and will fold into this section.

The whole site lives under `/livery/`, in development too, so local URLs match the live ones.

## Testing

| Layer      | Tool                    | What it covers                                                                                                                                                                                                                                                                                                                                                               |
| ---------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit       | Vitest                  | the token compiler, tenant settings and Studio: parsing, aliases, colour maths and OKLCH, the contract, contrast, CSS, tenant.json, share links, exported brands built from disk, a real Vite build per tenant chunk and one that must fail - 47 tests                                                                                                                       |
| Unit       | Vitest, Testing Library | the components: names, descriptions, states, the dialog's ways of closing, toast timing - 17 tests                                                                                                                                                                                                                                                                           |
| Unit       | Vitest, Testing Library | the payment machine, card checks, the mock API, the catalogues (keys, arguments, plurals), and the home, sign-in and invoice pages against the mock API in several languages - 43 tests                                                                                                                                                                                      |
| End-to-end | Playwright              | the production build on desktop and a Pixel 7: all 45 pages in three languages, default-language redirects, the language switcher, the account and invoices on all three brands, card payments, declines, bank confirmation, flags, sign-in redirects, pages without JavaScript, 404s, components, and Studio from settings to a downloaded brand that builds - 36 scenarios |

The end-to-end tests run against the production build, served by `scripts/serve.mjs` the way GitHub Pages serves it: under `/livery/`, with `404.html` for unknown paths.

## Project structure

```
apps/shell/                 the app: React Router routes, the document, tenant and session context, the API client, the MSW mock API, the payment machine
packages/tokens/            the token compiler, the contract, the base token file, OKLCH palettes, Studio's generator, the Vite plugin and a CLI
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

Open http://localhost:5173/livery/ and pick a brand; the language links are in its header. The API is mocked: any email and a password of six characters or more signs in, the password `wrong-password` is refused, and an email starting with `new` has no invoices. To pay, use `4242 4242 4242 4242` (goes through), `4000 0000 0000 0002` (declined) or `4000 0027 6000 3184` (the bank asks you to confirm), with any future expiry and any three digits.

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
- [x] The product: sign-in, account, invoices and payment, with a mocked API and per-tenant features
- [x] English, German and Spanish
- [x] Studio: create a brand in the browser, check its contrast live, export or share it
- [ ] End-to-end, accessibility and visual regression tests for every tenant
- [ ] Dark mode inside every brand
- [ ] Importing tokens from Figma (Tokens Studio format)
- [ ] Publishing the `ui` and `tokens` packages to npm

## License

Released under the [MIT License](LICENSE).

## Author

**Serge Tiutin** - [github.com/stiutin](https://github.com/stiutin)
