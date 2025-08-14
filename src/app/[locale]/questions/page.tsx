"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/useToast";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  Award,
  BarChart3,
  AlertTriangle,
  ClipboardCheck,
  Shield,
  Users,
  Target,
  Loader2,
  BookOpen,
  Timer,
  Eye,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  SkipForward,
  SkipBack,
} from "lucide-react";
import PostAssessmentView from "@/components/PostAssessmentView";
import {
  loadMediaPipeModels,
  getFaceEmbedding,
  compareWithStoredEmbedding,
  detectMultipleFaces,
} from "@/app/libs/mediapipeUtils";
import { AuthUser } from "@/app/apis/auth/islogin";
import { GetQuestion } from "@/app/apis/questions/get";
import { ContextData } from "@/components/context";
import { supabase } from "@/lib/supabase";
import PeriodicSupervision from "@/components/PeriodicSupervision";
import { usePeriodicSupervision } from "@/hooks/usePeriodicSupervision";
import { useTranslations } from "next-intl";
import LanguageSelector from "@/components/LanguageSelector";
import { useSmootherTimer } from "./timerFix"; // Import the new timer hook
import { CreateAnswers } from "@/app/apis/answers/create";
import { updateSubjectScores, logSubjectScores } from "@/utils/scoreUtils";
import LoadingAssessment from "@/components/LoadingAssessment";
import ProtectedRoute from "@/components/ProtectedRoute";

// Define types
interface QuestionType {
  question: string;
  options: { label: string; letter: string }[];
  correctAnswer: string;
  subject: string;
  time: string;
}

