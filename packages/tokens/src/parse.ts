import type {Problem, RawToken, TokenSource, TokenType} from './model.ts';
import {TOKEN_TYPES} from './model.ts';

const GROUP_PROPERTIES = new Set(['$type', '$description', '$extensions', '$deprecated']);
const TOKEN_PROPERTIES = new Set(['$value', '$type', '$description', '$extensions', '$deprecated']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isTokenType(value: unknown): value is TokenType {
  return TOKEN_TYPES.some((type) => type === value);
}

export interface ParseResult {
  readonly tokens: readonly RawToken[];
  readonly problems: readonly Problem[];
}

/**
 * Flattens one token file into tokens keyed by their dot path. Groups pass their `$type` down to the
 * tokens inside them. Structural mistakes are reported, never thrown, so one file shows all its problems.
 */
export function parseTokens({name: source, json}: TokenSource): ParseResult {
  const tokens: RawToken[] = [];
  const problems: Problem[] = [];
  const report = (path: string, message: string): void => {
    problems.push({source, path, message});
  };

  const readType = (node: Record<string, unknown>, path: string, inherited: TokenType | undefined) => {
    const own = node.$type;
    if (own === undefined) {
      return inherited;
    }
    if (isTokenType(own)) {
      return own;
    }
    report(path, `unsupported $type ${JSON.stringify(own)}; Livery supports ${TOKEN_TYPES.join(', ')}`);
    return undefined;
  };

  const readDescription = (node: Record<string, unknown>, path: string): string | undefined => {
    const description = node.$description;
    if (description === undefined || typeof description === 'string') {
      return description;
    }
    report(path, '$description must be a string');
    return undefined;
  };

  const visitGroup = (group: Record<string, unknown>, path: string, inherited: TokenType | undefined): void => {
    const type = readType(group, path || '(root)', inherited);
    readDescription(group, path || '(root)');

    for (const [key, child] of Object.entries(group)) {
      const childPath = path ? `${path}.${key}` : key;

      if (key.startsWith('$')) {
        if (!GROUP_PROPERTIES.has(key) && !(key === '$schema' && path === '')) {
          report(path || '(root)', `unknown group property ${key}`);
        }
        continue;
      }
      if (/[.{}]/.test(key)) {
        report(childPath, 'names cannot contain ".", "{" or "}"');
        continue;
      }
      if (!isRecord(child)) {
        report(childPath, 'expected a group or a token (an object with $value)');
        continue;
      }
      if ('$value' in child) {
        visitToken(child, childPath, type);
      } else {
        visitGroup(child, childPath, type);
      }
    }
  };

  const visitToken = (token: Record<string, unknown>, path: string, inherited: TokenType | undefined): void => {
    for (const key of Object.keys(token)) {
      if (!key.startsWith('$')) {
        report(path, `a token cannot contain "${key}"; only groups have children`);
      } else if (!TOKEN_PROPERTIES.has(key)) {
        report(path, `unknown token property ${key}`);
      }
    }
    tokens.push({
      path,
      source,
      type: readType(token, path, inherited),
      value: token.$value,
      description: readDescription(token, path),
    });
  };

  if (isRecord(json)) {
    visitGroup(json, '', undefined);
  } else {
    report('(root)', 'a token file must contain a JSON object');
  }
  return {tokens, problems};
}
