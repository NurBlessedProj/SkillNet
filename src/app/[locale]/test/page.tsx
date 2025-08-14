"use client";
import React, { useState, useEffect } from "react";
import { CheckUserEmailExists } from "@/app/apis/answers/get_answers_by_user";
import Loader from "@/components/spinnerLoade";
import {
  CheckCircle,
  ClipboardCheck,
  Clock,
  AlertCircle,
  PieChart as PieChartIcon,
  BarChart,
  Calendar,
  Award,
  ExternalLink,
  Loader2,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  CalendarDays,
  Router,
  TrendingUp,
  Users,
  Target,
  Trophy,
  Star,
  Zap,
  BookOpen,
  Eye,
  Clock3,
  CheckSquare,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Brain,
  Lightbulb,
  Shield,
  GraduationCap,
  Search,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { GetAnswers } from "@/app/apis/answers/get_answers_by_user";

import JobViewUser from "../viewJobs/page";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  format,
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
} from "date-fns";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnDef,
} from "@tanstack/react-table";

// Define a type for the assessment data to avoid subject_score errors
interface Assessment {
  id: string;
  created_at: string;
  email: string;
  exam?: string;
  score?: string;
  overall?: number;
  subject_score?: string; // Make this explicit
  metadata?: string; // Add metadata field for terminated status
  [key: string]: any; // For other properties
}

// Define a type for scheduled tests
interface ScheduledTest {
  id: string;
  user_email: string;
  section: string;
  scheduled_time: string;
  status: string;
  created_at: string;
}

