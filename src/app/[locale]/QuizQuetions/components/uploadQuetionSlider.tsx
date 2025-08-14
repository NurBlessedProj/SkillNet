"use client";
import React, { useState } from "react";
import MyDropzone from "@/components/dropzone";
import Slider from "@/components/slideOver";
import { useTranslations } from "next-intl"; // Add this import

interface QuizSliderProps {
  onUploadComplete?: () => void; // Add this prop to trigger refresh in parent
}

const QuizSlider: React.FC<QuizSliderProps> = ({ onUploadComplete }) => {
  const t = useTranslations(); // Initialize translation hook
  const [isCompleted, setIsCompleted] = useState(false);

  const handleFileUpload = async (file: File) => {
    // The actual file processing is now handled in MyDropzone
    // This is just for managing the slider state
    setIsCompleted(true);
  };

  const handleUploadSuccess = () => {
    setIsCompleted(true);

    // Call the parent's refresh function if provided
    if (onUploadComplete) {
      console.log(t("quizSlider.logs.triggeringRefresh"));
      onUploadComplete();
    }
  };

  return (
    <Slider edit={t("quizSlider.title")}>
      <div className="h-[80vh] w-full items-center flex justify-center">
        <MyDropzone
          onFileUploaded={handleFileUpload}
          onUploadSuccess={handleUploadSuccess}
        />
      </div>
    </Slider>
  );
};

export default QuizSlider;
