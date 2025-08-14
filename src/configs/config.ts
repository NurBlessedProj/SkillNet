import { Lang } from "./types/common.type";

export const locales: Lang[] = ['en', 'fr'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Lang = 'en' as const;

export function isValidLocale(locale: string): locale is Locale {
    return locales.includes(locale as Locale);
}
