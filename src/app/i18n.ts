import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale } from "@/configs/config";

export default getRequestConfig(async ({ locale }) => {
  // Use the provided locale or default to 'en' if undefined
  const resolvedLocale = locale || defaultLocale;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(resolvedLocale as any)) notFound();

  return {
    locale: resolvedLocale,
    messages: (await import(`../langs/${resolvedLocale}.json`)).default,
  };
});
