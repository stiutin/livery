import {colorToCss} from './color.ts';
import type {DimensionValue, TokenValue} from './model.ts';

const GENERIC_FAMILIES = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'ui-rounded',
  'emoji',
  'math',
  'fangsong',
  '-apple-system',
  'BlinkMacSystemFont',
]);

/** `semantic.color.text.default` → `--color-text-default`: the layer is not part of the name. */
export function cssVariable(path: string): string {
  return `--${path.split('.').slice(1).join('-')}`;
}

const dimension = ({value, unit}: DimensionValue): string => `${value}${unit}`;

const family = (name: string): string => (GENERIC_FAMILIES.has(name) ? name : `"${name.replaceAll('"', '\\"')}"`);

/** A resolved value as CSS. */
export function valueToCss(token: TokenValue): string {
  switch (token.type) {
    case 'color':
      return colorToCss(token.value);
    case 'dimension':
      return dimension(token.value);
    case 'fontFamily':
      return token.value.map(family).join(', ');
    case 'fontWeight':
    case 'number':
      return String(token.value);
    case 'duration':
      return `${token.value.value}${token.value.unit}`;
    case 'cubicBezier':
      return `cubic-bezier(${token.value.join(', ')})`;
    case 'shadow':
      return token.value
        .map((layer) =>
          [
            layer.inset ? 'inset' : '',
            dimension(layer.offsetX),
            dimension(layer.offsetY),
            dimension(layer.blur),
            dimension(layer.spread),
            colorToCss(layer.color),
          ]
            .filter(Boolean)
            .join(' ')
        )
        .join(', ');
  }
}
