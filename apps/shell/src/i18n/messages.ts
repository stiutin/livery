import type {Language} from './languages';
import type en from './messages/en.json';

/** Every message key; English is the source catalogue, and the tests hold the others to the same keys. */
export type MessageKey = keyof typeof en;
export type Messages = Readonly<Record<MessageKey, string>>;

const catalogues = import.meta.glob<Messages>('./messages/*.json', {import: 'default'});

/** One language's messages, as a chunk of its own. */
export async function loadMessages(language: Language): Promise<Messages> {
  const load = catalogues[`./messages/${language}.json`];
  if (!load) {
    throw new Error(`there is no message catalogue for ${language}`);
  }
  return load();
}
