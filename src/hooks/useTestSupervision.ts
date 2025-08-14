import { useRef, useState } from 'react';
import { TestSupervisionRef, TestSupervisionResults } from '@/components/TestSupervision';

interface VerificationResponse {
  verified: boolean;
  results?: TestSupervisionResults | null;
  error?: string;
}

export function useTestSupervision() {
  const supervisionRef = useRef<TestSupervisionRef>(null);
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [verificationResults, setVerificationResults] = useState<TestSupervisionResults | null>(null);

  const verifyTestIntegrity = async (): Promise<VerificationResponse> => {
    if (!supervisionRef.current) {
      return {
        verified: false,
        error: "Supervision not initialized"
      };
    }

    try {
      setIsVerifying(true);
      const results = await supervisionRef.current.verifyTestIntegrity();
      setVerificationResults(results);
      setVerificationComplete(true);
      setIsVerifying(false);
      return { verified: results?.verified ?? false, results };
    } catch (error) {
      console.error("Error during test verification:", error);
      setIsVerifying(false);
      return {
        verified: false,
        error: "Verification failed"
      };
    }
  };

  return {
    supervisionRef,
    isVerifying,
    verificationComplete,
    verificationResults,
    verifyTestIntegrity
  };
}