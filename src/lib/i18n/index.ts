import { id, type Messages } from "./messages";

/**
 * Tiny i18n layer (JES-113). Pure and dependency-free so it runs on both the
 * server and the client. Keys are type-checked (`MessageKey`), and `{param}`
 * placeholders are interpolated. A missing key falls back to the key string so a
 * typo surfaces visibly instead of rendering blank.
 */
export type MessageKey = keyof Messages;
type Params = Record<string, string | number>;

/** Currently the only locale; future locales register in this map. */
const dictionaries = { id } satisfies Record<string, Messages>;
const DEFAULT_LOCALE: keyof typeof dictionaries = "id";

export function t(key: MessageKey, params?: Params): string {
  const template = dictionaries[DEFAULT_LOCALE][key] ?? key;
  return params ? interpolate(template, params) : template;
}

function interpolate(template: string, params: Params): string {
  return template.replace(/\{(\w+)\}/g, (_match, name: string) => {
    const value = params[name];
    return value == null ? `{${name}}` : String(value);
  });
}
