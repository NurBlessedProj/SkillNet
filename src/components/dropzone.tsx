"use client";
import React, { FC, useState } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";
import {
  Loader2,
  AlertCircle,
  CheckCircle,
  UploadIcon,
  Download,
  FileType,
} from "lucide-react";
import { toast } from "sonner";
import { ensureSectionExists } from "@/app/[locale]/QuizQuetions/components/SectionMenu";
import { useTranslations } from "next-intl";

interface MyDropzoneProps {
  onFileUploaded: (file: File) => void;
  onUploadSuccess?: () => void; // Add this prop to trigger refresh in parent
}

interface UploadStatus {
  status: "idle" | "processing" | "success" | "error";
  message: string;
}

// Helper function to ensure subcategory exists in the subcategories table
const ensureSubcategoryExists = async (
  subcategoryName: string,
  sectionId: number
): Promise<string | null> => {
  if (!subcategoryName || !subcategoryName.trim() || !sectionId) return null;

  try {
    // Check if subcategory already exists
    const { data: existingSubcategory, error: checkError } = await supabase
      .from("subcategories")
      .select("id, name")
      .eq("name", subcategoryName)
      .eq("section_id", sectionId)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking subcategory:", checkError);
      return null;
    }

    // If subcategory exists, return its ID
    if (existingSubcategory) {
      return existingSubcategory.id;
    }

    // If subcategory doesn't exist, create it
    const { data: newSubcategory, error: insertError } = await supabase
      .from("subcategories")
      .insert({ name: subcategoryName, section_id: sectionId })
      .select("id")
      .single();

    if (insertError) {
      console.error("Error creating subcategory:", insertError);
      return null;
    }

    console.log(
      `Created new subcategory: ${subcategoryName} with ID: ${newSubcategory.id}`
    );
    return newSubcategory.id;
  } catch (error) {
    console.error("Error ensuring subcategory exists:", error);
    return null;
  }
};
// Helper function to parse timing values from various formats
const parseTimingValue = (timingValue: any): number => {
  // Default value if parsing fails
  const defaultTiming = 1;

  // If it's already a number, return it directly without rounding
  if (typeof timingValue === "number") {
    return timingValue; // Keep the exact decimal value
  }

  // Convert to string for parsing
  const timingStr = String(timingValue || "")
    .trim()
    .toLowerCase();

  if (!timingStr) return defaultTiming;

  try {
    // Try to extract numeric part with regex that handles decimals
    // This matches patterns like "0.75", "2.5 min", "1.25 minutes", etc.
    const numericMatch = timingStr.match(/(\d+\.?\d*)/);

    if (numericMatch && numericMatch[1]) {
      // Parse the extracted number and keep the decimal precision
      const parsedValue = parseFloat(numericMatch[1]);

      // Check if the value contains "sec" or "second" to convert to minutes
      if (timingStr.includes("sec") || timingStr.includes("second")) {
        return parsedValue / 60; // Convert seconds to minutes but keep decimals
      }

      // Return the parsed value as is, preserving decimal precision
      return parsedValue;
    }
  } catch (error) {
    console.error("Error parsing timing value:", error);
  }

  return defaultTiming;
};
const MyDropzone: FC<MyDropzoneProps> = ({
  onFileUploaded,
  onUploadSuccess,
}) => {
  const t = useTranslations("dropzone"); // Initialize translation hook with "dropzone" namespace
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: "idle",
    message: "",
  });
  const [downloadFormat, setDownloadFormat] = useState<"xlsx" | "csv">("xlsx");

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploadStatus({
      status: "processing",
      message: t("reading"),
    });

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      let jsonData: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet);

      // Log the data to help with debugging
      console.log("Parsed data:", jsonData);

      setUploadStatus({
        status: "processing",
        message: t("validating"),
      });

      // Define required columns - matching the newQuestionSlider format
      const requiredColumns = [
        "Function",
        "Area",
        "Question",
        "A",
        "B",
        "C",
        "D",
        "Correct_Answer",
        "Timing",
      ];

      // Check if all required columns are present in each row
      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        for (const col of requiredColumns) {
          if (row[col] === undefined || row[col] === null || row[col] === "") {
            throw new Error(
              t("errors.missingData", { row: i + 1, column: col })
            );
          }
        }
      }

      // Process the data
      setUploadStatus({
        status: "processing",
        message: t("processing"),
      });

      // Process the data to match the newQuestionSlider format
      const processedData = jsonData.map((row) => {
        // Extract discipline/function and subcategory
        const discipline = String(row.Function || "");
        const subcategory = String(row.sub_category || "");

        // Parse timing value using the helper function
        const numericTiming = parseTimingValue(row.Timing);

        // Create a new object with all the required fields
        return {
          Function: discipline,
          sub_category: subcategory || `${discipline}_Default`,
          Area: String(row.Area || "").toUpperCase(),
          Question: String(row.Question || "").trim(),
          A: String(row.A || "").trim(),
          B: String(row.B || "").trim(),
          C: String(row.C || "").trim(),
          D: String(row.D || "").trim(),
          Correct_Answer: String(row.Correct_Answer || ""),
          Timing: numericTiming, // Store the properly parsed timing value
        };
      });

      // Get unique disciplines to ensure they exist in the section table
      const uniqueDisciplines = [
        ...new Set(processedData.map((row) => row.Function)),
      ];

      // Track section IDs for subcategory creation
      const sectionIds: Record<string, number> = {};

      // Ensure each discipline exists in the section table
      for (const discipline of uniqueDisciplines) {
        if (discipline.trim()) {
          const sectionId = await ensureSectionExists(discipline);
          if (sectionId) {
            sectionIds[discipline] = sectionId;
          }
        }
      }

      // Get unique subcategories and ensure they exist in the subcategories table
      const subcategoryMap = new Map<
        string,
        { discipline: string; subcategory: string }
      >();

      processedData.forEach((row) => {
        const key = `${row.Function}:${row.sub_category}`;
        if (!subcategoryMap.has(key)) {
          subcategoryMap.set(key, {
            discipline: row.Function,
            subcategory: row.sub_category,
          });
        }
      });

      // Create subcategories in the subcategories table
      setUploadStatus({
        status: "processing",
        message: t("creatingSubcategories"),
      });

      for (const [
        key,
        { discipline, subcategory },
      ] of subcategoryMap.entries()) {
        const sectionId = sectionIds[discipline];
        if (sectionId && subcategory) {
          await ensureSubcategoryExists(subcategory, sectionId);
        }
      }

      console.log("Processed data:", processedData);

      setUploadStatus({
        status: "processing",
        message: t("uploading"),
      });

      // Insert data in smaller batches to avoid payload size limits
      const batchSize = 50;
      let successCount = 0;

      for (let i = 0; i < processedData.length; i += batchSize) {
        const batch = processedData.slice(i, i + batchSize);

        setUploadStatus({
          status: "processing",
          message: t("uploadingBatch", {
            current: Math.floor(i / batchSize) + 1,
            total: Math.ceil(processedData.length / batchSize),
          }),
        });

        const { error } = await supabase.from("questions").insert(batch);

        if (error) {
          console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
          throw new Error(
            t("errors.batchUpload", {
              batch: i / batchSize + 1,
              message: error.message,
            })
          );
        }

        successCount += batch.length;
      }

      setUploadStatus({
        status: "success",
        message: t("success", { count: successCount }),
      });

      onFileUploaded(file);

      // Call the onUploadSuccess callback to refresh the parent component
      if (onUploadSuccess) {
        onUploadSuccess();
      }

      // Show success toast
      toast.success(t("toast.success", { count: successCount }));
    } catch (err: any) {
      console.error("Upload error:", err);
      setUploadStatus({
        status: "error",
        message: err.message || t("errors.general"),
      });

      // Show error toast
      toast.error(err.message || t("toast.error"));
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "text/csv": [".csv"],
    },
    multiple: false,
    disabled: uploadStatus.status === "processing",
  });

  // Create sample data with exact structure matching the newQuestionSlider format
  // Keep the template questions in English
  const getSampleData = () => {
    return [
      {
        Function: "Finance",
        sub_category: "Finance_Beginner",
        Area: "AP",
        Question: "What is the primary purpose of accounts payable?",
        A: "To track company assets",
        B: "To manage payments to vendors and suppliers",
        C: "To record customer payments",
        D: "To calculate employee salaries",
        Correct_Answer: "B",
        Timing: 2, // Numeric only for the template
      },
      {
        Function: "Finance",
        sub_category: "Finance_Advanced",
        Area: "CASH FLOW",
        Question:
          "Which of the following is NOT part of a cash flow statement?",
        A: "Operating activities",
        B: "Investing activities",
        C: "Financing activities",
        D: "Marketing activities",
        Correct_Answer: "D",
        Timing: 3, // Numeric only for the template
      },
      {
        Function: "HR",
        sub_category: "HR_beginner",
        Area: "RECRUITMENT",
        Question: "What is the best practice for conducting job interviews?",
        A: "Ask only about personal life",
        B: "Make quick decisions based on appearance",
        C: "Use structured questions for all candidates",
        D: "Ignore resume information",
        Correct_Answer: "C",
        Timing: 2, // Numeric only for the template
      },
      {
        Function: "HR",
        sub_category: "HR_advanced",
        Area: "PERFORMANCE",
        Question:
          "How often should performance reviews typically be conducted?",
        A: "Only when problems arise",
        B: "Annually or semi-annually",
        C: "Every 5 years",
        D: "Daily",
        Correct_Answer: "B",
        Timing: 2, // Numeric only for the template
      },
    ];
  };

  const downloadTemplate = (format: "xlsx" | "csv") => {
    const sampleData = getSampleData();
    const filename = `${t("templateFilename")}.${format}`;

    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");

    if (format === "xlsx") {
      // Generate and download as XLSX
      XLSX.writeFile(workbook, filename);
    } else {
      // Generate and download as CSV
      const csvContent = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getStatusDisplay = () => {
    switch (uploadStatus.status) {
      case "processing":
        return (
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {uploadStatus.message}
            </p>
          </div>
        );
      case "success":
        return (
          <div className="flex flex-col items-center space-y-3">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {uploadStatus.message}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setUploadStatus({ status: "idle", message: "" });
              }}
              className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {t("buttons.uploadMore")}
            </button>
          </div>
        );
      case "error":
        return (
          <div className="flex flex-col items-center space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-sm text-red-600 dark:text-red-400 max-w-md text-center">
              {uploadStatus.message}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setUploadStatus({ status: "idle", message: "" });
              }}
              className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {t("buttons.tryAgain")}
            </button>
          </div>
        );
      default:
        return (
          <div className="text-center">
            <UploadIcon size={40} className="w-fit mx-auto text-emerald-500" />
            <p className="text-emerald-600 dark:text-emerald-400">
              {t("uploadPrompt")}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              {isDragActive ? t("dropHere") : t("dragAndDrop")}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="w-full mt-5">
      <div
        {...getRootProps()}
        className={`
          w-full border-2 border-dashed rounded-lg p-8 transition-colors
          ${
            isDragActive
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
              : "border-gray-300 dark:border-gray-600"
          }
          ${
            uploadStatus.status === "processing"
              ? "cursor-not-allowed"
              : "cursor-pointer"
          }
        `}
      >
        <input {...getInputProps()} />
        {getStatusDisplay()}
      </div>

      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("requiredFormat")}
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadTemplate("xlsx");
              }}
              className="flex items-center text-xs bg-emerald-600 text-white px-3 py-1 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-1" />
              XLSX
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadTemplate("csv");
              }}
              className="flex items-center text-xs bg-emerald-600 text-white px-3 py-1 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-1" />
              CSV
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
          <div>
            <strong>Function:</strong> {t("format.function")}
          </div>
          <div>
            <strong>sub_category:</strong> {t("format.subcategory")}
          </div>
          <div>
            <strong>Area:</strong> {t("format.area")}
          </div>
          <div>
            <strong>Question:</strong> {t("format.question")}
          </div>
          <div>
            <strong>A, B, C, D:</strong> {t("format.options")}
          </div>
          <div>
            <strong>Correct_Answer:</strong> {t("format.correctAnswer")}
          </div>
          <div>
            <strong>Timing:</strong> {t("format.timing")}
          </div>
        </div>
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("notes.templateFormat")}
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {t("notes.templateDescription")}
          </p>
          <ul className="list-disc pl-5 mt-1 text-xs text-gray-600 dark:text-gray-400">
            <li>
              <strong>Function:</strong> {t("notes.functionDescription")}
            </li>
            <li>
              <strong>sub_category:</strong> {t("notes.subcategoryDescription")}
            </li>
            <li>
              <strong>Area:</strong> {t("notes.areaDescription")}
            </li>
            <li>
              <strong>Question:</strong> {t("notes.questionDescription")}
            </li>
            <li>
              <strong>A, B, C, D:</strong> {t("notes.optionsDescription")}
            </li>
            <li>
              <strong>Correct_Answer:</strong>{" "}
              {t("notes.correctAnswerDescription")}
            </li>
            <li>
              <strong>Timing:</strong> {t("notes.timingDescription")}
            </li>
          </ul>
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-semibold">
            {t("notes.important")}: {t("notes.timingWarning")}
          </p>
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            <strong>{t("notes.note")}:</strong> {t("notes.downloadHelp")}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MyDropzone;
