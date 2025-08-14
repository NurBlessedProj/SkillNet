"use client";
import Select from "@/components/select";
import React, { useContext, useEffect, useState } from "react";
import QuizTable from "./components/table";
import QuizSlider from "./components/uploadQuetionSlider";
import NewQuestion from "./components/newqUESTIONSlider";
import fetchTableNames from "@/app/apis/getData/getData";
import { fetchSectionData } from "@/app/apis/getData/getSectionData";
import { ContextData } from "@/components/context";
import AddSectionModal from "./components/AddSectionModal";
import { supabase } from "@/lib/supabase";
import SectionMenu from "./components/SectionMenu";
import { Toaster } from "sonner";
import { useTranslations } from "next-intl"; // Add this import
import { RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";

const Quiz = () => {
  const t = useTranslations(); // Initialize the translation hook
  const context = useContext(ContextData);
  const router = useRouter();
  const [tableNames, setTableNames] = useState([]);
  const [sections, setSections] = useState<any[]>([]); // State to store sections data
  const [loading, setLoading] = useState<boolean>(true); // State to handle loading
  const [error, setError] = useState<string | null>(null); // State to handle errors
  const [areaOptions, setAreaOptions] = useState<any[]>([]);
  const [subCategoryOptions, setSubCategoryOptions] = useState<any[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<any>(-1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFunction, setSelectedFunction] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [refreshed, setRefreshed] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState("");

  // Get context values if available
  useEffect(() => {
    if (context) {
      // Sync local state with context when context changes
      if (context.selectedDiscipline !== selectedFunction) {
        setSelectedFunction(context.selectedDiscipline);
        // Find the index of the selected discipline in sections
        const index = sections.findIndex(
          (s) => s.name === context.selectedDiscipline
        );
        if (index !== -1) {
          setSelectedStatus(index);
        }
      }

      if (context.selectedSubcategory !== selectedSubCategory) {
        setSelectedSubCategory(context.selectedSubcategory);
      }
    }
  }, [context?.selectedDiscipline, context?.selectedSubcategory]);

  // Update context when local state changes
  useEffect(() => {
    if (context) {
      context.setSelectedDiscipline(selectedFunction);
      context.setSelectedSubcategory(selectedSubCategory);
    }
  }, [selectedFunction, selectedSubCategory]);

  // Fetch table names
  useEffect(() => {
    const getTableNames = async () => {
      const names: any = await fetchTableNames();
      setTableNames(names);
    };
    getTableNames();
  }, []);

  // Fetch area options
  useEffect(() => {
    const fetchAreaOptions = async () => {
      try {
        let query = supabase
          .from("questions")
          .select("Area")
          .not("Area", "is", null);

        // Filter by selected function if one is selected
        if (selectedFunction) {
          query = query.eq("Function", selectedFunction);
        }

        const { data, error } = await query.order("Area");

        if (error) {
          throw error;
        }

        if (data) {
          // Use Set to get unique values
          const uniqueAreas = [...new Set(data.map((item) => item.Area))];

          const formattedOptions = uniqueAreas.map((area) => ({
            label: area,
            value: area,
          }));

          // Add "All Areas" option
          const allAreasOption = {
            label: t("Quiz.filters.allAreas"),
            value: "",
          };
          setAreaOptions([allAreasOption, ...formattedOptions]);
        }
      } catch (err) {
        console.error("Error fetching area options:", err);
        setError(t("Quiz.errors.fetchAreaOptions"));
      }
    };

    fetchAreaOptions();
  }, [selectedFunction, refreshTrigger, t]); // Refresh when function changes or data is updated

  // Fetch subcategory options based on selected function
  useEffect(() => {
    const fetchSubCategoryOptions = async () => {
      try {
        let query = supabase
          .from("questions")
          .select("sub_category")
          .not("sub_category", "is", null);

        // Filter by selected function if one is selected
        if (selectedFunction) {
          query = query.eq("Function", selectedFunction);
        }

        // Filter by selected area if one is selected
        if (selectedArea) {
          query = query.eq("Area", selectedArea);
        }

        const { data, error } = await query.order("sub_category");

        if (error) {
          throw error;
        }

        if (data) {
          // Use Set to get unique values
          const uniqueSubCategories = [
            ...new Set(data.map((item) => item.sub_category)),
          ];

          const formattedOptions = uniqueSubCategories.map((subCategory) => ({
            label: subCategory,
            value: subCategory,
          }));

          // Add "All Subcategories" option
          const allSubCategoriesOption = {
            label: t("Quiz.filters.allSubcategories"),
            value: "",
          };
          setSubCategoryOptions([allSubCategoriesOption, ...formattedOptions]);
        }
      } catch (err) {
        console.error("Error fetching subcategory options:", err);
        setError(t("Quiz.errors.fetchSubcategoryOptions"));
      }
    };

    fetchSubCategoryOptions();
  }, [selectedFunction, selectedArea, refreshTrigger, t]); // Refresh when function or area changes

  // Fetch section data and handle it
  useEffect(() => {
    const getSectionData = async () => {
      try {
        const data = await fetchSectionData();
        if (data && data.length > 0) {
          setSections(data);
        } else {
          setError(t("Quiz.errors.noSections"));
        }
      } catch (err) {
        setError(t("Quiz.errors.fetchData"));
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    getSectionData();
  }, [refreshTrigger, t]);

  const handleSectionAdded = () => {
    setRefreshTrigger((prev) => prev + 1);
    console.log("refreshed trigger");
  };

  const handleUploadComplete = () => {
    setRefreshTrigger((prev) => prev + 1);
    console.log("refreshed after upload");
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (window.confirm(t("Quiz.confirmations.deleteSection"))) {
      try {
        const { error } = await supabase
          .from("section")
          .delete()
          .eq("id", sectionId);

        if (error) throw error;

        // Refresh the sections list
        setRefreshTrigger((prev) => prev + 1);

        // Reset selection if the deleted section was selected
        if (
          selectedStatus !== -1 &&
          sections[selectedStatus]?.id === sectionId
        ) {
          setSelectedStatus(-1);
          setSelectedFunction("");
        }
      } catch (err: any) {
        console.error("Error deleting section:", err);
        alert(t("Quiz.errors.deleteSection"));
      }
    }
  };

  // Handler for area select change
  const handleAreaChange = (value: string) => {
    setSelectedArea(value);
    setSelectedSubCategory(""); // Reset subcategory when area changes
    console.log("Selected Area:", value);
  };

  // Handler for subcategory select change
  const handleSubCategoryChange = (value: string) => {
    setSelectedSubCategory(value);
    console.log("Selected Subcategory:", value);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedFunction("");
    setSelectedStatus(-1);
    setSelectedArea("");
    setSelectedSubCategory("");
    setSearchQuery("");
    if (context) {
      context.clearFilters();
    }
  };

  const handleRefresh = () => {
    router.refresh();
    setRefreshed(true);
    setTimeout(() => {
      setRefreshed(false);
    }, 1000);
  };
  return (
    <ProtectedRoute allowedRoles={["s_admin"]}>
      <div className="flex pt-5 w-full h-[calc(100vh-80px)] overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Sidebar with disciplines - fixed height with proper scrolling */}
        <div className="w-[220px] min-w-[220px] flex-shrink-0 border-r border-gray-200 dark:border-gray-700 pr-2 flex flex-col bg-white dark:bg-gray-800">
          {/* Fixed header section */}
          <div className="flex-shrink-0 p-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="font-semibold text-gray-900 dark:text-white">
                {t("Quiz.disciplines")}
              </h1>
              <div className="flex gap-3 items-center">
                <RefreshCcw
                  size={18}
                  className={`cursor-pointer text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors ${
                    refreshed && "animate-spin"
                  }`}
                  onClick={handleRefresh}
                />
                <AddSectionModal onSectionAdded={handleSectionAdded} />
              </div>
            </div>
            <div
              className={`py-2.5 px-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                selectedStatus === -1
                  ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-700"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => {
                setSelectedFunction("");
                setSelectedStatus(-1);
                setSelectedArea("");
                setSelectedSubCategory("");
              }}
            >
              {t("Quiz.allDisciplines")}
            </div>
          </div>

          {/* Scrollable disciplines list */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-1">
              {sections.map((section, index: any) => (
                <div key={index + 1} className="group">
                  <SectionMenu
                    section={section}
                    onDelete={() => handleDeleteSection(section.id)}
                    onUpdate={(newName) => {
                      handleSectionAdded(); // This will refresh the section list
                    }}
                    onToggleActive={(sectionId, isActive) => {
                      setSections((prevSections) =>
                        prevSections.map((s) =>
                          s.id === sectionId ? { ...s, is_active: isActive } : s
                        )
                      );
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-hidden flex flex-col px-6 py-4">
          {/* Search and filter controls */}
          <div className="w-full flex items-center py-4 flex-wrap gap-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-4">
            <div className="flex space-x-4 flex-1 max-w-[60%]">
              <div className="w-full">
                <div className="relative rounded-lg shadow-sm">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <i className="ri-search-2-line text-gray-400 dark:text-gray-500"></i>
                  </div>
                  <input
                    id="text"
                    name="text"
                    type="text"
                    placeholder={t("Quiz.searchPlaceholder")}
                    className="py-2.5 outline-none pl-10 w-full border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex w-full">
                <Select
                  options={areaOptions}
                  selectedValue={selectedArea}
                  onChange={handleAreaChange}
                  bg={""}
                  placeholder={t("Quiz.filters.filterByArea")}
                />
              </div>
            </div>
            <div className="flex justify-end items-center space-x-3 ml-auto">
              <QuizSlider onUploadComplete={handleUploadComplete} />
              <NewQuestion
                onQuestionAdded={() => setRefreshTrigger((prev) => prev + 1)}
              />
            </div>
          </div>

          {/* Table area with overflow handling */}
          <div className="flex-1 overflow-hidden">
            <QuizTable
              refreshTrigger={refreshTrigger}
              searchQuery={searchQuery}
              selectedFunction={selectedFunction}
              selectedArea={selectedArea}
              selectedSubCategory={selectedSubCategory}
              onClearFilters={clearAllFilters}
            />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Quiz;
