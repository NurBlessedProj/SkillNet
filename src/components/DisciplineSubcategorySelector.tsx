"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { ensureSectionExists } from "@/app/[locale]/QuizQuetions/components/SectionMenu";
import Select from "@/components/select";

interface DisciplineSubcategorySelectorProps {
  selectedDiscipline: string;
  setSelectedDiscipline: (discipline: string) => void;
  selectedSubcategory: string;
  setSelectedSubcategory: (subcategory: string) => void;
  disciplines: Array<{ label: string; value: string }>;
}

const DisciplineSubcategorySelector: React.FC<
  DisciplineSubcategorySelectorProps
> = ({
  selectedDiscipline,
  setSelectedDiscipline,
  selectedSubcategory,
  setSelectedSubcategory,
  disciplines,
}) => {
  const t = useTranslations("Quiz");
  const [subcategories, setSubcategories] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [isAddingSubcategory, setIsAddingSubcategory] = useState(false);
  const [newSubcategoryValue, setNewSubcategoryValue] = useState("");
  const [subCategoryLoading, setSubCategoryLoading] = useState(false);

  // Fetch subcategories when discipline changes
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!selectedDiscipline) {
        setSubcategories([]);
        return;
      }

      setLoadingSubcategories(true);
      try {
        // First try to get the section ID
        const { data: sectionData, error: sectionError } = await supabase
          .from("section")
          .select("id")
          .eq("name", selectedDiscipline)
          .single();

        if (sectionError) {
          console.error("Error fetching section ID:", sectionError);
          throw sectionError;
        }

        const sectionId = sectionData?.id;

        // Try to fetch from subcategories table first
        const { data: subcatData, error: subcatError } = await supabase
          .from("subcategories")
          .select("*")
          .eq("section_id", sectionId)
          .order("name");

        if (subcatError) {
          console.log(
            "Error or no subcategories table, falling back to questions table"
          );

          // Fallback to questions table
          const { data: legacyData, error: legacyError } = await supabase
            .from("questions")
            .select("sub_category")
            .eq("Function", selectedDiscipline)
            .not("sub_category", "is", null);

          if (legacyError) throw legacyError;

          if (legacyData) {
            // Get unique subcategories
            const uniqueSubcategories = [
              ...new Set(legacyData.map((item) => item.sub_category)),
            ].filter(Boolean); // Filter out any null or empty values

            const formattedOptions = uniqueSubcategories.map((subcat) => ({
              label: subcat,
              value: subcat,
            }));

            // Add option to create a new subcategory
            formattedOptions.unshift({
              label: t("NewQuestion.createNewSubcategory"),
              value: "new",
            });

            setSubcategories(formattedOptions);
          }
        } else {
          // We got data from subcategories table
          const formattedOptions = subcatData.map((item) => ({
            label: item.name,
            value: item.name,
          }));

          // Add option to create a new subcategory
          formattedOptions.unshift({
            label: t("NewQuestion.createNewSubcategory"),
            value: "new",
          });

          setSubcategories(formattedOptions);
        }
      } catch (err) {
        console.error("Error fetching subcategories:", err);
        // Reset to empty array with just the "new" option
        setSubcategories([
          {
            label: t("NewQuestion.createNewSubcategory"),
            value: "new",
          },
        ]);
      } finally {
        setLoadingSubcategories(false);
      }
    };

    fetchSubcategories();
    // Reset subcategory selection when discipline changes
    setSelectedSubcategory("");
    setIsAddingSubcategory(false);
  }, [selectedDiscipline, t]);

  // Function to ensure subcategory table exists
  const ensureSubcategoryTable = async () => {
    try {
      // Try to create the subcategories table if it doesn't exist
      try {
        await supabase.rpc("create_subcategories_if_not_exists");
      } catch {
        console.log(
          "RPC function not available, table might already exist or will be created by Supabase"
        );
      }
      return true;
    } catch (error) {
      console.error("Error ensuring subcategory table exists:", error);
      return false;
    }
  };

  // Handle subcategory selection
  const handleSubcategoryChange = (value: string) => {
    if (value === "new") {
      setIsAddingSubcategory(true);
      setSelectedSubcategory("");
    } else {
      setIsAddingSubcategory(false);
      setSelectedSubcategory(value);
    }
  };

  // Add a new subcategory
  const handleAddSubcategory = async () => {
    if (!selectedDiscipline) {
      toast.error(t("NewQuestion.errors.selectDisciplineFirst"));
      return;
    }

    if (!newSubcategoryValue.trim()) {
      toast.error(t("NewQuestion.errors.emptySubcategoryName"));
      return;
    }

    // Check if subcategory already exists
    if (
      subcategories.some(
        (subcat) =>
          subcat.value === newSubcategoryValue && subcat.value !== "new"
      )
    ) {
      toast.error(t("NewQuestion.errors.subcategoryExists"));
      return;
    }

    setSubCategoryLoading(true);
    try {
      // Get the section ID
      const { data: sectionData, error: sectionError } = await supabase
        .from("section")
        .select("id")
        .eq("name", selectedDiscipline)
        .single();

      if (sectionError) {
        // If section doesn't exist, create it
        const sectionId = await ensureSectionExists(selectedDiscipline);
        if (!sectionId) {
          throw new Error("Failed to create section");
        }
      }

      const sectionId =
        sectionData?.id || (await ensureSectionExists(selectedDiscipline));

      // Ensure the subcategories table exists
      await ensureSubcategoryTable();

      // Insert the new subcategory
      const { data, error } = await supabase
        .from("subcategories")
        .insert({
          name: newSubcategoryValue,
          section_id: sectionId,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      if (data) {
        // Add the new subcategory to the list
        setSubcategories((prev) => [
          { label: t("NewQuestion.createNewSubcategory"), value: "new" },
          ...prev.filter((item) => item.value !== "new"),
          { label: data.name, value: data.name },
        ]);

        // Select the newly created subcategory
        setSelectedSubcategory(data.name);
        setIsAddingSubcategory(false);
      }

      setNewSubcategoryValue("");
      toast.success(t("NewQuestion.subcategoryAdded"));
    } catch (err: any) {
      console.error("Error adding subcategory:", err);
      toast.error(t("NewQuestion.errors.addSubcategoryFailed"));
    } finally {
      setSubCategoryLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Discipline Selector */}
      <div>
        <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {t("NewQuestion.discipline")}
        </h6>
        <Select
          options={disciplines}
          selectedValue={selectedDiscipline}
          onChange={setSelectedDiscipline}
          bg=""
          placeholder={t("NewQuestion.placeholders.discipline")}
        />
      </div>

      {/* Subcategory Selector */}
      <div>
        <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {t("NewQuestion.subcategory")}
        </h6>

        {selectedDiscipline ? (
          <>
            {/* Show dropdown for subcategory selection */}
            <Select
              options={subcategories}
              selectedValue={isAddingSubcategory ? "new" : selectedSubcategory}
              onChange={handleSubcategoryChange}
              bg=""
              placeholder={t("NewQuestion.placeholders.subcategory")}
              disabled={loadingSubcategories}
            />

            {/* Show input field for new subcategory */}
            {isAddingSubcategory && (
              <div className="mt-2 flex">
                <input
                  type="text"
                  value={newSubcategoryValue}
                  onChange={(e) => setNewSubcategoryValue(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                  placeholder={t("NewQuestion.placeholders.newSubcategory")}
                  disabled={subCategoryLoading}
                />
                <button
                  onClick={handleAddSubcategory}
                  disabled={subCategoryLoading || !newSubcategoryValue.trim()}
                  className="ml-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {subCategoryLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    t("NewQuestion.add")
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-gray-500 dark:text-gray-400 italic">
            {t("NewQuestion.selectDisciplineFirst")}
          </div>
        )}
      </div>
    </div>
  );
};

export default DisciplineSubcategorySelector;