const JobTableUser = () => {
  const t = useTranslations();
  const { emailExists, loading: userLoading } = CheckUserEmailExists();
  const { questions, loading: answersLoading } = GetAnswers();
  console.log("questions for user", questions);
  const router = useRouter();

  const [showNewTest, setShowNewTest] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<any | null>(null);
  const [userAssessments, setUserAssessments] = useState<Assessment[]>([]);
  const [scheduledTests, setScheduledTests] = useState<ScheduledTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingScheduled, setLoadingScheduled] = useState(true);
  const [selectedAssessment, setSelectedAssessment] =
    useState<Assessment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentScheduledPage, setCurrentScheduledPage] = useState(1);
  const [activeTab, setActiveTab] = useState("completed");

  // Constants
  const ITEMS_PER_PAGE = 4;

  const [mostRecentId, setMostRecentId] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const toggleReviewModal = () => {
    setIsReviewModalOpen(!isReviewModalOpen);
  };

  // Column definitions for the table
  const columnHelper = createColumnHelper<Assessment>();

  const columns: ColumnDef<Assessment, any>[] = [
    columnHelper.accessor("created_at", {
      header: "Date",
      cell: ({ getValue, row }) => {
        const date = getValue();
        return (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="whitespace-nowrap">
              {date ? format(new Date(date), "MMM d, yyyy") : "N/A"}
            </span>
            {row.original.id === mostRecentId && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                Latest
              </span>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("exam", {
      header: "Discipline",
      cell: ({ getValue, row }) => (
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-gray-400" />
          <span className="truncate max-w-[200px]">
            {getValue() || "General"}
          </span>
        </div>
      ),
    }),
    columnHelper.accessor("score", {
      header: "Score",
      cell: ({ row }) => {
        const assessment = row.original;
        const displayScore = getDisplayScore(assessment);
        const isPassed = isAssessmentPassed(assessment);

        return (
          <div className="flex items-center gap-2">
            {assessment.review_status === "pending" ||
            assessment.review_status === "rejected" ? (
              <span className="text-gray-500">—</span>
            ) : (
              <span
                className={`font-semibold ${
                  isPassed
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {displayScore}%
              </span>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("review_status", {
      header: "Status",
      cell: ({ row }) => {
        const assessment = row.original;
        const status = getAssessmentStatus(assessment);

        return (
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColorClass(
              status
            )}`}
          >
            {getStatusLabel(status)}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <button
          className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors"
          onClick={() => handleAssessmentClick(row.original)}
        >
          <Eye className="w-4 h-4" />
          View
        </button>
      ),
    }),
  ];

  // Table configuration
  const table = useReactTable({
    data: userAssessments,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  const formatTimeRemaining = (scheduledTime: any) => {
    const now = new Date();
    const scheduledDate = new Date(scheduledTime);
    const diffInSeconds = differenceInSeconds(scheduledDate, now);

    if (diffInSeconds < 0) {
      return t("Dashboard.metrics.pastDue");
    } else if (diffInSeconds < 60) {
      return t("Dashboard.metrics.secondsLeft", { seconds: diffInSeconds });
    } else if (differenceInMinutes(scheduledDate, now) < 60) {
      return t("Dashboard.metrics.minutesLeft", {
        minutes: differenceInMinutes(scheduledDate, now),
      });
    } else if (differenceInHours(scheduledDate, now) < 24) {
      return t("Dashboard.metrics.hoursLeft", {
        hours: differenceInHours(scheduledDate, now),
      });
    } else if (differenceInDays(scheduledDate, now) < 7) {
      return t("Dashboard.metrics.daysLeft", {
        days: differenceInDays(scheduledDate, now),
      });
    } else {
      return format(scheduledDate, "MMM d, yyyy");
    }
  };

  // Add this useEffect to set the most recent assessment ID when data loads
  useEffect(() => {
    if (userAssessments.length > 0) {
      setMostRecentId(userAssessments[0].id);
    }
  }, [userAssessments]);

  // Get the current user's email
  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Error fetching user:", error);
          return;
        }

        if (user) {
          setCurrentUserEmail(user.email);
        }
      } catch (error) {
        console.error("Error in getUserEmail:", error);
      }
    };

    getUserEmail();
  }, []);

  // Filter assessments for the current user
  useEffect(() => {
    if (!questions || !currentUserEmail) {
      return;
    }

    // Cast questions to the Assessment type to ensure subject_score is recognized
    const typedQuestions = questions as unknown as Assessment[];
    const userTests = typedQuestions.filter(
      (q) => q.email === currentUserEmail
    );

    // Sort by date (newest first)
    userTests.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setUserAssessments(userTests);

    // Set the most recent assessment as the default selected
    if (userTests.length > 0) {
      setSelectedAssessment(userTests[0]);
    }

    setLoading(false);
  }, [questions, currentUserEmail]);

  // Fetch scheduled tests for the current user
  useEffect(() => {
    const fetchScheduledTests = async () => {
      if (!currentUserEmail) return;

      try {
        setLoadingScheduled(true);
        const { data, error } = await supabase
          .from("test_schedules")
          .select("*")
          .eq("user_email", currentUserEmail)
          .order("scheduled_time", { ascending: false });

        if (error) throw error;

        setScheduledTests(data || []);
      } catch (error) {
        console.error("Error fetching scheduled tests:", error);
      } finally {
        setLoadingScheduled(false);
      }
    };

    fetchScheduledTests();
  }, [currentUserEmail]);

  if (userLoading || answersLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 bg-emerald-200 dark:bg-emerald-800 rounded-full animate-pulse"></div>
              <div className="absolute inset-2 bg-emerald-100 dark:bg-emerald-700 rounded-full animate-ping"></div>
              <div className="absolute inset-4 bg-emerald-50 dark:bg-emerald-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-emerald-600 dark:text-emerald-400 font-medium">
              Loading your dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handlePassTest = () => {
    window.location.href = "/facerecognition";
  };

  // Get the most recent assessment for the current user
  const getMostRecentAssessment = (): Assessment | null => {
    if (!userAssessments || userAssessments.length === 0) return null;

    return userAssessments.reduce((latest, current) => {
      const latestDate = new Date(latest.created_at);
      const currentDate = new Date(current.created_at);
      return currentDate > latestDate ? current : latest;
    }, userAssessments[0]);
  }; // Update the calculateSubjectPerformance function to handle both pending review and rejected status
  const calculateSubjectPerformance = () => {
    const assessmentToUse = selectedAssessment || getMostRecentAssessment();

    if (!assessmentToUse || !assessmentToUse.subject_score) {
      return [{ name: "No Data", value: 100, color: "#e0e0e0" }];
    }

    // If the assessment is pending review, don't show detailed results
    if (assessmentToUse.review_status === "pending") {
      return [{ name: "Pending Review", value: 100, color: "#FFB347" }]; // Orange/amber color for pending
    }

    // If the assessment was rejected, don't show detailed results
    if (assessmentToUse.review_status === "rejected") {
      return [{ name: "Test Rejected", value: 100, color: "#FF6347" }]; // Tomato red color for rejected
    }

    // Check if the assessment was terminated due to a violation
    try {
      const subjectScores = JSON.parse(assessmentToUse.subject_score);
      if (subjectScores.terminated === true) {
        return [{ name: "Test Terminated", value: 100, color: "#FF0000" }]; // Red color for terminated
      }
    } catch (e) {
      console.error("Error parsing subject scores:", e);
    }

    try {
      const subjectScores = JSON.parse(assessmentToUse.subject_score);

      // Convert to array format for PieChart
      return Object.entries(subjectScores)
        .map(([name, value], index) => {
          // Skip the subCategory field in the chart
          if (name.toLowerCase() === "subcategory") {
            return null;
          }

          // Special case for violation with value 1
          if (name.toLowerCase() === "violation" && value === 1) {
            return {
              name,
              value: parseInt(value as any) || 0,
              color: "#ff0000", // Red color for violation
            };
          }

          // Skip the terminated flag in the chart
          if (name.toLowerCase() === "terminated") {
            return null;
          }

          return {
            name,
            value: parseInt(value as string) || 0,
            color: getColorByIndex(index),
          };
        })
        .filter((item) => item !== null); // Filter out null items (terminated flag and subCategory)
    } catch (error) {
      console.error("Error parsing subject scores:", error);
      return [{ name: "Error", value: 100, color: "#ff0000" }];
    }
  };

  const isAssessmentPassed = (assessment: Assessment) => {
    const status = getAssessmentStatus(assessment);
    return status === "pass";
  };

  const getAssessmentStatus = (assessment: Assessment) => {
    // First check if the assessment was terminated due to a violation
    if (assessment.subject_score) {
      try {
        const subjectScores = JSON.parse(assessment.subject_score);
        if (subjectScores.terminated === true) {
          return "terminated";
        }
      } catch (e) {
        console.error("Error parsing subject scores:", e);
      }
    }

    // Check review status
    if (assessment.review_status) {
      if (assessment.review_status === "approved") {
        // For approved tests, show the actual pass/fail based on score
        const score = calculateScorePercentage(assessment);
        return score >= 50 ? "pass" : "fail";
      } else if (assessment.review_status === "rejected") {
        return "fail"; // Rejected tests always fail
      } else {
        return "pending"; // Tests pending review show as pending
      }
    }

    // Default to score-based pass/fail for tests without review status
    return calculateScorePercentage(assessment) >= 50 ? "pass" : "fail";
  };

  // Get status label based on assessment status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pass":
        return t("Dashboard.table.pass");
      case "fail":
        return t("Dashboard.table.fail");
      case "pending":
        return t("Dashboard.table.pendingReview");
      case "terminated":
        return t("Dashboard.table.terminated");
      default:
        return t("Dashboard.table.pending");
    }
  };

  // Get status color based on assessment status
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-700";
      case "approved-but-failing":
        return "bg-yellow-100 text-yellow-700"; // Yellow for pending review
      case "rejected":
        return "bg-red-100 text-red-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "terminated":
        return "bg-red-100 text-red-700";
      case "pass":
        return "bg-green-100 text-green-700";
      case "fail":
        return "bg-red-100 text-red-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };
  // Add this function to get review message
  const getReviewMessage = (assessment: Assessment) => {
    if (assessment?.review_notes) {
      return assessment.review_notes;
    }

    if (assessment?.review_status === "rejected") {
      return "This test was rejected by an administrator.";
    }

    if (assessment?.review_status === "pending") {
      return "This test is pending review by an administrator.";
    }

    return null;
  };

  // Update the getDisplayScore function to handle rejected tests
  const getDisplayScore = (assessment: Assessment) => {
    // If the assessment was terminated, show 0%
    if (assessment.subject_score) {
      try {
        const subjectScores = JSON.parse(assessment.subject_score);
        if (subjectScores.terminated === true) {
          return 0;
        }
      } catch (e) {
        console.error("Error parsing subject scores:", e);
      }
    }

    // For tests with pending review or rejected, don't show a score
    if (
      assessment.review_status === "pending" ||
      assessment.review_status === "rejected"
    ) {
      return assessment.review_status;
    }

    // For approved tests, show the actual score
    return calculateScorePercentage(assessment);
  };
  // Helper function to calculate percentage
  const calculatePercentage = (score: number, total: number) => {
    return total > 0 ? Math.round((score / total) * 100) : 0;
  };
  const getColorByIndex = (index: number) => {
    const colors = ["#10b981", "#059669", "#047857", "#065f46", "#064e3b"];
    return colors[index % colors.length];
  };

  const subjectPerformanceData = calculateSubjectPerformance();
  const mostRecentAssessment = getMostRecentAssessment();

  // Get total questions attempted
  const getTotalQuestionsAttempted = () => {
    const assessmentToUse = selectedAssessment || mostRecentAssessment;
    if (!assessmentToUse) return "N/A";

    return assessmentToUse.overall || "N/A";
  };

  // Calculate score percentage
  const calculateScorePercentage = (assessment: Assessment) => {
    if (!assessment.score || !assessment.overall) return 0;

    const score = Number(assessment.score);
    const questionsAttempted = Number(assessment.overall);

    return questionsAttempted > 0
      ? Math.round((score / questionsAttempted) * 100)
      : 0;
  };

  // Check if assessment was terminated
  const wasAssessmentTerminated = (assessment: Assessment) => {
    if (assessment.subject_score) {
      try {
        const subjectScores = JSON.parse(assessment.subject_score);
        return subjectScores.terminated === true;
      } catch (e) {
        console.error("Error parsing subject scores:", e);
        return false;
      }
    }
    return false;
  };

  // Handle clicking on an assessment in the history table
  const handleAssessmentClick = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
  };

  // Pagination for completed assessments
  const totalPages = Math.ceil(userAssessments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentAssessments = userAssessments.slice(startIndex, endIndex);

  // Pagination for scheduled tests
  const totalScheduledPages = Math.ceil(scheduledTests.length / ITEMS_PER_PAGE);
  const scheduledStartIndex = (currentScheduledPage - 1) * ITEMS_PER_PAGE;
  const scheduledEndIndex = scheduledStartIndex + ITEMS_PER_PAGE;
  const currentScheduledTests = scheduledTests.slice(scheduledStartIndex);

  // Function to get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "scheduled":
        return "bg-blue-100 text-blue-700";
      case "completed":
        return "bg-green-100 text-green-700";
      case "missed":
        return "bg-red-100 text-red-700";
      case "cancelled":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Get subcategory from subject_score JSON
  const getSubCategory = (assessment: Assessment) => {
    console.log("subjectscore", assessment?.subject_score);
    if (assessment?.subject_score) {
      try {
        const subjectScores = JSON.parse(assessment.subject_score);
        if (subjectScores.subCategory) {
          return subjectScores.subCategory;
        }
      } catch (e) {
        console.error("Error parsing subject scores for subcategory:", e);
      }
    }
    return ""; // Default fallback
  };

  // Custom legend formatter to handle long section names
  const customLegendFormatter = (value: string) => {
    // Truncate long section names to prevent overflow
    return value.length > 10 ? `${value.substring(0, 10)}...` : value;
  };

  // Calculate dashboard metrics
  const getDashboardMetrics = () => {
    const totalTests = userAssessments.length;

    // Count tests that have scores (completed tests)
    const completedTests = userAssessments.filter(
      (test) => test.score && test.overall && Number(test.score) > 0
    ).length;

    // Count passed tests (score >= 50%)
    const passedTests = userAssessments.filter((test) => {
      if (!test.score || !test.overall) return false;
      const score = Number(test.score);
      const total = Number(test.overall);
      return total > 0 && (score / total) * 100 >= 50;
    }).length;

    // Calculate average score from completed tests
    const averageScore =
      completedTests > 0
        ? userAssessments.reduce((sum, test) => {
            if (!test.score || !test.overall) return sum;
            const score = Number(test.score);
            const total = Number(test.overall);
            return total > 0 ? sum + (score / total) * 100 : sum;
          }, 0) / completedTests
        : 0;

    // Count pending tests
    const pendingTests = userAssessments.filter(
      (test) => test.review_status === "pending"
    ).length;

    return {
      totalTests,
      passedTests,
      completedTests,
      averageScore: Math.round(averageScore),
      pendingTests,
      successRate:
        completedTests > 0
          ? Math.round((passedTests / completedTests) * 100)
          : 0,
    };
  };

  const metrics = getDashboardMetrics();

  // Generate performance trend data
  const getPerformanceTrendData = () => {
    if (userAssessments.length === 0) return [];

    return userAssessments
      .slice(0, 5)
      .reverse()
      .map((assessment, index) => ({
        name: `Test ${index + 1}`,
        score:
          typeof getDisplayScore(assessment) === "number"
            ? getDisplayScore(assessment)
            : 0,
        date: format(new Date(assessment.created_at), "MMM d"),
      }));
  };

  const trendData = getPerformanceTrendData();

  const AssessmentHistory = () => (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 !pr-0">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back,{" "}
                {currentUserEmail ? currentUserEmail.split("@")[0] : "User"}! 👋
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Here's your learning progress and assessment overview
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => router.push("/questionaire")}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibod rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
              >
                <ClipboardCheck className="w-5 h-5 mr-2" />
                Start New Assessment
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Tests */}
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Total Tests
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {metrics.totalTests}
                </p>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <TrendingUp className="w-4 h-4 text-emerald-500 mr-2" />
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {metrics.totalTests > 0
                  ? `${Math.round(
                      (metrics.totalTests / (metrics.totalTests + 1)) * 100
                    )}% completion`
                  : "No tests yet"}
              </span>
            </div>
          </div>

          {/* Success Rate */}
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Trophy className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Success Rate
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {metrics.successRate}%
                </p>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <ArrowUpRight className="w-4 h-4 text-green-500 mr-2" />
              
            </div>
          </div>

          {/* Average Score */}
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Average Score
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {metrics.averageScore}%
                </p>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <ArrowUpRight className="w-4 h-4 text-blue-500 mr-2" />
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                {metrics.averageScore > 0
                  ? `${metrics.averageScore}% average`
                  : "No scores yet"}
              </span>
            </div>
          </div>

          {/* Pending Reviews */}
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/40 dark:to-yellow-800/40 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Pending Reviews
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {metrics.pendingTests}
                </p>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <Clock className="w-4 h-4 text-yellow-500 mr-2" />
              <span className="text-yellow-600 dark:text-yellow-400 font-medium">
                {metrics.pendingTests > 0
                  ? `${metrics.pendingTests} pending`
                  : "All reviewed"}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Performance Chart */}
          <div className="lg:col-span-2 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-emerald-600" />
                  Performance Overview
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Your recent assessment performance trends
                </p>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-lg font-medium hover:bg-emerald-200 transition-colors">
                  Last 5 Tests
                </button>
              </div>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop
                        offset="95%"
                        stopColor="#10b981"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="url(#colorScore)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Subject Performance */}
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <PieChartIcon className="w-5 h-5 mr-2 text-emerald-600" />
                Subject Breakdown
              </h2>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectPerformanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {subjectPerformanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${name}: ${value}`, ""]}
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{
                      fontSize: "12px",
                      overflowY: "auto",
                      maxHeight: "180px",
                      paddingLeft: "10px",
                      marginLeft: "15px",
                    }}
                    formatter={(value, entry) => {
                      const displayName =
                        value.length > 12
                          ? `${value.substring(0, 12)}...`
                          : value;
                      return (
                        <span
                          title={value}
                          className="text-gray-700 dark:text-gray-300"
                        >
                          {displayName}: {entry.payload?.value}
                        </span>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Assessment History */}
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <BarChart className="w-5 h-5 mr-2 text-emerald-600" />
                  Assessment History
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Track your progress and review past assessments
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <Tabs
              defaultValue="completed"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                <TabsTrigger
                  value="scheduled"
                  className="text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-lg"
                >
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Scheduled Tests
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-lg"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Completed Tests
                </TabsTrigger>
              </TabsList>

              <TabsContent value="completed" className="mt-0">
                {userAssessments.length > 0 ? (
                  <div className="relative">
                    {/* Search and Filter Bar */}
                    <div className="mb-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search assessments..."
                          value={globalFilter}
                          onChange={(e) => setGlobalFilter(e.target.value)}
                          onFocus={(e) =>
                            e.target.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            })
                          }
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {table.getFilteredRowModel().rows.length} of{" "}
                        {userAssessments.length} assessments
                      </div>
                    </div>

                    {/* Modern Table */}
                    <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                      <table className="w-full">
                        <thead className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-gray-700 dark:to-gray-600">
                          {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                              {headerGroup.headers.map((header) => (
                                <th
                                  key={header.id}
                                  className="px-6 py-4 text-left text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider cursor-pointer hover:bg-emerald-200 dark:hover:bg-gray-600 transition-colors"
                                  onClick={header.column.getToggleSortingHandler()}
                                >
                                  <div className="flex items-center gap-2">
                                    {flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                                    {header.column.getCanSort() && (
                                      <div className="flex flex-col">
                                        <ChevronUp className="w-3 h-3 -mb-1" />
                                        <ChevronDown className="w-3 h-3 -mt-1" />
                                      </div>
                                    )}
                                  </div>
                                </th>
                              ))}
                            </tr>
                          ))}
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {table.getRowModel().rows.map((row) => (
                            <tr
                              key={row.id}
                              className={`hover:bg-emerald-50 dark:hover:bg-emerald-900/10 cursor-pointer transition-all duration-200 ${
                                selectedAssessment?.id === row.original.id
                                  ? "bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-emerald-500"
                                  : ""
                              }`}
                              onClick={() =>
                                handleAssessmentClick(row.original)
                              }
                            >
                              {row.getVisibleCells().map((cell) => (
                                <td
                                  key={cell.id}
                                  className="px-6 py-4 text-sm text-gray-900 dark:text-white"
                                >
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Enhanced Pagination */}
                    {table.getPageCount() > 1 && (
                      <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                          <span>
                            Showing{" "}
                            {table.getState().pagination.pageIndex *
                              table.getState().pagination.pageSize +
                              1}{" "}
                            to{" "}
                            {Math.min(
                              (table.getState().pagination.pageIndex + 1) *
                                table.getState().pagination.pageSize,
                              table.getFilteredRowModel().rows.length
                            )}{" "}
                            of {table.getFilteredRowModel().rows.length} results
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <div className="flex items-center space-x-1">
                            {Array.from(
                              { length: Math.min(5, table.getPageCount()) },
                              (_, i) => {
                                const pageNum = i + 1;
                                return (
                                  <button
                                    key={pageNum}
                                    onClick={() =>
                                      table.setPageIndex(pageNum - 1)
                                    }
                                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                      table.getState().pagination.pageIndex ===
                                      pageNum - 1
                                        ? "bg-emerald-600 text-white"
                                        : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              }
                            )}
                          </div>
                          <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="mx-auto w-32 h-32 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-full flex items-center justify-center mb-6 shadow-sm">
                      <BookOpen className="w-16 h-16 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                      No assessments yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto leading-relaxed">
                      Start your first assessment to see your progress here and
                      track your learning journey
                    </p>
                    <button
                      onClick={() => router.push("/questionaire")}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                    >
                      <ClipboardCheck className="w-5 h-5 mr-2" />
                      Start Assessment
                    </button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="scheduled" className="mt-0">
                <div className="text-center py-16">
                  <div className="mx-auto w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <Calendar className="w-16 h-16 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    No scheduled tests
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
                    You don't have any upcoming scheduled assessments. Check
                    back later for new opportunities!
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Review Modal */}
        {isReviewModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {(selectedAssessment || mostRecentAssessment)!
                    .review_status === "rejected"
                    ? "Test Rejection Reason"
                    : "Review Notes"}
                </h3>
                <button
                  onClick={toggleReviewModal}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              <div
                className={`p-4 rounded-xl mb-4 border ${
                  (selectedAssessment || mostRecentAssessment)!
                    .review_status === "rejected"
                    ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700"
                    : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700"
                }`}
              >
                <p className="text-sm leading-relaxed">
                  {getReviewMessage(
                    selectedAssessment || mostRecentAssessment!
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Job Recommendations */}
        <div className="mt-8">
          {/* <JobViewUser /> */}
        </div>
      </div>
    </div>
  );

  return (
    <div className="overflow-y-auto h-screen">
      <AssessmentHistory />
    </div>
  );
};

export default JobTableUser;
