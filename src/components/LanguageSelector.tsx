"use client";
import React, { useEffect, useState } from "react";
import { ChevronDown, Globe } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";

interface LanguageSelectorProps {
  className?: string;
  variant?: "default" | "transparent";
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = "",
  variant = "default",
}) => {
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const pathname = usePathname();
  const currentLocale = useLocale();
  const router = useRouter();

  // Get translations if needed
  const t = useTranslations("Navigation");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsLanguageDropdownOpen(false);
    };

    if (isLanguageDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isLanguageDropdownOpen]);

  const switchToLocale = (locale: string) => {
    // Get the current path without the locale prefix
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, "");

    // Create the new path with the new locale
    const newPath = `/${locale}${pathWithoutLocale || ""}`;

    // Preserve query parameters
    const currentUrl = new URL(window.location.href);
    const queryString = currentUrl.search; // This includes the '?' at the beginning

    // Use Next.js router for client-side navigation
    router.push(`${newPath}${queryString}`);

    // Close the dropdown
    setIsLanguageDropdownOpen(false);
  };

  const toggleLanguageDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
  };

  const getButtonStyles = () => {
    if (variant === "transparent") {
      return "flex items-center px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-white hover:bg-white/20 transition-all duration-200 backdrop-blur-sm";
    }
    return "flex items-center px-2 sm:px-3 py-1.5 sm:py-2  transition-all duration-200 shadow-sm border-b";
  };

  const getDropdownStyles = () => {
    if (variant === "transparent") {
      return "absolute right-0 top-full mt-2 w-36 sm:w-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-xl shadow-xl border border-white/20 dark:border-gray-700/50 ring-1 ring-black/5 focus:outline-none z-50";
    }
    return "absolute right-0 top-full mt-2 w-36 sm:w-40 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 ring-1 ring-black/5 focus:outline-none z-50";
  };

  return (
    <div className={`relative flex items-center space-x-2 ${className}`}>
      {/* Theme Toggle Button */}
      <ThemeToggle variant={variant} />

      {/* Language Selector Button */}
      <button
        onClick={toggleLanguageDropdown}
        className={getButtonStyles()}
        title={t("language.switch")}
      >
        {/* Globe Icon */}
        <Globe
          size={16}
          className={`mr-2 ${
            variant === "transparent" ? "text-white" : "text-gray-600"
          }`}
        />

        {/* Current flag */}
        <div className="w-4 sm:w-5 h-3 sm:h-4 mr-1.5 sm:mr-2 relative overflow-hidden rounded-sm">
          <Image
            src={`/flags/${currentLocale === "en" ? "gb" : "fr"}.svg`}
            alt={currentLocale === "en" ? "English" : "Français"}
            fill
            className="object-cover"
          />
        </div>

        {/* Language code */}
        <span
          className={`text-xs sm:text-sm font-medium mr-1 ${
            variant === "transparent"
              ? "text-white"
              : "text-gray-700 dark:text-gray-200"
          }`}
        >
          {currentLocale === "en" ? "EN" : "FR"}
        </span>

        {/* Chevron with animation */}
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${
            variant === "transparent"
              ? "text-white"
              : "text-gray-500 dark:text-gray-400"
          } ${isLanguageDropdownOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown menu with animation */}
      {isLanguageDropdownOpen && (
        <div className={getDropdownStyles()}>
          <div className="py-2">
            <button
              onClick={() => switchToLocale("en")}
              className={`flex items-center w-full px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm transition-colors duration-150 ${
                currentLocale === "en"
                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-r-2 border-emerald-500"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200"
              }`}
            >
              <div className="w-4 sm:w-5 h-3 sm:h-4 mr-2 sm:mr-3 relative overflow-hidden rounded-sm">
                <Image
                  src="/flags/gb.svg"
                  alt="English"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-medium">English</span>
              {currentLocale === "en" && (
                <div className="ml-auto w-2 h-2 bg-emerald-500 rounded-full"></div>
              )}
            </button>
            <button
              onClick={() => switchToLocale("fr")}
              className={`flex items-center w-full px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm transition-colors duration-150 ${
                currentLocale === "fr"
                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-r-2 border-emerald-500"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-200"
              }`}
            >
              <div className="w-4 sm:w-5 h-3 sm:h-4 mr-2 sm:mr-3 relative overflow-hidden rounded-sm">
                <Image
                  src="/flags/fr.svg"
                  alt="Français"
                  fill
                  className="object-cover"
                />
              </div>
              <span className="font-medium">Français</span>
              {currentLocale === "fr" && (
                <div className="ml-auto w-2 h-2 bg-emerald-500 rounded-full"></div>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
