import {ApiError} from '../api/types';
import type {MessageKey} from './messages';

/** The message key for anything a request can throw. */
export function errorKey(error: unknown): MessageKey {
  return error instanceof ApiError ? `error.${error.code}` : 'error.unknown';
}
