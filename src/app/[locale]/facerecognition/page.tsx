"use client";

import RegisterFace from "@/components/RegisterFace";
import { useRouter } from "next/navigation";

export default function FaceRegistrationPage() {
  const router = useRouter();

  const handleVerificationComplete = () => {
    router.push("/questionaire");
  };

  return <RegisterFace onVerificationComplete={handleVerificationComplete} />;
}
