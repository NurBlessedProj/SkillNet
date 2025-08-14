"use client";
import React, { useContext, useEffect, useState } from "react";
import Logout from "../logout/modal";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { ContextData } from "@/components/context";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import LanguageSelector from "@/components/LanguageSelector";
import ThemeToggle from "@/components/ThemeToggle";

const Navbar = () => {
  const context = useContext(ContextData);
  const [routeName, setRouteName] = useState("");
  const pathname = usePathname();

  // Get the current locale directly from next-intl
  const currentLocale = useLocale();

  // Get translations
  const t = useTranslations("Navigation");

  useEffect(() => {
    // Extract the route name from the URL
    const pathParts = pathname.split("/");
    // The route is the part after the locale
    const route = pathParts.length > 2 ? pathParts[2] : "";
    setRouteName(route);
  }, [pathname]);

  const handleToggleSidebar = () => {
    if (context?.setToggle) {
      context.setToggle(!context?.toggle);
    }
  };

  const handleToggleMobileMenu = () => {
    if (context?.setMobileMenuOpen) {
      context.setMobileMenuOpen(!context?.mobileMenuOpen);
    }
  };

  return (
    <>
      <div className="w-full h-16 border-b border-gray-200 dark:border-gray-700 flex justify-between fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 z-50 shadow-lg">
        <div className="flex items-center">
          {/* Empty space to align with sidebar width - hidden on mobile */}
          <div
            className={`hidden md:block transition-all duration-300 ease-in-out h-16 ${
              context?.toggle ? "w-16" : "w-64"
            }`}
          >
            {/* This div just reserves space for the sidebar below */}
          </div>

          {/* Toggle button and page title */}
          <div className="flex items-center">
            {/* Mobile menu toggle */}
            <button
              onClick={handleToggleMobileMenu}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 mr-4 group"
              aria-label="Toggle mobile menu"
            >
              <Bars3Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors" />
            </button>

            {/* Desktop sidebar toggle */}
            <button
              onClick={handleToggleSidebar}
              className="hidden md:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 mr-4 group"
              aria-label="Toggle sidebar"
            >
              {context?.toggle ? (
                <Bars3Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors" />
              ) : (
                <XMarkIcon className="h-6 w-6 text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors" />
              )}
            </button>

            <div className="flex items-center space-x-3">
              <div className="h-8 w-1 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-full"></div>
              <h3 className="text-xl font-bold capitalize text-gray-900 dark:text-white">
                {/* Use translation for route name */}
                {routeName ? t(`routes.${routeName}`) : t("routes.home")}
              </h3>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 pr-4 sm:pr-6">
          {/* Language dropdown with flags */}
          <div className="block">
            <LanguageSelector />
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

          {/* Logout */}
          <div className="flex items-center">
            <Logout />
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
