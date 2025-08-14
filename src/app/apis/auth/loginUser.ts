"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CryptoJS from "crypto-js";
import { useToast } from "@/hooks/useToast";
import { useTranslations, useLocale } from "next-intl";

export const LoginUser = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const { promise } = useToast();

  // Encrypt function to encrypt the role data
  const encryptData = (data: string) => {
    const encrypted = CryptoJS.AES.encrypt(data, "secret-key").toString();
    return encrypted;
  };

  const Login = async (email: string, password: string) => {
    // Normalize email to prevent case-sensitivity issues
    const normalizedEmail = email.trim().toLowerCase();

    // Create the promise for login process
    const myPromise = new Promise(async (resolve, reject) => {
      setLoading(true);
      try {
        console.log("Attempting to sign in with email:", normalizedEmail);

        // Sign in the user with Supabase
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (loginError) {
          setError("Login Error: " + loginError.message);
          console.log("Login Error:", loginError);
          reject(loginError.message);
          return;
        }

        // Fetch the user session
        const { data: session, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          setError("Session Error: " + sessionError.message);
          console.log("Session Error:", sessionError);
          reject(sessionError.message);
          return;
        }

        console.log("Session:", session);

        const user = session?.session?.user;

        if (user) {
          // Fetch the profile using the user's email
          const { data, error: profileError } = await supabase
            .from("profiles")
            .select(
              "id, role, email, active, face_registered, section, onboarded"
            )
            .eq("email", normalizedEmail);

          if (profileError) {
            setError("Profile Error: " + profileError.message);
            console.log("Profile Error:", profileError);
            reject(profileError.message);
            return;
          }

          console.log("Profile Data:", data);

          // Check if we got any profiles back
          if (!data || data.length === 0) {
            const errorMessage = t("LoginUser.noProfileFound");
            setError(errorMessage);
            console.log("No profile found for email:", normalizedEmail);
            reject(errorMessage);
            return;
          }

          // Use the first profile found
          const profile = data[0];

          // Log all profiles if multiple were found (for debugging)
          if (data.length > 1) {
            console.log(
              "Warning: Multiple profiles found for email:",
              normalizedEmail,
              data
            );
          }

          // Encrypt and store the role in localStorage
          const encryptedRole = encryptData(profile.role);
          localStorage.setItem("userProfile", encryptedRole);
          console.log("Encrypted role data saved to localStorage");

          // Store user email
          localStorage.setItem("userEmail", normalizedEmail);

          // If face is registered, fetch face descriptors from the face_recognition table
          if (profile.face_registered) {
            try {
              // Fetch face descriptors using the user's email
              const { data: faceData, error: faceError } = await supabase
                .from("face_recognition")
                .select("face_descriptors")
                .eq("user_email", profile.email)
                .order("created_at", { ascending: false })
                .limit(1);

              if (faceError) {
                console.error("Error fetching face descriptors:", faceError);
              } else if (faceData && faceData.length > 0) {
                // Store the face descriptors in localStorage as a JSON string
                // Ensure we're preserving the exact array format from the database
                const descriptors = faceData[0].face_descriptors;

                // Check if descriptors is already a string, otherwise stringify it
                const descriptorsString =
                  typeof descriptors === "string"
                    ? descriptors
                    : JSON.stringify(descriptors);

                localStorage.setItem("faceDescriptors", descriptorsString);
                console.log(
                  "Face descriptors saved to localStorage:",
                  descriptorsString
                );
              } else {
                console.log("No face descriptors found for this user");
              }
            } catch (error) {
              console.error("Error processing face descriptors:", error);
              // Continue with login even if fetching descriptors fails
            }
          } else {
            console.log("User has not registered their face yet");
          }

          // Check conditions - active status, face registration, and section selection
          const isActive = profile.active === true || profile.active === "true";

          const hasFaceRegistered =
            profile.face_registered === true ||
            profile.face_registered === "true";

          const isOnboarded =
            profile.onboarded === true || profile.onboarded === "true";
          const hasSelectedSection =
            profile.section !== null &&
            profile.section !== undefined &&
            profile.section !== "";

          console.log(
            `User role: ${
              profile.role
            }, Active status: ${isActive}, Face registered: ${hasFaceRegistered}, Section selected: ${
              hasSelectedSection ? "Yes" : "No"
            } isonboarded ; ${isOnboarded}`
          );

          // Check if the user is an examiner by querying the examiners table
          let isExaminer = false;
          if (profile.role === "examiner" || profile.role === "user") {
            try {
              const { data: examinerData, error: examinerError } =
                await supabase
                  .from("examiners")
                  .select("id")
                  .eq("email", normalizedEmail)
                  .limit(1);

              if (!examinerError && examinerData && examinerData.length > 0) {
                isExaminer = true;
                console.log("User is an examiner");

                // Store examiner ID in localStorage for later use
                localStorage.setItem("examinerId", examinerData[0].id);
              }
            } catch (examinerError) {
              console.error("Error checking examiner status:", examinerError);
              // Continue with login even if examiner check fails
            }
          }

          // Redirect based on role and conditions - using Next.js client-side navigation with locale
          switch (profile.role) {
            case "s_admin":
              console.log("Redirecting to /dashboard (s_admin)");
              router.push(`/${locale}/dashboard`);
              break;
            case "admin":
              console.log("Redirecting to /jobs (admin)");
              router.push(`/${locale}/jobs`);
              break;
            case "examiner":
              console.log("Redirecting to /evaluation_check (examiner)");
              router.push(`/${locale}/evaluation_check`);
              break;
            case "user":
              if (isExaminer) {
                // If user is also an examiner, redirect to evaluation_check
                console.log(
                  "User is also an examiner, redirecting to /evaluation_check"
                );
                router.push(`/${locale}/evaluation_check`);
              } else {
                // Regular user flow
                // Check section selection first
                console.log("[DEBUG] hasSelectedSection:", hasSelectedSection);
                console.log("[DEBUG] hasFaceRegistered:", hasFaceRegistered);
                console.log("[DEBUG] isOnboarded:", isOnboarded);
                if (!hasSelectedSection) {
                  console.log(
                    "[DEBUG] Redirecting to /select-section (section not selected)"
                  );
                  router.push(`/${locale}/select-section`);
                }
                // Then check if face is registered
                else if (!hasFaceRegistered) {
                  console.log(
                    "[DEBUG] Redirecting to /facerecognition (face not registered)"
                  );
                  router.push(`/${locale}/facerecognition`);
                } else if (!isOnboarded) {
                  console.log(
                    "[DEBUG] Redirecting to /questionaire (user is new, setting onboarded to true)"
                  );
                  // Update onboarded to "true" for this user
                  await supabase
                    .from("profiles")
                    .update({ onboarded: "true" })
                    .eq("id", profile.id);
                  router.push(`/${locale}/questionaire`);
                }
                // If all 3 conditions met, go to test
                else {
                  console.log(
                    "[DEBUG] Redirecting to /test (all conditions met)"
                  );
                  router.push(`/${locale}/test`);
                }
              }
              break;
            default:
              console.log("Unknown role, redirecting to default page");
              router.push(`/${locale}/auth`);
          }

          resolve(profile);
        } else {
          const errorMessage = t("LoginUser.noUserSession");
          setError(errorMessage);
          console.log("No user session found after login");
          reject(errorMessage);
        }
      } catch (error: any) {
        setError("Caught Error: " + error.message);
        console.log("Caught Error:", error);
        reject(error.message);
      } finally {
        setLoading(false);
        console.log("Login process completed");
      }
    });

    // Use promise toast with i18n translations
    promise(myPromise, {
      loading: t("LoginUser.toastLoading"),
      success: t("LoginUser.toastSuccess"),
      error: t("LoginUser.toastError"),
    });
  };

  return { loading, Login, error };
};
