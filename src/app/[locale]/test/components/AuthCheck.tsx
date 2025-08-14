'use client';

import { AuthUser } from "@/app/apis/auth/islogin";
import { useEffect } from "react";

export default function AuthCheck() {
  // Use the AuthUser hook properly
  const { error, user, role } = AuthUser();
  
  // You can add additional logic here if needed
  
  return null; // This component doesn't render anything
}