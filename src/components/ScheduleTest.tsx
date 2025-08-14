"use client";

import React, { useState, useEffect, useContext } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ContextData } from "@/components/context";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  CalendarIcon,
  ChevronLeft,
  Clock,
  PlayCircle,
  Target,
  Loader2,
  CheckCircle,
  AlertCircle,
  CalendarDays,
  Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useLocale, useTranslations } from "next-intl";
import LanguageSelector from "./LanguageSelector";

// Helper function to get a user-friendly display name for a subcategory
const getSubCategoryDisplayName = (subCategory: string): string => {
  if (!subCategory) return "Default";

  // Handle Finance Accounting patterns
  if (subCategory.includes("Fin Acc Level")) {
    const levelMatch = subCategory.match(/Level(\d+)/);
    const langMatch = subCategory.match(/(En|Fr)$/);
    const level = levelMatch ? levelMatch[1] : "";
    const lang = langMatch ? langMatch[1] : "";

    return `Level ${level} ${lang === "En" ? "English" : "French"}`;
  }

  // Handle other patterns
  let displayName = subCategory;
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

// Helper function to map subcategory to difficulty level
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

const Schedule = () => {
  const t = useTranslations();
  const router = useRouter();
  const context = useContext(ContextData);
  const { success, error: showError } = useToast();

  // State for selected date and time
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState<string>("now");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // State to store selected section and subcategory
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>("");
  const [user, setUser] = useState<any>(null);

  const currentLocale = useLocale();
  const pathname = usePathname();

  // Debug logging to help identify issues
  useEffect(() => {
    console.log("Context data:", context?.data);
    console.log("Context subCategories:", context?.subCategories);
    console.log(
      "localStorage selectedSection:",
      localStorage.getItem("selectedSection")
    );
    console.log(
      "localStorage subCategories:",
      localStorage.getItem("subCategories")
    );
  }, [context]);

  // Check for user authentication and load user data
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError || !sessionData?.session?.user) {
          showError(t("Schedule.errors.loginRequired"));
          router.push("/login");
          return;
        }

        setUser(sessionData.session.user);

        // Load user profile data to get stored preferences
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("section, sub_category")
          .eq("email", sessionData.session.user.email)
          .single();

        if (!profileError && profileData) {
          if (profileData.section) {
            setSelectedSection(profileData.section);
          }
          if (profileData.sub_category) {
            setSelectedSubCategory(profileData.sub_category);
          }
        }
      } catch (error) {
        console.error("Auth check error:", error);
        showError(t("Schedule.errors.authError"));
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, t]);

  // Load section and subcategory from context or localStorage
  useEffect(() => {
    if (isLoading) return;

    let sectionFound = false;
    let subCategoryFound = false;

    // First try context (most recent, from questionnaire)
    if (context?.data) {
      setSelectedSection(context.data);
      sectionFound = true;

      // Get subcategories from context if available
      if (context.subCategories && context.subCategories.length > 0) {
        setSelectedSubCategory(context.subCategories[0]);
        subCategoryFound = true;
        console.log(
          "Using subcategory from context:",
          context.subCategories[0]
        );
      }
    }

    // Then try localStorage if needed
    if (!sectionFound) {
      const storedSection = localStorage.getItem("selectedSection");
      if (storedSection) {
        setSelectedSection(storedSection);
        sectionFound = true;
      }
    }

    if (!subCategoryFound) {
      const storedSubCategories = localStorage.getItem("subCategories");
      if (storedSubCategories) {
        try {
          const subCategories = JSON.parse(storedSubCategories);
          if (subCategories && subCategories.length > 0) {
            setSelectedSubCategory(subCategories[0]);
            subCategoryFound = true;
            console.log(
              "Using subcategory from localStorage:",
              subCategories[0]
            );
          }
        } catch (e) {
          console.error("Error parsing stored subcategories", e);
        }
      }
    }

    // If no section found, redirect to questionnaire
    if (!sectionFound) {
      showError(t("Schedule.errors.selectSubject"));
      router.push("/questionaire");
    }
  }, [context, isLoading, router, t]);

  // Check if user has terminated assessments
  useEffect(() => {
    const checkTerminatedAssessments = async () => {
      if (!user?.email || !selectedSection) return;

      try {
        const { data, error } = await supabase
          .from("answers")
          .select("metadata")
          .eq("email", user.email)
          .eq("discipline", selectedSection)
          .order("created_at", { ascending: false })
          .limit(1);

        if (error) {
          console.error("Error checking assessment history:", error);
          return;
        }

        if (data && data.length > 0) {
          try {
            const metadata = JSON.parse(data[0].metadata || "{}");
            if (metadata.terminated) {
              showError(t("Schedule.errors.terminated"));
              setTimeout(() => router.push("/test"), 2000);
            }
          } catch (e) {
            console.error("Error parsing metadata", e);
          }
        }
      } catch (error) {
        console.error("Error checking terminated assessments:", error);
      }
    };

    checkTerminatedAssessments();
  }, [user, selectedSection, router, t]);

  const handleGoBack = () => {
    router.push("/questionaire");
  };

  const handleStartTest = async () => {
    try {
      setIsProcessing(true);

      if (!selectedSection) {
        showError(t("Schedule.errors.selectSubject"));
        router.push("/questionaire");
        return;
      }

      // For scheduling in the future
      if (time !== "now") {
        // Store the schedule in database
        if (user?.email) {
          const { error } = await supabase.from("test_schedules").insert({
            user_email: user.email,
            section: selectedSection,
            sub_category: selectedSubCategory,
            scheduled_time: new Date(
              date?.getFullYear() || new Date().getFullYear(),
              date?.getMonth() || new Date().getMonth(),
              date?.getDate() || new Date().getDate(),
              parseInt(time.split(":")[0]),
              parseInt(time.split(":")[1] || "0")
            ).toISOString(),
            status: "scheduled",
          });

          if (error) {
            console.error("Error scheduling test:", error);
            showError(
              t("Schedule.errors.scheduleFailed", { error: error.message })
            );
            return;
          }
        }

        // Also store in localStorage as backup
        localStorage.setItem(
          "scheduledDate",
          date ? date.toISOString() : new Date().toISOString()
        );
        localStorage.setItem("scheduledTime", time);

        success(t("Schedule.success.scheduled"));

        // Return to test dashboard after scheduling
        setTimeout(() => router.push("/test"), 1500);
        return;
      }

      // For starting now - save the selected section and subcategory
      localStorage.setItem("selectedSection", selectedSection);
      localStorage.setItem(
        "subCategories",
        JSON.stringify([selectedSubCategory])
      );

      // For backward compatibility, also store difficulty level
      const difficultyLevel = mapSubCategoryToDifficulty(selectedSubCategory);
      localStorage.setItem("difficultyLevel", difficultyLevel);

      // Also update context if available
      if (context) {
        context.setData(selectedSection);
        if (typeof context.setSubCategories === "function") {
          context.setSubCategories([selectedSubCategory]);
        }
        // For backward compatibility
        if (typeof context.setDifficultyLevel === "function") {
          context.setDifficultyLevel(difficultyLevel);
        }
      }

      // Update user profile with selected section and subcategory
      if (user?.email) {
        await supabase.from("profiles").upsert({
          email: user.email,
          section: selectedSection,
          sub_category: selectedSubCategory,
          updated_at: new Date().toISOString(),
        });
      }

      // Wait a moment before redirecting
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to questions page
      router.push("/questions");
    } catch (error) {
      console.error("Error starting test:", error);
      showError(t("Schedule.errors.startFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  const getTimeOptions = () => {
    const options = [{ value: "now", label: t("Schedule.timeOptions.now") }];

    // Add time options in 30-minute increments
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute of [0, 30]) {
        const hourFormatted = hour.toString().padStart(2, "0");
        const minuteFormatted = minute.toString().padStart(2, "0");
        const timeValue = `${hourFormatted}:${minuteFormatted}`;
        options.push({ value: timeValue, label: `${timeValue}` });
      }
    }

    return options;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-200 dark:border-emerald-800 border-t-emerald-600 dark:border-t-emerald-400 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-emerald-400 dark:border-t-emerald-300 rounded-full animate-spin animate-delay-150 mx-auto"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("Schedule.loading")}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Preparing your assessment schedule...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Button
              variant="ghost"
              onClick={handleGoBack}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t("Schedule.backButton")}
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
                {t("Schedule.title")}
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-sm sm:text-base">
              {selectedSection
                ? t("Schedule.selectedAssessment", {
                    section: selectedSection,
                  })
                : t("Schedule.selectTime")}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Assessment Details & Options */}
          <div className="space-y-6">
            {/* Assessment Details Card */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                    <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Assessment Details
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Review your selected assessment and difficulty level
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedSection || "No section selected"}
                        </p>
                        {selectedSubCategory && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedSubCategory}
                          </p>
                        )}
                      </div>
                    </div>
                    {selectedSubCategory && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${getDifficultyColor(
                          selectedSubCategory
                        )}`}
                      >
                        {mapSubCategoryToDifficulty(selectedSubCategory)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Options Card */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                    <Timer className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    Schedule Options
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Choose when you'd like to take your assessment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("Schedule.fields.selectOption")}
                  </label>
                  <Select value={time} onValueChange={setTime}>
                    <SelectTrigger className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                      <SelectValue
                        placeholder={t("Schedule.placeholders.selectOption")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="now">Take test now</SelectItem>
                      <SelectItem value="schedule">
                        Schedule for later
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {time === "now" ? (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                        <PlayCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-800 dark:text-green-300 text-sm">
                          {t("Schedule.startNow.title")}
                        </h4>
                        <p className="text-green-700 dark:text-green-400 text-sm mt-1">
                          {t("Schedule.startNow.description")}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Select Time
                      </label>
                      <Select
                        value={time === "schedule" ? "09:00" : time}
                        onValueChange={setTime}
                        disabled={time === "now"}
                      >
                        <SelectTrigger className="w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                          <SelectValue placeholder="Select a time" />
                        </SelectTrigger>
                        <SelectContent>
                          {getTimeOptions()
                            .slice(1)
                            .map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                          <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-blue-800 dark:text-blue-300 text-sm">
                            {t("Schedule.scheduleLater.title")}
                          </h4>
                          <p className="text-blue-700 dark:text-blue-400 text-sm mt-1">
                            {date ? format(date, "MMMM d, yyyy") : ""} at{" "}
                            {time === "schedule" ? "09:00" : time}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Calendar */}
          <div className="space-y-6">
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                    <CalendarDays className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t("Schedule.fields.selectDate")}
                  </CardTitle>
                </div>
                <CardDescription className="text-gray-600 dark:text-gray-300">
                  Choose the date for your assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date() || time === "now"}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action Button */}
            <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <CardContent className="pt-6">
                <Button
                  onClick={handleStartTest}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 h-12 text-base font-medium"
                  disabled={isProcessing || !selectedSection}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {t("Schedule.buttons.processing")}
                    </>
                  ) : time === "now" ? (
                    <>
                      <PlayCircle className="h-5 w-5 mr-2" />
                      Start Test Now
                    </>
                  ) : (
                    <>
                      <CalendarIcon className="h-5 w-5 mr-2" />
                      Schedule For Later
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
