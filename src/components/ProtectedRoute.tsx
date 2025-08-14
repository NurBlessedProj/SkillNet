"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthUser } from "@/app/apis/auth/islogin";
import CryptoJS from "crypto-js";

interface ProtectedRouteProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const router = useRouter();
  const auth: any = AuthUser();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Wait for session to load
    if (auth.user === null) return; // Still loading

    // Check if user is authenticated
    if (!auth.user) {
      router.replace("/auth");
      return;
    }

    // Get role from localStorage
    const encryptedProfile = localStorage.getItem("userProfile");
    let role = "";
    if (encryptedProfile) {
      const bytes = CryptoJS.AES.decrypt(encryptedProfile, "secret-key");
      role = bytes.toString(CryptoJS.enc.Utf8);
    }
    console.log("[ProtectedRoute] Encrypted userProfile:", encryptedProfile);
    console.log("[ProtectedRoute] Decrypted role:", role);
    console.log("[ProtectedRoute] Allowed roles:", allowedRoles);

    // If role is not allowed, redirect to 404
    if (!allowedRoles.includes(role)) {
      router.replace("/404");
      return;
    }

    setChecked(true);
  }, [auth.user, allowedRoles, router]);

  // Show nothing or a spinner while checking
  if (!checked) return null;

  return <>{children}</>;
};

export default ProtectedRoute;
