"use client";
import React, { useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  X,
  UserCheck,
  Clock,
  XCircle,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Ban,
  Loader2,
  Check,
  Users,
  CheckCircle,
} from "lucide-react";
import Image from "next/image";
import moment from "moment";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getUserRole } from "@/app/apis/job/getJobs";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  profile: {
    image_url: string;
  };
  applied_date: string;
  status: string;
  experience?: string;
  skills?: string[];
  id_job_postings: string;
}

interface CandidatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    profile: {
      image_url: string;
    };
    applied_date: string;
    status: string;
    id_job_postings: string;
  }[];
  jobTitle: string;
  jobId: string;
}

interface EmailTemplate {
  subject: string;
  body: string;
}

// Define tab types
type TabType = "new" | "processed";

// Transform raw database data to match the Candidate interface
const transformCandidateData = (rawData: any): Candidate => {
  return {
    id: rawData.id,
    fullName: rawData.fullName || "Anonymous",
    email: rawData.email,
    phone: rawData.phone || undefined,
    location: rawData.location || undefined,
    profile: rawData.profile || { image_url: "/default-avatar.png" },
    applied_date: rawData.created_at || rawData.applied_date,
    status: (rawData.status || "pending").toLowerCase(),
    experience: rawData.experience || undefined,
    skills: rawData.skills || [],
    id_job_postings: rawData.id_job_postings,
  };
};

const emailTemplates = (
  companyInfo: {
    companyName: string;
    companyEmail: string;
  },
  t: any
) => ({
  accepted: (candidateName: string, jobTitle: string): EmailTemplate => ({
    subject: t("CandidatesModal.emails.accepted.subject", {
      jobTitle,
      companyName: companyInfo.companyName,
    }),
    body: t("CandidatesModal.emails.accepted.body", {
      candidateName,
      jobTitle,
      companyName: companyInfo.companyName,
      companyEmail: companyInfo.companyEmail,
    }),
  }),
  rejected: (candidateName: string, jobTitle: string): EmailTemplate => ({
    subject: t("CandidatesModal.emails.rejected.subject", {
      jobTitle,
      companyName: companyInfo.companyName,
    }),
    body: t("CandidatesModal.emails.rejected.body", {
      candidateName,
      jobTitle,
      companyName: companyInfo.companyName,
      companyEmail: companyInfo.companyEmail,
    }),
  }),
});

