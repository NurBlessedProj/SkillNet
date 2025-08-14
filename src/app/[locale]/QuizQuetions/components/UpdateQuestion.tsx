"use client";
import React, { useEffect, useState } from "react";
import Select from "@/components/select";
import Slider from "@/components/slideOver";
import { supabase } from "@/lib/supabase";
import { fetchSectionData } from "@/app/apis/getData/getSectionData";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl"; // Add this import
import { useRouter } from "next/navigation";

interface UpdateQuestionProps {
  question: any;
  onUpdate?: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const UpdateQuestion: React.FC<UpdateQuestionProps> = ({
  question,
  onUpdate,
  isOpen,
  onClose,
}) => {
  const t  = useTranslations(); // Initialize translation hook
  const [section, setSection] = useState(question.Area || "");
  const [expertLevel, setExpertLevel] = useState(question.Function || "");
  const [duration, setDuration] = useState(
    question.Timing?.split(" ")[0] || "02"
  );
  const [unit, setUnit] = useState(question.Timing?.split(" ")[1] || "min");
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

  // Update state when question prop changes
  useEffect(() => {
    setSection(question.Area || "");
    setExpertLevel(question.Function || "");
    setDuration(question.Timing?.split(" ")[0] || "02");
    setUnit(question.Timing?.split(" ")[1] || "min");
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
      toast.error(t("updateQuestion.errors.missingFields"));
      return;
    }

    const updatePromise = new Promise(async (resolve, reject) => {
      try {
        const { error } = await supabase
          .from("questions")
          .update({
            Area: section,
            Function: expertLevel,
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

        resolve(t("updateQuestion.success"));
        // Delay the reload slightly to allow the toast to be seen
        setTimeout(() => {
          router.refresh();
        }, 1000);
      } catch (err) {
        console.error("Error updating question:", err);
        reject(new Error(t("updateQuestion.errors.updateFailed")));
      }
    });

    toast.promise(updatePromise, {
      loading: t("updateQuestion.toast.updating"),
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
          setError(t("updateQuestion.errors.noSections"));
        }
      } catch (err) {
        setError(t("updateQuestion.errors.fetchFailed"));
        console.error("Error:", err);
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
    { label: t("updateQuestion.timeUnits.minutes"), value: "min" },
    { label: t("updateQuestion.timeUnits.hours"), value: "hrs" },
    { label: t("updateQuestion.timeUnits.seconds"), value: "secs" },
  ];

  return (
    <Slider
      edit={t("updateQuestion.title")}
      isOpen={isOpen}
      onClose={onClose}
      hideButton={true}
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Debug info to verify we're editing the right question */}
        <div className="text-xs text-gray-500">
          {t("updateQuestion.editingQuestion", {
            serial: question.Serial,
            preview: question.Question?.substring(0, 30) + "...",
          })}
        </div>

        {/* Header Section */}
        <div className="grid grid-cols-3 gap-6">
          <div>
            <h6 className="text-sm font-semibold text-gray-700 mb-2">
              {t("updateQuestion.fields.section")}
            </h6>
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder={t("updateQuestion.placeholders.section")}
            />
          </div>
          <div>
            <h6 className="text-sm font-semibold text-gray-700 mb-2">
              {t("updateQuestion.fields.discipline")}
            </h6>
            <Select
              options={sections}
              selectedValue={expertLevel}
              onChange={setExpertLevel}
              bg=""
            />
          </div>
          <div>
            <h6 className="text-sm font-semibold text-gray-700 mb-2">
              {t("updateQuestion.fields.dusration")}
            </h6>
            <div className="flex">
              <input
                type="number"
                className="w-full rounded-l-md border-r-0 border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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

        {/* Question Section */}
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">
            {t("updateQuestion.fields.question")}
          </label>
          <textarea
            className="w-full h-48 rounded-md border p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder={t("updateQuestion.placeholders.question")}
          />
        </div>

        {/* Answers Section */}
        <div className="space-y-6">
          <h5 className="text-lg font-semibold text-gray-800">
            {t("updateQuestion.fields.responses")}
          </h5>
          <div className="space-y-4">
            {answers.map(({ letter, value, setter }) => (
              <div key={letter} className="flex items-center space-x-2">
                <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-lg font-semibold text-gray-700">
                  {letter}
                </div>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="flex-1 rounded-lg border p-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder={t("updateQuestion.placeholders.answer", {
                    letter,
                  })}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Correct Answer Section */}
        <div>
          <h5 className="text-lg font-semibold text-gray-800 mb-4">
            {t("updateQuestion.fields.correctAnswer")}
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
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
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
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }
              text-white shadow-sm
            `}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin" />
                <span>{t("updateQuestion.buttons.updating")}</span>
              </div>
            ) : (
              t("updateQuestion.buttons.update")
            )}
          </button>
        </div>
      </div>
    </Slider>
  );
};

export default UpdateQuestion;
