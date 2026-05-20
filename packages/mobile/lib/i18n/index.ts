import { en } from './en';
import { hi } from './hi';

export type TranslationKey = keyof typeof en;

const translations = { en, hi } as const;

export type Language = keyof typeof translations;

export function t(key: TranslationKey, lang: Language = 'en', params?: Record<string, string | number>): string {
  let text = translations[lang]?.[key] || translations.en[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  return text;
}

export { en, hi };