const Question = () => {
  const router = useRouter();
  const t = useTranslations();
  const { success, error: showError, loading, dismiss } = useToast();
  const timerInitializedRef = useRef(false);
  const [assessmentStage, setAssessmentStage] = useState<
    "rules" | "assessment" | "completed"
  >("rules");

  const [totalTimeForAllQuestions, setTotalTimeForAllQuestions] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const auth: any = AuthUser();
  const Datas = GetQuestion().questions;
  // At the top of your component, make sure questions is initialized as an empty array
  const [questions, setQuestions] = useState<any[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [saveSuccessful, setSaveSuccessful] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedValue, setSelectedValue] = useState("");
  const [timeWarning, setTimeWarning] = useState(false);
  const [score, setScore] = useState(0);
  // Add this state at the top of your component with other state variables
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraConnected, setCameraConnected] = useState(false);
  const cameraCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [supervisionInitialized, setSupervisionInitialized] = useState(false);

  interface SubjectScoresType {
    [key: string]: any;
    subCategory?: any;
    terminated?: boolean;
    terminationReason?: string;
  }

  const [subjectScores, setSubjectScores] = useState<SubjectScoresType>({});
  const [isTestTerminated, setIsTestTerminated] = useState(false);
  const [isMonitoringActive, setIsMonitoringActive] = useState(false);

  // Simplified supervision approach - just collect snapshots
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);
  const cameraStream = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const snapshotIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [cameraSetupInProgress, setCameraSetupInProgress] = useState(false);

  const handleAnswers = CreateAnswers();

  const [val, setVal] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [currentDiscipline, setCurrentDiscipline] = useState<string | null>(
    null
  );
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [testStartTime, setTestStartTime] = useState<Date | null>(null);
  const [testEndTime, setTestEndTime] = useState<Date | null>(null);
  const context = useContext(ContextData);
  const [currentDifficultyLevel, setCurrentDifficultyLevel] =
    useState<string>("intermediate");

  // Use the new smoother timer hook
  const { timeLeft, setTimeLeft, formattedTime } = useSmootherTimer(
    totalTimeForAllQuestions,
    assessmentStage === "assessment" && !showResult,
    () => {
      if (!showResult) {
        setTestEndTime(new Date());
        setShowResult(true);
        saveTestResults();
      }
    }
  );

  // Logger function for supervision events
  const logSupervisionEvent = (event: string, details?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[SUPERVISION ${timestamp}] ${event}`, details || "");
  };

  // Check if face embeddings exist in localStorage
  useEffect(() => {
    const checkFaceRegistration = () => {
      const storedEmbedding = localStorage.getItem("faceDescriptors");
      if (!storedEmbedding) {
        logSupervisionEvent(
          "No face embedding found, redirecting to registration"
        );
        showError(
          "Identity registration required before taking the assessment"
        );
        router.push("/facerecognition");
      } else {
        logSupervisionEvent("Identity verification data found");
      }
    };

    checkFaceRegistration();
  }, [router]);
  // Add periodic snapshot collection
  useEffect(() => {
    // Only run when in assessment stage and not showing results
    if (assessmentStage !== "assessment" || showResult) {
      return;
    }

    logSupervisionEvent("Starting periodic snapshot collection");

    // Take snapshots every 20 seconds
    const snapshotInterval = setInterval(() => {
      console.log("Taking periodic snapshot");
      takeSnapshot().then((snapshot) => {
        if (snapshot) {
          console.log(
            `Adding snapshot with status: ${
              snapshot.verificationStatus
            }, total now: ${snapshots.length + 1}`
          );
          setSnapshots((prev) => [...prev, snapshot]);
        } else {
          console.log("Snapshot was null, not adding to collection");
        }
      });
    }, 20000); // 20 seconds

    // Clean up interval on unmount or when assessment ends
    return () => {
      console.log("Clearing snapshot interval");
      clearInterval(snapshotInterval);
    };
  }, [assessmentStage, showResult]);

  // Then modify your setupCamera function to use this lock
  const setupCamera = async () => {
    // If setup is already in progress, don't try again
    if (cameraSetupInProgress) {
      logSupervisionEvent(
        "Camera setup already in progress, skipping duplicate attempt"
      );
      return false;
    }

    setCameraSetupInProgress(true);

    try {
      // Try to get a stream with higher quality settings
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      if (hiddenVideoRef.current) {
        hiddenVideoRef.current.srcObject = stream;
        cameraStream.current = stream;
        hiddenVideoRef.current.muted = true;
        hiddenVideoRef.current.playsInline = true;

        // Play the video
        try {
          await hiddenVideoRef.current.play();
          logSupervisionEvent("Video playback started");
        } catch (playError) {
          logSupervisionEvent("Error playing video", playError);
          setCameraSetupInProgress(false);
          return false;
        }

        // Wait for video to be ready with better logging
        await new Promise<void>((resolve) => {
          const checkVideoReady = () => {
            if (
              hiddenVideoRef.current &&
              hiddenVideoRef.current.readyState >= 2 &&
              hiddenVideoRef.current.videoWidth > 0
            ) {
              logSupervisionEvent("Video feed loaded and ready", {
                readyState: hiddenVideoRef.current.readyState,
                width: hiddenVideoRef.current.videoWidth,
                height: hiddenVideoRef.current.videoHeight,
              });
              resolve();
            } else if (
              hiddenVideoRef.current &&
              hiddenVideoRef.current.readyState >= 1
            ) {
              logSupervisionEvent(
                "Video has metadata but may not be fully loaded",
                {
                  readyState: hiddenVideoRef.current.readyState,
                  width: hiddenVideoRef.current?.videoWidth || 0,
                  height: hiddenVideoRef.current?.videoHeight || 0,
                }
              );
              // If we at least have metadata, we can proceed after a short delay
              setTimeout(resolve, 1000); // Increased from 500ms to 1000ms
            } else {
              logSupervisionEvent("Video not ready yet, waiting...");
              setTimeout(checkVideoReady, 100);
            }
          };

          checkVideoReady();
          // Set a timeout to resolve anyway after 5 seconds (increased from 3)
          setTimeout(() => {
            logSupervisionEvent(
              "Video load timeout reached, proceeding anyway"
            );
            resolve();
          }, 5000);
        });

        // Make the video element visible for debugging (you can remove this in production)
        hiddenVideoRef.current.style.position = "fixed";
        hiddenVideoRef.current.style.bottom = "10px";
        hiddenVideoRef.current.style.right = "10px";
        hiddenVideoRef.current.style.width = "160px";
        hiddenVideoRef.current.style.height = "120px";
        hiddenVideoRef.current.style.opacity = "0.5";
        hiddenVideoRef.current.style.zIndex = "1000";

        // Set camera as connected
        setCameraConnected(true);
        logSupervisionEvent("Camera stream initialized successfully");
        setCameraSetupInProgress(false);
        return true;
      }
      setCameraSetupInProgress(false);
      return false;
    } catch (error) {
      logSupervisionEvent("Camera setup error", error);
      console.error("Error setting up camera:", error);
      setCameraConnected(false);
      setCameraSetupInProgress(false);
      return false;
    }
  };

  // Separate function to explicitly check camera connection before taking snapshot
  const verifyCameraConnection = () => {
    const videoElement = hiddenVideoRef.current;

    if (!videoElement) {
      return false;
    }

    const stream = videoElement.srcObject as MediaStream;

    if (!stream || !stream.active) {
      return false;
    }

    // Check if video tracks are active
    const videoTracks = stream.getVideoTracks();
    return videoTracks.length > 0 && videoTracks[0].readyState === "live";
  };

  // Update the startSnapshotCollection function to check camera before starting
  const startSnapshotCollection = () => {
    // Clear any existing interval
    if (snapshotIntervalRef.current) {
      clearInterval(snapshotIntervalRef.current);
    }

    // Take initial snapshot
    takeSnapshot().then((snapshot) => {
      if (snapshot) {
        setSnapshots([snapshot]);
      }
    });

    // Set interval for periodic snapshots (every 20 seconds)
    snapshotIntervalRef.current = setInterval(() => {
      console.log("Taking periodic snapshot");

      // First verify camera connection before taking snapshot
      if (verifyCameraConnection()) {
        takeSnapshot().then((snapshot) => {
          if (snapshot) {
            console.log(
              `Adding snapshot with status: ${
                snapshot.verificationStatus
              }, total now: ${snapshots.length + 1}`
            );
            setSnapshots((prev) => [...prev, snapshot]);
          }
        });
      } else {
        console.log("Camera connection check failed during scheduled snapshot");
        // If camera is not connected, force a check
        checkCameraStatus();
      }
    }, 30000); // Take a snapshot every 30 seconds
  };

  // Stop snapshot collection
  const stopSnapshotCollection = () => {
    if (snapshotIntervalRef.current) {
      clearInterval(snapshotIntervalRef.current);
      snapshotIntervalRef.current = null;
      logSupervisionEvent("Snapshot collection stopped");
    }
  };

  // Cleanup camera resources when component unmounts
  useEffect(() => {
    return () => {
      stopSnapshotCollection();

      if (cameraStream.current) {
        cameraStream.current.getTracks().forEach((track) => track.stop());
        logSupervisionEvent("Camera resources cleaned up");
      }
    };
  }, []);

  // Create a new file to fix the analyzeSnapshots function
  const analyzeSnapshots = async () => {
    logSupervisionEvent(`Analyzing ${snapshots.length} collected snapshots`);

    // If no snapshots collected, return a default result
    if (snapshots.length === 0) {
      return {
        verified: false,
        results: {
          totalSnapshots: 0,
          noFaceDetected: 0,
          identityMatches: 0,
          identityMismatches: 0,
          multipleFacesDetected: 0,
          errors: 0,
          verificationRate: 0,
        },
      };
    }

    // Count different types of snapshots
    let noFaceDetected = 0;
    let identityMatches = 0;
    let identityMismatches = 0;
    let multipleFacesDetected = 0;
    let errors = 0;

    snapshots.forEach((snapshot) => {
      // Use the explicit verificationStatus field to determine the status
      switch (snapshot.verificationStatus) {
        case "verified":
          identityMatches++;
          break;
        case "wrong_person":
          identityMismatches++;
          break;
        case "multiple_faces":
          multipleFacesDetected++;
          break;
        case "no_face":
          noFaceDetected++;
          break;
        case "error":
          errors++;
          break;
        default:
          // Fall back to the older logic for snapshots without explicit status
          if (snapshot.multipleFacesDetected) {
            multipleFacesDetected++;
          } else if (snapshot.embedding) {
            if (snapshot.verified) {
              identityMatches++;
            } else {
              identityMismatches++;
            }
          } else {
            // If no embedding and not multiple faces, then no face was detected
            noFaceDetected++;
          }
      }
    });

    // Calculate verification rate among snapshots with a single face
    const singleFaceSnapshots =
      snapshots.length - noFaceDetected - multipleFacesDetected - errors;
    const verificationRate =
      singleFaceSnapshots > 0
        ? (identityMatches / singleFaceSnapshots) * 100
        : 0;

    // Determine overall verification status
    // At least 50% of snapshots with a face must be verified
    const verified = verificationRate >= 50 && identityMatches > 0;

    const results = {
      totalSnapshots: snapshots.length,
      noFaceDetected,
      identityMatches,
      identityMismatches,
      multipleFacesDetected,
      errors,
      verificationRate,
    };

    logSupervisionEvent("Snapshot analysis complete", results);

    return {
      verified,
      results,
    };
  };

  // Get selected section and difficulty level
  const getSelectedSectionAndDifficulty = () => {
    // First try localStorage (most reliable source after page navigation)
    const storedSection = localStorage.getItem("selectedSection");
    const storedDifficulty = localStorage.getItem("difficultyLevel");

    if (storedSection) {
      console.log("Using section from localStorage:", storedSection);
      return {
        section: storedSection,
        difficultyLevel: storedDifficulty || "intermediate",
      };
    }

    // Then try context
    if (context?.data) {
      console.log("Using section from context:", context.data);
      return {
        section: context.data,
        difficultyLevel: context.difficultyLevel || "intermediate",
      };
    }

    // Default fallback
    console.warn("No section found in localStorage or context, using default");
    return { section: "Finance", difficultyLevel: "intermediate" };
  };

  // Authentication effect
  useEffect(() => {
    const getUser = async () => {
      setAuthLoading(true);

      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          console.error("Auth error:", error);
          showError("Authentication error. Please log in again.");
          setTimeout(() => router.push("/"), 2000);
          return;
        }

        if (data && data.user) {
          setUser(data.user);

          // Get selected section and difficulty
          const { section, difficultyLevel } =
            getSelectedSectionAndDifficulty();
          setCurrentDiscipline(section);
          setCurrentDifficultyLevel(difficultyLevel);

          // Check if user has any terminated assessments
          const { data: assessmentData, error: assessmentError } =
            await supabase
              .from("answers")
              .select("metadata")
              .eq("email", data.user.email)
              .eq("discipline", section)
              .order("created_at", { ascending: false })
              .limit(1);

          if (assessmentData && assessmentData.length > 0) {
            try {
              const metadata = JSON.parse(assessmentData[0].metadata || "{}");
              if (metadata.terminated) {
                showError(
                  "Your previous assessment was terminated due to a violation. You cannot retake this assessment."
                );
                setTimeout(() => router.push("/test"), 2000);
                return;
              }
            } catch (e) {
              console.error("Error parsing metadata", e);
            }
          }
        } else {
          console.error("No user found in session");
          showError("No user found. Please log in again.");
          setTimeout(() => router.push("/"), 2000);
        }
      } catch (err) {
        console.error("Unexpected auth error:", err);
      } finally {
        setAuthLoading(false);
      }
    };

    getUser();
  }, [router, context]);
  // Load and filter questions
  useEffect(() => {
    if (Datas && Datas.length > 0 && currentDiscipline) {
      setDataLoading(true);
      console.log(
        `Filtering questions for discipline: ${currentDiscipline}, difficulty: ${currentDifficultyLevel}`
      );

      // Filter the items based on the user's section/discipline
      let filteredQuestions = Datas.filter(
        (item: any) => item.Function === currentDiscipline
      );

      console.log(
        `Found ${filteredQuestions.length} questions for ${currentDiscipline}`
      );

      // Get the stored subcategories from localStorage
      const storedSubCategories = localStorage.getItem("subCategories");
      let subCategories: string[] = [];

      if (storedSubCategories) {
        try {
          subCategories = JSON.parse(storedSubCategories);
          console.log("Using subcategories from localStorage:", subCategories);
        } catch (e) {
          console.error("Error parsing subcategories from localStorage:", e);
        }
      }

      // If we have subcategories, filter by them
      if (subCategories && subCategories.length > 0) {
        console.log(
          `Further filtering by ${subCategories.length} subcategories`
        );

        const beforeCount = filteredQuestions.length;
        filteredQuestions = filteredQuestions.filter((item: any) => {
          if (!item.sub_category) return false;
          return subCategories.includes(item.sub_category);
        });

        console.log(
          `Filtered by subcategories: ${filteredQuestions.length} questions (from ${beforeCount})`
        );
      }
      // If no subcategories found, fall back to difficulty-based filtering
      else {
        console.log(
          `No subcategories found, falling back to difficulty filtering: ${currentDifficultyLevel}`
        );

        const beforeCount = filteredQuestions.length;
        filteredQuestions = filteredQuestions.filter((item: any) => {
          // First check explicit difficulty field
          if (item.difficulty) {
            return (
              item.difficulty.toLowerCase() ===
              currentDifficultyLevel.toLowerCase()
            );
          }

          // Then check sub_category for difficulty indicators
          if (item.sub_category) {
            const subCat = item.sub_category.toLowerCase();

            if (currentDifficultyLevel === "beginner") {
              return (
                subCat.includes("beginner") ||
                subCat.includes("_001_") ||
                subCat.includes("_default")
              );
            } else if (currentDifficultyLevel === "advanced") {
              return subCat.includes("advance") || subCat.includes("_003_");
            } else if (currentDifficultyLevel === "intermediate") {
              return (
                subCat.includes("intermediary") ||
                subCat.includes("intermediate") ||
                subCat.includes("_002_")
              );
            }
          }

          // If no difficulty info is available, include for intermediate only
          return currentDifficultyLevel === "intermediate";
        });

        console.log(
          `Filtered by difficulty: ${filteredQuestions.length} questions (from ${beforeCount})`
        );
      }

      if (filteredQuestions.length === 0) {
        console.warn(
          `No questions found for ${currentDiscipline} at ${currentDifficultyLevel} level`
        );
        showError(
          `No questions available for ${currentDiscipline} at ${currentDifficultyLevel} level. Please try a different difficulty level.`
        );
        setDataLoading(false);
        return;
      }

      // Format questions and continue with existing code...
      const formattedQuestions = filteredQuestions.map((question: any) => {
        // Parse timing value from database (stored in minutes) to seconds
        let timingInSeconds = 60; // Default to 60 seconds if no timing provided

        if (question.Timing !== null && question.Timing !== undefined) {
          // Convert any timing value to minutes, then to seconds
          const minutesValue = parseFloat(question.Timing);
          if (!isNaN(minutesValue)) {
            timingInSeconds = Math.round(minutesValue * 60); // Convert minutes to seconds
          }
        }

        // Ensure timing is at least 30 seconds
        timingInSeconds = Math.max(timingInSeconds, 30);

        console.log(
          `Question ${question.Serial}: Timing = ${timingInSeconds} seconds (from ${question.Timing} minutes)`
        );

        return {
          id: question.Serial,
          question: question.Question,
          options: [
            { letter: "A", label: question.A },
            { letter: "B", label: question.B },
            { letter: "C", label: question.C },
            { letter: "D", label: question.D },
          ],
          correctAnswer: question.Correct_Answer,
          subject: question.Area || "General",
          timing: timingInSeconds, // Use the properly parsed timing value in seconds
        };
      });

      // Set questions state
      setQuestions(formattedQuestions);

      // Calculate total time for all questions based ONLY on database values
      const totalTime = formattedQuestions.reduce((acc, curr) => {
        return acc + curr.timing;
      }, 0);

      // Log the calculated time for debugging
      console.log(
        `Total time calculated from questions: ${totalTime} seconds (${Math.floor(
          totalTime / 60
        )} minutes and ${totalTime % 60} seconds)`
      );

      // Set the time in state
      setTotalTimeForAllQuestions(totalTime);

      // Only set dataLoading to false once at the end
      setDataLoading(false);
      console.log(`Loaded ${formattedQuestions.length} formatted questions`);
    }
  }, [Datas, currentDiscipline, currentDifficultyLevel]);
  // Initialize subject scores
  useEffect(() => {
    if (questions.length > 0) {
      // Get unique subjects from questions
      const subjects = new Set(questions.map((q) => q.subject));

      // Initialize subject scores with 0 values
      const initialSubjectScores: { [key: string]: number } = {};
      subjects.forEach((subject) => {
        initialSubjectScores[subject] = 0;
      });

      console.log("Initialized subject scores:", initialSubjectScores);
      setSubjectScores(initialSubjectScores);
    }
  }, [questions]);

  // Initialize timer
  useEffect(() => {
    console.log("Timer effect running with:", {
      totalTimeForAllQuestions,
      assessmentStage,
      showResult,
      isNumber: typeof totalTimeForAllQuestions === "number",
    });

    if (
      typeof totalTimeForAllQuestions === "number" &&
      totalTimeForAllQuestions > 0 &&
      assessmentStage === "assessment" &&
      !showResult &&
      !timerInitializedRef.current
    ) {
      console.log(
        "Initializing timer with database time:",
        totalTimeForAllQuestions,
        "seconds"
      );
      setTimeLeft(totalTimeForAllQuestions);
      timerInitializedRef.current = true;
      setTestStartTime(new Date());

      // Initialize the timer display
      const timerElement = document.getElementById("timer-display");
      if (timerElement) {
        timerElement.textContent = formattedTime;
      }
    }
  }, [
    totalTimeForAllQuestions,
    assessmentStage,
    showResult,
    setTimeLeft,
    formattedTime,
  ]);

  // Show time warning when 20% of time is left
  useEffect(() => {
    // Check if we need to show a time warning (when 20% of time is left)
    if (
      timeLeft === Math.floor(totalTimeForAllQuestions * 0.2) &&
      !timeWarning &&
      assessmentStage === "assessment"
    ) {
      setTimeWarning(true);
      showError("You're running out of time! 20% remaining.");
    }
  }, [timeLeft, totalTimeForAllQuestions, timeWarning, assessmentStage]);

  // Safety check for timer
  useEffect(() => {
    if (timeLeft === 0 && assessmentStage === "assessment" && !showResult) {
      console.log("SAFETY CHECK: Time is 0, ending test");
      setTestEndTime(new Date());
      setShowResult(true);
      showError("Time's up! Your assessment has ended.");
      saveTestResults();
    }
  }, [timeLeft, assessmentStage, showResult]);

  // Calculate test duration in minutes
  const calculateTestDuration = () => {
    if (!testStartTime || !testEndTime) return 0;
    const durationMs = testEndTime.getTime() - testStartTime.getTime();
    return Math.round(durationMs / 60000); // Convert to minutes
  };

  // Handle Option Selection
  const handleChange = (value: string, letter: string) => {
    setSelectedValue(value);
    setVal(letter);

    // Update userAnswers array
    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentQuestionIndex] = letter;
    setUserAnswers(updatedAnswers);
  };
  // Handle Next Question
  const handleNext = () => {
    if (!questions || questions.length === 0) return;

    // Proceed to next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedValue("");
      setVal("");

      // Take a snapshot when changing questions (but not too frequently)
      const lastSnapshot = snapshots[snapshots.length - 1];
      const now = new Date();

      if (
        !lastSnapshot ||
        now.getTime() - new Date(lastSnapshot.timestamp).getTime() > 15000
      ) {
        // Only take a new snapshot if it's been more than 15 seconds since the last one
        console.log("Taking snapshot on question change");
        takeSnapshot().then((snapshot) => {
          if (snapshot) {
            console.log(
              `Adding snapshot with status: ${
                snapshot.verificationStatus
              }, total now: ${snapshots.length + 1}`
            );
            setSnapshots((prev) => [...prev, snapshot]);
          } else {
            console.log("Snapshot was null, not adding to collection");
          }
        });
      }
    }
  };

  // Handle Previous Question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);

      // Set the selected value based on previous answer
      const previousAnswer = userAnswers[currentQuestionIndex - 1];
      setVal(previousAnswer || "");

      if (previousAnswer) {
        const option = questions[currentQuestionIndex - 1].options.find(
          (opt: any) => opt.letter === previousAnswer
        );
        setSelectedValue(option?.label || "");
      } else {
        setSelectedValue("");
      }
    }
  };
  const calculateScore = () => {
    if (!questions || questions.length === 0) {
      console.log("No questions available for score calculation");
      return 0;
    }

    console.log(`Calculating score for ${userAnswers.length} answers`);

    // Count total correct answers
    let totalScore = 0;

    // Log the answers for debugging
    console.log("User answers:", userAnswers);
    console.log(
      "Correct answers:",
      questions.map((q) => q.correctAnswer)
    );

    // Count correct answers
    userAnswers.forEach((answer, index) => {
      if (questions[index] && answer === questions[index].correctAnswer) {
        totalScore++;
        console.log(`Question ${index + 1}: Correct! (${answer})`);
      } else if (questions[index]) {
        console.log(
          `Question ${index + 1}: Wrong. User: ${answer}, Correct: ${
            questions[index].correctAnswer
          }`
        );
      }
    });

    // Update the score state
    setScore(totalScore);
    console.log(`Total score: ${totalScore}/${questions.length}`);

    // Update subject scores using our utility function
    const updatedSubjectScores = updateSubjectScores(
      questions,
      userAnswers,
      subjectScores
    );

    // Log the updated subject scores
    logSubjectScores(updatedSubjectScores);

    // Update the subject scores state
    setSubjectScores(updatedSubjectScores);

    return totalScore;
  };

  // Enhanced SnapshotDebugView component
  const SnapshotDebugView = ({ snapshots }: { snapshots: any[] }) => {
    // Calculate statistics
    const totalSnapshots = snapshots.length;
    const noFaceCount = snapshots.filter(
      (s) =>
        s.verificationStatus === "no_face" ||
        (!s.embedding && !s.multipleFacesDetected)
    ).length;
    const multipleFacesCount = snapshots.filter(
      (s) =>
        s.verificationStatus === "multiple_faces" || s.multipleFacesDetected
    ).length;
    const verifiedCount = snapshots.filter(
      (s) => s.verificationStatus === "verified" || (s.embedding && s.verified)
    ).length;
    const wrongPersonCount = snapshots.filter(
      (s) =>
        s.verificationStatus === "wrong_person" || (s.embedding && !s.verified)
    ).length;
    const errorCount = snapshots.filter(
      (s) => s.verificationStatus === "error"
    ).length;

    // Calculate detection rate
    const faceDetectionRate =
      totalSnapshots > 0
        ? ((totalSnapshots - noFaceCount - errorCount) / totalSnapshots) * 100
        : 0;

    // Calculate verification rate (among snapshots with a single face)
    const singleFaceCount =
      totalSnapshots - noFaceCount - multipleFacesCount - errorCount;
    const verificationRate =
      singleFaceCount > 0 ? (verifiedCount / singleFaceCount) * 100 : 0;

    return (
      <div className="mt-6 p-6 border rounded-lg bg-white shadow-sm">
        <h3 className="text-xl font-medium mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-blue-600" />
          Supervision Debug Info (Testing Only)
        </h3>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">Total Snapshots</div>
            <div className="text-xl font-bold">{totalSnapshots}</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">
              Face Detection Rate
            </div>
            <div className="text-xl font-bold">
              {faceDetectionRate.toFixed(0)}%
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">
              Identity Verification Rate
            </div>
            <div className="text-xl font-bold">
              {verificationRate.toFixed(0)}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2 mb-4">
          <div className="bg-green-50 p-2 rounded text-center">
            <div className="text-xs text-gray-500">Verified</div>
            <div className="font-bold">{verifiedCount}</div>
          </div>
          <div className="bg-red-50 p-2 rounded text-center">
            <div className="text-xs text-gray-500">Wrong Person</div>
            <div className="font-bold">{wrongPersonCount}</div>
          </div>
          <div className="bg-amber-50 p-2 rounded text-center">
            <div className="text-xs text-gray-500">Multiple Faces</div>
            <div className="font-bold">{multipleFacesCount}</div>
          </div>
          <div className="bg-gray-50 p-2 rounded text-center">
            <div className="text-xs text-gray-500">No Face</div>
            <div className="font-bold">{noFaceCount}</div>
          </div>
          <div className="bg-gray-50 p-2 rounded text-center">
            <div className="text-xs text-gray-500">Errors</div>
            <div className="font-bold">{errorCount}</div>
          </div>
        </div>

        <div className="overflow-auto max-h-[500px] border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-100">
              <tr>
                <th className="p-3 text-left font-medium text-gray-600">
                  Time
                </th>
                <th className="p-3 text-left font-medium text-gray-600">
                  Status
                </th>
                <th className="p-3 text-left font-medium text-gray-600">
                  Details
                </th>
                <th className="p-3 text-left font-medium text-gray-600">
                  Image
                </th>
              </tr>
            </thead>
            <tbody>
              {snapshots.map((snapshot, i) => {
                // Determine status for display
                let status = "Unknown";
                let statusClass = "bg-gray-100 text-gray-800";

                if (
                  snapshot.verificationStatus === "verified" ||
                  (snapshot.embedding && snapshot.verified)
                ) {
                  status = "Verified";
                  statusClass = "bg-green-100 text-green-800";
                } else if (
                  snapshot.verificationStatus === "wrong_person" ||
                  (snapshot.embedding && !snapshot.verified)
                ) {
                  status = "Wrong Person";
                  statusClass = "bg-red-100 text-red-800";
                } else if (
                  snapshot.verificationStatus === "multiple_faces" ||
                  snapshot.multipleFacesDetected
                ) {
                  status = "Multiple Faces";
                  statusClass = "bg-amber-100 text-amber-800";
                } else if (
                  snapshot.verificationStatus === "no_face" ||
                  (!snapshot.embedding && !snapshot.multipleFacesDetected)
                ) {
                  status = "No Face";
                  statusClass = "bg-gray-100 text-gray-800";
                } else if (snapshot.verificationStatus === "error") {
                  status = "Error";
                  statusClass = "bg-red-100 text-red-800";
                }

                return (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="p-3 text-gray-700">
                      {new Date(snapshot.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-gray-600">
                      {snapshot.verificationStatus === "multiple_faces"
                        ? "Multiple people detected"
                        : snapshot.embedding
                        ? snapshot.verified
                          ? "Identity matched"
                          : "Identity mismatch"
                        : "No face detected"}
                    </td>
                    <td className="p-3">
                      {snapshot.dataUrl ? (
                        <div className="relative">
                          <img
                            src={snapshot.dataUrl}
                            alt={`Snapshot ${i + 1}`}
                            className="w-32 h-24 object-cover rounded border border-gray-200"
                          />
                          {snapshot.embedding && (
                            <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1 rounded">
                              Face detected
                            </div>
                          )}
                          {snapshot.multipleFacesDetected && (
                            <div className="absolute top-1 right-1 bg-amber-500 text-white text-xs px-1 rounded">
                              Multiple
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">No image</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-lg text-sm text-amber-700">
          <strong>Note:</strong> This debug view is for testing purposes only
          and will be removed in production.
        </div>
      </div>
    );
  };
  // Enhanced takeSnapshot function to better handle face detection failures
  const takeSnapshot = async () => {
    if (!hiddenVideoRef.current || hiddenVideoRef.current.readyState !== 4) {
      logSupervisionEvent("Video not ready for snapshot");
      return {
        timestamp: new Date().toISOString(),
        dataUrl: null,
        multipleFacesDetected: false,
        embedding: null,
        verified: false,
        verificationStatus: "error",
      };
    }

    try {
      // Create canvas if it doesn't exist
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }

      const video = hiddenVideoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        logSupervisionEvent("Could not get canvas context");
        return {
          timestamp: new Date().toISOString(),
          dataUrl: null,
          multipleFacesDetected: false,
          embedding: null,
          verified: false,
          verificationStatus: "error",
        };
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the current video frame to the canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get dataUrl before any processing to ensure we have an image
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

      // Log video dimensions for debugging
      logSupervisionEvent(
        `Video dimensions: ${video.videoWidth}x${video.videoHeight}`
      );

      // First check for multiple faces - with additional logging
      logSupervisionEvent("Attempting to detect faces");
      const hasMultipleFaces = await detectMultipleFaces(video);

      // Get face embedding with additional logging
      logSupervisionEvent("Attempting to get face embedding");
      let embedding = await getFaceEmbedding(video);

      // Log the embedding result
      if (embedding) {
        logSupervisionEvent("Face embedding obtained successfully");
      } else {
        logSupervisionEvent("Failed to get face embedding");
      }

      // Prepare snapshot data - always include the dataUrl now
      const snapshotData = {
        timestamp: new Date().toISOString(),
        dataUrl: dataUrl, // Always include the image
        multipleFacesDetected: hasMultipleFaces,
        embedding: null as Float32Array | null,
        verified: false,
        verificationStatus: "no_face", // Default status
      };

      // If multiple faces detected, set that status regardless of embedding
      if (hasMultipleFaces) {
        logSupervisionEvent("Multiple faces detected in snapshot");
        snapshotData.verificationStatus = "multiple_faces";
        return snapshotData;
      }

      // If we have an embedding, add verification data
      if (embedding) {
        logSupervisionEvent("Single face detected in snapshot");
        // Verify against stored embedding with a reduced threshold of 0.7 (was 0.8)
        const isVerified = await compareWithStoredEmbedding(embedding, 0.7);
        snapshotData.embedding = embedding;
        snapshotData.verified = isVerified;
        snapshotData.verificationStatus = isVerified
          ? "verified"
          : "wrong_person";
        logSupervisionEvent(
          `Face verification result: ${
            isVerified ? "Verified" : "Not verified"
          }`
        );
        return snapshotData;
      } else {
        // No face detected - be explicit about this
        logSupervisionEvent("No face detected in snapshot");
        console.log("Returning snapshot with NO face detected");
        snapshotData.verificationStatus = "no_face";

        // Return the snapshot with the image data anyway
        return snapshotData;
      }
    } catch (error) {
      logSupervisionEvent("Error taking snapshot", error);
      return {
        timestamp: new Date().toISOString(),
        dataUrl: null,
        multipleFacesDetected: false,
        embedding: null,
        verified: false,
        verificationStatus: "error",
      };
    }
  };

  const saveTestResults = async () => {
    if (saveAttempted || questions.length === 0) {
      return;
    }

    setSaveAttempted(true);
    setTestEndTime(new Date());
    setShowResult(true);

    stopSnapshotCollection();

    try {
      let userEmail = user?.email;
      if (!userEmail && auth?.user?.email) {
        userEmail = auth.user.email;
      }

      if (!userEmail) {
        showError("User email not found. Please ensure you're logged in.");
        return;
      }

      // Calculate the scores directly before saving to ensure we have the latest values
      // This is crucial - we calculate the scores right before saving instead of relying on state
      const finalScore = calculateScore();
      console.log("Final score calculated:", finalScore);

      // Get the updated subject scores directly from a fresh calculation
      const updatedSubjectScores = updateSubjectScores(questions, userAnswers, {
        ...subjectScores,
      });

      const storedSubCategories = localStorage.getItem("subCategories");
      const subcat = storedSubCategories
        ? (JSON.parse(storedSubCategories) as any)
        : null;

      // Create a clean subject scores object with our freshly calculated values
      let finalSubjectScores = { ...updatedSubjectScores };

      // Add subcategories
      if (subcat) {
        finalSubjectScores.subCategory = subcat;
      }

      // Log the final subject scores before saving
      console.log("Final subject scores before saving:", finalSubjectScores);
      logSubjectScores(finalSubjectScores);

      // Convert to JSON string to ensure proper format for database
      const subjectScoresJson = JSON.stringify(finalSubjectScores);

      console.log("Saving test results:", {
        email: userEmail,
        score: finalScore,
        subjectScores: subjectScoresJson,
        discipline: currentDiscipline || "Finance",
        questionCount: questions.length,
        snapshotsCount: snapshots.length,
      });

      // Analyze snapshots before saving
      const snapshotAnalysis = await analyzeSnapshots();
      console.log("Snapshot analysis:", snapshotAnalysis);

      // Save results to database with improved error handling and include snapshots
      const result = await handleAnswers.Save(
        userEmail,
        finalScore,
        subjectScoresJson, // Pass as JSON string
        currentDiscipline || "Finance",
        questions.length,
        snapshots // Pass the snapshots array
      );

      if (result?.error) {
        console.error("Error saving results:", result.error);
        showError("Failed to save results: " + result.error);
      } else {
        setSaveSuccessful(true);

        // Show appropriate toast message based on whether the test was assigned
        if (result.assignedToExaminers) {
          success(`Assessment results saved successfully!.`);
        } else {
          success("Assessment results saved successfully! .");
        }

        // Clean up localStorage after test is completed
        localStorage.removeItem("selectedSection");
        localStorage.removeItem("difficultyLevel");
        localStorage.removeItem("scheduledDate");
        localStorage.removeItem("scheduledTime");
      }
    } catch (error) {
      console.error("Error saving test results:", error);
      showError("An error occurred while saving results");
    }
  };
  const handleSubmit = async () => {
    console.log("Submit button clicked - starting submission process");

    // Stop snapshot collection using your existing function
    stopSnapshotCollection();
    console.log("Snapshot collection stopped");

    // Clear intervals directly
    if (snapshotIntervalRef.current) {
      clearInterval(snapshotIntervalRef.current);
      snapshotIntervalRef.current = null;
      console.log("Snapshot interval cleared");
    }

    if (cameraCheckIntervalRef.current) {
      clearInterval(cameraCheckIntervalRef.current);
      cameraCheckIntervalRef.current = null;
      console.log("Camera check interval cleared");
    }

    // Stop camera stream if available
    if (hiddenVideoRef.current && hiddenVideoRef.current.srcObject) {
      const stream = hiddenVideoRef.current.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        console.log("Camera tracks stopped");
      }
    }

    // Calculate final score
    const finalScore = calculateScore();
    console.log("Final score on submit:", finalScore);

    // Set test end time
    setTestEndTime(new Date());
    console.log("Test end time set:", new Date());

    // IMPORTANT: Set assessmentStage to "completed" first
    // This prevents the camera initialization useEffect from running again
    setAssessmentStage("completed");

    // Then set showResult to true
    setShowResult(true);

    // Save results to database
    await saveTestResults();
  };
  // Simplified camera status check function - just show toast and change state
  const checkCameraStatus = useCallback(async () => {
    if (assessmentStage !== "assessment" || showResult) {
      return;
    }

    try {
      const videoElement = hiddenVideoRef.current;
      const streamActive =
        videoElement?.srcObject &&
        (videoElement.srcObject as MediaStream).active;
      const videoTracks = videoElement?.srcObject
        ? (videoElement.srcObject as MediaStream).getVideoTracks()
        : [];
      const tracksLive = videoTracks.some(
        (track) => track.readyState === "live"
      );
      const isConnected = videoElement && streamActive && tracksLive;

      if (!isConnected) {
        // Stop all monitoring
        if (snapshotIntervalRef.current) {
          clearInterval(snapshotIntervalRef.current);
          snapshotIntervalRef.current = null;
        }

        if (cameraCheckIntervalRef.current) {
          clearInterval(cameraCheckIntervalRef.current);
          cameraCheckIntervalRef.current = null;
        }

        // Stop any active camera stream
        if (cameraStream.current) {
          cameraStream.current.getTracks().forEach((track) => {
            track.stop();
          });
        }

        // Show error message toast only
        showError(
          "Camera disconnected. Assessment terminated for security reasons."
        );

        // Log the termination
        logSupervisionEvent(
          "Assessment terminated due to camera disconnection"
        );

        // Change state directly - no alerts, no confirmations
        setAssessmentStage("rules");
      } else if (!cameraConnected) {
        setCameraConnected(true);
        logSupervisionEvent("Camera connection restored");
      }
    } catch (error) {
      // Show error toast only
      showError(
        "Camera monitoring error. Assessment terminated for security reasons."
      );

      // Change state directly - no alerts, no confirmations
      setAssessmentStage("rules");
    }
  }, [assessmentStage, cameraConnected, showResult, setAssessmentStage]);

  // Add event listeners to detect tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (assessmentStage === "assessment" && !showResult) {
        if (document.visibilityState === "hidden") {
          logSupervisionEvent("Tab lost focus - user switched away from test");
          // Could implement additional security measures here
        } else {
          logSupervisionEvent("Tab regained focus");
          // Immediately check camera status when tab regains focus
          checkCameraStatus();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [assessmentStage, showResult, checkCameraStatus]);

  // Add listener for before unload to warn user
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (assessmentStage === "assessment" && !showResult) {
        // Standard way to show a confirmation dialog before leaving
        e.preventDefault();
        e.returnValue = ""; // Chrome requires returnValue to be set
        return ""; // This text is usually ignored by browsers
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [assessmentStage, showResult]);
  // Improved startAssessment function that requires camera access
  const startAssessment = async () => {
    try {
      // Disable the button to prevent multiple clicks
      const agreeButton = document.getElementById("agree-button");
      if (agreeButton) {
        (agreeButton as HTMLButtonElement).disabled = true;
        agreeButton.innerHTML = `
        <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        ${t("AssessmentRules.buttons.preparing")}
      `;
      }

      // Show loading toast
      const loadingToast = loading("Loading face verification system...");
      let loadingToast3: string | undefined;

      try {
        // First load MediaPipe models
        dismiss(loadingToast);
        const loadingToast2 = loading("Loading MediaPipe models...");
        await loadMediaPipeModels();
        dismiss(loadingToast2);
        logSupervisionEvent("MediaPipe models loaded successfully");

        // Check if camera is accessible
        loadingToast3 = loading("Checking camera access...");

        try {
          // Simple camera check - just try to get access
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });

          // If we got here, camera access is granted
          // We'll release this stream and let the assessment page handle the proper setup
          stream.getTracks().forEach((track) => track.stop());

          // Camera access successful
          if (loadingToast3) dismiss(loadingToast3);
          success("Camera access confirmed!");

          // Proceed to assessment
          setAssessmentStage("assessment");
          setTestStartTime(new Date());

          // The actual camera setup will happen in the assessment stage via useEffect
          logSupervisionEvent(
            "Assessment started with camera permission granted"
          );
        } catch (cameraError) {
          // Camera access failed
          if (loadingToast3) dismiss(loadingToast3);
          logSupervisionEvent("Camera access check failed", cameraError);
          showError(
            "Camera access denied. This assessment requires camera access."
          );

          // Re-enable button
          if (agreeButton) {
            (agreeButton as HTMLButtonElement).disabled = false;
            agreeButton.innerHTML = t("AssessmentRules.buttons.agree");
          }

          // Show camera permission instructions
          setTimeout(() => {
            const permissionMessage =
              "Camera access is required for this assessment.\n\n" +
              "To enable your camera:\n\n" +
              "1. Look for the camera icon in your browser's address bar\n" +
              "2. Click it and select 'Allow' for this site\n" +
              "3. Then click 'Agree' again\n\n" +
              "Would you like to view detailed instructions?";

            if (window.confirm(permissionMessage)) {
              // Show more detailed instructions in a modal or redirect to help page
              showError("Please enable camera access and try again.");

              // You could also open a modal with more detailed instructions here
              // or redirect to a help page
            }
          }, 1000);
        }
      } catch (error) {
        // Dismiss any active loading toast
        if (loadingToast3) dismiss(loadingToast3);
        console.error("Setup error:", error);
        showError("Setup error. Please refresh and try again.");

        // Re-enable button
        if (agreeButton) {
          (agreeButton as HTMLButtonElement).disabled = false;
          agreeButton.innerHTML = t("AssessmentRules.buttons.agree");
        }
      }
    } catch (error) {
      console.error("Error starting assessment:", error);
      showError("Failed to start assessment. Please refresh and try again.");

      // Re-enable button
      const agreeButton = document.getElementById("agree-button");
      if (agreeButton) {
        (agreeButton as HTMLButtonElement).disabled = false;
        agreeButton.innerHTML = t("AssessmentRules.buttons.agree");
      }
    }
  };
  // Add this state at the top of your component

  // Then modify your useEffect for supervision initialization
  useEffect(() => {
    if (assessmentStage === "assessment" && !supervisionInitialized) {
      // Initialize supervision system
      const initializeSupervision = async () => {
        try {
          logSupervisionEvent("Initializing supervision for assessment");
          setSupervisionInitialized(true); // Mark as initialized immediately to prevent duplicate calls

          // Load models if not already loaded
          if (!modelsLoaded) {
            logSupervisionEvent("Loading supervision models");
            await loadMediaPipeModels();
            setModelsLoaded(true);
            logSupervisionEvent("Supervision models loaded");
          }

          // Setup camera
          logSupervisionEvent("Setting up camera for assessment");
          const cameraReady = await setupCamera();

          if (cameraReady) {
            // Start taking snapshots
            startSnapshotCollection();
            logSupervisionEvent(
              "Camera setup successful, snapshot collection started"
            );

            // Start periodic camera status checks (every 2 seconds)
            cameraCheckIntervalRef.current = setInterval(
              checkCameraStatus,
              2000
            );
          } else {
            // Camera setup failed - this shouldn't happen since we already checked permissions
            logSupervisionEvent(
              "Camera setup failed during assessment initialization"
            );
            showError("Camera setup failed. Please refresh and try again.");

            // Wait 3 seconds before returning to rules stage so the user can see the error
            setTimeout(() => {
              setSupervisionInitialized(false); // Reset so we can try again
              setAssessmentStage("rules");
            }, 3000);
          }
        } catch (error) {
          console.error("Error initializing supervision:", error);
          logSupervisionEvent("Error initializing supervision", error);

          // Show error and return to rules stage
          showError("Camera setup failed. Please refresh and try again.");

          setTimeout(() => {
            setSupervisionInitialized(false); // Reset so we can try again
            setAssessmentStage("rules");
          }, 3000);
        }
      };

      initializeSupervision();

      // Cleanup function to clear the interval
      return () => {
        if (cameraCheckIntervalRef.current) {
          clearInterval(cameraCheckIntervalRef.current);
          cameraCheckIntervalRef.current = null;
        }
      };
    }

    // Reset supervision initialized state when going back to rules
    if (assessmentStage === "rules" && supervisionInitialized) {
      setSupervisionInitialized(false);
    }
  }, [
    assessmentStage,
    modelsLoaded,
    checkCameraStatus,
    currentDiscipline,
    user?.email,
    router,
    supervisionInitialized,
  ]);

  // Add a cleanup function when component unmounts
  useEffect(() => {
    return () => {
      // Clean up camera resources when component unmounts
      if (hiddenVideoRef.current && hiddenVideoRef.current.srcObject) {
        const stream = hiddenVideoRef.current.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      }

      // Clear any intervals
      if (cameraCheckIntervalRef.current) {
        clearInterval(cameraCheckIntervalRef.current);
        cameraCheckIntervalRef.current = null;
      }

      if (snapshotIntervalRef.current) {
        clearInterval(snapshotIntervalRef.current);
        snapshotIntervalRef.current = null;
      }
    };
  }, []);
  // If loading, show loading state
  if (authLoading || dataLoading) {
    return <LoadingAssessment />;
  }

  // If no questions found, show error
  if (!dataLoading && (!questions || questions.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-center text-red-600">
                No Questions Available
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <AlertTriangle className="h-16 w-16 text-red-600" />
              <p className="text-center text-muted-foreground">
                No questions are available for the selected discipline and
                difficulty level. Please try a different selection.
              </p>
              <Button onClick={() => router.push("/test")} className="mt-4">
                Return to Test Selection
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } // Updated Assessment Rules section with translation support
  if (assessmentStage === "rules") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                    <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Assessment Rules & Guidelines
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Please read carefully before starting your assessment
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <LanguageSelector />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
            <CardHeader className="text-center pb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-full">
                  <Target className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                {t("AssessmentRules.title")}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-300 text-base">
                {t("AssessmentRules.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Assessment Rules List */}
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    Assessment Rules & Guidelines
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Identity Verification
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {t("AssessmentRules.identityVerification.description")}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Time Limit
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {t("AssessmentRules.timeLimit.description", {
                          minutes: Math.floor(totalTimeForAllQuestions / 60),
                          seconds: totalTimeForAllQuestions % 60,
                          questionCount: questions.length,
                        })}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Prohibited Behaviors
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {t("AssessmentRules.prohibitedBehaviors.description")}
                      </p>
                      <ul className="text-sm text-gray-600 dark:text-gray-300 list-disc pl-5 space-y-1">
                        <li>
                          {t("AssessmentRules.prohibitedBehaviors.item1")}
                        </li>
                        <li>
                          {t("AssessmentRules.prohibitedBehaviors.item2")}
                        </li>
                        <li>
                          {t("AssessmentRules.prohibitedBehaviors.item3")}
                        </li>
                        <li>
                          {t("AssessmentRules.prohibitedBehaviors.item4")}
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Supervision
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {t("AssessmentRules.supervision.description")}{" "}
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          {t("AssessmentRules.supervision.warning")}
                        </span>
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Navigation
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {t("AssessmentRules.navigation.description")}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Technical Requirements
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {t("AssessmentRules.technicalRequirements.description")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Important Notice */}
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-3">
                        {t("AssessmentRules.importantNotice.title")}
                      </h3>
                      <p className="text-red-700 dark:text-red-300 leading-relaxed">
                        {t("AssessmentRules.importantNotice.description")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between pt-8 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => router.push("/test")}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t("AssessmentRules.buttons.cancel")}
              </Button>
              <Button
                onClick={startAssessment}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2"
                id="agree-button"
              >
                {t("AssessmentRules.buttons.agree")}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }
  if (showResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-full ">
          <PostAssessmentView
            score={score}
            totalQuestions={questions.length}
            subjectScores={subjectScores}
            duration={calculateTestDuration()}
            discipline={currentDiscipline || ""}
            isTerminated={isTestTerminated}
            difficultyLevel={currentDifficultyLevel}
          />
          {/* Add snapshot debugging view */}
          {/* <SnapshotDebugView snapshots={snapshots} /> */}
        </div>
      </div>
    );
  }

  // Main assessment view
  return (
    <ProtectedRoute allowedRoles={["user"]}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                    <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Assessment in Progress
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {currentDiscipline} -{" "}
                      {questions[currentQuestionIndex]?.subject || "General"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-full">
                  <Timer className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                    {formattedTime}
                  </span>
                </div>
                <LanguageSelector />
              </div>
            </div>
          </div>
        </div>

        {/* Floating Navigation Bar - Always Accessible */}
        <div className="sticky top-16 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </span>
                  <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{
                        width: `${
                          ((currentQuestionIndex + 1) / questions.length) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {currentQuestionIndex < questions.length - 1 ? (
                  <Button
                    onClick={handleNext}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 flex items-center gap-2 shadow-lg"
                  >
                    <span className="hidden sm:inline">Next Question</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 flex items-center gap-2 shadow-lg"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Submit Assessment</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Question Section - Takes 3 columns on large screens */}
            <div className="lg:col-span-3">
              <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                        <BookOpen className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-gray-900 dark:text-white">
                          Question {currentQuestionIndex + 1} of{" "}
                          {questions.length}
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-300">
                          {questions[currentQuestionIndex]?.subject ||
                            "General"}
                        </CardDescription>
                      </div>
                    </div>

                    {/* Progress indicator */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {userAnswers.filter(Boolean).length} of{" "}
                          {questions.length}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          answered
                        </p>
                      </div>
                      <Progress
                        value={
                          (userAnswers.filter(Boolean).length /
                            questions.length) *
                          100
                        }
                        className="w-20 h-2"
                      />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-8 pb-8">
                  <div className="space-y-8">
                    {/* Question Text */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white leading-relaxed">
                        {questions[currentQuestionIndex]?.question}
                      </h2>
                    </div>

                    {/* Options */}
                    <RadioGroup value={val} className="space-y-4">
                      {questions[currentQuestionIndex]?.options.map(
                        (option: any, index: number) => (
                          <div
                            key={index}
                            className={`relative rounded-xl border-2 p-6 cursor-pointer transition-all duration-200 ${
                              val === option.letter
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md"
                                : "border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                            onClick={() =>
                              handleChange(option.label, option.letter)
                            }
                          >
                            <div className="flex items-start gap-4">
                              <div
                                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                  val === option.letter
                                    ? "border-emerald-500 bg-emerald-500"
                                    : "border-gray-300 dark:border-gray-500"
                                }`}
                              >
                                {val === option.letter && (
                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                )}
                              </div>
                              <div className="flex-1">
                                <Label
                                  htmlFor={`option-${index}`}
                                  className="cursor-pointer text-base text-gray-900 dark:text-white leading-relaxed"
                                >
                                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 mr-3">
                                    {option.letter}.
                                  </span>
                                  {option.label}
                                </Label>
                              </div>
                            </div>
                            <RadioGroupItem
                              value={option.letter}
                              id={`option-${index}`}
                              checked={val === option.letter}
                              className="sr-only"
                            />
                          </div>
                        )
                      )}
                    </RadioGroup>
                  </div>
                </CardContent>

                <CardFooter className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <div className="flex items-center justify-center w-full">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Use the navigation bar above to move between questions
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span>
                          Current question is highlighted in the sidebar
                        </span>
                      </div>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </div>

            {/* Sidebar - Takes 1 column on large screens */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                {/* Timer Card */}
                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                        <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">
                        Time Remaining
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
                        {formattedTime}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {timeWarning && "Time is running out!"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Progress Card */}
                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">
                        Progress
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {userAnswers.filter(Boolean).length}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        of {questions.length} answered
                      </p>
                    </div>
                    <Progress
                      value={
                        (userAnswers.filter(Boolean).length /
                          questions.length) *
                        100
                      }
                      className="w-full h-2"
                    />
                    <div className="text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {Math.round(
                          (userAnswers.filter(Boolean).length /
                            questions.length) *
                            100
                        )}
                        % Complete
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Navigation Card */}
                <Card className="border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                        <Eye className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-gray-900 dark:text-white">
                        Question Navigation
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-2">
                      {questions.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentQuestionIndex(index)}
                          className={`w-8 h-8 rounded-lg text-xs font-medium transition-all duration-200 ${
                            index === currentQuestionIndex
                              ? "bg-emerald-600 text-white"
                              : userAnswers[index]
                              ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden video element for camera */}
        <div className="hidden">
          <video
            ref={hiddenVideoRef}
            autoPlay
            playsInline
            muted
            style={{ width: 320, height: 240 }}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Question;
