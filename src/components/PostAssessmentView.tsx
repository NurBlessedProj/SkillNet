import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  CheckCircle2,
  Award,
  Clock,
  BarChart3,
  AlertTriangle,
  Shield,
  BookOpen,
  ChevronRight,
  Download,
  Share2,
  Printer,
  TrendingUp,
  XCircle,
  User,
  Users,
  UserX,
  Eye,
  EyeOff,
  ClipboardCheck,
  Target,
  Trophy,
  Timer,
  CheckCircle,
  X,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface PostAssessmentViewProps {
  score: number;
  totalQuestions: number;
  subjectScores: { [key: string]: any };
  duration: number;
  discipline: string;
  isTerminated?: boolean;
  difficultyLevel?: string;
}

const PostAssessmentView = ({
  score,
  totalQuestions,
  subjectScores,
  duration,
  discipline,
  isTerminated = false,
  difficultyLevel = "intermediate",
}: PostAssessmentViewProps) => {
  const router = useRouter();
  const percentage = Math.round((score / totalQuestions) * 100);

  // Extract subject scores, filtering out metadata properties
  const subjectNames = Object.keys(subjectScores).filter(
    (key) =>
      typeof subjectScores[key] === "number" &&
      ![
        "supervisionResults",
        "difficultyLevel",
        "snapshotCount",
        "snapshotSummary",
        "terminated",
        "terminationReason",
        "reviewStatus",
      ].includes(key)
  );

  // Get supervision data if available
  const supervisionData = subjectScores.supervisionResults || null;
  const snapshotSummary = subjectScores.snapshotSummary || [];
  const terminationReason =
    subjectScores.terminationReason || "Supervision violation detected";

  // Check if results are pending review
  const isPendingReview = subjectScores.reviewStatus === "pending";

  // Determine pass/fail status (example threshold: 60%)
  const isPassed = percentage >= 60 && !isTerminated;

  // Determine grade based on percentage
  const getGrade = (percent: number) => {
    if (isTerminated)
      return { letter: "F", color: "text-red-600 dark:text-red-400" };
    if (isPendingReview)
      return { letter: "...", color: "text-blue-600 dark:text-blue-400" };
    if (percent >= 90)
      return { letter: "A", color: "text-emerald-600 dark:text-emerald-400" };
    if (percent >= 80)
      return { letter: "B", color: "text-green-600 dark:text-green-400" };
    if (percent >= 70)
      return { letter: "C", color: "text-blue-600 dark:text-blue-400" };
    if (percent >= 60)
      return { letter: "D", color: "text-amber-600 dark:text-amber-400" };
    return { letter: "F", color: "text-red-600 dark:text-red-400" };
  };

  const grade = getGrade(percentage);

  // Generate feedback based on score
  const getFeedback = () => {
    if (isTerminated) {
      return "Your assessment was terminated due to supervision violations. Please ensure you follow all rules in future assessments.";
    }

    if (isPendingReview) {
      return "Your assessment has been submitted and is pending review by an examiner. You will be notified once the review is complete.";
    }

    if (percentage >= 90)
      return "Outstanding performance! You've demonstrated exceptional understanding of the material.";
    if (percentage >= 80)
      return "Great job! You've shown strong knowledge in most areas.";
    if (percentage >= 70)
      return "Good work! You have a solid foundation but there's room for improvement in some areas.";
    if (percentage >= 60)
      return "You've passed, but consider reviewing the topics where you missed questions.";
    return "You'll need to improve your understanding of the core concepts. Consider reviewing the material and trying again.";
  };

  // Process subject scores to handle subjects with multiple questions
  const processedSubjectScores = React.useMemo(() => {
    // Create a map to track questions per subject
    const subjectQuestionCounts: Record<string, number> = {};
    const subjectCorrectCounts: Record<string, number> = {};

    // Initialize counts
    subjectNames.forEach((subject) => {
      // For each subject name in the list, count it as one question for that subject
      subjectQuestionCounts[subject] =
        (subjectQuestionCounts[subject] || 0) + 1;
      // Get the score for this subject (how many correct answers)
      subjectCorrectCounts[subject] = subjectScores[subject] || 0;
    });

    // Create processed subject data
    return subjectNames
      .filter((subject, index, self) => self.indexOf(subject) === index) // Get unique subjects
      .map((subject) => {
        const questionCount = subjectQuestionCounts[subject];
        const correctCount = subjectCorrectCounts[subject];
        const percentage = Math.round((correctCount / questionCount) * 100);
        return {
          name: subject,
          questionCount,
          correctCount,
          percentage,
        };
      });
  }, [subjectNames, subjectScores]);

  // Get supervision violation icon based on termination reason
  const getViolationIcon = () => {
    if (terminationReason.toLowerCase().includes("multiple face")) {
      return <Users className="h-16 w-16 text-red-500" />;
    } else if (terminationReason.toLowerCase().includes("different person")) {
      return <UserX className="h-16 w-16 text-red-500" />;
    } else if (terminationReason.toLowerCase().includes("face not visible")) {
      return <EyeOff className="h-16 w-16 text-red-500" />;
    } else {
      return <XCircle className="h-16 w-16 text-red-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
    >
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Card with Overall Results */}
          <Card className="shadow-xl mb-8 overflow-hidden border-0 ring-1 ring-gray-200 bg-red-5 dark:ring-gray-700">
            <div
              className={`${
                isTerminated
                  ? "bg-gradient-to-r from-red-500 to-red-600"
                  : isPendingReview
                  ? "bg-gradient-to-r from-blue-500 to-blue-600"
                  : isPassed
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600"
                  : "bg-gradient-to-r from-amber-500 to-orange-600"
              } py-8 px-6 text-white`}
            >
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
                      {isTerminated ? (
                        <XCircle className="h-6 w-6 text-white" />
                      ) : isPendingReview ? (
                        <ClipboardCheck className="h-6 w-6 text-white" />
                      ) : isPassed ? (
                        <Trophy className="h-6 w-6 text-white" />
                      ) : (
                        <Target className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold">
                      {isTerminated
                        ? "Assessment Terminated"
                        : isPendingReview
                        ? "Assessment Submitted"
                        : "Assessment Results"}
                    </h1>
                  </div>
                  <p className="text-white/90 text-sm sm:text-base">
                    {discipline} ·{" "}
                    {difficultyLevel.charAt(0).toUpperCase() +
                      difficultyLevel.slice(1)}{" "}
                    Level
                  </p>
                </div>

                {/* Score Circle */}
                <div className="relative">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
                    <div className="text-center">
                      <div className="text-2xl sm:text-4xl font-bold">
                        {percentage}%
                      </div>
                      <div className="text-xs sm:text-sm opacity-90">
                        {score}/{totalQuestions}
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={`absolute -top-2 -right-2 ${
                      isPassed
                        ? "bg-emerald-500 hover:bg-emerald-600"
                        : "bg-red-500 hover:bg-red-600"
                    } text-white border-2 border-white`}
                  >
                    {isPassed ? "PASSED" : "FAILED"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Status Notices */}
            {isTerminated && (
              <div className="bg-red-50 dark:bg-red-900/20 p-6 border-b border-red-200 dark:border-red-800">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                      Assessment Terminated
                    </h3>
                    <p className="text-red-700 dark:text-red-300">
                      Your assessment has been terminated due to supervision
                      violations.
                      <span className="font-medium block mt-1">
                        Reason: {terminationReason}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isPendingReview && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 border-b border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <ClipboardCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                      Pending Review
                    </h3>
                    <p className="text-blue-700 dark:text-blue-300">
                      Your assessment has been submitted and is awaiting review
                      by an examiner.
                      <span className="font-medium block mt-1">
                        You will be notified when the review is complete.
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <CardContent className="pt-8 pb-0">
              {isTerminated ? (
                // Special display for terminated assessments
                <div className="text-center py-8">
                  {getViolationIcon()}
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4 mb-3">
                    Assessment Failed
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-6">
                    Your assessment has been terminated due to supervision
                    violations. Your score has not been recorded.
                  </p>
                  <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300 max-w-md mx-auto">
                    <p className="font-semibold mb-2">Violation detected:</p>
                    <p>{terminationReason}</p>
                  </div>
                </div>
              ) : isPendingReview ? (
                // Special display for pending review assessments
                <div className="text-center py-8">
                  <ClipboardCheck className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Awaiting Review
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-6">
                    Your assessment has been submitted and is currently being
                    reviewed by an examiner. Your final score and results will
                    be available once the review is complete.
                  </p>
                  <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-700 dark:text-blue-300 max-w-md mx-auto">
                    <p className="font-semibold mb-2">What happens next?</p>
                    <p>
                      An examiner will review your assessment and verify your
                      results. You will be notified when the review is complete.
                    </p>
                  </div>
                </div>
              ) : (
                // Normal results display
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Score Display */}
                  <div className="lg:col-span-1">
                    <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-200 dark:border-emerald-800">
                      <CardContent className="p-6 text-center">
                        <div className="mb-6">
                          <div className="relative inline-block">
                            <div className="w-32 h-32 rounded-full bg-white dark:bg-gray-800 shadow-lg border-4 border-emerald-200 dark:border-emerald-700 flex items-center justify-center">
                              <div>
                                <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                                  {percentage}%
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  Score
                                </div>
                              </div>
                            </div>
                            <div className="absolute -top-2 -right-2">
                              <Badge
                                className={`${
                                  isPassed ? "bg-emerald-500" : "bg-red-500"
                                } text-white`}
                              >
                                {isPassed ? "PASS" : "FAIL"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                              Grade:{" "}
                              <span className={grade.color}>
                                {grade.letter}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {score} correct out of {totalQuestions} questions
                            </div>
                          </div>

                          <div className="pt-4 border-t border-emerald-200 dark:border-emerald-700">
                            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              Performance
                            </div>
                            <Progress
                              value={percentage}
                              className="h-3 bg-emerald-100 dark:bg-emerald-900/30"
                            />
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <span>0%</span>
                              <span>60%</span>
                              <span>100%</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Test Details */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="border-gray-200 dark:border-gray-700">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          Assessment Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                              <Timer className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Duration
                              </div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {duration} minutes
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Questions
                              </div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {totalQuestions}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                              <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                Avg. Time
                              </div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {(duration / totalQuestions).toFixed(1)} min
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-gray-200 dark:border-gray-700">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          Feedback & Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                            <p className="text-emerald-800 dark:text-emerald-200">
                              {getFeedback()}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <span className="font-semibold text-green-800 dark:text-green-200">
                                  Correct Answers
                                </span>
                              </div>
                              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                {score}
                              </div>
                            </div>

                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                                <span className="font-semibold text-red-800 dark:text-red-200">
                                  Incorrect Answers
                                </span>
                              </div>
                              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                                {totalQuestions - score}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Action Buttons */}
            <CardFooter className="border-t border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col sm:flex-row w-full gap-4">
                <Button
                  onClick={() => router.push("/test")}
                  variant="outline"
                  className="flex-1 sm:flex-none border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>

                {!isTerminated && !isPendingReview && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Report
                    </Button>
                    <Button
                      variant="outline"
                      className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Results
                    </Button>
                  </div>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default PostAssessmentView;