const StatusBadge = ({ status }: { status: string }) => {
  const t = useTranslations();
  // Normalize the status to lowercase for comparison
  const normalizedStatus = status?.toLowerCase() || "";

  const getStatusStyles = () => {
    switch (normalizedStatus) {
      case "accepted":
        return "bg-green-50 text-green-700 border-green-200";
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = () => {
    switch (normalizedStatus) {
      case "accepted":
        return <UserCheck className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusLabel = () => {
    switch (normalizedStatus) {
      case "accepted":
        return t("CandidatesModal.status.accepted");
      case "pending":
        return t("CandidatesModal.status.pending");
      case "rejected":
        return t("CandidatesModal.status.rejected");
      default:
        return normalizedStatus;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusStyles()}`}
    >
      {getStatusIcon()}
      <span className="ml-2 capitalize">{getStatusLabel()}</span>
    </span>
  );
};

const CandidateCard = ({
  candidate,
  onUpdateStatus,
  isProcessing,
}: {
  candidate: Candidate;
  onUpdateStatus: (
    candidateId: string,
    newStatus: "accepted" | "rejected"
  ) => Promise<void>;
  isProcessing: boolean;
}) => {
  const t = useTranslations();
  const [loading, setLoading] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>("");
  const getUser = async () => {
    const { role, email } = await getUserRole();
    setRole(role);
  };
  useEffect(() => {
    getUser();
  }, []);

  // Provide default values for null fields
  const defaultProfile = {
    image_url:
      "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
  };

  const displayProfile = candidate.profile || defaultProfile;
  const displayName = candidate.fullName || t("CandidatesModal.anonymous");
  const displaySkills = candidate.skills || [];

  const handleStatusUpdate = async (status: "accepted" | "rejected") => {
    try {
      setLoading(status);
      await onUpdateStatus(candidate.id, status);
    } catch (error) {
      toast.error(t("CandidatesModal.errors.failedToUpdateStatus"));
    } finally {
      setLoading(null);
    }
  };

  const router = useRouter();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="relative w-16 h-16">
            <Image
              src={displayProfile.image_url}
              alt={displayName}
              width={64}
              height={64}
              className="rounded-full w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {displayName}
            </h3>
            <div className="mt-1 space-y-1">
              <p className="flex items-center text-sm text-gray-500">
                <Mail className="w-4 h-4 mr-2" />
                {candidate.email}
              </p>
              {candidate.phone && (
                <p className="flex items-center text-sm text-gray-500">
                  <Phone className="w-4 h-4 mr-2" />
                  {candidate.phone}
                </p>
              )}
              {candidate.location && (
                <p className="flex items-center text-sm text-gray-500">
                  <MapPin className="w-4 h-4 mr-2" />
                  {candidate.location}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-2">
          <StatusBadge status={candidate.status} />

          {candidate.status?.toLowerCase() === "pending" &&
            role === "admin" && (
              <div className="flex items-center space-x-2 mt-2">
                <button
                  onClick={() => handleStatusUpdate("accepted")}
                  disabled={isProcessing || loading !== null}
                  className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                    (isProcessing || loading) && "opacity-50 cursor-not-allowed"
                  }`}
                >
                  {loading === "accepted" ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {t("CandidatesModal.actions.accept")}
                </button>
                <button
                  onClick={() => handleStatusUpdate("rejected")}
                  disabled={isProcessing || loading !== null}
                  className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                    (isProcessing || loading) && "opacity-50 cursor-not-allowed"
                  }`}
                >
                  {loading === "rejected" ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Ban className="w-4 h-4 mr-2" />
                  )}
                  {t("CandidatesModal.actions.decline")}
                </button>
              </div>
            )}
        </div>
      </div>

      {displaySkills.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            {t("CandidatesModal.labels.skills")}
          </h4>
          <div className="flex flex-wrap gap-2">
            {displaySkills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-gray-500">
          {t("CandidatesModal.applied")}{" "}
          {moment(candidate.applied_date).fromNow()}
        </span>
        <button
          onClick={() =>
            router.push(
              `/candidates/details?email=${encodeURIComponent(candidate.email)}`
            )
          }
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          {t("CandidatesModal.actions.viewProfile")}
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  );
};

const CandidatesModal: React.FC<CandidatesModalProps> = ({
  isOpen,
  onClose,
  candidates: initialCandidates,
  jobTitle,
  jobId,
}) => {
  const t = useTranslations();
  const [isProcessing, setIsProcessing] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<{
    companyName: string;
    companyEmail: string;
  } | null>(null);

  // Add candidates state
  const [candidates, setCandidates] = useState(
    initialCandidates.map(transformCandidateData)
  );

  // Add tab state
  const [activeTab, setActiveTab] = useState<TabType>("new");

  // Update candidates when initialCandidates changes
  useEffect(() => {
    setCandidates(initialCandidates.map(transformCandidateData));
  }, [initialCandidates]);

  useEffect(() => {
    const getCompanyInfo = async () => {
      try {
        const { data: userData, error } = await supabase.auth.getUser();
        if (error) throw error;

        // Set a default company info in case the query fails
        let companyName = t("CandidatesModal.defaultCompanyName");
        let companyEmail = userData.user?.email || "";

        // Try to get profile data, but don't throw if it fails
        try {
          const { data: profileData } = await supabase
            .from("profile_recruter")
            .select("name")
            .eq("email", userData.user.email)
            .maybeSingle();

          if (profileData?.name) {
            companyName = profileData.name;
          }
        } catch (profileError) {
          console.warn("Could not fetch recruiter profile:", profileError);
        }

        setCompanyInfo({
          companyName,
          companyEmail,
        });
      } catch (error) {
        console.error("Error fetching company info:", error);
        // Set default values even if there's an error
        setCompanyInfo({
          companyName: t("CandidatesModal.defaultCompanyName"),
          companyEmail: "",
        });
      }
    };

    getCompanyInfo();
  }, [t]);

  // Filter candidates based on active tab
  const filteredCandidates = candidates.filter((candidate) => {
    if (activeTab === "new") {
      return candidate.status.toLowerCase() === "pending";
    } else {
      return (
        candidate.status.toLowerCase() === "accepted" ||
        candidate.status.toLowerCase() === "rejected"
      );
    }
  });

  // Count of new applications
  const newApplicationsCount = candidates.filter(
    (c) => c.status.toLowerCase() === "pending"
  ).length;

  // Count of processed applications
  const processedApplicationsCount = candidates.filter(
    (c) =>
      c.status.toLowerCase() === "accepted" ||
      c.status.toLowerCase() === "rejected"
  ).length;

  const handleUpdateStatus = async (
    candidateId: string,
    newStatus: "accepted" | "rejected"
  ) => {
    if (!companyInfo) {
      toast.error(t("CandidatesModal.errors.companyInfoNotLoaded"));
      return;
    }

    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) {
      throw new Error(t("CandidatesModal.errors.candidateNotFound"));
    }

    setIsProcessing(true);
    try {
      const { data: candidateData, error: fetchError } = await supabase
        .from("applied")
        .select("*")
        .eq("id", candidateId)
        .single();

      if (fetchError) throw fetchError;

      // Get the current status before updating
      const previousStatus = candidateData.status;

      // Update the status in the database
      const { error: updateError } = await supabase
        .from("applied")
        .update({ status: newStatus })
        .eq("id", candidateId);

      if (updateError) throw updateError;

      // Update local state immediately after successful database update
      setCandidates((prevCandidates) =>
        prevCandidates.map((c) =>
          c.id === candidateId ? { ...c, status: newStatus } : c
        )
      );

      // Update job capacity based on status changes:
      // 1. When accepting a candidate (that wasn't previously accepted): INCREASE capacity
      // 2. When rejecting a previously accepted candidate: DECREASE capacity
      // 3. When rejecting a pending candidate: NO CHANGE to capacity

      if (newStatus === "accepted" && previousStatus !== "accepted") {
        // Increase capacity when accepting a new candidate
        const { data: jobData, error: jobFetchError } = await supabase
          .from("job_postings")
          .select("capacity")
          .eq("id", candidate.id_job_postings)
          .single();

        if (jobFetchError) throw jobFetchError;

        const { error: jobUpdateError } = await supabase
          .from("job_postings")
          .update({ capacity: jobData.capacity + 1 })
          .eq("id", candidate.id_job_postings);

        if (jobUpdateError) throw jobUpdateError;
      } else if (previousStatus === "accepted" && newStatus === "rejected") {
        // Decrease capacity when rejecting a previously accepted candidate
        const { data: jobData, error: jobFetchError } = await supabase
          .from("job_postings")
          .select("capacity")
          .eq("id", candidate.id_job_postings)
          .single();

        if (jobFetchError) throw jobFetchError;

        const { error: jobUpdateError } = await supabase
          .from("job_postings")
          .update({ capacity: Math.max(0, jobData.capacity - 1) })
          .eq("id", candidate.id_job_postings);

        if (jobUpdateError) throw jobUpdateError;
      }

      const emailTemplate = emailTemplates(companyInfo, t)[newStatus](
        candidate.fullName,
        jobTitle
      );

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: candidateData.email,
          subject: emailTemplate.subject,
          body: emailTemplate.body,
          from: companyInfo.companyEmail,
        }),
      });

      if (!response.ok) {
        throw new Error(t("CandidatesModal.errors.failedToSendEmail"));
      }

      // Automatically switch to processed tab when a candidate is processed
      if (activeTab === "new") {
        setTimeout(() => {
          // Optional: Switch to processed tab after a short delay
          // setActiveTab("processed");
        }, 500);
      }

      toast.success(
        t("CandidatesModal.success.candidateStatusUpdated", {
          status: newStatus,
        })
      );
    } catch (error) {
      console.error("Error updating candidate status:", error);
      toast.error(t("CandidatesModal.errors.failedToUpdateStatus"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 overflow-hidden z-50"
        onClose={onClose}
      >
        <div className="absolute inset-0 overflow-hidden">
          <Transition.Child
            as={React.Fragment}
            enter="ease-in-out duration-500"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in-out duration-500"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="absolute inset-0 bg-black bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <Transition.Child
              as={React.Fragment}
              enter="transform transition ease-in-out duration-500"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-500"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="w-screen max-w-4xl">
                <div className="h-full flex flex-col bg-white shadow-xl">
                  <div className="flex-1 overflow-y-auto">
                    <div className="px-4 py-6 sm:px-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <Dialog.Title className="text-lg font-semibold text-gray-900">
                            {t("CandidatesModal.titles.candidatesFor", {
                              jobTitle,
                            })}
                          </Dialog.Title>
                          <p className="mt-1 text-sm text-gray-500">
                            {t("CandidatesModal.info.totalApplications", {
                              count: candidates.length,
                            })}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                          onClick={onClose}
                        >
                          <span className="sr-only">
                            {t("CandidatesModal.actions.closePanel")}
                          </span>
                          <X className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200">
                      <div className="px-4 sm:px-6">
                        <nav className="flex space-x-4" aria-label="Tabs">
                          <button
                            onClick={() => setActiveTab("new")}
                            className={`
                              px-3 py-2 text-sm font-medium rounded-md flex items-center
                              ${
                                activeTab === "new"
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-gray-500 hover:text-gray-700"
                              }
                            `}
                          >
                            <Users className="mr-2 h-5 w-5" />
                            {t("CandidatesModal.tabs.newApplications")}
                            <span
                              className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                                activeTab === "new"
                                  ? "bg-blue-100"
                                  : "bg-gray-100"
                              }`}
                            >
                              {newApplicationsCount}
                            </span>
                          </button>
                          <button
                            onClick={() => setActiveTab("processed")}
                            className={`
                              px-3 py-2 text-sm font-medium rounded-md flex items-center
                              ${
                                activeTab === "processed"
                                  ? "bg-blue-50 text-blue-700"
                                  : "text-gray-500 hover:text-gray-700"
                              }
                            `}
                          >
                            <CheckCircle className="mr-2 h-5 w-5" />
                            {t("CandidatesModal.tabs.processed")}
                            <span
                              className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                                activeTab === "processed"
                                  ? "bg-blue-100"
                                  : "bg-gray-100"
                              }`}
                            >
                              {processedApplicationsCount}
                            </span>
                          </button>
                        </nav>
                      </div>
                    </div>

                    <div className="px-4 py-6 sm:px-6">
                      <div className="flow-root">
                        <div className="space-y-6">
                          {filteredCandidates.length === 0 ? (
                            <div className="text-center py-12">
                              <div className="mx-auto h-12 w-12 text-gray-400">
                                {activeTab === "new" ? (
                                  <Users className="h-12 w-12" />
                                ) : (
                                  <CheckCircle className="h-12 w-12" />
                                )}
                              </div>
                              <h3 className="mt-2 text-sm font-medium text-gray-900">
                                {activeTab === "new"
                                  ? t("CandidatesModal.noCandidates.newTitle")
                                  : t(
                                      "CandidatesModal.noCandidates.processedTitle"
                                    )}
                              </h3>
                              <p className="mt-1 text-sm text-gray-500">
                                {activeTab === "new"
                                  ? t(
                                      "CandidatesModal.noCandidates.newDescription"
                                    )
                                  : t(
                                      "CandidatesModal.noCandidates.processedDescription"
                                    )}
                              </p>
                            </div>
                          ) : (
                            filteredCandidates.map((candidate) => (
                              <CandidateCard
                                key={candidate.id}
                                candidate={candidate}
                                onUpdateStatus={handleUpdateStatus}
                                isProcessing={isProcessing}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default CandidatesModal;
