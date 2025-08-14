import type { Metadata } from "next";
import { getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import "../globals.css";
import "remixicon/fonts/remixicon.css";
import ClientProviders from "@/components/ClientProviders";
import { Toaster } from "sonner";
// Import the console override script at the root layout level
import "@/utils/console-override.js";

export const metadata: Metadata = {
  title: "SkillNet",
  description: "",
};

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "fr" }];
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: {
    locale: string;
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: LocaleLayoutProps) {
  // Explicitly load messages for the current locale
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="icon" href="/skillnet_logo.png" type="image/png+xml" />

        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap"
          rel="stylesheet"
        />
        {/* Add inline script to disable console logs immediately */}
        {process.env.NODE_ENV === "production" && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
              console.log = function(){};
              console.error = function(){};
              console.warn = function(){};
              console.info = function(){};
              console.debug = function(){};
              console.trace = function(){};
            `,
            }}
          />
        )}
      </head>
      <body className="font-outfit antialiased overflow-auto">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ClientProviders>
            <Toaster position="top-center" />
            {children}
          </ClientProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
