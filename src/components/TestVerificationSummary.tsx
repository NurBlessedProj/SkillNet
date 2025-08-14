"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  CheckCircle2,
  Shield,
  Users,
  UserX,
  Camera,
} from "lucide-react";
import { TestSupervisionResults } from "@/components/TestSupervision";

interface TestVerificationSummaryProps {
  results: TestSupervisionResults;
  showDetails?: boolean;
}

const TestVerificationSummary: React.FC<TestVerificationSummaryProps> = ({
  results,
  showDetails = false,
}) => {
  const { verified, violations, qualityMetrics } = results;
  const {
    noFaceDetected,
    multipleFacesDetected,
    identityMismatch,
    lowQualityFaces,
  } = violations;

  // Determine the most significant violation for the summary
  const getPrimaryViolation = () => {
    if (identityMismatch) return "Identity verification failed";
    if (multipleFacesDetected >= 3)
      return "Multiple people detected during test";
    if (noFaceDetected > 5) return `Face not visible in multiple snapshots`;
    if (lowQualityFaces > 3) return "Poor quality face images detected";
    return null;
  };

  const primaryViolation = getPrimaryViolation();

  // Helper function to get color class based on quality score
  const getQualityColorClass = (score: number) => {
    if (score >= 0.7) return "text-green-600";
    if (score >= 0.5) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <Card
      className={`${verified ? "bg-green-50" : "bg-red-50"} border-0 shadow-sm`}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          {verified ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-green-700">Test Integrity Verified</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-700">Test Integrity Violation</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {verified ? (
          <div className="space-y-3">
            <p className="text-green-700 text-sm">
              Your identity has been verified and no supervision violations were
              detected.
            </p>

            {showDetails && qualityMetrics && (
              <div className="mt-3 pt-2 border-t border-green-200">
                <h4 className="font-medium text-gray-700 text-sm mb-2">
                  Face Quality Metrics:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600">Average Quality:</span>
                    <span
                      className={getQualityColorClass(
                        qualityMetrics.averageQuality
                      )}
                    >
                      {(qualityMetrics.averageQuality * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600">High Quality:</span>
                    <span className="text-green-600">
                      {qualityMetrics.highQualitySnapshots}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600">Medium Quality:</span>
                    <span className="text-amber-600">
                      {qualityMetrics.mediumQualitySnapshots}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-600">Low Quality:</span>
                    <span className="text-red-600">
                      {qualityMetrics.lowQualitySnapshots}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-red-700 text-sm font-medium">
              {primaryViolation}
            </p>

            {showDetails && (
              <div className="mt-3 space-y-2 text-sm">
                <h4 className="font-medium text-gray-700">
                  Violation Details:
                </h4>
                <ul className="space-y-1 pl-5">
                  {identityMismatch && (
                    <li className="flex items-start gap-2">
                      <UserX className="h-4 w-4 text-red-500 mt-0.5" />
                      <span className="text-red-700">
                        The person taking the test does not match the registered
                        user
                      </span>
                    </li>
                  )}

                  {multipleFacesDetected >= 3 && (
                    <li className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-red-500 mt-0.5" />
                      <span className="text-red-700">
                        Multiple people detected in {multipleFacesDetected}{" "}
                        snapshots
                      </span>
                    </li>
                  )}

                  {noFaceDetected > 0 && (
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                      <span className="text-red-700">
                        No face detected in {noFaceDetected} out of{" "}
                        {noFaceDetected + multipleFacesDetected} snapshots
                      </span>
                    </li>
                  )}

                  {lowQualityFaces > 0 && (
                    <li className="flex items-start gap-2">
                      <Camera className="h-4 w-4 text-amber-500 mt-0.5" />
                      <span className="text-amber-700">
                        Low quality face images in {lowQualityFaces} snapshots
                      </span>
                    </li>
                  )}
                </ul>

                {qualityMetrics && (
                  <div className="mt-3 pt-2 border-t border-red-200">
                    <h4 className="font-medium text-gray-700 mb-1">
                      Face Quality Metrics:
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600">Average Quality:</span>
                        <span
                          className={getQualityColorClass(
                            qualityMetrics.averageQuality
                          )}
                        >
                          {(qualityMetrics.averageQuality * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600">High Quality:</span>
                        <span className="text-green-600">
                          {qualityMetrics.highQualitySnapshots}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600">Medium Quality:</span>
                        <span className="text-amber-600">
                          {qualityMetrics.mediumQualitySnapshots}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-600">Low Quality:</span>
                        <span className="text-red-600">
                          {qualityMetrics.lowQualitySnapshots}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestVerificationSummary;
