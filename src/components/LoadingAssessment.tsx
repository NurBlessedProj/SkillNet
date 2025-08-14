import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Target } from "lucide-react";

const LoadingAssessment = () => {
  const [progress, setProgress] = React.useState(10);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setProgress((prevProgress) => {
        // Randomly increment progress to simulate loading
        const increment = Math.floor(Math.random() * 10) + 5;
        return Math.min(prevProgress + increment, 95);
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg border-gray-200 dark:border-gray-700">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Target className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                Preparing Assessment
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col items-center space-y-6 pb-8">
            {/* Simple Loading Spinner */}
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
            </div>

            {/* Progress Bar */}
            <div className="w-full space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Loading...
                </span>
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {progress}%
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Simple Status Message */}
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
              Please wait while we prepare your assessment...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoadingAssessment;
