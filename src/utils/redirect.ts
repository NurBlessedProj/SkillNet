import { defaultLocale } from "@/configs/config";
import { redirect } from "next/navigation";

/**
 * Utility function to redirect to a localized path
 * @param path The path to redirect to (without locale prefix)
 */
export function redirectToLocalizedPath(path: string = "") {
  // Remove leading slash if present
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  
  // Redirect to the path with the default locale
  redirect(`/${defaultLocale}/${normalizedPath}`);
}