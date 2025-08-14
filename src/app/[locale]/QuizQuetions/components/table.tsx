"use client";
import { useContext, useState, useEffect, FC } from "react";
import { ContextData } from "@/components/context";
import { useQuestions } from "@/app/apis/questions/useQuestions";
import { Trash2, Edit, Filter, X, Search } from "lucide-react";
import EditQuestionModal from "./EditQuestionModal";
import DeleteQuestionModal from "./DeleteQuestionModal";
import DataGridDemo from "@/components/muitable";
import { useTranslations } from "next-intl"; // Add this import

interface QuizTableProps {
  refreshTrigger: number;
  searchQuery?: string;
  selectedFunction?: string;
  selectedArea?: string;
  selectedSubCategory?: string;
  onClearFilters: () => void;
}

const QuizTable: FC<QuizTableProps> = ({
  refreshTrigger,
  searchQuery = "",
  selectedFunction = "",
  selectedArea = "",
  selectedSubCategory = "",
  onClearFilters,
}) => {
  const t = useTranslations("Quiz"); // Initialize the translation hook
  const context = useContext(ContextData);

  if (!context) {
    throw new Error("QuizTable must be used within a DataProvider");
  }

  const [filteredQuestions, setFilteredQuestions] = useState<any[]>([]);
  const { questions, loading, refetch } = useQuestions(refreshTrigger);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // State for edit modal
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // State for delete modal
  const [questionToDelete, setQuestionToDelete] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Update active filters for display
  useEffect(() => {
    const filters: string[] = [];

    if (selectedFunction)
      filters.push(`${t("QuizTable.filters.discipline")}: ${selectedFunction}`);
    if (selectedSubCategory)
      filters.push(
        `${t("QuizTable.filters.subcategory")}: ${selectedSubCategory}`
      );
    if (selectedArea)
      filters.push(`${t("QuizTable.filters.area")}: ${selectedArea}`);
    if (searchQuery)
      filters.push(`${t("QuizTable.filters.search")}: "${searchQuery}"`);

    setActiveFilters(filters);
  }, [selectedFunction, selectedSubCategory, selectedArea, searchQuery, t]);

  // Filter Questions based on multiple criteria and add unique IDs for DataGrid
  useEffect(() => {
    if (!questions || questions.length === 0) return;

    let filtered = [...questions];

    // Filter by function/discipline from sidebar
    if (selectedFunction && selectedFunction !== "") {
      filtered = filtered.filter(
        (question: any) => question.Function === selectedFunction
      );
    }

    // Filter by area
    if (selectedArea && selectedArea !== "") {
      filtered = filtered.filter(
        (question: any) => question.Area === selectedArea
      );
    }

    // Filter by subcategory
    if (
      selectedSubCategory &&
      selectedSubCategory !== "" &&
      selectedSubCategory !== t("Quiz.filters.allSubcategories")
    ) {
      filtered = filtered.filter(
        (question: any) => question.sub_category === selectedSubCategory
      );
    }

    // Filter by search query
    if (searchQuery && searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (question: any) =>
          (question.Question &&
            question.Question.toLowerCase().includes(query)) ||
          (question.Area && question.Area.toLowerCase().includes(query)) ||
          (question.Function &&
            question.Function.toLowerCase().includes(query)) ||
          (question.sub_category &&
            question.sub_category.toLowerCase().includes(query))
      );
    }

    // Make sure each question has a valid id for DataGrid
    const questionsWithIds = filtered.map((question) => ({
      ...question,
      id:
        question.Serial ||
        question.id ||
        Math.random().toString(36).substr(2, 9),
    }));

    setFilteredQuestions(questionsWithIds);
  }, [
    questions,
    selectedFunction,
    selectedArea,
    selectedSubCategory,
    searchQuery,
    t,
  ]);

  // Function to open delete modal
  const handleOpenDeleteModal = (question: any) => {
    setQuestionToDelete(question);
    setIsDeleteModalOpen(true);
  };

  // Function to handle actual deletion after confirmation
  const handleDeleteConfirm = () => {
    // Remove the deleted question from the filtered list
    setFilteredQuestions((prev) =>
      prev.filter((question) => question.Serial !== questionToDelete.Serial)
    );

    // Also trigger a refetch to keep the main questions list updated
    refetch();
  };

  // Function to handle opening the edit modal with the selected question
  const handleEditQuestion = (question: any) => {
    setSelectedQuestion(question);
    setIsUpdateModalOpen(true);
  };

  // Function to handle question update after editing
  const handleQuestionUpdate = () => {
    setIsUpdateModalOpen(false);
    setSelectedQuestion(null);
    refetch();
  };

  // Function to close the update modal
  const handleCloseUpdateModal = () => {
    setIsUpdateModalOpen(false);
    // Don't clear selectedQuestion immediately to allow for animation
    setTimeout(() => {
      setSelectedQuestion(null);
    }, 500);
  };

  // Columns setup for the MUI DataGrid
  const columns = [
    // {
    //   field: "Serial",
    //   headerName: t("QuizTable.columns.no"),
    //   width: 70,
    //   flex: 0.5,
    //   sortable: true,
    //   renderCell: (params: any) => (
    //     <div className="flex h-full justify-start items-center">
    //       <div className="text-sm">{params.value}</div>
    //     </div>
    //   ),
    // },
    {
      field: "Question",
      headerName: t("QuizTable.columns.questions"),
      width: 250,
      flex: 2,
      sortable: true,
      renderCell: (params: any) => (
        <div
          className="flex items-center h-full space-x-0 truncate"
          style={{ maxWidth: "250px" }}
        >
          <span className="truncate" title={params.value}>
            {params.value}
          </span>
        </div>
      ),
    },
    {
      field: "Area",
      headerName: t("QuizTable.columns.area"),
      width: 120,
      flex: 1,
      sortable: true,
      renderCell: (params: any) => (
        <div
          className="flex items-center h-full space-x-2 truncate"
          style={{ maxWidth: "120px" }}
        >
          <span className="truncate" title={params.value}>
            {params.value}
          </span>
        </div>
      ),
    },
    {
      field: "Function",
      headerName: t("QuizTable.columns.discipline"),
      width: 120,
      flex: 1,
      sortable: true,
      renderCell: (params: any) => (
        <div
          className="flex items-center h-full space-x-2 truncate"
          style={{ maxWidth: "120px" }}
        >
          <span className="truncate" title={params.value}>
            {params.value}
          </span>
        </div>
      ),
    },
    {
      field: "sub_category",
      headerName: t("QuizTable.columns.subcategory"),
      width: 120,
      flex: 1,
      sortable: true,
      renderCell: (params: any) => (
        <div
          className="flex items-center h-full space-x-2 truncate"
          style={{ maxWidth: "120px" }}
        >
          <span className="truncate" title={params.value}>
            {params.value}
          </span>
        </div>
      ),
    },
    {
      field: "Timing",
      headerName: t("QuizTable.columns.responseTime"),
      width: 120,
      flex: 1,
      sortable: true,
      renderCell: (params: any) => {
        // Format the timing value to show decimals and add "min" suffix
        const value =
          typeof params.value === "number"
            ? `${params.value.toFixed(2)} min`
            : params.value;

        return (
          <div className="flex items-center justify-center h-full w-full">
            <span title={value}>{value}</span>
          </div>
        );
      },
    },
    {
      field: "Correct_Answer",
      headerName: t("QuizTable.columns.answer"),
      width: 70,
      flex: 0.5,
      sortable: true,
      renderCell: (params: any) => (
        <div className="flex items-center justify-center h-full w-full">
          <span title={params.value}>{params.value}</span>
        </div>
      ),
    },
    {
      field: "actions",
      headerName: t("QuizTable.columns.actions"),
      width: 100,
      flex: 0.8,
      sortable: false,
      renderCell: (params: any) => (
        <div className="flex items-center h-full gap-2">
          <button
            onClick={() => handleEditQuestion(params.row)}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
            title={t("QuizTable.actions.editQuestion")}
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => handleOpenDeleteModal(params.row)}
            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            title={t("QuizTable.actions.deleteQuestion")}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Active filters display */}
      {activeFilters.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="flex items-center text-gray-600">
            <Filter className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">
              {t("QuizTable.activeFilters")}:
            </span>
          </div>

          {activeFilters.map((filter, index) => (
            <div
              key={index}
              className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-sm flex items-center border border-emerald-200 dark:border-emerald-700"
            >
              {filter}
            </div>
          ))}

          <button
            onClick={onClearFilters}
            className="ml-2 text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 flex items-center transition-colors"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            {t("QuizTable.clearAllFilters")}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {filteredQuestions.length > 0 ? (
          <div className="h-full overflow-auto">
            <style jsx global>{`
              .MuiDataGrid-cell {
                white-space: normal !important;
                padding: 8px !important;
                align-items: center !important;
                border-color: #e5e7eb !important;
              }
              .MuiDataGrid-virtualScroller {
                overflow-y: auto !important;
              }
              .MuiDataGrid-row {
                min-height: 48px !important;
              }
              .MuiDataGrid-row:hover {
                background-color: #f0fdf4 !important;
              }
              .MuiDataGrid-columnHeader {
                background-color: #f9fafb !important;
                font-weight: bold !important;
                border-color: #e5e7eb !important;
              }
              .MuiDataGrid-columnHeaderTitle {
                font-weight: bold !important;
                color: #374151 !important;
              }
              .MuiDataGrid-footerContainer {
                border-color: #e5e7eb !important;
              }
              .MuiDataGrid-footerContainer .MuiTablePagination-root {
                color: #374151 !important;
              }
              .dark .MuiDataGrid-cell {
                border-color: #374151 !important;
                color: #d1d5db !important;
                background-color: #1f2937 !important;
              }
              .dark .MuiDataGrid-row:hover {
                background-color: #374151 !important;
              }
              .dark .MuiDataGrid-columnHeader {
                background-color: #374151 !important;
                border-color: #4b5563 !important;
              }
              .dark .MuiDataGrid-columnHeaderTitle {
                color: #d1d5db !important;
              }
              .dark .MuiDataGrid-footerContainer {
                border-color: #4b5563 !important;
                background-color: #374151 !important;
              }
              .dark .MuiDataGrid-footerContainer .MuiTablePagination-root {
                color: #d1d5db !important;
              }
              .dark .MuiDataGrid-virtualScroller {
                background-color: #1f2937 !important;
              }
              .dark .MuiDataGrid-virtualScrollerRenderZone {
                background-color: #1f2937 !important;
              }
            `}</style>
            <DataGridDemo
              rows={filteredQuestions}
              columns={columns}
              loading={loading}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <Search className="w-12 h-12 mx-auto opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("QuizTable.noQuestionsMatch")}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              {t("QuizTable.tryAdjustingFilters")}
            </p>
            <button
              onClick={onClearFilters}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {t("QuizTable.clearAllFilters")}
            </button>
          </div>
        )}
      </div>

      {/* Edit Question Modal */}
      {selectedQuestion && (
        <EditQuestionModal
          question={selectedQuestion}
          onUpdate={handleQuestionUpdate}
          isOpen={isUpdateModalOpen}
          onClose={handleCloseUpdateModal}
        />
      )}

      {/* Delete Question Modal */}
      {questionToDelete && (
        <DeleteQuestionModal
          question={questionToDelete}
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={handleDeleteConfirm}
        />
      )}
    </div>
  );
};

export default QuizTable;
