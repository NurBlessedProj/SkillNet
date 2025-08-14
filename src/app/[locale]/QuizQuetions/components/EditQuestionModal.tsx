"use client";
import React, { useEffect, useState } from "react";
import Select from "@/components/select";
import { supabase } from "@/lib/supabase";
import { fetchSectionData } from "@/app/apis/getData/getSectionData";
import { CheckCircle, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";

interface EditQuestionModalProps {
  question: any;
  onUpdate?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const EditQuestionModal: React.FC<EditQuestionModalProps> = ({
  question,
  onUpdate,
  isOpen,
  onClose,
}) => {
  const t = useTranslations(); // Initialize translation hook
  const [section, setSection] = useState(question.Area || "");
  const [expertLevel, setExpertLevel] = useState(question.Function || "");
  const [subcategory, setSubcategory] = useState(question.sub_category || ""); // Add subcategory state
  const [duration, setDuration] = useState(() => {
    if (typeof question.Timing === "string" && question.Timing) {
      return question.Timing.split(" ")[0] || "02";
    }
    return "02";
  });

  const [unit, setUnit] = useState(() => {
    if (typeof question.Timing === "string" && question.Timing) {
      return question.Timing.split(" ")[1] || "min";
    }
    return "min";
  });
  const [questionText, setQuestionText] = useState(question.Question || "");
  const [answerA, setAnswerA] = useState(question.A || "");
  const [answerB, setAnswerB] = useState(question.B || "");
  const [answerC, setAnswerC] = useState(question.C || "");
  const [answerD, setAnswerD] = useState(question.D || "");
  const [correctAnswer, setCorrectAnswer] = useState(
    question.Correct_Answer || ""
  );
  const [sections, setSections] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  // Track if the component has mounted
  const [mounted, setMounted] = useState(false);
  // Track actual animation state
  const [animatingIn, setAnimatingIn] = useState(false);

  // Handle initial mount
  useEffect(() => {
    setMounted(true);
    // Small delay to ensure CSS transitions work properly
    const timer = setTimeout(() => {
      setAnimatingIn(isOpen);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Handle open/close state changes
  useEffect(() => {
    if (mounted) {
      setAnimatingIn(isOpen);
    }
  }, [isOpen, mounted]);

  // Update state when question prop changes
  useEffect(() => {
    setSection(question.Area || "");
    setExpertLevel(question.Function || "");
    setSubcategory(question.sub_category || ""); // Update subcategory when question changes
    if (typeof question.Timing === "string" && question.Timing) {
      const timingParts = question.Timing.split(" ");
      setDuration(timingParts[0] || "02");
      setUnit(timingParts[1] || "min");
    } else {
      setDuration("02");
      setUnit("min");
    }
    setQuestionText(question.Question || "");
    setAnswerA(question.A || "");
    setAnswerB(question.B || "");
    setAnswerC(question.C || "");
    setAnswerD(question.D || "");
    setCorrectAnswer(question.Correct_Answer || "");
  }, [question]);

  const handleCorrectAnswerChange = (answer: string) => {
    setCorrectAnswer(answer);
  };

  const handleUpdateQuestion = async () => {
    // Validation check
    if (!questionText || !correctAnswer || !section || !expertLevel) {
      toast.error(t("editQuestionModal.validation.requiredFields"));
      return;
    }

    const updatePromise = new Promise(async (resolve, reject) => {
      try {
        const { error } = await supabase
          .from("questions")
          .update({
            Area: section,
            Function: expertLevel,
            sub_category: subcategory, // Include subcategory in the update
            Timing: `${duration} ${unit}`,
            Question: questionText,
            A: answerA,
            B: answerB,
            C: answerC,
            D: answerD,
            Correct_Answer: correctAnswer,
          })
          .eq("Serial", question.Serial);

        if (error) throw error;

        if (onUpdate) {
          onUpdate();
        }

        resolve(t("editQuestionModal.toast.success"));
        // Delay the reload slightly to allow the toast to be seen
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } catch (err) {
        console.error(t("editQuestionModal.logs.error"), err);
        reject(new Error(t("editQuestionModal.toast.error")));
      }
    });

    toast.promise(updatePromise, {
      loading: t("editQuestionModal.toast.loading"),
      success: (data) => data as string,
      error: (err) => err.message,
    });
  };

  useEffect(() => {
    const getSectionData = async () => {
      try {
        const data = await fetchSectionData();
        if (data && data.length > 0) {
          const formattedData = data.map((item) => ({
            label: item.name,
            value: item.name,
          }));
          setSections(formattedData);
        } else {
          setError(t("editQuestionModal.errors.noSections"));
        }
      } catch (err) {
        setError(t("editQuestionModal.errors.fetchFailed"));
        console.error(t("editQuestionModal.logs.fetchError"), err);
      }
    };

    getSectionData();
  }, [t]);

  const answers = [
    { letter: "A", value: answerA, setter: setAnswerA },
    { letter: "B", value: answerB, setter: setAnswerB },
    { letter: "C", value: answerC, setter: setAnswerC },
    { letter: "D", value: answerD, setter: setAnswerD },
  ];

  const timeUnits = [
    { label: t("editQuestionModal.timeUnits.minutes"), value: "min" },
    { label: t("editQuestionModal.timeUnits.hours"), value: "hrs" },
    { label: t("editQuestionModal.timeUnits.seconds"), value: "secs" },
  ];

  // Don't render anything until mounted
  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-500 ${
          animatingIn ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Sliding panel */}
      <div
        className={`fixed inset-y-0 right-0 max-w-5xl w-full bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-500 ease-in-out ${
          animatingIn ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ willChange: "transform" }}
      >
        <div className="flex h-full flex-col overflow-y-scroll">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("editQuestionModal.title")}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1 text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="sr-only">
                {t("editQuestionModal.closePanel")}
              </span>
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="relative flex-1 px-6 py-6 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Debug info to verify we're editing the right question */}
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {t("editQuestionModal.editingQuestion")}: {question.Serial} -{" "}
                {question.Question?.substring(0, 30)}...
              </div>

              {/* Header Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t("editQuestionModal.fields.section")}
                  </h6>
                  <input
                    type="text"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                    placeholder={t("editQuestionModal.placeholders.section")}
                  />
                </div>
                <div>
                  <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t("editQuestionModal.fields.discipline")}
                  </h6>
                  <Select
                    options={sections}
                    selectedValue={expertLevel}
                    onChange={setExpertLevel}
                    bg=""
                  />
                </div>
                <div>
                  <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t("editQuestionModal.fields.duration")}
                  </h6>
                  <div className="flex">
                    <input
                      type="number"
                      className="w-full rounded-l-lg border-r-0 border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                    />
                    <Select
                      options={timeUnits}
                      selectedValue={unit}
                      onChange={setUnit}
                      bg=""
                    />
                  </div>
                </div>
              </div>

              {/* Add Subcategory field */}
              <div>
                <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t("Quiz.QuizTable.columns.subcategory")}
                </h6>
                <input
                  type="text"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                  placeholder={t("NewQuestion.placeholders.subcategory")}
                />
              </div>

              {/* Question Section */}
              <div>
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                  {t("editQuestionModal.fields.question")}
                </label>
                <textarea
                  className="w-full h-48 rounded-lg border border-gray-200 dark:border-gray-600 p-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none transition-colors"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder={t("editQuestionModal.placeholders.question")}
                />
              </div>

              {/* Answers Section */}
              <div className="space-y-6">
                <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {t("editQuestionModal.fields.responses")}
                </h5>
                <div className="space-y-4">
                  {answers.map(({ letter, value, setter }) => (
                    <div key={letter} className="flex items-center space-x-2">
                      <div className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg font-semibold text-gray-700 dark:text-gray-300">
                        {letter}
                      </div>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        className="flex-1 rounded-lg border border-gray-200 dark:border-gray-600 p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                        placeholder={t(
                          "editQuestionModal.placeholders.answer",
                          { letter }
                        )}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Correct Answer Section */}
              <div>
                <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                  {t("editQuestionModal.fields.correctAnswer")}
                </h5>
                <div className="flex space-x-4">
                  {answers.map(({ letter }) => (
                    <button
                      key={letter}
                      onClick={() => handleCorrectAnswerChange(letter)}
                      className={`
                        flex items-center justify-center space-x-2 rounded-lg px-6 py-3 
                        transition-all duration-200 
                        ${
                          correctAnswer === letter
                            ? "bg-emerald-600 text-white"
                            : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                        }
                      `}
                    >
                      {correctAnswer === letter && (
                        <CheckCircle className="w-5 h-5 mr-2" />
                      )}
                      <span>{letter}</span>
                    </button>
                  ))}
                </div>
              </div>

              {error && <div className="text-red-600 text-sm">{error}</div>}

              {/* Update Button */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleUpdateQuestion}
                  disabled={loading}
                  className={`
                    px-8 py-3 rounded-lg font-medium transition-all duration-200
                    ${
                      loading
                        ? "bg-emerald-400 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }
                    text-white shadow-sm
                  `}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin" />
                      <span>{t("editQuestionModal.buttons.updating")}</span>
                    </div>
                  ) : (
                    t("editQuestionModal.buttons.update")
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditQuestionModal;
