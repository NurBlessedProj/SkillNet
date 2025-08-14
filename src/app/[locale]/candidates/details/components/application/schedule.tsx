import { fetchAllAnswers } from "@/app/apis/answers/get_all_answers";
import moment from "moment";
import { Clock, Award, BookOpen } from "lucide-react";
import { FC, useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { supabase } from "@/lib/supabase";

interface Data {
  data: any;
}

interface SubjectScore {
  [key: string]: number;
  subCategory?: any;
}

interface Answer {
  created_at: string;
  email: string;
  exam: string;
  id: string | number;
  overall: string | number;
  score: string | number;
  subject_score: string | SubjectScore;
}

const Schedule: FC<Data> = ({ data }) => {
  const t = useTranslations(); // Initialize translation hook
  const locale = useLocale(); // Get the current locale
  const [filteredAnswers, setFilteredAnswers] = useState<Answer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Configure moment to use the current language
  useEffect(() => {
    moment.locale(locale);
  }, [locale]);

  useEffect(() => {
    const getAnswers = async () => {
      setIsLoading(true);
      try {
        // Directly fetch answers from Supabase for the specific email
        const { data: answers, error } = await supabase
          .from("answers")
          .select("*")
          .eq("email", data.email);

        if (error) {
          throw error;
        }

        // Sort by date, most recent first
        const sortedAnswers = answers.sort(
          (a: Answer, b: Answer) =>
            moment(b.created_at).valueOf() - moment(a.created_at).valueOf()
        );

        // Process the answers to ensure correct data types
        const processedAnswers = sortedAnswers.map((answer: Answer) => ({
          ...answer,
          score:
            typeof answer.score === "string"
              ? parseInt(answer.score)
              : answer.score,
          overall:
            typeof answer.overall === "string"
              ? parseInt(answer.overall)
              : answer.overall,
          subject_score:
            typeof answer.subject_score === "string"
              ? answer.subject_score
              : JSON.stringify(answer.subject_score),
        }));

        setFilteredAnswers(processedAnswers);
      } catch (error) {
        console.error("Error fetching answers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (data?.email) {
      getAnswers();
    }
  }, [data?.email]);

  // Calculate score percentage
  const calculatePercentage = (score: number, overall: number): number => {
    if (overall === 0) return 0;
    return Math.round((score / overall) * 100);
  };

  const getScoreColor = (score: number, overall: number) => {
    const percentage = (score / overall) * 100;
    if (percentage >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (percentage >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const parseSubjectScore = (
    subjectScoreStr: string | SubjectScore
  ): SubjectScore => {
    if (typeof subjectScoreStr !== "string") {
      return subjectScoreStr as SubjectScore;
    }

    try {
      return JSON.parse(subjectScoreStr);
    } catch (error) {
      console.error("Error parsing subject score:", error, subjectScoreStr);
      return {};
    }
  };

  // Create a formatted total string without using nested translations
  const getTotalText = () => {
    const count = filteredAnswers.length;
    return `${t("application.schedule.total")}: ${count} ${
      count === 1
        ? t("application.schedule.singleAssessment")
        : t("application.schedule.multipleAssessments")
    }`;
  };

  // Helper function to render subject scores as percentages
  const renderSubjectScores = (subjectScoreData: SubjectScore) => {
    // Filter out the subCategory field which is not a score
    const scoreEntries = Object.entries(subjectScoreData).filter(
      ([key]) => key !== "subCategory" && key !== "terminated"
    );

    if (scoreEntries.length === 0) {
      return (
        <div className="text-sm text-gray-500 italic">
          {t("application.schedule.noSubjectScores")}
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {scoreEntries.map(([code, score]) => {
          // Calculate percentage based on score (assuming score is out of 100)
          // If score is already a percentage, we can use it directly
          const percentage =
            typeof score === "number" ? score : parseInt(score as any);

          // Determine color based on percentage
          let colorClass =
            "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700";
          if (percentage >= 80)
            colorClass =
              "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700";
          else if (percentage >= 50)
            colorClass =
              "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700";
          else if (percentage < 50)
            colorClass =
              "bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700";

          return (
            <div
              key={code}
              className={`${colorClass} px-3 py-1 rounded-full text-sm font-medium`}
            >
              <span className="font-medium">{code}:</span>{" "}
              <span>{percentage}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full flex justify-center mt-12">
      <div className="w-[90%] md:w-[70%] space-y-6">
        <div className="flex w-full justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            {t("application.schedule.assessmentHistory")}
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {getTotalText()}
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-pulse text-gray-400 dark:text-gray-500">
              {t("application.schedule.loadingAssessments")}
            </div>
          </div>
        ) : filteredAnswers.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">
              {t("application.schedule.noAssessments")}
            </p>
          </div>
        ) : (
          filteredAnswers.map((answer, index) => {
            const subjectScoreData = parseSubjectScore(answer.subject_score);
            const scorePercentage = calculatePercentage(
              Number(answer.score),
              Number(answer.overall)
            );

            return (
              <div
                key={answer.id || index}
                className="rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-800 hover:shadow-lg transition-all duration-200 hover:border-emerald-200 dark:hover:border-emerald-700"
              >
                <div className="flex flex-col sm:flex-row sm:space-x-6">
                  <div className="sm:w-2/3">
                    <div className="flex items-center space-x-2 mb-4">
                      <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <h3
                        className={`text-xl font-bold ${getScoreColor(
                          Number(answer.score),
                          Number(answer.overall)
                        )}`}
                      >
                        {scorePercentage}%
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                          ({answer.score}/{answer.overall})
                        </span>
                      </h3>
                    </div>

                    <div className="flex items-center space-x-2 mb-4">
                      <BookOpen className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {answer.exam || t("application.schedule.unknownExam")}
                      </p>
                    </div>

                    {subjectScoreData.subCategory && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t("application.schedule.category")}:
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Array.isArray(subjectScoreData.subCategory) &&
                            subjectScoreData.subCategory.map((category, i) => (
                              <span
                                key={i}
                                className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded text-xs border border-gray-200 dark:border-gray-600"
                              >
                                {category}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        {t("application.schedule.subjectScores")}:
                      </p>
                      {renderSubjectScores(subjectScoreData)}
                    </div>
                  </div>

                  <div className="sm:w-1/3 sm:text-right mt-6 sm:mt-0 border-t sm:border-t-0 border-gray-200 dark:border-gray-700 pt-4 sm:pt-0">
                    <div className="flex items-center justify-end space-x-2">
                      <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {moment(answer.created_at).format("MMM DD, YYYY")}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {moment(answer.created_at).format("hh:mm A")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Schedule;
