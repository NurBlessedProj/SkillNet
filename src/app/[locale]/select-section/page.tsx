"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowRight, CheckCircle } from "lucide-react";

interface Section {
  id: string;
  name: string;
  is_active: boolean | string;
}

// Default sections that will always be displayed first
const DEFAULT_SECTIONS = [
  "Finance",
  "Sales",
  "Marketing",
  "Operations",
  "Legal",
  "Management",
  "Business development",
  "HSE",
  "IT",
  "Engineering",
  "Driver",
];

export default function SelectSection() {
  const [dbSections, setDbSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [viewMode, setViewMode] = useState<"default" | "others">("default");
  const [success, setSuccess] = useState<boolean>(false);
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();

  useEffect(() => {
    // Get user email from localStorage
    const email = localStorage.getItem("userEmail");
    if (!email) {
      toast.error(t("SelectSection.notLoggedIn"));
      router.push(`/${locale}/auth`);
      return;
    }
    setUserEmail(email);

    // Fetch all active sections from database (for "Others" view)
    const fetchSections = async () => {
      try {
        const { data, error } = await supabase
          .from("section")
          .select("*")
          .eq("is_active", "true");

        if (error) {
          throw error;
        }

        if (data) {
          // Filter out sections that match our default names
          const nonDefaultSections = data.filter(
            (section) => !DEFAULT_SECTIONS.includes(section.name)
          );

          // Sort alphabetically
          nonDefaultSections.sort((a, b) => a.name.localeCompare(b.name));

          setDbSections(nonDefaultSections);
        }
      } catch (error: any) {
        toast.error(t("SelectSection.errorFetchingSections"));
        console.error("Error fetching sections:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, [router, locale, t]);

  const handleSubmit = async () => {
    if (!selectedSection) {
      toast.error(t("SelectSection.pleaseSelectSection"));
      return;
    }

    setSubmitting(true);

    try {
      // Update the user's profile with the selected section
      const { error } = await supabase
        .from("profiles")
        .update({ section: selectedSection })
        .eq("email", userEmail);

      if (error) {
        throw error;
      }

      setSuccess(true);

      // Check if the user has registered their face
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("face_registered")
        .eq("email", userEmail)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Redirect based on face registration status after a brief delay to show success message
      setTimeout(() => {
        const hasFaceRegistered =
          data.face_registered === true || data.face_registered === "true";

        if (!hasFaceRegistered) {
          router.push(`/${locale}/facerecognition`);
        } else {
          router.push(`/${locale}/test`);
        }
      }, 1500);
    } catch (error: any) {
      toast.error(t("SelectSection.errorUpdatingProfile"));
      console.error("Error updating profile:", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gray-50">
        <div className="md:w-[500px] w-[90%] bg-white p-8 rounded-xl shadow-lg">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
            <p className="text-gray-600">{t("SelectSection.loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-gray-50">
      <div className="md:w-[500px] w-[90%] bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {t("SelectSection.selectYourSection")}
          </h1>
          <p className="text-gray-600">
            {t("SelectSection.sectionDescription")}
          </p>
        </div>

        {viewMode === "default" ? (
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("SelectSection.section")}
            </label>
            <Select
              onValueChange={(value) => {
                if (value === "view_others") {
                  setViewMode("others");
                  setSelectedSection("");
                } else {
                  setSelectedSection(value);
                }
              }}
              value={selectedSection}
            >
              <SelectTrigger className="w-full border border-gray-300 rounded-md bg-white p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <SelectValue placeholder={t("SelectSection.selectSection")} />
              </SelectTrigger>
              <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md max-h-[300px]">
                <SelectGroup>
                  <SelectLabel className="text-sm font-medium text-gray-700 px-2 py-1.5">
                    {t("SelectSection.commonSections")}
                  </SelectLabel>
                  {DEFAULT_SECTIONS.map((sectionName) => (
                    <SelectItem
                      key={sectionName}
                      value={sectionName}
                      className="hover:bg-gray-100 focus:bg-gray-100 cursor-pointer"
                    >
                      {sectionName}
                    </SelectItem>
                  ))}
                  {dbSections.length > 0 && (
                    <SelectItem
                      value="view_others"
                      className="mt-2 font-medium text-blue-600 hover:bg-gray-100 focus:bg-gray-100 cursor-pointer border-t pt-2"
                    >
                      {t("SelectSection.viewOtherSections")}
                    </SelectItem>
                  )}
                </SelectGroup>
              </SelectContent>
            </Select>
            <p className="mt-2 text-sm text-gray-500">
              {t("SelectSection.helpText")}
            </p>
          </div>
        ) : (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {t("SelectSection.otherSections")}
              </label>
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                onClick={() => {
                  setViewMode("default");
                  setSelectedSection("");
                }}
              >
                {t("SelectSection.backToCommonSections")}
              </Button>
            </div>
            {dbSections.length > 0 ? (
              <>
                <Select
                  onValueChange={setSelectedSection}
                  value={selectedSection}
                >
                  <SelectTrigger className="w-full border border-gray-300 rounded-md bg-white p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <SelectValue
                      placeholder={t("SelectSection.selectOtherSection")}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md max-h-[300px]">
                    {dbSections.map((section) => (
                      <SelectItem
                        key={section.id}
                        value={section.id}
                        className="hover:bg-gray-100 focus:bg-gray-100 cursor-pointer"
                      >
                        {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-2 text-sm text-gray-500">
                  {t("SelectSection.helpText")}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-500 italic">
                {t("SelectSection.noOtherSections")}
              </p>
            )}
          </div>
        )}

        {success ? (
          <div className="flex items-center justify-center p-4 bg-green-50 text-green-700 rounded-lg">
            <CheckCircle className="mr-2 h-5 w-5" />
            <span>{t("SelectSection.sectionSelected")}</span>
          </div>
        ) : (
          <div className="mt-8 w-full flex justify-end">
            <Button
              className={`flex items-center justify-center gap-2 w-full px-6 py-3 text-white rounded-md transition-all ${
                !selectedSection
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
              onClick={handleSubmit}
              disabled={submitting || !selectedSection}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{t("SelectSection.submitting")}</span>
                </>
              ) : (
                <>
                  <span>{t("SelectSection.continue")}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
        {/* 
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            {t("SelectSection.needHelp")}{" "}
            <a
              href="mailto:support@example.com"
              className="text-blue-600 hover:underline"
            >
              support@example.com
            </a>
          </p>
        </div> */}
      </div>
    </div>
  );
}
