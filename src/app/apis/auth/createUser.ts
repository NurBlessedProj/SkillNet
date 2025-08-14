"use client";
import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";

export const CreateUser = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations(); // Initialize translation hook
  const router = useRouter(); // Initialize router
  const locale = useLocale(); // Get current locale

  const Create = async (email: string, password: string, role: string) => {
    setError(null);

    // Normalize email to prevent case-sensitivity issues
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password || !role) {
      toast.error(t.raw("CreateUser.fillAllFields"));
      return;
    }

    if (role !== "user" && role !== "admin") {
      toast.error(t.raw("CreateUser.invalidRole"));
      return;
    }

    setLoading(true);
    try {
      // Check profiles table for existing email
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", normalizedEmail)
        .single();

      if (!profileCheckError && existingProfile) {
        setError(t.raw("CreateUser.emailExists"));
        toast.error(t.raw("CreateUser.emailExists"));
        return;
      }

      // Proceed with sign up
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/${locale}/auth`,
          },
        });

      if (signUpError) {
        if (signUpError.message.includes("User already registered")) {
          setError(t.raw("CreateUser.emailExists"));
          toast.error(t.raw("CreateUser.emailExists"));
          return;
        }
        throw signUpError;
      }

      if (!signUpData.user) {
        throw new Error(t.raw("CreateUser.failedToCreate"));
      }

      console.log(
        `Creating new user with email: ${normalizedEmail}, role: ${role}`
      );

      // Insert into profiles table WITHOUT specifying ID to let the database auto-increment
      // Also, store face_registered as a boolean value instead of a string
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          email: normalizedEmail,
          role: role,
          active: true,
          face_registered: false, // Store as boolean false, not string 'false'
          onboarded: false, // New users are not onboarded
        },
      ]);

      if (profileError) {
        console.error("Failed to create profile:", profileError);
        throw new Error(t.raw("CreateUser.profileCreationFailed"));
      }

      toast.success(t.raw("CreateUser.checkEmail"));

      // Use Next.js router for client-side navigation with a delay
      setTimeout(() => {
        router.push(`/${locale}/auth`);
      }, 4000);

      return true;
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message || t.raw("CreateUser.genericError"));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loading, Create, error };
};
