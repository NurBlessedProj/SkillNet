"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

// Language context
interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState("en");

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

// Theme context
interface ThemeContextType {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("skillnet-theme") as
      | "light"
      | "dark";
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Save theme to localStorage and apply to document
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("skillnet-theme", theme);
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ContextType {
  toggle: boolean;
  setToggle: (toggle: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  data: string;
  setData: (data: string) => void;
  selectedDiscipline: string;
  setSelectedDiscipline: (discipline: string) => void;
  selectedSubcategory: string;
  setSelectedSubcategory: (subcategory: string) => void;
  difficultyLevel: string;
  setDifficultyLevel: (level: string) => void;
  clearFilters: () => void;
  subCategories?: any;
  setSubCategories?: any;
}

const ContextData = createContext<ContextType | null>(null);

interface Children {
  children: React.ReactNode;
}

const DataProvider: React.FC<Children> = ({ children }) => {
  // Initialize toggle from localStorage if available
  const [toggle, setToggle] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const savedToggle = localStorage.getItem("sidebarToggle");
      return savedToggle ? JSON.parse(savedToggle) : true;
    }
    return true;
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [data, setData] = useState<string>("");
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>("");
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>("");
  const [difficultyLevel, setDifficultyLevel] =
    useState<string>("intermediate"); // Default to intermediate

  // Save toggle state to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarToggle", JSON.stringify(toggle));
    }
  }, [toggle]);

  const clearFilters = () => {
    setSelectedDiscipline("");
    setSelectedSubcategory("");
    setDifficultyLevel("intermediate");
  };

  return (
    <ContextData.Provider
      value={{
        toggle,
        setToggle,
        mobileMenuOpen,
        setMobileMenuOpen,
        data,
        setData,
        selectedDiscipline,
        setSelectedDiscipline,
        selectedSubcategory,
        setSelectedSubcategory,
        difficultyLevel,
        setDifficultyLevel,
        clearFilters,
      }}
    >
      {children}
    </ContextData.Provider>
  );
};

export { ContextData, DataProvider };
