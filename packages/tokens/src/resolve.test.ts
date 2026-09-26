import {describe, expect, it} from 'vitest';

import type {RawToken} from './model.ts';
import {parseTokens} from './parse.ts';
import {resolveTokens} from './resolve.ts';

const srgb = (r: number, g: number, b: number, alpha?: number) => ({
  colorSpace: 'srgb',
  components: [r, g, b],
  ...(alpha === undefined ? {} : {alpha}),
});

function resolve(json: unknown) {
  const {tokens} = parseTokens({name: 'test.json', json});
  const map = new Map<string, RawToken>(tokens.map((token) => [token.path, token]));
  const result = resolveTokens(map);
  return {...result, messages: result.problems.map((problem) => `${problem.path}: ${problem.message}`)};
}

describe('resolveTokens', () => {
  it('follows alias chains and remembers the direct target', () => {
    const {resolved, problems} = resolve({
      primitive: {$type: 'color', blue: {$value: srgb(0, 0, 1)}},
      semantic: {brand: {$value: '{primitive.blue}'}, link: {$type: 'color', $value: '{semantic.brand}'}},
    });

    expect(problems).toEqual([]);
    expect(resolved.get('semantic.link')).toMatchObject({
      aliasOf: 'semantic.brand',
      value: {type: 'color', value: {colorSpace: 'srgb', components: [0, 0, 1], alpha: 1}},
    });
  });

  it('reports a missing target once, not again for every token that depends on it', () => {
    const {messages} = resolve({
      semantic: {a: {$value: '{primitive.nowhere}'}, b: {$value: '{semantic.a}'}, c: {$value: '{semantic.b}'}},
    });
    expect(messages).toEqual(['semantic.a: refers to {primitive.nowhere}, which does not exist']);
  });

  it('reports circular aliases', () => {
    const {messages} = resolve({semantic: {a: {$value: '{semantic.b}'}, b: {$value: '{semantic.a}'}}});
    expect(messages).toEqual(['semantic.a: circular alias: semantic.a → semantic.b → semantic.a']);
  });

  it('checks that an alias has the type its token declares', () => {
    const {messages} = resolve({
      primitive: {gap: {$type: 'dimension', $value: {value: 4, unit: 'px'}}},
      semantic: {text: {$type: 'color', $value: '{primitive.gap}'}},
    });
    expect(messages).toEqual(['semantic.text: is a color but refers to {primitive.gap}, a dimension']);
  });

  it('validates values', () => {
    const {messages} = resolve({
      primitive: {
        $type: 'color',
        tooBright: {$value: srgb(1.2, 0, 0)},
        wrongHex: {$value: {...srgb(1, 1, 1), hex: '#000000'}},
        badAlpha: {$value: srgb(0, 0, 0, 2)},
        named: {$value: 'red'},
        em: {$type: 'dimension', $value: {value: 1, unit: 'em'}},
        weight: {$type: 'fontWeight', $value: 'chunky'},
      },
      other: {untyped: {$value: 3}},
    });
    expect(messages).toEqual([
      'primitive.tooBright: sRGB components go from 0 to 1',
      'primitive.wrongHex: hex #000000 does not match the components',
      'primitive.badAlpha: alpha goes from 0 to 1',
      'primitive.named: a color is an object: {colorSpace, components, alpha?, hex?}',
      'primitive.em: a dimension is {value: number, unit: "px" | "rem"}',
      'primitive.weight: a font weight is a number from 1 to 1000 or a keyword such as "bold"',
      'other.untyped: has no $type: set it on the token or on a group above it',
    ]);
  });

  it('resolves aliases inside a shadow', () => {
    const {resolved, problems} = resolve({
      primitive: {
        ink: {$type: 'color', $value: srgb(0, 0, 0, 0.25)},
        lift: {$type: 'dimension', $value: {value: 6, unit: 'px'}},
      },
      semantic: {
        raised: {
          $type: 'shadow',
          $value: {
            color: '{primitive.ink}',
            offsetX: {value: 0, unit: 'px'},
            offsetY: '{primitive.lift}',
            blur: {value: 12, unit: 'px'},
            spread: {value: 0, unit: 'px'},
          },
        },
      },
    });
    expect(problems).toEqual([]);
    expect(resolved.get('semantic.raised')?.value).toMatchObject({
      type: 'shadow',
      value: [{color: {alpha: 0.25}, offsetY: {value: 6, unit: 'px'}, inset: false}],
    });
  });
});
