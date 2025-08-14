"use client";
import React, { useState, useEffect, useContext } from "react";
import QuestionaireLayout from "./layout";
import {
  Clock,
  Loader2,
  BookOpen,
  Users,
  Search,
  ArrowRight,
  ChevronLeft,
  Globe,
  Filter,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/useToast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ContextData } from "@/components/context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale, useTranslations } from "next-intl";
import LanguageSelector from "@/components/LanguageSelector";

interface Question {
  Serial: number;
  Function: string;
  Area: string;
  Question: string;
  A: string;
  B: string;
  C: string;
  D: string;
  Correct_Answer: string;
  Timing: number | string;
  sub_category?: string;
}

interface SubCategoryGroup {
  name: string;
  displayName: string;
  totalQuestions: number;
  estimatedDuration: string;
  totalSeconds: number;
  areas: string[];
}

interface Section {
  id: number;
  name: string;
  description: string;
  function: string;
  is_active: boolean;
  subCategories: {
    [key: string]: SubCategoryGroup;
  };
}

// Format time function to convert seconds to a human-readable format
const formatTimeDisplay = (totalSeconds: number) => {
  if (totalSeconds === undefined || totalSeconds < 0) return "0 minutes";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes} minutes`;
  } else {
    return `${seconds} seconds`;
  }
};

// Parse timing value from database to seconds
const parseTimingToSeconds = (timing: string | number | undefined): number => {
  if (timing === undefined || timing === null) {
    return 60;
  }

  if (typeof timing === "string") {
    const minutesValue = parseFloat(timing);
    if (!isNaN(minutesValue)) {
      return Math.round(minutesValue * 60);
    }
  } else if (typeof timing === "number") {
    return Math.round(timing * 60);
  }

  return 60;
};

// Helper function to get a user-friendly display name for a subcategory
const getSubCategoryDisplayName = (subCategory: string): string => {
  if (!subCategory) return "Default";

  let displayName = subCategory;

  // Handle Finance Accounting patterns
  if (subCategory.includes("Fin Acc Level")) {
    const levelMatch = subCategory.match(/Level(\d+)/);
    const langMatch = subCategory.match(/(En|Fr)$/);
    const level = levelMatch ? levelMatch[1] : "";
    const lang = langMatch ? langMatch[1] : "";

    return `Level ${level} ${lang === "En" ? "English" : "French"}`;
  }

  // Handle other patterns
  const parts = subCategory.split("_");
  if (parts.length > 3) {
    displayName = parts[parts.length - 1];
    displayName = displayName.replace(/^\d+_/, "");
  }

  return (
    displayName.charAt(0).toUpperCase() +
    displayName.slice(1).replace(/_/g, " ")
  );
};

// Helper function to map subcategory to difficulty level for backward compatibility
const mapSubCategoryToDifficulty = (subCategory: string): string => {
  if (!subCategory) return "beginner";

  const subCat = subCategory.toLowerCase();

  // Handle Finance Accounting levels
  if (subCat.includes("level1")) {
    return "beginner";
  } else if (subCat.includes("level2")) {
    return "intermediate";
  } else if (subCat.includes("level3") || subCat.includes("level4")) {
    return "advanced";
  }

  // Handle other patterns
  if (
    subCat.includes("_001_") ||
    subCat.includes("beginner") ||
    subCat.includes("_default")
  ) {
    return "beginner";
  } else if (
    subCat.includes("_002_") ||
    subCat.includes("intermediary") ||
    subCat.includes("intermediate")
  ) {
    return "intermediate";
  } else if (subCat.includes("_003_") || subCat.includes("advance")) {
    return "advanced";
  }
  return "beginner";
};

// Get difficulty color for badges
const getDifficultyColor = (subCategory: string): string => {
  const difficulty = mapSubCategoryToDifficulty(subCategory);
  switch (difficulty) {
    case "beginner":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800";
    case "intermediate":
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800";
    case "advanced":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";
  }
};

const Questionaire = () => {
  const t = useTranslations();
  const router = useRouter();
  const context = useContext(ContextData);
  const { success, error: showError } = useToast();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [processingSection, setProcessingSection] = useState<{
    section: string;
    subCategory: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const currentLocale = useLocale();
  const pathname = usePathname();

  const switchLocale = () => {
    const newLocale = currentLocale === "en" ? "fr" : "en";
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, "");
    const newPath = `/${newLocale}${pathWithoutLocale || ""}`;
    window.location.href = newPath;
  };

  useEffect(() => {
    fetchQuestionsAndSections();
  }, []);

  const fetchQuestionsAndSections = async () => {
    try {
      setLoading(true);
      const { data: activeSections, error: sectionsError } = await supabase
        .from("section")
        .select("*")
        .eq("is_active", true);

      if (sectionsError) throw sectionsError;

      const activeSectionsMap = new Map();
      activeSections.forEach((section: any) => {
        activeSectionsMap.set(section.name, {
          id: section.id,
          name: section.name,
          description: `Test your knowledge in ${section.name} related concepts and practices.`,
          function: section.name,
          is_active: true,
          subCategories: {},
        });
      });

      const { data: questions, error: questionsError } = await supabase
        .from("questions")
        .select("*");

      if (questionsError) throw questionsError;

      questions.forEach((question: Question) => {
        if (!activeSectionsMap.has(question.Function)) return;
        const section = activeSectionsMap.get(question.Function);
        const subCategory = question.sub_category || "Default";

        if (!section.subCategories[subCategory]) {
          section.subCategories[subCategory] = {
            name: subCategory,
            displayName: getSubCategoryDisplayName(subCategory),
            totalQuestions: 0,
            estimatedDuration: "0 minutes",
            totalSeconds: 0,
            areas: [],
          };
        }

        const timingInSeconds = parseTimingToSeconds(question.Timing);
        section.subCategories[subCategory].totalQuestions++;
        section.subCategories[subCategory].totalSeconds += timingInSeconds;
        section.subCategories[subCategory].estimatedDuration =
          formatTimeDisplay(section.subCategories[subCategory].totalSeconds);

        if (!section.subCategories[subCategory].areas.includes(question.Area)) {
          section.subCategories[subCategory].areas.push(question.Area);
        }
      });

      const sectionsWithQuestions = Array.from(
        activeSectionsMap.values()
      ).filter((section) => Object.keys(section.subCategories).length > 0);

      setSections(sectionsWithQuestions);

      if (sectionsWithQuestions.length > 0) {
        setActiveTab(sectionsWithQuestions[0].name);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(t("Questionnaire.noSections"));
    } finally {
      setLoading(false);
    }
  };

  const handleSectionSelect = async (
    sectionName: string,
    subCategory: string
  ) => {
    try {
      setProcessingSection({
        section: sectionName,
        subCategory,
      });

      const selectedSection = sections.find(
        (section) => section.name === sectionName
      );
      if (!selectedSection) {
        throw new Error("Selected section not found");
      }

      if (context) {
        context.setData(sectionName);
        if (typeof context.setSubCategories === "function") {
          context.setSubCategories([subCategory]);
        }
      }

      localStorage.setItem("selectedSection", sectionName);
      localStorage.setItem(
        "difficultyLevel",
        mapSubCategoryToDifficulty(subCategory)
      );
      localStorage.setItem("subCategories", JSON.stringify([subCategory]));

      await new Promise((resolve) => setTimeout(resolve, 800));
      success(
        t("Questionnaire.toasts.success", {
          section: sectionName,
        })
      );
      router.push("/schedule");
    } catch (error) {
      console.error("Error selecting section:", error);
      setError(
        `${t("Questionnaire.toasts.error")} ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      showError(t("Questionnaire.toasts.error"));
    } finally {
      setProcessingSection(null);
    }
  };

  const handleGoBack = () => {
    router.push("/test");
  };

  // Filter sections based on search and difficulty
  const filteredSections = sections.filter((section) => {
    const matchesSearch =
      section.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      Object.values(section.subCategories).some((group) =>
        group.areas.some((area) =>
          area.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );

    const matchesDifficulty =
      selectedDifficulty === "all" ||
      Object.keys(section.subCategories).some(
        (subCategory) =>
          mapSubCategoryToDifficulty(subCategory) === selectedDifficulty
      );

    return matchesSearch && matchesDifficulty;
  });

  // Get filtered subcategories for current section
  const getFilteredSubCategories = (section: Section) => {
    return Object.entries(section.subCategories).filter(([subCategoryKey]) => {
      if (selectedDifficulty === "all") return true;
      return mapSubCategoryToDifficulty(subCategoryKey) === selectedDifficulty;
    });
  };

  if (loading) {
    return (
      <QuestionaireLayout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-emerald-200 dark:border-emerald-800 border-t-emerald-600 dark:border-t-emerald-400 rounded-full animate-spin mx-auto"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-emerald-400 dark:border-t-emerald-300 rounded-full animate-spin animate-delay-150 mx-auto"></div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("Questionnaire.loading")}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Preparing your assessment options...
              </p>
            </div>
          </div>
        </div>
      </QuestionaireLayout>
    );
  }

  return (
    <QuestionaireLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <Button
                variant="ghost"
                onClick={handleGoBack}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {t("Questionnaire.back")}
                </span>
              </Button>

              <div className="flex items-center gap-4">
                <LanguageSelector />
              </div>
            </div>

            <div className="text-center pb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                  <Target className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {t("Questionnaire.title")}
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-sm sm:text-base">
                {t("Questionnaire.subtitle")}
              </p>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 pb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
                <Input
                  type="text"
                  placeholder={t("Questionnaire.search")}
                  className="pl-10 w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-emerald-500 focus:ring-emerald-500 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Filters</span>
                </Button>
              </div>
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="pb-6">
                <div className="flex flex-wrap gap-2">
                  {["all", "beginner", "intermediate", "advanced"].map(
                    (difficulty) => (
                      <Button
                        key={difficulty}
                        variant={
                          selectedDifficulty === difficulty
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedDifficulty(difficulty)}
                        className={`capitalize ${
                          selectedDifficulty === difficulty
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        }`}
                      >
                        {difficulty === "all" ? "All Levels" : difficulty}
                      </Button>
                    )
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-700 dark:text-red-400 text-sm">
                  {error}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        {filteredSections.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex overflow-x-auto gap-2 py-4 scrollbar-hide">
                {filteredSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveTab(section.name)}
                    className={`px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 whitespace-nowrap flex items-center gap-2 border ${
                      activeTab === section.name
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
                    }`}
                  >
                    <Sparkles
                      className={`h-4 w-4 ${
                        activeTab === section.name
                          ? "text-white"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    />
                    <span>{section.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {filteredSections.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Search className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No assessments found
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {searchQuery
                    ? t("Questionnaire.noSectionsSearch")
                    : t("Questionnaire.noSections")}
                </p>
              </div>
            </div>
          ) : (
            <>
              {filteredSections.map((section) => (
                <div
                  key={section.id}
                  className={`${
                    activeTab === section.name ? "block" : "hidden"
                  }`}
                >
                  {/* Section Header */}
                  <div className="mb-8">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                        <BookOpen className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        {section.name}
                      </h2>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base max-w-3xl">
                      {section.description}
                    </p>
                  </div>

                  {/* Subcategories Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredSubCategories(section).map(
                      ([subCategoryKey, subCategoryData]) => (
                        <Card
                          key={subCategoryKey}
                          className="group hover:shadow-lg transition-all duration-300 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 overflow-hidden bg-white dark:bg-gray-800"
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                                  {subCategoryData.displayName}
                                </CardTitle>
                                <CardDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {subCategoryData.name}
                                </CardDescription>
                              </div>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getDifficultyColor(
                                  subCategoryKey
                                )}`}
                              >
                                {mapSubCategoryToDifficulty(subCategoryKey)}
                              </Badge>
                            </div>
                          </CardHeader>

                          <CardContent className="pt-0 pb-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                  <Users className="h-4 w-4" />
                                  <span>Questions</span>
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {subCategoryData.totalQuestions}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                  <Clock className="h-4 w-4" />
                                  <span>Duration</span>
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {subCategoryData.estimatedDuration}
                                </span>
                              </div>

                              {subCategoryData.areas.length > 0 && (
                                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    <TrendingUp className="h-4 w-4" />
                                    <span>Areas Covered</span>
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {subCategoryData.areas
                                      .slice(0, 3)
                                      .map((area, index) => (
                                        <Badge
                                          key={index}
                                          variant="secondary"
                                          className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                        >
                                          {area}
                                        </Badge>
                                      ))}
                                    {subCategoryData.areas.length > 3 && (
                                      <Badge
                                        variant="secondary"
                                        className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                      >
                                        +{subCategoryData.areas.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>

                          <CardFooter className="pt-0">
                            <Button
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 group-hover:shadow-md"
                              onClick={() =>
                                handleSectionSelect(
                                  section.name,
                                  subCategoryKey
                                )
                              }
                              disabled={processingSection !== null}
                            >
                              {processingSection?.section === section.name &&
                              processingSection?.subCategory ===
                                subCategoryKey ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Starting...
                                </>
                              ) : (
                                <>
                                  <ArrowRight className="h-4 w-4 mr-2 group-hover:translate-x-1 transition-transform" />
                                  Start Assessment
                                </>
                              )}
                            </Button>
                          </CardFooter>
                        </Card>
                      )
                    )}
                  </div>

                  {/* No questions available message */}
                  {getFilteredSubCategories(section).length === 0 && (
                    <div className="text-center py-12">
                      <div className="max-w-md mx-auto">
                        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          No assessments available
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {t("Questionnaire.noQuestions")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </QuestionaireLayout>
  );
};

export default Questionaire;
