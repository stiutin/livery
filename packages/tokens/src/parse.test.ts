import {describe, expect, it} from 'vitest';

import {parseTokens} from './parse.ts';

const parse = (json: unknown) => parseTokens({name: 'test.json', json});

describe('parseTokens', () => {
  it('flattens tokens to dot paths and passes group types down', () => {
    const {tokens, problems} = parse({
      $schema: 'https://www.designtokens.org/schemas/2025.10/format.json',
      primitive: {
        $type: 'color',
        white: {$value: {colorSpace: 'srgb', components: [1, 1, 1]}, $description: 'Paper'},
        gap: {$type: 'dimension', $value: {value: 4, unit: 'px'}},
      },
    });

    expect(problems).toEqual([]);
    expect(tokens).toEqual([
      {
        path: 'primitive.white',
        source: 'test.json',
        type: 'color',
        value: {colorSpace: 'srgb', components: [1, 1, 1]},
        description: 'Paper',
      },
      {
        path: 'primitive.gap',
        source: 'test.json',
        type: 'dimension',
        value: {value: 4, unit: 'px'},
        description: undefined,
      },
    ]);
  });

  it('leaves the type of an untyped alias to be taken from its target', () => {
    const {tokens} = parse({semantic: {link: {$value: '{primitive.blue}'}}});
    expect(tokens[0]?.type).toBeUndefined();
  });

  it('reports every structural problem instead of stopping at the first', () => {
    const {problems} = parse({
      primitive: {
        'a.b': {$value: 1, $type: 'number'},
        typo: {$value: 1, $typ: 'number'},
        nested: {$value: 1, $type: 'number', child: {$value: 2}},
        gradient: {$value: [], $type: 'gradient'},
        loose: 3,
        $unknown: true,
      },
    });

    expect(problems.map((problem) => `${problem.path}: ${problem.message}`)).toEqual([
      'primitive.a.b: names cannot contain ".", "{" or "}"',
      'primitive.typo: unknown token property $typ',
      'primitive.nested: a token cannot contain "child"; only groups have children',
      'primitive.gradient: unsupported $type "gradient"; Livery supports color, dimension, fontFamily, fontWeight, duration, number, cubicBezier, shadow',
      'primitive.loose: expected a group or a token (an object with $value)',
      'primitive: unknown group property $unknown',
    ]);
  });

  it('rejects a file that is not an object', () => {
    expect(parse([]).problems).toEqual([
      {source: 'test.json', path: '(root)', message: 'a token file must contain a JSON object'},
    ]);
  });
});
