import type * as Translations from '.';

type Dictionary = {
  [key in
  & keyof Translations.TranslationsEn
  & keyof Translations.TranslationsRo
  & keyof Translations.TranslationsRu]:
  | Translations.TranslationsEn[key]
  | Translations.TranslationsRo[key]
  | Translations.TranslationsRu[key];
}

type ExtractVariables<T extends string> = T extends `${infer Prev}%{${infer Var}}${infer Rest}`
  ? Var | ExtractVariables<Rest> | ExtractVariables<Prev>
  : never

type OptionsMap<K extends keyof Dictionary> = Dictionary[K] extends `${string}%{${string}}${string}`
  ? Record<ExtractVariables<Dictionary[K]>, string | number>
  : never

type GetTranslationArgs<T extends keyof Dictionary> = OptionsMap<T> extends never
  ? [T]
  : [T, OptionsMap<T>];

export class I18n {
  private static __instance: I18n | null = null;

  protected static translations: Partial<Record<string, Partial<Dictionary>>> = {}

  protected static fallbackLanguage: string;

  protected static language: string;

  private constructor() {
    /**
   * Gets the current device locale using the underscore format(i.e en-US, sv-SE, sv).
   * If will fallback to english if it can't get the locale.
   * @returns device locale
   */
    const deviceLanguage = (navigator?.languages?.length
      ? navigator.languages[0]
      : navigator.language)?.slice(0, 2) ?? 'en';

    I18n.fallbackLanguage = 'en';
    I18n.language = deviceLanguage;
  }

  static addTranslations(translations: Partial<Record<string, Partial<Dictionary>>>) {
    Object.entries(translations).forEach(([lang, translation]) => {
      if (I18n.translations[lang]) {
        I18n.translations[lang] = {
          ...I18n.translations[lang],
          ...translation as Partial<Dictionary>,
        };
      } else {
        I18n.translations[lang] = translation as Partial<Dictionary>;
      }
    })
  }

  static getInstance() {
    if (!I18n.__instance) {
      I18n.__instance = new I18n();
    }
    return I18n.__instance as I18n;
  }

  setLanguage(language: string) {
    I18n.language = language;
  }

  setFallbackLanguage(language: string) {
    if (!I18n.translations[language]) {
      console.error(`Language "${language}" is not supported.`);
      return
    }
    I18n.fallbackLanguage = language;
  }

  t<T extends keyof Dictionary>(...args: GetTranslationArgs<T>): Dictionary[T] {
    const [key, options = {}] = args;
    const translation = I18n.translations[I18n.language]?.[key]
      ?? I18n.translations[I18n.fallbackLanguage]?.[key];

    if (translation) {
      return Object.entries(options).reduce<string>((acc, [key, value]) => (
        acc.replace(`%{${key}}`, String(value))
      ), translation) as Dictionary[T]
    }

    throw new Error(`Translation for key "${key}" not found in language "${I18n.language}" or fallback "${I18n.fallbackLanguage}".`);
  }
}
