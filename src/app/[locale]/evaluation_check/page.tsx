"use client";
import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import DataGridDemo from "@/components/muitable";
import {
  Loader2,
  Eye,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Camera,
  Filter,
  Search,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import moment from "moment";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
} from "@mui/material";
import { getUserRole } from "@/app/apis/job/getJobs";
import { toast } from "sonner";
import Slider from "@/components/slideOver";
import ProtectedRoute from "@/components/ProtectedRoute";

type ExaminerData = {
  id: string;
  name: string;
  email: string;
  status: string;
};
interface TestSubmission {
  id: string;
  candidateId: string;
  candidateName: string;
  email: string;
  testId: string;
  testName: string;
  submissionDate: string;
  status: "pending" | "in_progress" | "completed";
  score: number;
  photos: string[];
  assignment_id: string;
  subject_score: any;
  exam: string;
  overall: number;
  snapshot_metadata?: any;
  examiner_name?: string; // Added for admin view
  examiner_email?: string; // Added for admin view
}

const EvaluationCheckPage = () => {
  const t = useTranslations("EvaluationCheck");
  const [submissions, setSubmissions] = useState<TestSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [role, setRole] = useState<string | null>();
  const [selectedSubmission, setSelectedSubmission] =
    useState<TestSubmission | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSlider, setOpenSlider] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [processingAction, setProcessingAction] = useState(false);
  const [examinerEmail, setExaminerEmail] = useState<string | null>(null);
  const [examinerId, setExaminerId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewScore, setReviewScore] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filteredSubmissions, setFilteredSubmissions] = useState<
    TestSubmission[]
  >([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [examinerFilter, setExaminerFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [uniqueExaminers, setUniqueExaminers] = useState<
    { id: string; name: string }[]
  >([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  useEffect(() => {
    getUser();

    // Run an immediate cleanup of all completed reviews when the component loads
    // This ensures we don't show any completed reviews to users
    immediateCleanupCompletedReviews();

    // Also set up a periodic cleanup every few hours
    const cleanupInterval = setInterval(() => {
      cleanupAllCompletedReviews();
    }, 6 * 60 * 60 * 1000); // Run every 6 hours

    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);

  const getUser = async () => {
    try {
      const { role } = await getUserRole();
      setRole(role);

      // Check if user is admin or s_admin
      const isAdminUser = role === "s_admin";
      setIsAdmin(isAdminUser);

      // Get the examiner email from localStorage
      const email = localStorage.getItem("userEmail");
      setExaminerEmail(email);

      if (isAdminUser) {
        // For admins, fetch all assigned tests
        fetchAllAssignedTests();
      } else {
        // For examiners, get their ID and fetch only their assignments
        let id = localStorage.getItem("examinerId");

        if (!id && email) {
          // Fetch examiner ID if not in localStorage
          const { data, error } = await supabase
            .from("examiners")
            .select("id")
            .eq("email", email)
            .single();

          if (error) {
            console.error("Error fetching examiner ID:", error);
          } else if (data) {
            id = data.id;
            if (id) {
              localStorage.setItem("examinerId", id);
            }
          }
        }

        setExaminerId(id);

        if (id) {
          fetchAssignedTests(id);
        } else {
          console.error("Could not determine examiner ID");
          setLoading(false);
        }
      }
    } catch (error) {
      console.error("Error getting user:", error);
      setLoading(false);
    }
  };

  // New function to fetch all assigned tests for admins
  const fetchAllAssignedTests = async () => {
    setLoading(true);
    try {
      // Fetch all review assignments with related examiner and test data
      // Exclude completed and archived assignments
      const { data: assignments, error: assignmentsError } = await supabase
        .from("review_assignments")
        .select(
          `
          id,
          examiner_id,
          test_id,
          assigned_at,
          status,
          completed_at,
          notes,
          archived,
          examiners:examiner_id (
            id,
            name,
            email,
            status
          )
        `
        )
        .eq("archived", false) // Only get non-archived assignments
        .not("status", "eq", "completed") // Exclude completed assignments
        .order("assigned_at", { ascending: false });

      if (assignmentsError) {
        throw assignmentsError;
      }

      if (!assignments || assignments.length === 0) {
        console.log("No assignments found");
        setSubmissions([]);
        setLoading(false);
        return;
      }

      console.log("Fetched all assignments:", assignments);

      // Get all test IDs from assignments
      const testIds = assignments.map((assignment) => assignment.test_id);

      // Fetch test details from the answers table
      const { data: tests, error: testsError } = await supabase
        .from("answers")
        .select(
          `
          id,
          email,
          score,
          subject_score,
          exam,
          overall,
          review_status,
          assigned_at,
          reviewed_at,
          review_notes,
          review_score,
          reviewer_notes,
          snapshot_metadata,
          created_at
        `
        )
        .in("id", testIds);

      if (testsError) {
        throw testsError;
      }

      // Fetch profile information for all test emails
      const emails = tests?.map((test) => test.email) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles_data")
        .select(
          `
          id,
          email,
          first_name,
          last_name
        `
        )
        .in("email", emails);

      if (profilesError) {
        throw profilesError;
      }

      // Create a map of email to profile data for quick lookup
      const profileMap = new Map();
      profiles?.forEach((profile) => {
        profileMap.set(profile.email, profile);
      });

      // In the fetchAllAssignedTests function, update where we access the examiner data:
      const formattedSubmissions = assignments
        .map((assignment) => {
          const test = tests?.find((t) => t.id === assignment.test_id);
          if (!test) return null;

          const profile = profileMap.get(test.email);

          // Extract photos from snapshot_metadata if available
          let photos: string[] = [];
          let parsedMetadata = test.snapshot_metadata;

          // Try to parse if it's a string
          if (typeof test.snapshot_metadata === "string") {
            try {
              parsedMetadata = JSON.parse(test.snapshot_metadata);
            } catch (e) {
              console.error(
                `Error parsing snapshot_metadata for test ${test.id}:`,
                e
              );
            }
          }

          // Extract URLs from the metadata
          if (parsedMetadata && parsedMetadata.urls) {
            photos = Object.values(parsedMetadata.urls);
          }

          // Use any type to bypass TypeScript error
          const examiners = assignment.examiners as any;

          const candidateName = profile
            ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
            : test.email;

          return {
            id: assignment.id, // Using assignment ID as the primary key
            assignment_id: assignment.id,
            candidateId: profile?.id || "",
            candidateName: candidateName || "Unknown Candidate",
            email: test.email || "",
            testId: test.id || "",
            testName: `${test.exam} Test`, // Using exam field as test name
            submissionDate: test.created_at || assignment.assigned_at,
            status: assignment.status as
              | "pending"
              | "in_progress"
              | "completed",
            score: parseInt(test.score) || 0,
            photos: photos,
            subject_score: test.subject_score,
            exam: test.exam,
            overall: parseInt(test.overall) || 0,
            snapshot_metadata: parsedMetadata, // Use the parsed metadata
            // Add examiner information for admin view - use optional chaining with any type
            examiner_name: examiners?.name || "Unknown Examiner",
            examiner_email: examiners?.email || "",
          };
        })
        .filter(Boolean) as TestSubmission[];

      setSubmissions(formattedSubmissions);
    } catch (error) {
      console.error("Error fetching all test assignments:", error);
      toast.error(t("fetchError"));
    } finally {
      setLoading(false);
    }
  };

  // Update the fetchAssignedTests function to include better logging for snapshot metadata
  const fetchAssignedTests = async (examinerId: string) => {
    setLoading(true);
    try {
      // Fetch all review assignments for this examiner that are not completed and not archived
      const { data: assignments, error: assignmentsError } = await supabase
        .from("review_assignments")
        .select(
          `
          id,
          examiner_id,
          test_id,
          assigned_at,
          status,
          completed_at,
          notes,
          archived
        `
        )
        .eq("examiner_id", examinerId)
        .eq("archived", false) // Only get non-archived assignments
        .not("status", "eq", "completed") // Exclude completed assignments
        .order("assigned_at", { ascending: false });

      if (assignmentsError) {
        throw assignmentsError;
      }
      if (!assignments || assignments.length === 0) {
        console.log("No assignments found for this examiner");
        setSubmissions([]);
        setLoading(false);
        return;
      }

      console.log("Fetched assignments:", assignments);

      // Get all test IDs from assignments
      const testIds = assignments.map((assignment) => assignment.test_id);

      // Fetch test details from the answers table
      const { data: tests, error: testsError } = await supabase
        .from("answers")
        .select(
          `
        id,
        email,
        score,
        subject_score,
        exam,
        overall,
        review_status,
        assigned_at,
        reviewed_at,
        review_notes,
        review_score,
        reviewer_notes,
        snapshot_metadata,
        created_at
      `
        )
        .in("id", testIds);

      if (testsError) {
        throw testsError;
      }

      // Fetch profile information for all test emails
      const emails = tests?.map((test) => test.email) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles_data")
        .select(
          `
        id,
        email,
        first_name,
        last_name
      `
        )
        .in("email", emails);

      if (profilesError) {
        throw profilesError;
      }

      // Create a map of email to profile data for quick lookup
      const profileMap = new Map();
      profiles?.forEach((profile) => {
        profileMap.set(profile.email, profile);
      });

      // Combine the data
      const formattedSubmissions = assignments
        .map((assignment) => {
          const test = tests?.find((t) => t.id === assignment.test_id);
          if (!test) return null;

          const profile = profileMap.get(test.email);

          // Debug log for snapshot metadata
          console.log(
            `Test ID ${test.id} snapshot metadata:`,
            test.snapshot_metadata
          );

          // Extract photos from snapshot_metadata if available
          let photos: string[] = [];
          let parsedMetadata = test.snapshot_metadata;

          // Try to parse if it's a string
          if (typeof test.snapshot_metadata === "string") {
            try {
              parsedMetadata = JSON.parse(test.snapshot_metadata);
              console.log(
                `Parsed metadata for test ${test.id}:`,
                parsedMetadata
              );
            } catch (e) {
              console.error(
                `Error parsing snapshot_metadata for test ${test.id}:`,
                e
              );
            }
          }

          // Extract URLs from the metadata
          if (parsedMetadata && parsedMetadata.urls) {
            console.log(
              `Found URLs in metadata for test ${test.id}:`,
              parsedMetadata.urls
            );
            photos = Object.values(parsedMetadata.urls);
          } else {
            console.log(`No URLs found in metadata for test ${test.id}`);
          }

          console.log(
            `Extracted ${photos.length} photos for test ${test.id}:`,
            photos
          );

          const candidateName = profile
            ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
            : test.email;

          return {
            id: assignment.id, // Using assignment ID as the primary key
            assignment_id: assignment.id,
            candidateId: profile?.id || "",
            candidateName: candidateName || "Unknown Candidate",
            email: test.email || "",
            testId: test.id || "",
            testName: `${test.exam} Test`, // Using exam field as test name
            submissionDate: test.created_at || assignment.assigned_at,
            status: assignment.status as
              | "pending"
              | "in_progress"
              | "completed",
            score: parseInt(test.score) || 0,
            photos: photos,
            subject_score: test.subject_score,
            exam: test.exam,
            overall: parseInt(test.overall) || 0,
            snapshot_metadata: parsedMetadata, // Use the parsed metadata
          };
        })
        .filter(Boolean) as TestSubmission[];

      setSubmissions(formattedSubmissions);
    } catch (error) {
      console.error("Error fetching test assignments:", error);
      toast.error(t("fetchError"));
    } finally {
      setLoading(false);
    }
  };

  // Improve the formatSnapshotResults function with better error handling and logging
  const formatSnapshotResults = (metadata: any) => {
    console.log("Formatting snapshot results for metadata:", metadata);

    if (!metadata) {
      console.log("No metadata provided");
      return [];
    }

    try {
      // If metadata is a string, try to parse it
      let parsedMetadata = metadata;
      if (typeof metadata === "string") {
        console.log("Metadata is a string, attempting to parse");
        try {
          parsedMetadata = JSON.parse(metadata);
          console.log("Successfully parsed metadata string:", parsedMetadata);
        } catch (e) {
          console.error("Failed to parse metadata string:", e);
          return [];
        }
      }

      if (!parsedMetadata.results) {
        console.log("No results field in metadata");
        return [];
      }

      console.log("Processing results:", parsedMetadata.results);

      const formattedResults = Object.entries(parsedMetadata.results).map(
        ([key, value]: [string, any]) => {
          const result = value as any;
          console.log(`Processing result ${key}:`, result);

          return {
            id: key,
            timestamp: result.timestamp
              ? new Date(result.timestamp).toLocaleString()
              : "Unknown",
            status: result.status || "Unknown",
            verified: result.verified === true ? "Yes" : "No",
            hasFace: result.hasFace === true ? "Yes" : "No",
            multipleFaces: result.multipleFaces === true ? "Yes" : "No",
          };
        }
      );

      console.log("Formatted results:", formattedResults);
      return formattedResults;
    } catch (error) {
      console.error("Error formatting snapshot results:", error);
      return [];
    }
  };

  const handleViewTest = (submission: TestSubmission) => {
    setSelectedSubmission(submission);
    setOpenSlider(true);
    setCurrentPhotoIndex(0);
    setReviewNotes("");
    setReviewScore(null);
    setActiveTab(0);

    // If the status is pending, update it to in_progress
    if (submission.status === "pending") {
      updateAssignmentStatus(submission.assignment_id, "in_progress");
    }
  };

  const handleViewPhotos = () => {
    if (!selectedSubmission) return;
    setOpenDialog(true);
  };

  const updateAssignmentStatus = async (
    assignmentId: string,
    status: string
  ) => {
    try {
      const { error } = await supabase
        .from("review_assignments")
        .update({
          status: status,
          ...(status === "completed"
            ? { completed_at: new Date().toISOString() }
            : {}),
        })
        .eq("id", assignmentId);

      if (error) throw error;

      // Update local state
      setSubmissions(
        submissions.map((sub) =>
          sub.assignment_id === assignmentId
            ? {
                ...sub,
                status: status as "pending" | "in_progress" | "completed",
              }
            : sub
        )
      );
    } catch (error) {
      console.error(`Failed to update assignment status to ${status}:`, error);
    }
  };
  // Function to immediately clean up all completed reviews
  const immediateCleanupCompletedReviews = async () => {
    try {
      console.log("Starting immediate cleanup of all completed reviews");

      // Get all completed assignments that aren't archived yet
      const { data: completedAssignments, error: fetchError } = await supabase
        .from("review_assignments")
        .select(
          `
        id,
        test_id,
        status
      `
        )
        .eq("status", "completed")
        .eq("archived", false);

      if (fetchError) {
        console.error("Error fetching completed assignments:", fetchError);
        return;
      }

      console.log(
        `Found ${
          completedAssignments?.length || 0
        } completed assignments to clean up immediately`
      );

      if (!completedAssignments || completedAssignments.length === 0) {
        return;
      }

      // Get test details to find images
      const testIds = completedAssignments.map(
        (assignment) => assignment.test_id
      );

      const { data: tests, error: testsError } = await supabase
        .from("answers")
        .select(
          `
        id,
        snapshot_metadata
      `
        )
        .in("id", testIds);

      if (testsError) {
        console.error("Error fetching tests for cleanup:", testsError);
        return;
      }

      // Process each completed assignment
      for (const assignment of completedAssignments) {
        const test = tests?.find((t) => t.id === assignment.test_id);
        if (!test) continue;

        // Extract photos from snapshot_metadata
        let photos: string[] = [];
        let parsedMetadata = test.snapshot_metadata;

        // Try to parse if it's a string
        if (typeof test.snapshot_metadata === "string") {
          try {
            parsedMetadata = JSON.parse(test.snapshot_metadata);
          } catch (e) {
            console.error(
              `Error parsing snapshot_metadata for test ${test.id}:`,
              e
            );
          }
        }

        // Extract URLs from the metadata
        if (parsedMetadata && parsedMetadata.urls) {
          photos = Object.values(parsedMetadata.urls);
        }

        // Clean up this review immediately
        await cleanupCompletedReview(
          assignment.test_id,
          photos,
          assignment.id,
          false
        );
      }

      console.log("Completed immediate cleanup of all completed reviews");
    } catch (error) {
      console.error("Error during immediate cleanup:", error);
    }
  };
  const scheduleReviewCleanup = (
    testId: string,
    photos: string[],
    assignmentId: string,
    immediate = false,
    isAdminAction = false // New parameter
  ) => {
    // If immediate cleanup is requested, do it now
    if (immediate) {
      cleanupCompletedReview(testId, photos, assignmentId, isAdminAction);
      return;
    }

    // Otherwise, schedule cleanup after 1 hour (3600000 ms)
    const CLEANUP_DELAY = 3600000;

    setTimeout(() => {
      cleanupCompletedReview(testId, photos, assignmentId, isAdminAction);
    }, CLEANUP_DELAY);

    console.log(`Scheduled cleanup for test ${testId} in 1 hour`);
  };
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleCloseSlider = () => {
    setOpenSlider(false);
    setSelectedSubmission(null);
  };

  const handleNextPhoto = () => {
    if (
      selectedSubmission &&
      currentPhotoIndex < selectedSubmission.photos.length - 1
    ) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const handlePreviousPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  useEffect(() => {
    getUser();
  }, []);
  // Add this to your useEffect that runs on component mount
  useEffect(() => {
    getUser();

    // Run a cleanup of all completed reviews when the component loads
    // This helps ensure we don't accumulate old reviews
    if (isAdmin) {
      cleanupAllCompletedReviews();
    }

    // Optional: Set up a periodic cleanup every few hours
    const cleanupInterval = setInterval(() => {
      if (isAdmin) {
        cleanupAllCompletedReviews();
      }
    }, 6 * 60 * 60 * 1000); // Run every 6 hours

    return () => {
      clearInterval(cleanupInterval);
    };
  }, []);

  // Improve the formatSubjectScore function to make it more readable
  const formatSubjectScore = (subjectScore: any) => {
    if (!subjectScore) return "N/A";

    try {
      // Parse the subject score if it's a string
      const scoreData =
        typeof subjectScore === "string"
          ? JSON.parse(subjectScore)
          : subjectScore;

      // Extract subCategory for display
      const subCategory = scoreData.subCategory
        ? scoreData.subCategory.join(", ")
        : "Unknown";

      // Remove the subCategory field for the scores display
      const { subCategory: _, ...scores } = scoreData;

      // Format the scores as a readable table-like structure
      const formattedScores = Object.entries(scores)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");

      return (
        <div>
          <div className="mb-2">
            <span className="font-medium">Category: </span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
              {subCategory}
            </span>
          </div>
          <div>
            <span className="font-medium">Scores: </span>
            {formattedScores}
          </div>
        </div>
      );
    } catch (error) {
      console.error("Error formatting subject score:", error);
      return "Error formatting score data";
    }
  };

  // Updated function to send evaluation emails using the dedicated endpoint
  const sendEvaluationEmail = async (
    email: string,
    status: "approved" | "rejected",
    testName: string,
    testId: string,
    score: number,
    overall: number,
    reviewNotes: string,
    reviewScore: number | null
  ) => {
    try {
      // Create the email subject based on the review status
      const subject =
        status === "approved"
          ? `Your ${testName} has been approved`
          : `Your ${testName} requires attention`;

      // Build a detailed email body with the review information (for fallback plain text)
      let body = `Dear Candidate,\n\n`;

      if (status === "approved") {
        body += `We are pleased to inform you that your ${testName} has been reviewed and approved.\n\n`;
      } else {
        body += `Your ${testName} has been reviewed and requires some attention.\n\n`;
      }

      body += `Test Details:\n`;
      body += `- Test: ${testName}\n`;
      body += `- Original Score: ${score}/${overall}\n`;

      body += `\nReviewer Notes:\n${reviewNotes}\n\n`;

      body += `If you have any questions, please don't hesitate to contact us.\n\n`;
      body += `Best regards,\nThe Assessment Team`;

      // Send the email using our dedicated API endpoint
      const response = await fetch("/api/send-evaluation-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: email,
          subject,
          body,
          testId,
          reviewStatus: status,
          reviewScore,
          originalScore: score,
          overall,
          testName,
          reviewNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Email API error:", errorData);
        throw new Error(
          `Failed to send evaluation email: ${
            errorData.details || "Unknown error"
          }`
        );
      }

      return true;
    } catch (error) {
      console.error("Error sending evaluation email:", error);
      return false;
    }
  };
  const handleApproveSubmission = async () => {
    if (!selectedSubmission) return;

    setProcessingAction(true);
    try {
      // Check if current user is s_admin
      const isAdminAction = isAdmin; // Use your existing isAdmin flag or check user role directly

      // If NOT an admin action, update the review assignment status to completed
      if (!isAdminAction) {
        await updateAssignmentStatus(
          selectedSubmission.assignment_id,
          "completed"
        );
      }

      // Update the answer record with review information
      const { error } = await supabase
        .from("answers")
        .update({
          review_status: "approved",
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes,
          review_score: reviewScore,
        })
        .eq("id", selectedSubmission.testId);

      if (error) throw error;

      // Send email notification using our dedicated endpoint
      const emailSent = await sendEvaluationEmail(
        selectedSubmission.email,
        "approved",
        selectedSubmission.testName,
        selectedSubmission.testId,
        selectedSubmission.score,
        selectedSubmission.overall,
        reviewNotes,
        reviewScore
      );

      // Clean up this review immediately after approval, passing the isAdminAction flag
      scheduleReviewCleanup(
        selectedSubmission.testId,
        selectedSubmission.photos,
        selectedSubmission.assignment_id,
        true, // Set to true for immediate cleanup
        isAdminAction // Pass the admin flag
      );

      // Close slider and show success message
      handleCloseSlider();
      toast.success(
        emailSent ? t("approvalSuccessWithEmail") : t("approvalSuccess")
      );

      // Refresh the assignments list
      if (isAdmin) {
        fetchAllAssignedTests();
      } else if (examinerId) {
        fetchAssignedTests(examinerId);
      }
    } catch (error) {
      console.error("Failed to approve submission:", error);
      toast.error(t("approvalError"));
    } finally {
      setProcessingAction(false);
    }
  };
  const cleanupCompletedReview = async (
    testId: string,
    photos: string[],
    assignmentId: string,
    isAdminAction = false // New parameter to indicate if this is an admin action
  ) => {
    try {
      console.log(
        `Starting cleanup for test ${testId}, assignment ${assignmentId}, isAdminAction: ${isAdminAction}`
      );

      // 1. Delete images from Supabase storage (no change here)
      if (photos && photos.length > 0) {
        // Image deletion code remains the same...
      }

      // 2. If this is a regular examiner action, mark THEIR assignment as completed and archived
      if (!isAdminAction) {
        const { error: updateError } = await supabase
          .from("review_assignments")
          .update({
            archived: true,
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("id", assignmentId);

        if (updateError) {
          console.error(
            `Error archiving review assignment ${assignmentId}:`,
            updateError
          );
        } else {
          console.log(`Successfully archived assignment ${assignmentId}`);
        }
      }

      // 3. Mark ALL assignments for this test as archived
      // If it's an admin action, we only archive without marking as completed
      const { error: updateAllError } = await supabase
        .from("review_assignments")
        .update({
          archived: true,
          // Only include completed status if this is NOT an admin action and we're updating other assignments
          ...(isAdminAction
            ? {}
            : { status: "completed", completed_at: new Date().toISOString() }),
        })
        .eq("test_id", testId)
        .eq("archived", false); // Only update non-archived assignments

      if (updateAllError) {
        console.error(
          `Error archiving assignments for test ${testId}:`,
          updateAllError
        );
      } else {
        console.log(`Successfully archived all assignments for test ${testId}`);
      }

      console.log(`Cleanup completed for test ${testId}`);
      return true;
    } catch (error) {
      console.error(
        `Error during cleanup for test ${testId}, assignment ${assignmentId}:`,
        error
      );
      return false;
    }
  };
  // New function to clean up all non-active assignments
  const cleanupAllCompletedReviews = async () => {
    try {
      console.log("Starting cleanup of all completed reviews");

      // 1. Get all completed assignments that aren't archived yet
      const { data: completedAssignments, error: fetchError } = await supabase
        .from("review_assignments")
        .select(
          `
        id,
        test_id,
        status,
        archived
      `
        )
        .in("status", ["completed"])
        .eq("archived", false);

      if (fetchError) {
        console.error("Error fetching completed assignments:", fetchError);
        return;
      }

      console.log(
        `Found ${
          completedAssignments?.length || 0
        } completed assignments to clean up`
      );

      if (!completedAssignments || completedAssignments.length === 0) {
        return;
      }

      // 2. Get test details to find images
      const testIds = completedAssignments.map(
        (assignment) => assignment.test_id
      );

      const { data: tests, error: testsError } = await supabase
        .from("answers")
        .select(
          `
        id,
        snapshot_metadata
      `
        )
        .in("id", testIds);

      if (testsError) {
        console.error("Error fetching tests for cleanup:", testsError);
        return;
      }

      // 3. Process each completed assignment
      for (const assignment of completedAssignments) {
        const test = tests?.find((t) => t.id === assignment.test_id);
        if (!test) continue;
        // Extract photos from snapshot_metadata
        let photos: string[] = [];
        let parsedMetadata = test.snapshot_metadata;

        // Try to parse if it's a string
        if (typeof test.snapshot_metadata === "string") {
          try {
            parsedMetadata = JSON.parse(test.snapshot_metadata);
          } catch (e) {
            console.error(
              `Error parsing snapshot_metadata for test ${test.id}:`,
              e
            );
          }
        }

        // Extract URLs from the metadata
        if (parsedMetadata && parsedMetadata.urls) {
          photos = Object.values(parsedMetadata.urls);
        }

        // Clean up this review immediately
        await cleanupCompletedReview(
          assignment.test_id,
          photos,
          assignment.id,
          false
        );
      }

      console.log("Completed batch cleanup of all completed reviews");
    } catch (error) {
      console.error("Error during batch cleanup:", error);
    }
  };
  const handleRejectSubmission = async () => {
    if (!selectedSubmission) return;

    setProcessingAction(true);
    try {
      // Check if current user is s_admin
      const isAdminAction = isAdmin; // Use your existing isAdmin flag or check user role directly

      // If NOT an admin action, update the review assignment status to completed
      if (!isAdminAction) {
        await updateAssignmentStatus(
          selectedSubmission.assignment_id,
          "completed"
        );
      }

      // Update the answer record with review information
      const { error } = await supabase
        .from("answers")
        .update({
          review_status: "rejected",
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes,
          review_score: reviewScore,
        })
        .eq("id", selectedSubmission.testId);

      if (error) throw error;

      // Send email notification using our dedicated endpoint
      const emailSent = await sendEvaluationEmail(
        selectedSubmission.email,
        "rejected",
        selectedSubmission.testName,
        selectedSubmission.testId,
        selectedSubmission.score,
        selectedSubmission.overall,
        reviewNotes,
        reviewScore
      );

      // Clean up this review immediately after rejection, passing the isAdminAction flag
      scheduleReviewCleanup(
        selectedSubmission.testId,
        selectedSubmission.photos,
        selectedSubmission.assignment_id,
        true, // Set to true for immediate cleanup
        isAdminAction // Pass the admin flag
      );

      // Close slider and show success message
      handleCloseSlider();
      toast.success(
        emailSent ? t("rejectionSuccessWithEmail") : t("rejectionSuccess")
      );

      // Refresh the assignments list
      if (isAdmin) {
        fetchAllAssignedTests();
      } else if (examinerId) {
        fetchAssignedTests(examinerId);
      }
    } catch (error) {
      console.error("Failed to reject submission:", error);
      toast.error(t("rejectionError"));
    } finally {
      setProcessingAction(false);
    }
  };
  // Define columns based on user role
  const getColumns = () => {
    const baseColumns = [
      {
        field: "candidateName",
        headerName: t("table.candidate"),
        width: 200,
        flex: 1,
        sortable: true,
        renderCell: (params: any) => {
          return (
            <div className="flex items-center w-full">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mr-3">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                  {params.row.candidateName?.charAt(0)?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex flex-col">
                <p className="font-medium text-sm text-gray-900 dark:text-white">
                  {params.row.candidateName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {params.row.email || "No email"}
                </p>
              </div>
            </div>
          );
        },
      },

      {
        field: "testName",
        headerName: t("table.testName"),
        width: 180,
        flex: 1,
        sortable: true,
      },
      {
        field: "score",
        headerName: t("table.score"),
        width: 100,
        flex: 1,
        sortable: true,
        renderCell: (params: any) => (
          <div className="flex items-center">
            <span
              className={`font-medium ${
                params.row.score >= 80
                  ? "text-emerald-600 dark:text-emerald-400"
                  : params.row.score >= 60
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {params.row.score}/{params.row.overall}
            </span>
          </div>
        ),
      },
      {
        field: "submissionDate",
        headerName: t("table.submissionDate"),
        width: 180,
        flex: 1,
        sortable: true,
        renderCell: (params: any) => (
          <div className="text-gray-600 dark:text-gray-400 text-sm">
            {moment(params.row.submissionDate).format("MMM D, YYYY, h:mm A")}
          </div>
        ),
      },
      {
        field: "status",
        headerName: t("table.status"),
        width: 120,
        flex: 1,
        sortable: true,
        renderCell: (params: any) => (
          <div>
            <span
              className={`px-3 py-1 text-xs rounded-full font-medium ${
                params.row.status === "completed"
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700"
                  : params.row.status === "in_progress"
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
                  : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700"
              }`}
            >
              {t(`status.${params.row.status}`)}
            </span>
          </div>
        ),
      },
      {
        field: "actions",
        headerName: t("table.actions"),
        width: 120,
        flex: 1,
        sortable: false,
        renderCell: (params: any) => (
          <div className="flex items-center h-full gap-2">
            <ReviewButton
              submission={params.row}
              onReview={handleViewTest}
              disabled={params.row.status === "completed"}
            />
          </div>
        ),
      },
    ];

    // Add examiner column for admin view
    if (isAdmin) {
      return [
        ...baseColumns.slice(0, 1),
        {
          field: "examiner_name",
          headerName: "Examiner",
          width: 180,
          flex: 1,
          sortable: true,
          renderCell: (params: any) => (
            <div className="flex items-center gap-3">
              <div>
                <div className="font-medium">{params.row.examiner_name}</div>
                <div className="text-sm text-gray-500">
                  {params.row.examiner_email}
                </div>
              </div>
            </div>
          ),
        },
        ...baseColumns.slice(1),
      ];
    }

    return baseColumns;
  };

  // Add this useEffect to handle filtering
  useEffect(() => {
    if (submissions.length > 0) {
      // Extract unique examiners for the filter dropdown
      const examiners = submissions.reduce(
        (acc: { id: string; name: string }[], submission) => {
          if (submission.examiner_name && submission.examiner_email) {
            const exists = acc.some((e) => e.id === submission.examiner_email);
            if (!exists) {
              acc.push({
                id: submission.examiner_email,
                name: submission.examiner_name,
              });
            }
          }
          return acc;
        },
        []
      );

      setUniqueExaminers(examiners);

      // Apply filters
      let filtered = [...submissions];

      // Filter by status
      if (statusFilter !== "all") {
        filtered = filtered.filter((sub) => sub.status === statusFilter);
      }

      // Filter by examiner
      if (examinerFilter !== "all") {
        filtered = filtered.filter(
          (sub) => sub.examiner_email === examinerFilter
        );
      }

      // Filter by search query (candidate name or email)
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (sub) =>
            sub.candidateName.toLowerCase().includes(query) ||
            sub.email.toLowerCase().includes(query) ||
            sub.testName.toLowerCase().includes(query)
        );
      }

      setFilteredSubmissions(filtered);
    } else {
      setFilteredSubmissions([]);
    }
  }, [submissions, statusFilter, examinerFilter, searchQuery, refreshKey]);

  // Add a function to handle refresh
  const handleRefresh = () => {
    if (isAdmin) {
      fetchAllAssignedTests();
    } else if (examinerId) {
      fetchAssignedTests(examinerId);
    }
    setRefreshKey((prev) => prev + 1);
  };

  // Add a function to clear all filters
  const clearFilters = () => {
    setStatusFilter("all");
    setExaminerFilter("all");
    setSearchQuery("");
  };

  return (
    <ProtectedRoute allowedRoles={["admin", "s_admin", "examiner"]}>
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          {isAdmin ? "All Test Evaluations" : t("title")}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {isAdmin
            ? "View and manage all test evaluations assigned to examiners"
            : t("description")}
        </p>

        {isAdmin && (
          <Card className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardContent className="p-6">
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="status-filter-label" className="text-gray-700 dark:text-gray-300">Status</InputLabel>
                    <Select
                      labelId="status-filter-label"
                      value={statusFilter}
                      label="Status"
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="text-gray-900 dark:text-white"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: '#d1d5db',
                          },
                          '&:hover fieldset': {
                            borderColor: '#10b981',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#10b981',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#6b7280',
                        },
                        '& .MuiSelect-icon': {
                          color: '#6b7280',
                        },
                      }}
                    >
                      <MenuItem value="all">All Statuses</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="in_progress">In Progress</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="examiner-filter-label" className="text-gray-700 dark:text-gray-300">Examiner</InputLabel>
                    <Select
                      labelId="examiner-filter-label"
                      value={examinerFilter}
                      label="Examiner"
                      onChange={(e) => setExaminerFilter(e.target.value)}
                      className="text-gray-900 dark:text-white"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: '#d1d5db',
                          },
                          '&:hover fieldset': {
                            borderColor: '#10b981',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#10b981',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#6b7280',
                        },
                        '& .MuiSelect-icon': {
                          color: '#6b7280',
                        },
                      }}
                    >
                      <MenuItem value="all">All Examiners</MenuItem>
                      {uniqueExaminers.map((examiner) => (
                        <MenuItem key={examiner.id} value={examiner.id}>
                          {examiner.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Search candidates or tests"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="text-gray-900 dark:text-white"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: '#d1d5db',
                        },
                        '&:hover fieldset': {
                          borderColor: '#10b981',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#10b981',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#6b7280',
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <Search className="h-4 w-4 mr-2 text-gray-400 dark:text-gray-500" />
                      ),
                    }}
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                  md={2}
                  className="flex items-center justify-end gap-2"
                >
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={clearFilters}
                    className="min-w-[80px] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Clear
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleRefresh}
                    className="min-w-[80px] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                    startIcon={<RefreshCw className="h-4 w-4" />}
                  >
                    Refresh
                  </Button>
                </Grid>
              </Grid>

              {/* Show filter summary */}
              <Box className="mt-4 flex flex-wrap gap-2">
                {statusFilter !== "all" && (
                  <Chip
                    label={`Status: ${statusFilter}`}
                    onDelete={() => setStatusFilter("all")}
                    size="small"
                    color="primary"
                    variant="outlined"
                    className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
                  />
                )}
                {examinerFilter !== "all" && (
                  <Chip
                    label={`Examiner: ${
                      uniqueExaminers.find((e) => e.id === examinerFilter)
                        ?.name || examinerFilter
                    }`}
                    onDelete={() => setExaminerFilter("all")}
                    size="small"
                    color="primary"
                    variant="outlined"
                    className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
                  />
                )}
                {searchQuery && (
                  <Chip
                    label={`Search: ${searchQuery}`}
                    onDelete={() => setSearchQuery("")}
                    size="small"
                    color="primary"
                    variant="outlined"
                    className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
                  />
                )}

                {/* Show count of filtered results */}
                {(statusFilter !== "all" ||
                  examinerFilter !== "all" ||
                  searchQuery) && (
                  <Typography
                    variant="body2"
                    className="ml-2 flex items-center"
                  >
                    <span className="text-gray-500 dark:text-gray-400">
                      Showing {filteredSubmissions.length} of{" "}
                      {submissions.length} evaluations
                    </span>
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        )}
        <div className="mt-6 overflow-x-auto max-w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="min-w-[1000px]">
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
              rows={isAdmin ? filteredSubmissions : submissions}
              columns={getColumns()}
              loading={loading}
            />
          </div>
        </div>
        {/* Test Review Slider */}
        <Slider
          edit={t("reviewSlider.title")}
          isOpen={openSlider}
          onClose={handleCloseSlider}
          hideButton={true}
        >
          {selectedSubmission && (
            <div className="space-y-6 py-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                  {selectedSubmission.candidateName}
                </h2>

                {/* Show examiner info for admin view */}
                {isAdmin && selectedSubmission.examiner_name && (
                  <div className="mb-4 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-200 dark:border-emerald-700">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      <span className="font-medium">Assigned to:</span>{" "}
                      {selectedSubmission.examiner_name} (
                      {selectedSubmission.examiner_email})
                    </p>
                  </div>
                )}

                <Tabs value={activeTab} onChange={handleTabChange}>
                  <Tab label="Test Details" />
                  <Tab
                    label={
                      <div className="flex items-center gap-2">
                        <Camera size={16} />
                        <span>
                          Snapshots ({selectedSubmission.photos.length})
                        </span>
                      </div>
                    }
                  />
                </Tabs>
                {activeTab === 0 && (
                  <div className="mt-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t("reviewSlider.email")}
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedSubmission.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t("reviewSlider.testType")}
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedSubmission.exam}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t("reviewSlider.score")}
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {selectedSubmission.score}/
                          {selectedSubmission.overall}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t("reviewSlider.submissionDate")}
                        </p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {moment(selectedSubmission.submissionDate).format(
                            "MMM D, YYYY, h:mm A"
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 font-medium">
                        {t("reviewSlider.subjectScores")}
                      </p>
                      <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-600">
                        {formatSubjectScore(selectedSubmission.subject_score)}
                      </div>
                    </div>
                  </div>
                )}
                {activeTab === 1 && (
                  <div className="mt-4">
                    {selectedSubmission.photos.length > 0 ? (
                      <div>
                        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg mb-4 border border-gray-200 dark:border-gray-600">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Snapshot {currentPhotoIndex + 1} of{" "}
                            {selectedSubmission.photos.length}
                          </p>
                          <div className="relative h-[400px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                            <img
                              src={selectedSubmission.photos[currentPhotoIndex]}
                              alt={`Snapshot ${currentPhotoIndex + 1}`}
                              className="max-h-full max-w-full object-contain"
                            />
                          </div>
                          <div className="flex justify-center mt-4 gap-4">
                            <Button
                              variant="outlined"
                              onClick={handlePreviousPhoto}
                              disabled={currentPhotoIndex === 0}
                              startIcon={<ChevronLeft size={16} />}
                              className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={handleNextPhoto}
                              disabled={
                                currentPhotoIndex ===
                                selectedSubmission.photos.length - 1
                              }
                              endIcon={<ChevronRight size={16} />}
                              className="text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              Next
                            </Button>
                          </div>
                        </div>

                        {/* Snapshot analysis section */}
                        <div className="mt-6">
                          <h4 className="font-medium text-lg mb-3 text-gray-900 dark:text-white">
                            Snapshot Analysis
                          </h4>

                          {/* Display snapshot metadata in a more readable format */}
                          {selectedSubmission.snapshot_metadata && (
                            <div className="grid grid-cols-2 gap-4 mb-4 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-700">
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Total Snapshots
                                </p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {(
                                    selectedSubmission.snapshot_metadata
                                      .totalCount || 0
                                  ).toString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Saved Snapshots
                                </p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {(
                                    selectedSubmission.snapshot_metadata
                                      .savedCount || 0
                                  ).toString()}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Display verification results for each snapshot */}
                          <div className="overflow-x-auto">
                            <table className="min-w-full border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                              <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Time
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Verified
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Face Detected
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Multiple Faces
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {formatSnapshotResults(
                                  selectedSubmission.snapshot_metadata
                                ).length > 0 ? (
                                  formatSnapshotResults(
                                    selectedSubmission.snapshot_metadata
                                  ).map((result) => (
                                    <tr key={result.id}>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        {result.timestamp}
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                                        <span
                                          className={`px-2 py-1 text-xs rounded-full ${
                                            result.status === "verified"
                                              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700"
                                              : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700"
                                          }`}
                                        >
                                          {result.status}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                                        <span
                                          className={`px-2 py-1 text-xs rounded-full ${
                                            result.verified === "Yes"
                                              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700"
                                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700"
                                          }`}
                                        >
                                          {result.verified}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                                        <span
                                          className={`px-2 py-1 text-xs rounded-full ${
                                            result.hasFace === "Yes"
                                              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700"
                                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700"
                                          }`}
                                        >
                                          {result.hasFace}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                                        <span
                                          className={`px-2 py-1 text-xs rounded-full ${
                                            result.multipleFaces === "Yes"
                                              ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700"
                                              : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700"
                                          }`}
                                        >
                                          {result.multipleFaces}
                                        </span>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={5}
                                      className="px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
                                    >
                                      No detailed analysis available
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Add a summary section */}
                          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                            <h5 className="font-medium mb-2 text-gray-900 dark:text-white">Summary</h5>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {selectedSubmission.photos.length > 0
                                ? `This test has ${
                                    selectedSubmission.photos.length
                                  } snapshot(s). ${
                                    formatSnapshotResults(
                                      selectedSubmission.snapshot_metadata
                                    ).some((r) => r.hasFace === "Yes")
                                      ? "Face verification was successful."
                                      : "No face was detected in the snapshots."
                                  }`
                                : "No snapshots were captured during this test."}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[200px] bg-gray-100 rounded-lg">
                        <p className="text-gray-500">
                          No snapshots available for this test
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold mb-4">
                  {t("reviewSlider.reviewSection")}
                </h3>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("reviewSlider.reviewNotes")}{" "}
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                    placeholder={t("reviewSlider.reviewNotesPlaceholder")}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outlined"
                    onClick={handleCloseSlider}
                    disabled={processingAction}
                  >
                    {t("buttons.cancel")}
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={
                      processingAction ? (
                        <CircularProgress size={16} />
                      ) : (
                        <X size={16} />
                      )
                    }
                    onClick={handleRejectSubmission}
                    disabled={processingAction}
                  >
                    {t("buttons.reject")}
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={
                      processingAction ? (
                        <CircularProgress size={16} />
                      ) : (
                        <Check size={16} />
                      )
                    }
                    onClick={handleApproveSubmission}
                    disabled={processingAction}
                  >
                    {t("buttons.approve")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Slider>
        {/* Photo Review Dialog */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          {selectedSubmission && (
            <>
              <DialogTitle>
                {t("reviewDialog.title", {
                  name: selectedSubmission.candidateName,
                })}
              </DialogTitle>
              <DialogContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle1">
                    {t("reviewDialog.testInfo", {
                      test: selectedSubmission.testName,
                      score: `${selectedSubmission.score}/${selectedSubmission.overall}`,
                    })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedSubmission.photos.length > 0
                      ? t("reviewDialog.photoInfo", {
                          current: currentPhotoIndex + 1,
                          total: selectedSubmission.photos.length,
                        })
                      : t("reviewDialog.noPhotos")}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    mb: 2,
                    height: 400,
                    backgroundColor: "#f5f5f5",
                    position: "relative",
                  }}
                >
                  {selectedSubmission.photos.length > 0 ? (
                    <img
                      src={selectedSubmission.photos[currentPhotoIndex]}
                      alt={`Proctoring photo ${currentPhotoIndex + 1}`}
                      style={{
                        maxHeight: "100%",
                        maxWidth: "100%",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <p className="text-gray-600">
                        {t("reviewDialog.noPhotosAvailable")}
                      </p>
                    </div>
                  )}
                </Box>

                {selectedSubmission.photos.length > 0 && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Button
                      variant="outlined"
                      onClick={handlePreviousPhoto}
                      disabled={currentPhotoIndex === 0}
                      startIcon={<ChevronLeft size={16} />}
                    >
                      {t("reviewDialog.previousPhoto")}
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleNextPhoto}
                      disabled={
                        currentPhotoIndex ===
                        selectedSubmission.photos.length - 1
                      }
                      endIcon={<ChevronRight size={16} />}
                    >
                      {t("reviewDialog.nextPhoto")}
                    </Button>
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDialog}>
                  {t("buttons.close")}
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </div>
    </ProtectedRoute>
  );
};
const ReviewButton = ({
  submission,
  onReview,
  disabled,
}: {
  submission: TestSubmission;
  onReview: (submission: TestSubmission) => void;
  disabled: boolean;
}) => {
  const t = useTranslations("EvaluationCheck");

  // Always disable the button for completed reviews
  const isDisabled = disabled || submission.status === "completed";

  return (
    <button
      onClick={() => onReview(submission)}
      disabled={isDisabled}
      className={`flex items-center justify-center px-3 py-1 rounded-md text-sm ${
        isDisabled
          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
          : "bg-blue-50 text-blue-600 hover:bg-blue-100"
      }`}
      title={
        submission.status === "completed"
          ? t("buttons.alreadyReviewed")
          : t("buttons.reviewTest")
      }
    >
      <Eye size={16} className="mr-1" />
      {t("buttons.review")}
    </button>
  );
};

export default EvaluationCheckPage;
