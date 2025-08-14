// components/AddSubcategoryModal.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface AddSubcategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => Promise<void>;
  sectionName: string;
  loading: boolean;
}

const AddSubcategoryModal: React.FC<AddSubcategoryModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  sectionName,
  loading,
}) => {
  const t = useTranslations();
  const [subcategoryName, setSubcategoryName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSubcategoryName("");
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subcategoryName.trim()) return;
    await onAdd(subcategoryName);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100"
          disabled={loading}
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
        
        <h3 className="text-lg font-semibold mb-4">
          {t("Quiz.sectionMenu.addSubcategoryTitle")}
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="subcategoryName" className="block text-sm font-medium text-gray-700 mb-1">
              {t("Quiz.sectionMenu.subcategoryNameLabel")}
            </label>
            <input
              ref={inputRef}
              id="subcategoryName"
              type="text"
              value={subcategoryName}
              onChange={(e) => setSubcategoryName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={t("Quiz.sectionMenu.newSubcategoryPlaceholder")}
              disabled={loading}
            />
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={loading}
            >
              {t("Quiz.common.cancel")}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
              disabled={loading || !subcategoryName.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("Quiz.common.saving")}
                </>
              ) : (
                t("Quiz.common.add")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubcategoryModal;