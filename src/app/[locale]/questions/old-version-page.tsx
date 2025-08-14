"use client";
import React, { useState, useEffect, useRef, useContext } from "react";
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
import { toast } from "sonner";
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
import { CreateAnswers } from "@/app/apis/answers/create";
import PeriodicSupervision from "@/components/PeriodicSupervision";
import { usePeriodicSupervision } from "@/hooks/usePeriodicSupervision";
import { useTranslations } from "next-intl";
import LanguageSelector from "@/components/LanguageSelector";

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
  const timerInitializedRef = useRef(false);
  const [assessmentStage, setAssessmentStage] = useState<
    "rules" | "assessment"
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
  const [timeLeft, setTimeLeft] = useState(-1);
  const [score, setScore] = useState(0);
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

  const handleAnswers = CreateAnswers();

  const [val, setVal] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [currentDiscipline, setCurrentDiscipline] = useState<string | null>(
    null
  );
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [testStartTime, setTestStartTime] = useState<Date | null>(null);
  const [testEndTime, setTestEndTime] = useState<Date | null>(null);
  const [timeWarning, setTimeWarning] = useState(false);
  const context = useContext(ContextData);
  const [currentDifficultyLevel, setCurrentDifficultyLevel] =
    useState<string>("intermediate");

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
        toast.error(
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
  // Improve the setupCamera function to better handle camera initialization
  const setupCamera = async () => {
    try {
      await loadMediaPipeModels();
      logSupervisionEvent("Supervision models loaded");

      // Try to get a stream with standard settings
      try {
        logSupervisionEvent("Requesting camera access with standard settings");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
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
          }

          // Wait for video to be ready
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
              } else {
                setTimeout(checkVideoReady, 100);
              }
            };
            checkVideoReady();
          });

          logSupervisionEvent("Camera stream initialized successfully");
          return true;
        }
      } catch (error) {
        logSupervisionEvent(
          "Could not access camera with standard settings",
          error
        );

        // Try fallback with basic settings
        try {
          logSupervisionEvent("Trying fallback camera settings");
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });

          if (hiddenVideoRef.current) {
            hiddenVideoRef.current.srcObject = fallbackStream;
            cameraStream.current = fallbackStream;
            hiddenVideoRef.current.muted = true;
            hiddenVideoRef.current.playsInline = true;

            // Play the video
            try {
              await hiddenVideoRef.current.play();
              logSupervisionEvent(
                "Video playback started with fallback settings"
              );
            } catch (playError) {
              logSupervisionEvent(
                "Error playing video with fallback settings",
                playError
              );
            }

            // Wait for video to be ready
            await new Promise<void>((resolve) => {
              const checkVideoReady = () => {
                if (
                  hiddenVideoRef.current &&
                  hiddenVideoRef.current.readyState >= 2 &&
                  hiddenVideoRef.current.videoWidth > 0
                ) {
                  logSupervisionEvent(
                    "Video feed loaded with fallback settings",
                    {
                      readyState: hiddenVideoRef.current.readyState,
                      width: hiddenVideoRef.current.videoWidth,
                      height: hiddenVideoRef.current.videoHeight,
                    }
                  );
                  resolve();
                } else {
                  setTimeout(checkVideoReady, 100);
                }
              };
              checkVideoReady();
            });

            logSupervisionEvent(
              "Camera stream initialized with fallback settings"
            );
            return true;
          }
        } catch (fallbackError) {
          logSupervisionEvent(
            "Camera access failed with fallback settings",
            fallbackError
          );
          return false;
        }
      }

      return false;
    } catch (error) {
      logSupervisionEvent("Camera setup error", error);
      console.error("Error setting up camera:", error);
      return false;
    }
  };
  // Start periodic snapshot collection
  const startSnapshotCollection = () => {
    if (snapshotIntervalRef.current) {
      clearInterval(snapshotIntervalRef.current);
    }

    logSupervisionEvent("Starting periodic snapshot collection");

    // Take first snapshot immediately
    takeSnapshot().then((snapshot) => {
      if (snapshot) {
        setSnapshots((prev) => [...prev, snapshot]);
      }
    });

    // Then take snapshots periodically (every 30 seconds)
    snapshotIntervalRef.current = setInterval(async () => {
      const snapshot = await takeSnapshot();
      if (snapshot) {
        setSnapshots((prev) => [...prev, snapshot]);
        logSupervisionEvent(
          `Snapshot collected (total: ${snapshots.length + 1})`
        );
      }
    }, 30000); // 30 seconds
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

  // Initialize camera and snapshot collection when assessment starts
  useEffect(() => {
    if (assessmentStage === "assessment" && !isMonitoringActive) {
      const initializeSupervision = async () => {
        logSupervisionEvent("Initializing assessment supervision");
        setIsMonitoringActive(true);

        // Setup camera
        const cameraReady = await setupCamera();

        if (cameraReady) {
          // Start taking snapshots
          startSnapshotCollection();
        } else {
          toast.warning(
            "Camera access is required for this assessment. Please ensure your camera is enabled.",
            { duration: 5000 }
          );

          // We'll still allow the test to proceed, but will note the lack of supervision
          logSupervisionEvent(
            "Proceeding with assessment without camera access"
          );
        }
      };

      initializeSupervision();
    }
  }, [assessmentStage]);
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
          toast.error("Authentication error. Please log in again.");
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
                toast.error(
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
          toast.error("No user found. Please log in again.");
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
        toast.warning(
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
      const subjects = new Set(questions.map((q) => q.subject));
      const initialSubjectScores: { [key: string]: number } = {};
      subjects.forEach((subject) => {
        initialSubjectScores[subject] = 0;
      });
      setSubjectScores(initialSubjectScores);
    }
  }, [questions]);

  // Format time display
  const formatTimeDisplay = (totalSeconds: number) => {
    if (totalSeconds === undefined || totalSeconds < 0) return "00:00";

    // Calculate hours, minutes, and seconds
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    // Format with leading zeros
    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}:${String(seconds).padStart(2, "0")}`;
    } else {
      return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
        2,
        "0"
      )}`;
    }
  };

  // Timer effect
  useEffect(() => {
    if (timeLeft > 0 && assessmentStage === "assessment" && !showResult) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);

        // Update the timer display
        const timerElement = document.getElementById("timer-display");
        if (timerElement) {
          timerElement.textContent = formatTimeDisplay(timeLeft - 1);
        }

        // Optional: Add visual indicators when time is running low
        if (timeLeft <= 60) {
          // Last minute
          const timerContainer = document.getElementById("timer-container");
          if (timerContainer) {
            timerContainer.classList.add("animate-pulse", "text-red-600");
          }
        }
      }, 1000);

      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && assessmentStage === "assessment") {
      // Replace handleSubmit with saveTestResults
      setTestEndTime(new Date());
      setShowResult(true);
      saveTestResults();
    }
  }, [timeLeft, assessmentStage, showResult]);

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
        timerElement.textContent = formatTimeDisplay(totalTimeForAllQuestions);
      }
    }
  }, [totalTimeForAllQuestions, assessmentStage, showResult]);

  // Timer countdown effect
  useEffect(() => {
    // Don't start the timer if we're still loading, not in assessment stage, or showing results
    if (
      questions.length === 0 ||
      authLoading ||
      dataLoading ||
      showResult ||
      assessmentStage !== "assessment" ||
      timeLeft <= 0 // Changed from timeLeft < 0 to also catch timeLeft === 0
    ) {
      return;
    }

    console.log("Starting countdown with timeLeft:", timeLeft);

    // Show warning when 20% of time is left
    if (
      timeLeft === Math.floor(totalTimeForAllQuestions * 0.2) &&
      !timeWarning
    ) {
      setTimeWarning(true);
      toast.warning("You're running out of time! 20% remaining.", {
        duration: 5000,
      });
    }

    // Check for timeout
    if (
      timeLeft === 0 &&
      !showResult &&
      !saveAttempted &&
      questions.length > 0
    ) {
      setTestEndTime(new Date());
      setShowResult(true);
      saveTestResults();
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [
    timeLeft,
    showResult,
    saveAttempted,
    questions.length,
    authLoading,
    dataLoading,
    totalTimeForAllQuestions,
    timeWarning,
    assessmentStage,
  ]);

  // Safety check for timer
  useEffect(() => {
    if (timeLeft === 0 && assessmentStage === "assessment" && !showResult) {
      console.log("SAFETY CHECK: Time is 0, ending test");
      setTestEndTime(new Date());
      setShowResult(true);
      toast.error("Time's up! Your assessment has ended.", {
        duration: 5000,
      });
      saveTestResults();
    }
  }, [timeLeft, assessmentStage, showResult]);

  // Format time to HH:MM:SS
  const formatTime = (seconds: number | undefined) => {
    if (seconds === undefined || seconds < 0) return "00:00:00";

    // Calculate hours, minutes, and seconds
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    // Format with leading zeros
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

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

  // Calculate Score
  const calculateScore = () => {
    let totalScore = 0;
    const newSubjectScores = { ...subjectScores };

    userAnswers.forEach((answer, index) => {
      if (questions[index] && answer === questions[index].correctAnswer) {
        totalScore++;

        // Update subject scores
        const subject = questions[index].subject;
        if (subject) {
          newSubjectScores[subject] = (newSubjectScores[subject] || 0) + 1;
        }
      }
    });

    setScore(totalScore);
    setSubjectScores(newSubjectScores);
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

      // First check for multiple faces
      const hasMultipleFaces = await detectMultipleFaces(video);

      // Get face embedding (will return the first face detected)
      let embedding = await getFaceEmbedding(video);

      // Prepare snapshot data
      const snapshotData = {
        timestamp: new Date().toISOString(),
        dataUrl: canvas.toDataURL("image/jpeg", 0.7), // Store image at 70% quality
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

        // Verify against stored embedding with a threshold of 0.8
        const isVerified = await compareWithStoredEmbedding(embedding, 0.8);

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
  // Update the saveTestResults function to implement stricter verification rules
  const saveTestResults = async () => {
    if (saveAttempted || questions.length === 0) {
      return;
    }

    setSaveAttempted(true);
    setTestEndTime(new Date());
    // Explicitly set showResult to true FIRST to ensure the UI updates
    setShowResult(true);

    // Stop snapshot collection
    stopSnapshotCollection();

    try {
      let userEmail = user?.email;
      if (!userEmail && auth?.user?.email) {
        userEmail = auth.user.email;
      }

      if (!userEmail) {
        toast.error("User email not found. Please ensure you're logged in.");
        return;
      }

      // Calculate final score
      const finalScore = calculateScore();

      // Analyze collected snapshots
      const supervisionResults = await analyzeSnapshots();
      logSupervisionEvent(
        "Final supervision analysis results",
        supervisionResults
      );
      const storedSubCategories = localStorage.getItem("subCategories");
      const subcat = storedSubCategories ? (JSON.parse(storedSubCategories) as any) : null;
      // Add supervision results to metadata
      let finalSubjectScores = { ...subjectScores, subCategory: subcat };
      // finalSubjectScores.supervisionResults = supervisionResults.results;
      // finalSubjectScores.difficultyLevel = currentDifficultyLevel;

      // Store snapshots for debugging - only store the timestamp and face detection status
      // finalSubjectScores.snapshotCount = snapshots.length;
      // finalSubjectScores.snapshotSummary = snapshots.map((s) => ({
      //   timestamp: new Date(s.timestamp).toLocaleTimeString(),
      //   faceDetected: !!s.embedding,
      //   verified: !!s.verified,
      //   status:
      //     s.verificationStatus ||
      //     (s.embedding
      //       ? s.verified
      //         ? "verified"
      //         : "wrong_person"
      //       : "no_face"),
      // }));

      // Check for supervision violations
      const {
        totalSnapshots,
        noFaceDetected,
        identityMatches,
        identityMismatches,
        multipleFacesDetected,
      } = supervisionResults.results;

      // Define violation thresholds
      const MAX_NO_FACE_ALLOWED = 1;
      const MAX_WRONG_PERSON_ALLOWED = 2; // Maximum number of wrong person detections allowed
      const MAX_MULTIPLE_FACES_ALLOWED = 1; // Maximum number of multiple face detections allowed
      const MIN_FACE_DETECTION_RATE = 50; // Minimum percentage of snapshots that must have a face detected

      // Calculate face detection rate
      const faceDetectionRate =
        totalSnapshots > 0
          ? ((totalSnapshots - (noFaceDetected ?? 0)) / totalSnapshots) * 100
          : 0;

      // Initialize assessment status
      let isTerminated = false;
      let terminationReason = "";

      // Check for violations
      // if (totalSnapshots < MIN_SNAPSHOTS_REQUIRED) {
      //   isTerminated = true;
      //   terminationReason = "Insufficient supervision data collected";
      // } else if ((identityMismatches ?? 0) > MAX_WRONG_PERSON_ALLOWED) {
      //   isTerminated = true;
      //   terminationReason = `Different person detected in ${identityMismatches} snapshots`;
      // } else if ((multipleFacesDetected ?? 0) > MAX_MULTIPLE_FACES_ALLOWED) {
      //   isTerminated = true;
      //   terminationReason = `Multiple faces detected in ${multipleFacesDetected} snapshots`;
      // } else if (
      //   faceDetectionRate < MIN_FACE_DETECTION_RATE &&
      //   totalSnapshots >= 3
      // ) {
      //   isTerminated = true;
      //   terminationReason = `Face not visible in ${noFaceDetected} out of ${totalSnapshots} snapshots`;
      // }

      if (totalSnapshots === 0) {
        // No snapshots at all - likely a technical issue
        logSupervisionEvent(
          "No snapshots collected - possible technical issue"
        );
        // Don't terminate, just log the issue
      } else if ((identityMismatches ?? 0) > MAX_WRONG_PERSON_ALLOWED) {
        isTerminated = true;
        terminationReason = `Different person detected in ${identityMismatches} snapshots`;
      } else if ((multipleFacesDetected ?? 0) > MAX_MULTIPLE_FACES_ALLOWED) {
        isTerminated = true;
        terminationReason = `Multiple faces detected in ${multipleFacesDetected} snapshots`;
      } else if (
        faceDetectionRate < MIN_FACE_DETECTION_RATE &&
        totalSnapshots >= 3 &&
        (identityMatches ?? 0) === 0
      ) {
        // Only terminate if we have no successful face detections at all
        isTerminated = true;
        terminationReason = `Face not visible in ${noFaceDetected} out of ${totalSnapshots} snapshots`;
      } else if ((noFaceDetected ?? 0) > MAX_NO_FACE_ALLOWED) {
        isTerminated = true;
        (finalSubjectScores as SubjectScoresType).terminated = true;
      }

      // Update metadata with termination info if applicable
      if (isTerminated) {
        finalSubjectScores.terminated = true;
        finalSubjectScores.terminationReason = terminationReason;
        setIsTestTerminated(true);

        // Log the termination
        logSupervisionEvent(`Assessment terminated: ${terminationReason}`);

        // Show toast notification
        toast.error(`Assessment terminated: ${terminationReason}`, {
          duration: 8000,
        });
      }

      // Convert subjectScores to a JSON string
      const subjectScoresJSON = JSON.stringify(finalSubjectScores);

      // If terminated, save with a score of 0
      const result = await handleAnswers.Save(
        userEmail,
        isTerminated ? 0 : finalScore,
        subjectScoresJSON,
        currentDiscipline || "Finance",
        questions.length
      );

      if (result?.error) {
        console.error("Error saving results:", result.error);
        toast.error("Failed to save results: " + result.error);
      } else {
        setSaveSuccessful(true);
        if (!isTerminated) {
          toast.success("Assessment results saved successfully!");
        }

        // Clean up localStorage after test is completed
        localStorage.removeItem("selectedSection");
        localStorage.removeItem("difficultyLevel");
        localStorage.removeItem("scheduledDate");
        localStorage.removeItem("scheduledTime");
      }
    } catch (error) {
      console.error("Error saving test results:", error);
      toast.error("An error occurred while saving results");
    }
  };

  // Modify the handleSubmit function to ensure it properly sets showResult
  const handleSubmit = async () => {
    // Calculate final score
    calculateScore();

    // Set test end time
    setTestEndTime(new Date());

    // Show results FIRST
    setShowResult(true);

    // Save results to database
    await saveTestResults();
  };
  // Start Assessment
  const startAssessment = () => {
    setAssessmentStage("assessment");
    logSupervisionEvent("Assessment started");
  };

  // If loading, show loading state
  if (authLoading || dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-center">Loading Assessment</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="w-full">
                <Progress value={30} className="w-full" />
              </div>
              <p className="text-center text-muted-foreground">
                Please wait while we prepare your assessment...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
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
    // Get translations using the useTranslations hook

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="fixed right-5 top-5">
          <LanguageSelector />
        </div>
        <div className="w-full max-w-4xl">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-center">
                {t("AssessmentRules.title")}
              </CardTitle>
              <CardDescription className="text-center">
                {t("AssessmentRules.subtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">
                      {t("AssessmentRules.identityVerification.title")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t("AssessmentRules.identityVerification.description")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">
                      {t("AssessmentRules.timeLimit.title")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t("AssessmentRules.timeLimit.description", {
                        minutes: Math.floor(totalTimeForAllQuestions / 60),
                        seconds: totalTimeForAllQuestions % 60,
                        questionCount: questions.length,
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">
                      {t("AssessmentRules.supervision.title")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t("AssessmentRules.supervision.description")}{" "}
                      <span className="font-medium text-red-600">
                        {t("AssessmentRules.supervision.warning")}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Users className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">
                      {t("AssessmentRules.prohibitedBehaviors.title")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t("AssessmentRules.prohibitedBehaviors.description")}
                    </p>
                    <ul className="text-sm text-muted-foreground list-disc pl-5 mt-1 space-y-1">
                      <li>{t("AssessmentRules.prohibitedBehaviors.item1")}</li>
                      <li>{t("AssessmentRules.prohibitedBehaviors.item2")}</li>
                      <li>{t("AssessmentRules.prohibitedBehaviors.item3")}</li>
                      <li>{t("AssessmentRules.prohibitedBehaviors.item4")}</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <ClipboardCheck className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-medium">
                      {t("AssessmentRules.navigation.title")}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t("AssessmentRules.navigation.description")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-md bg-red-50 p-4 border border-red-200 mt-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle
                      className="h-5 w-5 text-red-500"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {t("AssessmentRules.importantNotice.title")}
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{t("AssessmentRules.importantNotice.description")}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-md bg-amber-50 p-4 border border-amber-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle
                      className="h-5 w-5 text-amber-400"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">
                      {t("AssessmentRules.technicalRequirements.title")}
                    </h3>
                    <div className="mt-2 text-sm text-amber-700">
                      <p>
                        {t("AssessmentRules.technicalRequirements.description")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => router.push("/test")}>
                {t("AssessmentRules.buttons.cancel")}
              </Button>
              <Button
                onClick={startAssessment}
                className="bg-primary hover:bg-primary/90"
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
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-4xl">
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
                  Question {currentQuestionIndex + 1} of {questions.length}
                </CardTitle>
                <CardDescription>
                  {currentDiscipline} -{" "}
                  {questions[currentQuestionIndex]?.subject || "General"}
                </CardDescription>
              </div>
              <div
                id="timer-container"
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full"
              >
                <Clock className="h-5 w-5 text-gray-600" />
                <span id="timer-display" className="font-mono font-bold">
                  {formatTimeDisplay(timeLeft)}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="text-lg font-medium">
                {questions[currentQuestionIndex]?.question}
              </div>

              <RadioGroup value={val} className="space-y-3">
                {questions[currentQuestionIndex]?.options.map(
                  (option: any, index: number) => (
                    <div
                      key={index}
                      className={`flex items-center space-x-2 rounded-lg border p-4 ${
                        val === option.letter
                          ? "border-primary bg-primary/5"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => handleChange(option.label, option.letter)}
                    >
                      <RadioGroupItem
                        value={option.letter}
                        id={`option-${index}`}
                        checked={val === option.letter}
                      />
                      <Label
                        htmlFor={`option-${index}`}
                        className="flex-grow cursor-pointer"
                      >
                        <span className="font-medium mr-2">
                          {option.letter}.
                        </span>
                        {option.label}
                      </Label>
                    </div>
                  )
                )}
              </RadioGroup>
            </div>
          </CardContent>

          <CardFooter className="border-t pt-6 flex justify-between">
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </Button>

              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  onClick={handleNext}
                  className="flex items-center gap-1"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Submit
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {userAnswers.filter(Boolean).length} of {questions.length}{" "}
                answered
              </span>
              <Progress
                value={
                  (userAnswers.filter(Boolean).length / questions.length) * 100
                }
                className="w-24"
              />
            </div>
          </CardFooter>
        </Card>
      </div>

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
  );
};

export default Question;
