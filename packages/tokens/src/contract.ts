import type {TokenType} from './model.ts';

/**
 * The Livery token contract.
 *
 * A tenant's tokens live in three layers, as the top-level groups of its files:
 *
 * - `primitive`: the raw palette and scales. Free-form and never emitted, so components cannot reach them.
 * - `semantic`: what a value means (the page, a surface, muted text, the brand). Every tenant defines all of them.
 * - `component`: what a component uses. The shared base file maps them to semantic tokens; a tenant may override.
 *
 * The semantic and component layers are closed: a missing token, an unknown one (usually a typo) or one of the
 * wrong type fails the build. Only these two layers become CSS custom properties.
 */
export const LAYERS = ['primitive', 'semantic', 'component'] as const;
export type Layer = (typeof LAYERS)[number];
export const EMITTED_LAYERS: readonly Layer[] = ['semantic', 'component'];

export interface ContractToken {
  readonly path: string;
  readonly type: TokenType;
  readonly purpose: string;
}

const token = (path: string, type: TokenType, purpose: string): ContractToken => ({path, type, purpose});

export const CONTRACT: readonly ContractToken[] = [
  token('semantic.color.canvas', 'color', 'the page behind everything'),
  token('semantic.color.surface.default', 'color', 'cards, forms and inputs'),
  token('semantic.color.surface.subtle', 'color', 'notices and quiet panels'),
  token('semantic.color.border.default', 'color', 'decorative borders of cards and forms'),
  token('semantic.color.border.strong', 'color', 'borders that identify a control'),
  token('semantic.color.text.default', 'color', 'body text'),
  token('semantic.color.text.muted', 'color', 'secondary text'),
  token('semantic.color.brand.default', 'color', 'the brand colour: header and primary actions'),
  token('semantic.color.brand.hover', 'color', 'primary actions under the pointer'),
  token('semantic.color.brand.on', 'color', 'text and icons on the brand colour'),
  token('semantic.color.link', 'color', 'links'),
  token('semantic.color.focus', 'color', 'the keyboard focus ring'),
  token('semantic.color.danger.text', 'color', 'error messages'),
  token('semantic.color.danger.surface', 'color', 'the background of an error message'),
  token('semantic.color.danger.border', 'color', 'the border of an error message and an invalid field'),
  token('semantic.color.success.text', 'color', 'confirmations'),
  token('semantic.color.success.surface', 'color', 'the background of a confirmation'),
  token('semantic.color.success.border', 'color', 'the border of a confirmation'),
  token('semantic.color.overlay', 'color', 'behind a modal dialog'),
  token('semantic.font.family.body', 'fontFamily', 'all text'),
  token('semantic.radius.small', 'dimension', 'inputs and selects'),
  token('semantic.radius.medium', 'dimension', 'buttons and notices'),
  token('semantic.radius.large', 'dimension', 'cards and forms'),
  token('semantic.shadow.raised', 'shadow', 'elements lifted off the surface'),
  token('semantic.shadow.overlay', 'shadow', 'dialogs and notifications above the page'),
  token('semantic.duration.fast', 'duration', 'hover and focus transitions'),

  token('component.button.primary.background', 'color', 'primary button'),
  token('component.button.primary.background-hover', 'color', 'primary button under the pointer'),
  token('component.button.primary.text', 'color', 'primary button label'),
  token('component.button.secondary.background', 'color', 'secondary button'),
  token('component.button.secondary.background-hover', 'color', 'secondary button under the pointer'),
  token('component.button.secondary.text', 'color', 'secondary button label'),
  token('component.button.secondary.border', 'color', 'secondary button border'),
  token('component.button.radius', 'dimension', 'button corners'),
  token('component.card.background', 'color', 'card'),
  token('component.card.border', 'color', 'card border'),
  token('component.card.radius', 'dimension', 'card corners'),
  token('component.dialog.background', 'color', 'dialog panel'),
  token('component.dialog.backdrop', 'color', 'the page behind a dialog'),
  token('component.dialog.radius', 'dimension', 'dialog corners'),
  token('component.dialog.shadow', 'shadow', 'dialog elevation'),
  token('component.header.background', 'color', 'app header'),
  token('component.header.text', 'color', 'app header text and links'),
  token('component.input.background', 'color', 'text inputs and selects'),
  token('component.input.border', 'color', 'input border at rest'),
  token('component.input.border-focus', 'color', 'input border with focus'),
  token('component.input.radius', 'dimension', 'input corners'),
  token('component.table.header-background', 'color', 'table header row'),
  token('component.table.border', 'color', 'lines between table rows'),
];

/** WCAG 2.2: 4.5:1 for normal text (1.4.3), 3:1 for the parts of a control and focus indicators (1.4.11). */
export const TEXT_CONTRAST = 4.5;
export const NON_TEXT_CONTRAST = 3;

export interface ContrastPair {
  readonly label: string;
  readonly foreground: string;
  readonly background: string;
  readonly minimum: number;
}

const pair = (label: string, foreground: string, background: string, minimum = TEXT_CONTRAST): ContrastPair => ({
  label,
  foreground,
  background,
  minimum,
});

/** Every foreground the app puts on a background, checked for each tenant. Backgrounds must be opaque. */
export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  pair('body text on the page', 'semantic.color.text.default', 'semantic.color.canvas'),
  pair('body text on a surface', 'semantic.color.text.default', 'semantic.color.surface.default'),
  pair('body text on a subtle surface', 'semantic.color.text.default', 'semantic.color.surface.subtle'),
  pair('muted text on the page', 'semantic.color.text.muted', 'semantic.color.canvas'),
  pair('muted text on a surface', 'semantic.color.text.muted', 'semantic.color.surface.default'),
  pair('links on the page', 'semantic.color.link', 'semantic.color.canvas'),
  pair('links on a surface', 'semantic.color.link', 'semantic.color.surface.default'),
  pair('error text in an error message', 'semantic.color.danger.text', 'semantic.color.danger.surface'),
  pair('error text under a field', 'semantic.color.danger.text', 'semantic.color.surface.default'),
  pair('confirmation text', 'semantic.color.success.text', 'semantic.color.success.surface'),
  pair('header text', 'component.header.text', 'component.header.background'),
  pair('primary button label', 'component.button.primary.text', 'component.button.primary.background'),
  pair(
    'primary button label under the pointer',
    'component.button.primary.text',
    'component.button.primary.background-hover'
  ),
  pair('secondary button label', 'component.button.secondary.text', 'component.button.secondary.background'),
  pair(
    'secondary button label under the pointer',
    'component.button.secondary.text',
    'component.button.secondary.background-hover'
  ),
  pair(
    'secondary button border',
    'component.button.secondary.border',
    'component.button.secondary.background',
    NON_TEXT_CONTRAST
  ),
  pair('text in a dialog', 'semantic.color.text.default', 'component.dialog.background'),
  pair('table header text', 'semantic.color.text.default', 'component.table.header-background'),
  pair('input border', 'component.input.border', 'component.input.background', NON_TEXT_CONTRAST),
  pair('focus ring on a surface', 'semantic.color.focus', 'semantic.color.surface.default', NON_TEXT_CONTRAST),
  pair('focus ring on the page', 'semantic.color.focus', 'semantic.color.canvas', NON_TEXT_CONTRAST),
];
