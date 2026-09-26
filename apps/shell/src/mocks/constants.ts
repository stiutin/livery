/**
 * What the mock API treats specially, shared with the pages that explain it. Kept apart from the handlers so a
 * page that only shows these values does not pull MSW into its bundle.
 */

/** Test cards, as payment providers publish them: one always declines, one always asks the bank to confirm. */
export const TEST_CARDS = {
  success: '4242 4242 4242 4242',
  declined: '4000 0000 0000 0002',
  confirm: '4000 0027 6000 3184',
} as const;

/** The one password the mock API refuses, to show a failed sign-in. */
export const WRONG_PASSWORD = 'wrong-password';
