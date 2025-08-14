import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./configs/config";
import { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const intlMiddleware = createMiddleware({
    locales: locales,
    defaultLocale: defaultLocale,
    localePrefix: "always",
    localeDetection: true,
  });

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|public|.*\\..*).*)"],
};
