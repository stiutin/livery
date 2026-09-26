import '@testing-library/jest-dom/vitest';

import {cleanup} from '@testing-library/react';
import {setupServer} from 'msw/node';
import {afterAll, afterEach, beforeAll} from 'vitest';

import {resetDb} from '../mocks/db';
import {handlers} from '../mocks/handlers';

/** The same mock API the browser uses, answering fetch in Node. */
export const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({onUnhandledRequest: 'error'});
});
afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetDb();
  sessionStorage.clear();
});
afterAll(() => {
  server.close();
});

// jsdom has <dialog> but not its modal API; this stand-in keeps the open attribute and the close event right.
HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.setAttribute('open', '');
};
HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
  if (this.hasAttribute('open')) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  }
};
