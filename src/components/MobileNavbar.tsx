"use client";
import React from "react";
import LanguageSelector from "./LanguageSelector";
import ThemeToggle from "./ThemeToggle";

const MobileNavbar: React.FC = () => {
  return (
    <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex items-center">
          <img
            src="/skillnet_logo.png"
            className="h-8 w-auto"
            alt="SkillNet Logo"
          />
        </div>

        {/* Language and Theme Controls */}
        <div className="flex items-center space-x-2">
          <LanguageSelector variant="default" />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
};

export default MobileNavbar;
