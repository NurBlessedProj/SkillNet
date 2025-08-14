"use client";
import React, { useEffect, useState } from "react";
import Select from "@/components/select";
import Slider from "@/components/slideOver";
import { CreateQuestions } from "@/app/apis/questions/createQuestions";
import { fetchSectionData } from "@/app/apis/getData/getSectionData";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { ensureSectionExists } from "./SectionMenu";
import { useTranslations } from "next-intl";
import DisciplineSubcategorySelector from "@/components/DisciplineSubcategorySelector";

interface NewQuestionProps {
  onQuestionAdded?: () => void;
}

const NewQuestion: React.FC<NewQuestionProps> = ({ onQuestionAdded }) => {
  const t = useTranslations("Quiz");
  const Question = CreateQuestions();
  const [area, setArea] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [duration, setDuration] = useState("02");
  const [unit, setUnit] = useState("min");
  const [question, setQuestion] = useState("");
  const [answerA, setAnswerA] = useState("");
  const [answerB, setAnswerB] = useState("");
  const [answerC, setAnswerC] = useState("");
  const [answerD, setAnswerD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [disciplines, setDisciplines] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const handleCorrectAnswerChange = (answer: string) => {
    setCorrectAnswer(answer);
  };

  const handleSaveQuestion = async () => {
    if (!question || !correctAnswer || !area || !discipline) {
      toast.error(t("NewQuestion.errors.fillAllFields"));
      return;
    }

    try {
      // Ensure the discipline exists in the section table
      await ensureSectionExists(discipline);

      // Determine subcategory - if none provided, use discipline name with a default suffix
      const finalSubcategory = subcategory || `${discipline}_Default`;

      const formData = {
        Area: area,
        Function: discipline, // Main category
        sub_category: finalSubcategory, // Subcategory
        Timing: `${duration} ${unit}`,
        Question: question,
        A: answerA,
        B: answerB,
        C: answerC,
        D: answerD,
        Correct_Answer: correctAnswer,
      };

      const promise = Question.Save(formData);

      toast.promise(promise, {
        loading: t("NewQuestion.toast.saving"),
        success: () => {
          // Clear the form
          setQuestion("");
          setAnswerA("");
          setAnswerB("");
          setAnswerC("");
          setAnswerD("");
          setCorrectAnswer("");
          setDuration("02");
          // Don't reset subcategory to allow for multiple questions with same subcategory

          // Notify parent component that a question was added
          if (onQuestionAdded) {
            onQuestionAdded();
          }

          return t("NewQuestion.toast.saveSuccess");
        },
        error: (err) =>
          t("NewQuestion.toast.saveError", { error: err.message }),
      });
    } catch (error: any) {
      toast.error(t("NewQuestion.toast.error", { error: error.message }));
    }
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
          setDisciplines(formattedData);
        } else {
          setError(t("NewQuestion.errors.noDisciplines"));
        }
      } catch (err) {
        setError(t("NewQuestion.errors.fetchingData"));
        console.error("Error:", err);
      } finally {
        setLoading(false);
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

  const durationOptions = [
    { label: t("NewQuestion.timeUnits.min"), value: "min" },
  ];

  return (
    <Slider edit={t("NewQuestion.title")}>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t("NewQuestion.area")}
            </h6>
            <input
              type="text"
              value={area.toUpperCase()}
              onChange={(e) => setArea(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
              placeholder={t("NewQuestion.placeholders.area")}
            />
          </div>
          <div>
            <h6 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t("NewQuestion.duration")}
            </h6>
            <div className="flex">
              <input
                type="number"
                className="w-full rounded-l-lg border-r-0 border border-gray-200 dark:border-gray-600 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-colors"
                placeholder="02"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
              <Select
                options={durationOptions}
                selectedValue={unit}
                onChange={setUnit}
                bg=""
              />
            </div>
          </div>
        </div>

        {/* Discipline and Subcategory Section */}
        <DisciplineSubcategorySelector
          selectedDiscipline={discipline}
          setSelectedDiscipline={setDiscipline}
          selectedSubcategory={subcategory}
          setSelectedSubcategory={setSubcategory}
          disciplines={disciplines}
        />

        {/* Question Section */}
        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
            {t("NewQuestion.question")}
          </label>
          <textarea
            className="w-full h-48 rounded-lg border border-gray-200 dark:border-gray-600 p-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none transition-colors"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t("NewQuestion.placeholders.question")}
          />
        </div>

        {/* Answers Section */}
        <div className="space-y-6">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {t("NewQuestion.responses")}
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
                  placeholder={t("NewQuestion.placeholders.answer")}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Correct Answer Section */}
        <div>
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
            {t("NewQuestion.correctAnswer")}
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

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            onClick={handleSaveQuestion}
            disabled={Question.loading}
            className={`
              px-8 py-3 rounded-lg font-medium transition-all duration-200
              ${
                Question.loading
                  ? "bg-emerald-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }
              text-white shadow-sm
            `}
          >
            {Question.loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin" />
                <span>{t("NewQuestion.saving")}</span>
              </div>
            ) : (
              t("NewQuestion.saveQuestion")
            )}
          </button>
        </div>
      </div>
    </Slider>
  );
};

export default NewQuestion;
