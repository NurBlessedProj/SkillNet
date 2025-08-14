import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";
import fs from "fs";
import path from "path";

// Define the default locale directly in this file to avoid import issues
const defaultLocale = "en";

const withNextIntl = createNextIntlPlugin("./src/app/i18n.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  sassOptions: {
    additionalData: `$var: red;`,
  },

  // Add images configuration to allow any domain
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },

  // Add custom webpack configuration to handle missing fs module
  webpack(config) {
    config.resolve.fallback = {
      fs: false, // Disable fs to prevent the error
      path: false,
      os: false,
      stream: false,
      buffer: false,
      util: false,
    };

    // Remove console logs in production
    if (process.env.NODE_ENV === "production") {
      // Use a direct configuration for TerserPlugin options
      if (config.optimization && config.optimization.minimizer) {
        for (const minimizer of config.optimization.minimizer) {
          if (minimizer.constructor.name === "TerserPlugin") {
            // Modify existing TerserPlugin options
            minimizer.options.terserOptions = {
              ...minimizer.options.terserOptions,
              compress: {
                ...minimizer.options.terserOptions?.compress,
                drop_console: true,
              },
            };
          }
        }
      }
    }

    return config;
  },
};

// Apply next-intl first, then Sentry
const nextConfigWithIntl = withNextIntl(nextConfig);

export default withSentryConfig(nextConfigWithIntl, {
  // Sentry configuration remains the same
  org: "instanvi-lf",
  project: "phoenix-nextjs",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  reactComponentAnnotation: {
    enabled: true,
  },
  tunnelRoute: "/monitoring",
  disableLogger: true,
  automaticVercelMonitors: true,
});
