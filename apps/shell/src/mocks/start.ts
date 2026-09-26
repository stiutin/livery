let ready: Promise<void> | undefined;

/**
 * Starts the mock API the first time any page calls it, so pages that never call it never load MSW. In tests
 * the Node server from src/test/setup.ts is already listening, and this does nothing.
 */
export function startMocks(): Promise<void> {
  if (import.meta.env.MODE === 'test') {
    return Promise.resolve();
  }
  ready ??= Promise.all([import('msw/browser'), import('./handlers')]).then(async ([{setupWorker}, {handlers}]) => {
    const base = import.meta.env.BASE_URL;
    await setupWorker(...handlers).start({
      serviceWorker: {url: `${base}mockServiceWorker.js`, options: {scope: base}},
      onUnhandledRequest: 'bypass',
      quiet: true,
    });
  });
  return ready;
}
