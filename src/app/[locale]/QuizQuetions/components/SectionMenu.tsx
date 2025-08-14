// components/SectionMenu.tsx
"use client";
import React, { useState, useRef, useEffect, useContext } from "react";
import {
  MoreVertical,
  Trash2,
  Edit,
  Loader2,
  ToggleLeft,
  ToggleRight,
  FileText,
  ChevronDown,
  ChevronRight,
  Plus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import DeleteSectionModal from "./DeletSectionModal";
import AddSubcategoryModal from "./AddSubcategoryModal"; // Import the new modal
import { toast } from "sonner";
import { ContextData } from "@/components/context";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

interface SectionMenuProps {
  section: {
    id: number;
    name: string;
    is_active?: boolean;
  };
  onDelete: () => void;
  onUpdate: (newName: string) => void;
  onToggleActive?: (sectionId: number, isActive: boolean) => void;
}

interface Subcategory {
  id: string;
  name: string;
  section_id: number;
  created_at?: string;
}

// Utility function to ensure a section exists - can be used by other components
export const ensureSectionExists = async (
  sectionName: string
): Promise<number | null> => {
  if (!sectionName || !sectionName.trim()) return null;

  try {
    // Check if section already exists
    const { data: existingSection, error: checkError } = await supabase
      .from("section")
      .select("id, name")
      .eq("name", sectionName)
      .maybeSingle();

    if (checkError) throw checkError;

    // If section exists, return its ID
    if (existingSection) {
      return existingSection.id;
    }

    // If section doesn't exist, create it
    const { data: newSection, error: insertError } = await supabase
      .from("section")
      .insert({ name: sectionName })
      .select("id")
      .single();

    if (insertError) throw insertError;

    console.log(
      `Created new section: ${sectionName} with ID: ${newSection.id}`
    );
    return newSection.id;
  } catch (error) {
    console.error("Error ensuring section exists:", error);
    return null;
  }
};

const SectionMenu: React.FC<SectionMenuProps> = ({
  section,
  onDelete,
  onUpdate,
  onToggleActive,
}) => {
  const t = useTranslations(); // Initialize the translation hook
  const router = useRouter(); // Initialize router for page refresh
  const context = useContext(ContextData);

  if (!context) {
    throw new Error("SectionMenu must be used within a DataProvider");
  }

  const {
    selectedDiscipline,
    setSelectedDiscipline,
    selectedSubcategory,
    setSelectedSubcategory,
  } = context;

  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(section.name);
  const [isLoading, setIsLoading] = useState(false);
  const [isActive, setIsActive] = useState(section.is_active !== false); // Default to true if undefined
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubcategoriesExpanded, setIsSubcategoriesExpanded] = useState(false);
  const [isAddSubcategoryModalOpen, setIsAddSubcategoryModalOpen] =
    useState(false); // New state for modal

  // New state variables for subcategory editing
  const [editingSubcategory, setEditingSubcategory] = useState<string | null>(
    null
  );
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [subCategoryLoading, setSubCategoryLoading] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const subcategoryInputRef = useRef<HTMLInputElement>(null);

  // Check if this section is currently selected
  const isSelected = selectedDiscipline === section.name;

  // Auto-expand subcategories when section is selected
  useEffect(() => {
    if (isSelected) {
      setIsSubcategoriesExpanded(true);
    }
  }, [isSelected]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsEditing(false);
        setNewName(section.name); // Reset to original name when clicking outside
        setEditingSubcategory(null); // Reset subcategory editing
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [section.name]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Focus subcategory input when editing starts
  useEffect(() => {
    if (editingSubcategory && subcategoryInputRef.current) {
      subcategoryInputRef.current.focus();
      subcategoryInputRef.current.select();
    }
  }, [editingSubcategory]);

  // Update isActive state when section prop changes
  useEffect(() => {
    setIsActive(section.is_active !== false);
  }, [section.is_active]);

  // Fetch subcategories on component mount
  useEffect(() => {
    fetchSubcategories();
  }, []);

  const fetchSubcategories = async () => {
    setLoadingSubcategories(true);
    try {
      // First try to fetch subcategories directly
      const { data, error } = await supabase
        .from("subcategories")
        .select("*")
        .eq("section_id", section.id)
        .order("name");
      if (error) {
        console.log("Error fetching subcategories:", error);
        return { data: null, error };
      }

      // If successful, use the data
      if (!error && data) {
        setSubcategories(data);
        return;
      }

      // If there was an error (table doesn't exist or type mismatch), try legacy approach
      console.log("Falling back to legacy subcategories from questions table");

      // Get subcategories from questions table as fallback
      const { data: legacyData, error: legacyError } = await supabase
        .from("questions")
        .select("sub_category")
        .eq("Function", section.name)
        .not("sub_category", "is", null);

      if (!legacyError && legacyData) {
        // Convert legacy format to new format
        const uniqueSubcategories = [
          ...new Set(legacyData.map((item) => item.sub_category)),
        ]
          .filter(Boolean)
          .map((name) => ({
            id: `legacy-${name}`,
            name: name,
            section_id: section.id,
          }));

        setSubcategories(uniqueSubcategories);
      } else {
        setSubcategories([]);
      }
    } catch (err) {
      console.error("Error fetching subcategories:", err);
      // Instead of showing an error toast, just set empty subcategories
      // This provides a better user experience since the error is likely due to table structure
      setSubcategories([]);
    } finally {
      setLoadingSubcategories(false);
    }
  };

  const handleSubcategoryClick = (subcategory: Subcategory) => {
    setSelectedDiscipline(section.name);
    setSelectedSubcategory(subcategory.name);
  };

  const handleUpdate = async () => {
    if (!newName.trim()) {
      alert(t("Quiz.sectionMenu.errors.emptyName"));
      return;
    }

    if (newName === section.name) {
      setIsEditing(false);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      // Start a transaction to update both tables
      const { data: existingSection, error: checkError } = await supabase
        .from("section")
        .select("name")
        .eq("name", newName)
        .single();

      if (existingSection) {
        alert(t("Quiz.sectionMenu.errors.nameExists"));
        return;
      }

      // Update the section table
      const { error: sectionError } = await supabase
        .from("section")
        .update({ name: newName })
        .eq("id", section.id);

      if (sectionError) throw sectionError;

      // Update the questions table where Function matches the old section name
      const { error: questionsError } = await supabase
        .from("questions")
        .update({ Function: newName })
        .eq("Function", section.name);

      if (questionsError) throw questionsError;

      // Update selected discipline if it was the one being edited
      if (selectedDiscipline === section.name) {
        setSelectedDiscipline(newName);
      }

      // Call the parent handler to update UI
      onUpdate(newName);

      // Show success toast
      toast.success(t("Quiz.sectionMenu.sectionUpdated", { name: newName }));

      setIsEditing(false);
      setIsOpen(false);

      // Refresh the page to ensure all components reflect the updated data
      // Add a small delay to allow the toast to be visible
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err: any) {
      console.error("Error updating section:", err);
      toast.error(err.message || t("Quiz.sectionMenu.errors.updateFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update subcategory name
  const handleUpdateSubcategory = async (
    subcategory: Subcategory,
    newName: string
  ) => {
    if (!newName.trim()) {
      toast.error(t("Quiz.sectionMenu.errors.emptyName"));
      return;
    }

    if (newName === subcategory.name) {
      setEditingSubcategory(null);
      return;
    }

    setSubCategoryLoading(true);
    try {
      // Check if the subcategory is from the legacy system (stored in questions table)
      if (subcategory.id.startsWith("legacy-")) {
        // Update all questions with this subcategory
        const { error } = await supabase
          .from("questions")
          .update({ sub_category: newName })
          .eq("Function", section.name)
          .eq("sub_category", subcategory.name);

        if (error) throw error;

        // Also create a proper entry in the subcategories table
        await ensureSubcategoryTable();

        const { error: insertError } = await supabase
          .from("subcategories")
          .insert({
            name: newName,
            section_id: section.id,
          });

        if (insertError) throw insertError;
      } else {
        // Update the subcategory in the subcategories table
        const { error } = await supabase
          .from("subcategories")
          .update({ name: newName })
          .eq("id", subcategory.id);

        if (error) throw error;

        // Also update any questions that might be using this subcategory
        const { error: questionsError } = await supabase
          .from("questions")
          .update({ sub_category: newName })
          .eq("Function", section.name)
          .eq("sub_category", subcategory.name);

        if (questionsError) {
          console.warn(
            "Could not update questions with this subcategory:",
            questionsError
          );
        }
      }

      // Update local state
      setSubcategories((prev) =>
        prev.map((subcat) =>
          subcat.id === subcategory.id ? { ...subcat, name: newName } : subcat
        )
      );

      // Update selected subcategory if it was the one being edited
      if (
        selectedSubcategory === subcategory.name &&
        selectedDiscipline === section.name
      ) {
        setSelectedSubcategory(newName);
      }

      toast.success(t("Quiz.sectionMenu.subcategoryUpdated"));
      setEditingSubcategory(null);

      // Refresh the page after a short delay
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err: any) {
      console.error("Error updating subcategory:", err);
      toast.error(t("Quiz.sectionMenu.errors.updateSubcategoryFailed"));
    } finally {
      setSubCategoryLoading(false);
    }
  };

  // Function to ensure subcategory table exists
  const ensureSubcategoryTable = async () => {
    try {
      // Try to create the subcategories table if it doesn't exist
      // This is a simplified approach - in a real app, you'd use migrations
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

  // Function to add a subcategory - now used by the modal
  const handleAddSubcategory = async (newSubcategoryValue: string) => {
    if (!newSubcategoryValue.trim()) {
      toast.error(t("Quiz.sectionMenu.errors.emptyName"));
      return;
    }

    // Check if subcategory already exists
    if (subcategories.some((subcat) => subcat.name === newSubcategoryValue)) {
      toast.error(t("Quiz.sectionMenu.errors.subcategoryExists"));
      return;
    }

    setSubCategoryLoading(true);
    try {
      // Ensure the subcategories table exists
      await ensureSubcategoryTable();

      // Insert the new subcategory
      const { data, error } = await supabase
        .from("subcategories")
        .insert({
          name: newSubcategoryValue,
          section_id: section.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      if (data) {
        setSubcategories((prev) =>
          [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
        );
      }

      // Close the modal
      setIsAddSubcategoryModalOpen(false);

      toast.success(t("Quiz.sectionMenu.subcategoryAdded"));

      // Refresh the page after a short delay
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err: any) {
      console.error("Error adding subcategory:", err);
      toast.error(t("Quiz.sectionMenu.errors.addSubcategoryFailed"));
    } finally {
      setSubCategoryLoading(false);
    }
  };

  // Function to delete a subcategory
  const handleDeleteSubcategory = async (subcategory: Subcategory) => {
    if (!confirm(t("Quiz.sectionMenu.confirmDeleteSubcategory"))) {
      return;
    }

    setSubCategoryLoading(true);
    try {
      // Check if this is a legacy subcategory
      if (subcategory.id.startsWith("legacy-")) {
        // Delete all questions with this subcategory in this section
        const { error } = await supabase
          .from("questions")
          .delete()
          .eq("Function", section.name)
          .eq("sub_category", subcategory.name);

        if (error) throw error;
      } else {
        // Delete from subcategories table
        const { error } = await supabase
          .from("subcategories")
          .delete()
          .eq("id", subcategory.id);

        if (error) throw error;

        // Also delete any questions with this subcategory
        const { error: questionsError } = await supabase
          .from("questions")
          .delete()
          .eq("Function", section.name)
          .eq("sub_category", subcategory.name);

        if (questionsError) {
          console.warn(
            "Could not delete questions with this subcategory:",
            questionsError
          );
        }
      }

      // Update local state
      setSubcategories((prev) =>
        prev.filter((subcat) => subcat.id !== subcategory.id)
      );

      // Reset selected subcategory if it was the one being deleted
      if (
        selectedSubcategory === subcategory.name &&
        selectedDiscipline === section.name
      ) {
        setSelectedSubcategory("");
      }

      toast.success(t("Quiz.sectionMenu.subcategoryDeleted"));

      // Refresh the page after a short delay
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err: any) {
      console.error("Error deleting subcategory:", err);
      toast.error(t("Quiz.sectionMenu.errors.deleteSubcategoryFailed"));
    } finally {
      setSubCategoryLoading(false);
    }
  };

  const handleToggleActive = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const newActiveState = !isActive;

    try {
      const { error } = await supabase
        .from("section")
        .update({ is_active: newActiveState })
        .eq("id", section.id);

      if (error) throw error;

      // Update local state only after successful DB update
      setIsActive(newActiveState);
      setIsOpen(false);

      // Show toast notification near the discipline
      toast(
        newActiveState
          ? t("Quiz.sectionMenu.notifications.nowActive", {
              name: section.name,
            })
          : t("Quiz.sectionMenu.notifications.nowInactive", {
              name: section.name,
            }),
        {
          position: "top-center",
          duration: 3000,
          className: newActiveState
            ? "bg-green-50 border-green-500"
            : "bg-gray-50 border-gray-400",
        }
      );

      // Call the parent handler if provided
      if (onToggleActive) {
        onToggleActive(section.id, newActiveState);
      }

      // Refresh the page after a short delay
      setTimeout(() => {
        router.refresh();
      }, 1000);
    } catch (err: any) {
      console.error("Error toggling section active status:", err);
      toast.error(
        t("Quiz.sectionMenu.errors.updateStatusFailed", { name: section.name })
      );
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleUpdate();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setNewName(section.name);
    }
  };

  // Handle key press for subcategory editing
  const handleSubcategoryKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement>,
    subcategory: Subcategory
  ) => {
    if (e.key === "Enter") {
      handleUpdateSubcategory(subcategory, newSubcategoryName);
    } else if (e.key === "Escape") {
      setEditingSubcategory(null);
      setNewSubcategoryName("");
    }
  };

  const handleSectionClick = () => {
    setSelectedDiscipline(section.name);
    setSelectedSubcategory("");
  };

  const toggleSubcategories = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSubcategoriesExpanded(!isSubcategoriesExpanded);
  };

  const hasSubcategories = subcategories.length > 0;

  return (
    <div className="relative group" ref={menuRef}>
      {/* Main section row with controls */}
      <div
        className={`flex items-center justify-between py-1.5 px-2 rounded-lg transition-colors ${
          isSelected && !selectedSubcategory
            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700"
            : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
        } cursor-pointer`}
        onClick={handleSectionClick}
      >
        <div className="flex items-center flex-grow">
          {hasSubcategories && (
            <button
              onClick={toggleSubcategories}
              className="p-1 mr-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              {isSubcategoriesExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
              )}
            </button>
          )}
          <span
            className={`truncate max-w-[80%] ${
              isSelected
                ? "font-medium text-emerald-600 dark:text-emerald-400"
                : ""
            } ${
              section.is_active === false
                ? "italic text-gray-400 dark:text-gray-500"
                : ""
            }`}
            title={section.name}
          >
            {section.name}
            {section.is_active === false && (
              <span className="text-xs ml-1">
                ({t("Quiz.sectionMenu.inactive")})
              </span>
            )}
          </span>
        </div>

        {/* Right side - action buttons */}
        <div className="flex items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleActive(e);
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-opacity mr-1 opacity-0 group-hover:opacity-100"
            title={
              isActive
                ? t("Quiz.sectionMenu.tooltips.active")
                : t("Quiz.sectionMenu.tooltips.inactive")
            }
          >
            {isActive ? (
              <ToggleRight className="w-4 h-4 text-emerald-500" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Subcategories - Collapsible */}
      <div
        className={`ml-4 pl-2 border-l border-gray-200 dark:border-gray-600 overflow-hidden transition-all duration-300 ease-in-out ${
          isSubcategoriesExpanded ? "max-h-96" : "max-h-0"
        }`}
      >
        {loadingSubcategories ? (
          <div className="py-1 flex items-center pl-2 text-xs text-gray-500">
            <Loader2 className="w-3 h-3 animate-spin mr-2" />
            {t("Quiz.common.loading")}
          </div>
        ) : (
          <>
            {/* Add subcategory button */}
            <div className="py-1 flex items-center pl-2 text-xs">
              <button
                onClick={() => setIsAddSubcategoryModalOpen(true)}
                className="flex items-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                <Plus className="w-3 h-3 mr-1" />
                {t("Quiz.sectionMenu.addSubcategory")}
              </button>
            </div>

            {/* Subcategories list */}
            {subcategories.length > 0 ? (
              <ul className="py-0.5">
                {subcategories.map((subcat) => (
                  <li
                    key={subcat.id}
                    className={`
                      py-1 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 px-2 rounded text-xs group transition-colors
                      ${
                        selectedSubcategory === subcat.name &&
                        selectedDiscipline === section.name
                          ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-700"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      }
                    `}
                  >
                    {editingSubcategory === subcat.id ? (
                      <div className="flex w-full items-center">
                        <input
                          ref={subcategoryInputRef}
                          type="text"
                          value={newSubcategoryName}
                          onChange={(e) =>
                            setNewSubcategoryName(e.target.value)
                          }
                          onKeyDown={(e) =>
                            handleSubcategoryKeyPress(e, subcat)
                          }
                          className="w-full p-1 border border-gray-200 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                          onClick={(e) => e.stopPropagation()}
                          disabled={subCategoryLoading}
                        />
                        <div className="flex ml-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateSubcategory(
                                subcat,
                                newSubcategoryName
                              );
                            }}
                            className="p-1 rounded bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50 transition-colors"
                            disabled={subCategoryLoading}
                          >
                            {subCategoryLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSubcategory(null);
                            }}
                            className="p-1 ml-1 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          className="flex items-center flex-grow"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSubcategoryClick(subcat);
                          }}
                        >
                          <FileText className="w-3 h-3 mr-1.5 opacity-70 flex-shrink-0" />
                          <span className="truncate max-w-[120px]">
                            {subcat.name}
                          </span>
                        </div>
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSubcategory(subcat.id);
                              setNewSubcategoryName(subcat.name);
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                            title={t("Quiz.common.edit")}
                          >
                            <Edit className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSubcategory(subcat);
                            }}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                            title={t("Quiz.common.delete")}
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-1 italic pl-2 text-xs text-gray-500">
                {t("Quiz.sectionMenu.noSubcategories")}
              </div>
            )}
          </>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 border border-gray-200 dark:border-gray-700">
          {isEditing ? (
            <div className="p-2">
              <input
                ref={inputRef}
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleKeyPress}
                className="w-full p-1.5 border border-gray-200 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                onClick={(e) => e.stopPropagation()}
                disabled={isLoading}
                placeholder={t("Quiz.sectionMenu.enterSectionName")}
              />
              <div className="flex justify-end mt-2 gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(false);
                    setNewName(section.name);
                  }}
                  className="px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 transition-colors"
                  disabled={isLoading}
                >
                  {t("Quiz.common.cancel")}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdate();
                  }}
                  className="px-2 py-1 text-sm text-white bg-emerald-500 hover:bg-emerald-600 rounded flex items-center gap-1 disabled:opacity-50 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {t("Quiz.common.saving")}
                    </>
                  ) : (
                    t("Quiz.common.save")
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
              >
                <Edit className="w-4 h-4" />
                {t("Quiz.common.edit")}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  setIsDeleteModalOpen(true);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {t("Quiz.common.delete")}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleActive(e);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
              >
                {isActive ? (
                  <>
                    <ToggleRight className="w-4 h-4" />
                    {t("Quiz.sectionMenu.setInactive")}
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4" />
                    {t("Quiz.sectionMenu.setActive")}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Delete section modal */}
      <DeleteSectionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        section={section}
        onDelete={onDelete}
      />

      {/* Add subcategory modal */}
      <AddSubcategoryModal
        isOpen={isAddSubcategoryModalOpen}
        onClose={() => setIsAddSubcategoryModalOpen(false)}
        onAdd={handleAddSubcategory}
        sectionName={section.name}
        loading={subCategoryLoading}
      />
    </div>
  );
};

export default SectionMenu;
